import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runTtsHarnessAdapter } from "../src/tts-harness-adapter.mjs";
import { archiveMatchesAssetDirectory } from "../src/asset-bundler.mjs";

function write(filePath, content, mode) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  if (mode) fs.chmodSync(filePath, mode);
}

function fakePythonScript() {
  return `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const script = path.basename(process.argv[2]);
const args = process.argv.slice(3);
const value = (name) => args[args.indexOf(name) + 1];
const project = value('--project-dir');
const assets = path.join(project, 'video-assets');
fs.mkdirSync(path.join(assets, 'audio/scene-01'), {recursive: true});
fs.mkdirSync(path.join(assets, 'timing/scene-01'), {recursive: true});
fs.mkdirSync(path.join(assets, 'subtitles'), {recursive: true});
if (script === 'generate_audio.py') {
  fs.writeFileSync(path.join(assets, 'audio/scene-01/01-01.mp3'), 'audio');
  fs.writeFileSync(path.join(assets, 'timing/scene-01/01-01.json'), JSON.stringify({wordBoundaries: []}));
  fs.writeFileSync(path.join(assets, 'audio-manifest.json'), JSON.stringify({schemaVersion: '1.0', videoId: 'adapter-video', scenes: [{sceneId: '01', segments: [{id: '01-01', file: 'audio/scene-01/01-01.mp3', text: '测试', duration: 1}], narrationDuration: 1}]}));
} else if (script === 'generate_subtitles.py') {
  fs.writeFileSync(path.join(assets, 'subtitles/scene-01.json'), JSON.stringify({schemaVersion: '1.0', videoId: 'adapter-video', sceneId: '01', segments: [{segmentId: '01-01', audioFile: 'audio/scene-01/01-01.mp3', cues: [{id: '01-01-a', text: '测试', start: 0, end: 1}]}]}));
  fs.writeFileSync(path.join(assets, 'subtitle-manifest.json'), JSON.stringify({schemaVersion: '1.0', videoId: 'adapter-video', scenes: [{sceneId: '01', file: 'subtitles/scene-01.json', segments: [{segmentId: '01-01', audioFile: 'audio/scene-01/01-01.mp3', cues: [{id: '01-01-a', text: '测试', start: 0, end: 1}]}]}]}));
} else if (script === 'generate_timeline.py') {
  fs.writeFileSync(path.join(assets, 'timeline-manifest.json'), JSON.stringify({schemaVersion: '1.0', videoId: 'adapter-video', sceneBuffer: 0, duration: 1, scenes: [{sceneId: '01', offset: 0, narrationDuration: 1, buffer: 0, duration: 1, end: 1, segments: [{segmentId: '01-01', offset: 0, duration: 1, end: 1, audioFile: 'audio/scene-01/01-01.mp3', subtitleFile: 'subtitles/scene-01.json'}]}]}));
  fs.writeFileSync(path.join(assets, 'subtitles/captions.srt'), '1\\n00:00:00,000 --> 00:00:01,000\\n测试\\n');
  fs.writeFileSync(path.join(assets, 'subtitles/captions.vtt'), 'WEBVTT\\n');
}
`;
}

test("bridges the frozen TTS script into generated assets and complete Remotion assets", async () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-adapter-workspace-"));
  const ttsProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-adapter-tts-"));
  const python = path.join(ttsProjectDir, "fake-python.cjs");
  write(python, fakePythonScript(), 0o755);
  for (const name of ["generate_audio.py", "generate_subtitles.py", "generate_timeline.py"]) {
    write(path.join(ttsProjectDir, "scripts", name), "# fake\n");
  }
  const slug = "adapter-video";
  const ttsPath = path.join(workspaceRoot, "videos", slug, "tts-script.json");
  write(ttsPath, JSON.stringify({ schemaVersion: "1.0", videoId: slug, scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "测试" }] }] }));
  const payload = {
    schemaVersion: 1,
    kind: "video-tts-execution",
    videoId: slug,
    rate: "+25%",
    voice: "zh-CN-XiaoxiaoNeural",
    workspaceRoot,
    input: { ttsScript: `videos/${slug}/tts-script.json` },
    output: {
      audioDirectory: `src/videos/${slug}/generated/audio`,
      audioManifest: `src/videos/${slug}/generated/audio-manifest.json`,
      subtitleManifest: `src/videos/${slug}/generated/subtitle-manifest.json`,
      timelineManifest: `src/videos/${slug}/generated/timeline-manifest.json`,
      subtitleDirectory: `src/videos/${slug}/generated/subtitles`,
    },
  };
  const previous = {
    HARNESS_TTS_PROJECT_DIR: process.env.HARNESS_TTS_PROJECT_DIR,
    HARNESS_TTS_PYTHON: process.env.HARNESS_TTS_PYTHON,
    HARNESS_TTS_CACHE_DIR: process.env.HARNESS_TTS_CACHE_DIR,
  };
  process.env.HARNESS_TTS_PROJECT_DIR = ttsProjectDir;
  process.env.HARNESS_TTS_PYTHON = python;
  process.env.HARNESS_TTS_CACHE_DIR = path.join(workspaceRoot, "harness", ".cache", "tts");
  try {
    const result = await runTtsHarnessAdapter(payload);
    assert.equal(result.rate, "+25%");
    assert.equal(result.scenes, 1);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "src/videos", slug, "generated/audio/scene-01/01-01.mp3")), true);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "src/videos", slug, "generated/subtitles/scene-01.json")), true);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "public/local-assets", slug, "audio/scene-01/01-01.mp3")), true);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "public/local-assets", slug, "subtitles/captions.vtt")), true);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "public/local-assets", slug, "subtitles/captions.srt")), true);
    assert.equal(result.assetBundle, `assets/${slug}-assets.zip`);
    assert.equal(archiveMatchesAssetDirectory({ config: { slug, workspaceRoot } }), true);
    const timeline = JSON.parse(fs.readFileSync(path.join(workspaceRoot, "src/videos", slug, "generated/timeline-manifest.json"), "utf8"));
    assert.equal(timeline.videoId, slug);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(ttsProjectDir, { recursive: true, force: true });
  }
});
