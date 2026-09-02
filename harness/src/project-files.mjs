import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getVideoProject } from "./project-view.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

const documentFiles = Object.freeze([
  ["source.md", "source", "原始内容"],
  ["content-analysis.md", "content-analysis", "内容分析"],
  ["video-narrative.md", "video-narrative", "视频叙事"],
  ["scene-script.md", "scene-script", "Scene 脚本"],
  ["narration-script.md", "narration-script", "口播稿"],
  ["visual-script.md", "visual-script", "视觉脚本"],
  ["visual-prototype.html", "visual-prototype", "视觉原型"],
  ["remotion-alignment.json", "remotion", "Remotion 对齐清单"],
  ["tts-script.json", "tts", "TTS 输入"],
]);

const generatedFiles = Object.freeze([
  ["generated/audio-manifest.json", "subtitle-timeline", "音频 Manifest"],
  ["generated/subtitle-manifest.json", "subtitle-timeline", "字幕 Manifest"],
  ["generated/timeline-manifest.json", "subtitle-timeline", "Timeline Manifest"],
]);

function pathEntry(relativePath, stage, label, kind = "document") {
  const absolutePath = path.resolve(workspaceRoot(), relativePath);
  return {
    path: relativePath,
    stage,
    label,
    kind,
    present: fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile(),
  };
}

export function listProjectFiles(slug) {
  if (!getVideoProject(slug)) return null;

  const entries = [
    ...documentFiles.map(([file, stage, label]) => pathEntry(`videos/${slug}/${file}`, stage, label)),
    ...generatedFiles.map(([file, stage, label]) => pathEntry(`src/videos/${slug}/${file}`, stage, label, "manifest")),
    pathEntry(`src/videos/${slug}/video.config.ts`, "remotion", "Remotion 配置", "remotion"),
  ];

  const remotionDirectory = path.resolve(workspaceRoot(), "src", "videos", slug);
  if (fs.existsSync(remotionDirectory) && fs.statSync(remotionDirectory).isDirectory()) {
    for (const entry of fs.readdirSync(remotionDirectory)) {
      if (!entry.endsWith("Video.tsx")) continue;
      entries.push(pathEntry(`src/videos/${slug}/${entry}`, "remotion", entry, "remotion"));
    }
  }

  return entries;
}

export function getProjectFile(slug, relativePath) {
  const entry = listProjectFiles(slug)?.find((item) => item.path === relativePath);
  if (!entry || !entry.present) return null;

  const absolutePath = path.resolve(workspaceRoot(), entry.path);
  return {
    ...entry,
    content: fs.readFileSync(absolutePath, "utf8"),
  };
}

export function getProjectPrototype(slug) {
  return getProjectFile(slug, `videos/${slug}/visual-prototype.html`);
}
