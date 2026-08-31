#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural";
const DEFAULT_RATE = "+25%";
const DEFAULT_PITCH = "+0Hz";
const DEFAULT_VOLUME = "+0%";

function fail(message, code = "tts-adapter-failed") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.once("error", reject);
    process.stdin.once("end", () => resolve(input));
  });
}

function parsePayload(text) {
  if (!text.trim()) fail("TTS Harness adapter 未收到 JSON 输入", "tts-input-invalid");
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    fail(`TTS Harness adapter 输入不是有效 JSON：${error.message}`, "tts-input-invalid");
  }
  if (payload?.kind !== "video-tts-execution") {
    fail(`不支持的执行任务类型：${payload?.kind ?? "未提供"}`, "tts-input-invalid");
  }
  if (!payload.videoId || !payload.workspaceRoot || !payload.input?.ttsScript || !payload.output) {
    fail("TTS Harness adapter 输入缺少 videoId、workspaceRoot、input.ttsScript 或 output", "tts-input-invalid");
  }
  return payload;
}

function safePath(root, relativePath, label) {
  if (typeof relativePath !== "string" || path.isAbsolute(relativePath)) {
    fail(`${label} 必须是工作区内的相对路径`, "tts-path-invalid");
  }
  const rootPath = path.resolve(root);
  const target = path.resolve(rootPath, relativePath);
  if (target !== rootPath && !target.startsWith(`${rootPath}${path.sep}`)) {
    fail(`${label} 不能越出工作区：${relativePath}`, "tts-path-invalid");
  }
  return target;
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(`${label} 不存在：${filePath}`, "tts-input-missing");
  }
}

function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

function removeEmptyFiles(root) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) removeEmptyFiles(target);
    else if (fs.statSync(target).size === 0) fs.rmSync(target);
  }
}

