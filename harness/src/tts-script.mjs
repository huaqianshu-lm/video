import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeJson } from "./storage.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function narrationPathFor(project) {
  return `videos/${project.config.slug}/narration-script.md`;
}

function ttsPathFor(project) {
  return `videos/${project.config.slug}/tts-script.json`;
}

function resolveTtsTool(workspaceRoot) {
  const defaultProjectDir = path.resolve(workspaceRoot, "..", "tts");
  const projectDir = path.resolve(process.env.HARNESS_TTS_PROJECT_DIR || defaultProjectDir);
  const scriptsDir = path.resolve(process.env.HARNESS_TTS_SCRIPTS_DIR || path.join(projectDir, "scripts"));
  const python = process.env.HARNESS_TTS_PYTHON || path.join(projectDir, ".venv", "bin", "python");
  const builder = process.env.HARNESS_TTS_SCRIPT_BUILDER || path.join(scriptsDir, "build_tts_script.py");
  return { projectDir, python, builder };
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`无法调用既有 TTS 规则：缺少${label} ${filePath}`);
  }
}

function fingerprint(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function runCanonicalBuilder({ videoId, narrationText, inputPath, outputPath, workspaceRoot }) {
  const tool = resolveTtsTool(workspaceRoot);
  ensureFile(tool.python, "TTS Python 执行器");
  ensureFile(tool.builder, "标准 TTS Script 生成器");

  const temporaryRoot = inputPath ? null : fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-tts-script-"));
  const sourcePath = inputPath || path.join(temporaryRoot, "narration-script.md");
  const targetPath = outputPath || path.join(temporaryRoot, "tts-script.json");
  if (!inputPath) fs.writeFileSync(sourcePath, narrationText, "utf8");

  try {
    execFileSync(tool.python, [
      tool.builder,
      "--project-dir", tool.projectDir,
      "--input", sourcePath,
      "--output", targetPath,
      "--video-id", videoId,
    ], {
      cwd: tool.projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    ensureFile(targetPath, "标准 TTS Script 输出");
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`标准 TTS Script 输出不是有效 JSON：${error.message}`);
    }
    const details = [error.message, error.stderr?.toString().trim()].filter(Boolean).join("：");
    throw new Error(`标准 TTS Script 生成失败：${details}`);
  } finally {
    if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

export function buildTtsScript(videoId, narrationText) {
  return runCanonicalBuilder({
    videoId,
    narrationText,
    workspaceRoot: repositoryRoot,
  });
}

export function ensureTtsScript(project) {
  const relativePath = ttsPathFor(project);
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  const narrationPath = narrationPathFor(project);
  const narrationAbsolutePath = path.join(project.config.workspaceRoot, narrationPath);
  const existed = fs.existsSync(absolutePath);
  ensureFile(narrationAbsolutePath, `口播稿 ${narrationPath}`);
  const narrationText = fs.readFileSync(narrationAbsolutePath, "utf8");

  const generatedScript = runCanonicalBuilder({
    videoId: project.config.slug,
    inputPath: narrationAbsolutePath,
    outputPath: absolutePath,
    workspaceRoot: project.config.workspaceRoot,
  });
  const script = {
    ...generatedScript,
    source: {
      generator: "tts/scripts/build_tts_script.py",
      narrationFingerprint: fingerprint(narrationText),
    },
  };
  writeJson(absolutePath, script);
  return {
    created: !existed,
    path: relativePath,
    sceneCount: script.scenes.length,
  };
}
