import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildTtsExecutionInput, createTtsExecutor } from "../src/tts-executor.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { approveGate, runStage } from "../src/runner.mjs";

function fixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-tts-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-tts-projects-"));
  const slug = "tts-executor-video";
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  const source = {
    "source.md": "# Source\n\n内容。\n",
    "content-analysis.md": "# Content Analysis\n\n## 核心命题\n内容。\n\n## 可视觉化内容\n状态。\n\n## 关键关系\n关系。\n",
    "video-narrative.md": "# Video Narrative\n\n## 叙事目标\n解释。\n\n## 整体叙事结构\n开始到结束。\n\n## 叙事原则\n清晰。\n",
    "scene-script.md": "# Scene Script\n\n## Scene 01\n\n### 目的\n验证。\n### narrativeRole\n建立。\n### narrationIntent\n解释。\n### visualIntent\n展示。\n### visualType\n流程。\n### keyOnScreenText\n状态。\n### videoValue\n可见。\n",
    "narration-script.md": "# Narration Script\n\n## Scene 01\n\n这是测试口播。\n",
    "visual-script.md": "# Visual Script\n\n## 全局视觉原则\n清晰。\n\n## Scene 01\n\n### 视觉目标\n展示。\n### 画面结构\n卡片。\n### 动画\n淡入。\n### 屏幕文字\n状态。\n### Visual Type\n流程。\n",
    "visual-prototype.html": "<!doctype html><button>上一幕</button><button>下一幕</button><button>自动播放</button><div>进度</div><section class=\"scene\">Scene 01</section>",
  };
  for (const [file, content] of Object.entries(source)) {
    const target = path.join(workspaceRoot, `videos/${slug}`, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }
  return { slug, project, workspaceRoot, projectsRoot };
}

function prepareAtSubtitleTimeline(project) {
  for (const stage of [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
    "gate-2",
  ]) {
    runStage(loadProject(project.state.slug), stage);
  }
  approveGate(loadProject(project.state.slug), "gate-2");
  runStage(loadProject(project.state.slug), "tts");
  return loadProject(project.state.slug);
}

function outputFiles(project) {
  const base = path.join(project.config.workspaceRoot, `src/videos/${project.config.slug}/generated`);
  return {
    audio: path.join(base, "audio-manifest.json"),
    subtitle: path.join(base, "subtitle-manifest.json"),
    timeline: path.join(base, "timeline-manifest.json"),
  };
}

function writeValidManifests(project) {
  const tts = JSON.parse(fs.readFileSync(
    path.join(project.config.workspaceRoot, `videos/${project.config.slug}/tts-script.json`),
    "utf8",
  ));
  const files = outputFiles(project);
  const scenes = tts.scenes.map((scene, sceneIndex) => {
    const segments = scene.segments.map((segment, segmentIndex) => ({
      id: segment.id,
      segmentId: segment.id,
      file: `audio/scene-${scene.sceneId}/${segment.id}.mp3`,
      audioFile: `audio/scene-${scene.sceneId}/${segment.id}.mp3`,
      offset: segmentIndex,
      duration: 1,
      end: segmentIndex + 1,
      cues: [{ id: `${segment.id}-a`, text: segment.text, start: 0, end: 1 }],
    }));
    return {
      sceneId: scene.sceneId,
      offset: sceneIndex * scene.segments.length,
      duration: scene.segments.length,
      narrationDuration: scene.segments.length,
      end: (sceneIndex + 1) * scene.segments.length,
      segments,
    };
  });
  fs.mkdirSync(path.dirname(files.audio), { recursive: true });
  fs.writeFileSync(files.audio, JSON.stringify({ schemaVersion: "1.0", videoId: project.config.slug, scenes }, null, 2));
  fs.writeFileSync(files.subtitle, JSON.stringify({ schemaVersion: "1.0", videoId: project.config.slug, scenes }, null, 2));
  fs.writeFileSync(files.timeline, JSON.stringify({ schemaVersion: "1.0", videoId: project.config.slug, duration: scenes.at(-1).end, scenes }, null, 2));
}

test("builds a bounded TTS execution input with the frozen rate and output contract", () => {
  const { project } = fixture();
  const input = buildTtsExecutionInput(project);
  assert.equal(input.kind, "video-tts-execution");
  assert.equal(input.rate, "+25%");
  assert.equal(input.voice, "zh-CN-XiaoxiaoNeural");
  assert.equal(input.input.ttsScript, "videos/tts-executor-video/tts-script.json");
  assert.equal(input.output.timelineManifest, "src/videos/tts-executor-video/generated/timeline-manifest.json");
});

test("runs a single TTS executor and only advances after output validation", async () => {
  const { slug, project } = fixture();
  const prepared = prepareAtSubtitleTimeline(project);
  const executor = createTtsExecutor({
    command: process.execPath,
    args: ["-e", "process.stdin.resume(); process.stdin.on('end', () => process.exit(0));"],
    input: ({ project: current }) => ({ slug: current.config.slug }),
  });
  const wrapped = {
    run: async (context) => {
      const result = await executor.run(context);
      writeValidManifests(context.project);
      return result;
    },
  };

  await runStage(loadProject(slug), "subtitle-timeline", { executors: { "subtitle-timeline": wrapped } });
  const finished = loadProject(slug, { refresh: false });
  assert.equal(finished.state.currentStage, "remotion");
  assert.equal(finished.state.stages["subtitle-timeline"].status, "succeeded");
  assert.deepEqual(finished.state.stages["subtitle-timeline"].outputs, []);
});

test("marks a failed TTS executor as failed without advancing the project", async () => {
  const { slug, project } = fixture();
  prepareAtSubtitleTimeline(project);
  const executor = {
    run() {
      const error = new Error("TTS service unavailable");
      error.code = "tts-service-unavailable";
      throw error;
    },
  };

  assert.throws(
    () => runStage(loadProject(slug), "subtitle-timeline", { executors: { "subtitle-timeline": executor } }),
    /TTS service unavailable/,
  );
  const failed = loadProject(slug, { refresh: false });
  assert.equal(failed.state.currentStage, "subtitle-timeline");
  assert.equal(failed.state.stages["subtitle-timeline"].status, "failed");
  assert.equal(failed.state.stages["subtitle-timeline"].error.code, "tts-service-unavailable");
});