function loadJson(filePath, label) {
  ensureFile(filePath, label);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} 不是有效 JSON：${error.message}`, "tts-output-invalid");
  }
}

function validateOutputs({ payload, assetsRoot, audioManifestPath, subtitleManifestPath, timelineManifestPath }) {
  const audio = loadJson(audioManifestPath, "Audio Manifest");
  const subtitles = loadJson(subtitleManifestPath, "Subtitle Manifest");
  const timeline = loadJson(timelineManifestPath, "Timeline Manifest");
  for (const [label, manifest] of [["Audio Manifest", audio], ["Subtitle Manifest", subtitles], ["Timeline Manifest", timeline]]) {
    if (manifest.videoId !== payload.videoId) fail(`${label} 的 videoId 不匹配：${manifest.videoId}`, "tts-output-invalid");
    if (!Array.isArray(manifest.scenes) || manifest.scenes.length === 0) fail(`${label} 缺少 scenes`, "tts-output-invalid");
  }
  for (const scene of audio.scenes) {
    for (const segment of scene.segments ?? []) {
      ensureFile(path.join(assetsRoot, segment.file), `音频 Segment ${segment.id}`);
    }
  }
  for (const scene of subtitles.scenes) {
    if (scene.file) ensureFile(path.join(assetsRoot, scene.file), `字幕 Scene ${scene.sceneId}`);
  }
  return { audio, subtitles, timeline };
}

function runProcess(command, args, { cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.once("error", (error) => reject(error));
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const error = new Error(`TTS 子命令退出：${signal ? `signal ${signal}` : `code ${code}`}`);
      error.code = "tts-process-failed";
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

export async function runTtsHarnessAdapter(payload, { spawnProcess = runProcess } = {}) {
  const workspaceRoot = path.resolve(payload.workspaceRoot);
  const slug = payload.videoId;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`videoId 不是合法 slug：${slug}`, "tts-input-invalid");

  const inputPath = safePath(workspaceRoot, payload.input.ttsScript, "TTS Script 路径");
  ensureFile(inputPath, "冻结的 tts-script.json");
  const ttsScript = loadJson(inputPath, "冻结的 tts-script.json");
  if (ttsScript.videoId !== slug) fail(`tts-script.json 的 videoId 不匹配：${ttsScript.videoId}`, "tts-input-invalid");
  if (!Array.isArray(ttsScript.scenes) || ttsScript.scenes.length === 0) fail("tts-script.json 缺少 scenes", "tts-input-invalid");

  const output = payload.output;
  const outputRoot = safePath(workspaceRoot, path.dirname(output.audioManifest), "TTS 输出目录");
  const outputAudio = safePath(workspaceRoot, output.audioDirectory, "音频输出目录");
  const outputSubtitles = safePath(workspaceRoot, output.subtitleDirectory, "字幕输出目录");
  const outputAudioManifest = safePath(workspaceRoot, output.audioManifest, "Audio Manifest 输出路径");
  const outputSubtitleManifest = safePath(workspaceRoot, output.subtitleManifest, "Subtitle Manifest 输出路径");
  const outputTimelineManifest = safePath(workspaceRoot, output.timelineManifest, "Timeline Manifest 输出路径");

  const ttsProjectDir = path.resolve(
    process.env.HARNESS_TTS_PROJECT_DIR || path.resolve(workspaceRoot, "..", "tts"),
  );
  const python = process.env.HARNESS_TTS_PYTHON || path.join(ttsProjectDir, ".venv", "bin", "python");
  const scriptsDir = path.resolve(process.env.HARNESS_TTS_SCRIPTS_DIR || path.join(ttsProjectDir, "scripts"));
  ensureFile(python, "TTS Python 执行器");
  for (const name of ["generate_audio.py", "generate_subtitles.py", "generate_timeline.py"]) {
    ensureFile(path.join(scriptsDir, name), `TTS 脚本 ${name}`);
  }

  const scriptHash = crypto.createHash("sha256").update(fs.readFileSync(inputPath)).digest("hex").slice(0, 16);
  const cacheRoot = path.resolve(process.env.HARNESS_TTS_CACHE_DIR || path.join(workspaceRoot, "harness", ".cache", "tts"));
  const runRoot = path.join(cacheRoot, `${slug}-${scriptHash}`);
  const assetsRoot = path.join(runRoot, "video-assets");
  const stagedScript = path.join(assetsRoot, "tts-script.json");
  fs.mkdirSync(assetsRoot, { recursive: true });
  fs.copyFileSync(inputPath, stagedScript);
  removeEmptyFiles(assetsRoot);

  const voice = payload.voice || DEFAULT_VOICE;
  const rate = payload.rate || DEFAULT_RATE;
  const pitch = process.env.HARNESS_TTS_PITCH || DEFAULT_PITCH;
  const volume = process.env.HARNESS_TTS_VOLUME || DEFAULT_VOLUME;
  const common = ["--project-dir", runRoot];
  await spawnProcess(python, [path.join(scriptsDir, "generate_audio.py"), ...common, "--input", stagedScript, "--voice", voice, "--rate", rate, "--pitch", pitch, "--volume", volume], { cwd: ttsProjectDir });
  await spawnProcess(python, [path.join(scriptsDir, "generate_subtitles.py"), ...common, "--tts-script", stagedScript, "--audio-manifest", path.join(assetsRoot, "audio-manifest.json"), "--timing-root", path.join(assetsRoot, "timing"), "--output-root", path.join(assetsRoot, "subtitles"), "--manifest", path.join(assetsRoot, "subtitle-manifest.json")], { cwd: ttsProjectDir });
  await spawnProcess(python, [path.join(scriptsDir, "generate_timeline.py"), ...common, "--tts-script", stagedScript, "--audio-manifest", path.join(assetsRoot, "audio-manifest.json"), "--subtitle-manifest", path.join(assetsRoot, "subtitle-manifest.json"), "--timeline", path.join(assetsRoot, "timeline-manifest.json"), "--srt", path.join(assetsRoot, "subtitles", "captions.srt"), "--vtt", path.join(assetsRoot, "subtitles", "captions.vtt"), "--scene-buffer", "0"], { cwd: ttsProjectDir });

  const manifests = validateOutputs({
    payload,
    assetsRoot,
    audioManifestPath: path.join(assetsRoot, "audio-manifest.json"),
    subtitleManifestPath: path.join(assetsRoot, "subtitle-manifest.json"),
    timelineManifestPath: path.join(assetsRoot, "timeline-manifest.json"),
  });

  fs.mkdirSync(outputRoot, { recursive: true });
  copyTree(path.join(assetsRoot, "audio"), outputAudio);
  copyTree(path.join(assetsRoot, "subtitles"), outputSubtitles);
  fs.copyFileSync(path.join(assetsRoot, "audio-manifest.json"), outputAudioManifest);
  fs.copyFileSync(path.join(assetsRoot, "subtitle-manifest.json"), outputSubtitleManifest);
  fs.copyFileSync(path.join(assetsRoot, "timeline-manifest.json"), outputTimelineManifest);

  const publicAssets = path.join(workspaceRoot, "public", "local-assets", slug);
  copyTree(path.join(assetsRoot, "audio"), path.join(publicAssets, "audio"));
  copyTree(path.join(assetsRoot, "subtitles"), path.join(publicAssets, "subtitles"));
  return {
    executor: "tts-harness-adapter",
    videoId: slug,
    rate,
    voice,
    cacheDirectory: path.relative(workspaceRoot, runRoot),
    scenes: manifests.timeline.scenes.length,
    duration: manifests.timeline.duration,
    outputs: [
      path.relative(workspaceRoot, outputAudioManifest),
      path.relative(workspaceRoot, outputSubtitleManifest),
      path.relative(workspaceRoot, outputTimelineManifest),
    ],
  };
}

async function main() {
  try {
    const payload = parsePayload(await readStdin());
    const result = await runTtsHarnessAdapter(payload);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
