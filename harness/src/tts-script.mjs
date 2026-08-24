import fs from "node:fs";
import path from "node:path";
import { writeJson } from "./storage.mjs";

function narrationPathFor(project) {
  return `videos/${project.config.slug}/narration-script.md`;
}

function ttsPathFor(project) {
  return `videos/${project.config.slug}/tts-script.json`;
}

function sceneBodiesFromNarration(text) {
  const matches = [...text.matchAll(/^##\s+Scene\s+(\d+).*$/gim)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return {
      sceneId: match[1].padStart(2, "0"),
      body: text.slice(start, end).trim(),
    };
  });
}

function segmentsFromScene(scene) {
  const paragraphs = scene.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    throw new Error(`Scene ${scene.sceneId} 没有可派生的口播段落`);
  }

  return paragraphs.map((text, index) => ({
    id: `${scene.sceneId}-${String(index + 1).padStart(2, "0")}`,
    text,
  }));
}

export function buildTtsScript(videoId, narrationText) {
  const scenes = sceneBodiesFromNarration(narrationText);
  if (scenes.length === 0) {
    throw new Error("Narration Script 没有可识别的 Scene 标题");
  }

  const sceneIds = new Set();
  return {
    schemaVersion: "1.0",
    videoId,
    scenes: scenes.map((scene) => {
      if (sceneIds.has(scene.sceneId)) {
        throw new Error(`Narration Script 存在重复的 Scene ID：${scene.sceneId}`);
      }
      sceneIds.add(scene.sceneId);
      return {
        sceneId: scene.sceneId,
        segments: segmentsFromScene(scene),
      };
    }),
  };
}

export function ensureTtsScript(project) {
  const relativePath = ttsPathFor(project);
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  if (fs.existsSync(absolutePath)) {
    return { created: false, path: relativePath };
  }

  const narrationPath = narrationPathFor(project);
  const narrationAbsolutePath = path.join(project.config.workspaceRoot, narrationPath);
  if (!fs.existsSync(narrationAbsolutePath)) {
    throw new Error(`无法派生 TTS Script：缺少 ${narrationPath}`);
  }

  const script = buildTtsScript(
    project.config.slug,
    fs.readFileSync(narrationAbsolutePath, "utf8"),
  );
  writeJson(absolutePath, script);
  return { created: true, path: relativePath, sceneCount: script.scenes.length };
}
