import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createAgentJob, getAgentJob, retryAgentJob, runAgentJob } from "../src/agent-jobs.mjs";
import { buildTaskPacket } from "../src/context.mjs";
import { buildPrototypeBaseline, getPrototypeBaseline, remotionAlignmentPath } from "../src/remotion-alignment.mjs";
import { buildRemotionTimingPlan } from "../src/remotion-timing.mjs";
import { buildNextAction } from "../src/reports.mjs";
import { approveGate, runStage, validateStage } from "../src/runner.mjs";
import { initializeProject, loadProject } from "../src/storage.mjs";

function roots(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  process.env.HARNESS_WORKSPACE_ROOT = path.join(root, "workspace");
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_AGENT_JOBS_DIR = path.join(root, "agent-jobs");
  process.env.HARNESS_TTS_PROJECT_DIR = path.resolve(new URL("../..", import.meta.url).pathname, "..", "tts");
  return root;
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${content}\n`, "utf8");
}

test("persists an Agent Job and advances only after the executor output validates", async () => {
  roots("video-agent-job-");
  const slug = "agent-job-video";
  write(process.env.HARNESS_WORKSPACE_ROOT, `videos/${slug}/source.md`, "# Source\n\n测试内容。");
  initializeProject(slug);

  const job = createAgentJob({ slug, stage: "source" });
  let calls = 0;
  const finished = await runAgentJob(job.id, {
    executor: {
      async run({ stage, project }) {
        calls += 1;
        assert.equal(stage, "source");
        assert.equal(project.config.slug, slug);
        return { executor: "fixture-agent", stdout: "done", stderr: "" };
      },
    },
  });

  assert.equal(calls, 1);
  assert.equal(finished.status, "succeeded");
  assert.equal(finished.logs.stdout, "done");
  assert.equal(loadProject(slug, { refresh: false }).state.currentStage, "content-analysis");
});

test("keeps an unconfigured Agent Job failed and retryable", async () => {
  roots("video-agent-job-unconfigured-");
  const slug = "unconfigured-agent-video";
  write(process.env.HARNESS_WORKSPACE_ROOT, `videos/${slug}/source.md`, "# Source\n\n测试内容。");
  initializeProject(slug);

  const job = createAgentJob({ slug, stage: "source" });
  const failed = await runAgentJob(job.id);
  assert.equal(failed.status, "failed");
  assert.equal(failed.error.code, "executor-not-configured");
  assert.equal(retryAgentJob(job.id).status, "queued");
  assert.equal(getAgentJob(job.id).status, "queued");
});

test("allows an Agent stage to run before its own output artifact exists", () => {
  roots("video-agent-job-preflight-");
  const slug = "agent-preflight-video";
  write(process.env.HARNESS_WORKSPACE_ROOT, `videos/${slug}/source.md`, "# Source\n\n测试内容。");
  initializeProject(slug);

  const project = loadProject(slug, { refresh: false });
  runStage(project, "source");
  const readyProject = loadProject(slug, { refresh: false });

  assert.equal(validateStage(readyProject, "content-analysis").some((item) => item.code === "missing-artifact"), true);
  assert.equal(buildNextAction(readyProject).action, "run-stage");
  assert.deepEqual(buildNextAction(readyProject).issues, []);
});

test("fails an Agent Job when the process exits successfully without required output", async () => {
  roots("video-agent-job-invalid-output-");
  const slug = "invalid-agent-output-video";
  initializeProject(slug);

  const job = createAgentJob({ slug, stage: "source" });
  const failed = await runAgentJob(job.id, { executor: { async run() { return { stdout: "no output" }; } } });
  assert.equal(failed.status, "failed");
  assert.equal(failed.error.code, "validation-failed");
  assert.equal(loadProject(slug, { refresh: false }).state.stages.source.status, "failed");
});

function createAlignmentFixture() {
  roots("video-remotion-alignment-");
  const slug = "alignment-video";
  const workspace = process.env.HARNESS_WORKSPACE_ROOT;
  const documents = {
    "source.md": "# Source\n\n内容。",
    "content-analysis.md": "# Content Analysis\n\n## 核心命题\n内容。\n\n## 关键关系\n关系。\n\n## 可视觉化内容\n状态。",
    "video-narrative.md": "# Video Narrative\n\n## 叙事目标\n解释。\n\n## 叙事原则\n清晰。\n\n## 整体叙事结构\n开始到结束。",
    "scene-script.md": "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证。\n\n### narrativeRole\n建立。\n\n### narrationIntent\n解释。\n\n### visualIntent\n展示。\n\n### visualType\n流程。\n\n### keyOnScreenText\n状态。\n\n### videoValue\n可见。",
    "narration-script.md": "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。",
    "visual-script.md": "# Visual Script\n\n## 全局视觉原则\n清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示。\n\n### 画面结构\n中心状态卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\n状态。\n\n### Visual Type\n流程。",
    "visual-prototype.html": "<!doctype html><button>上一幕</button><button>下一幕</button><button>自动播放</button><div id=\"progress\"></div><section class=\"scene\">Scene 01</section>",
    "tts-script.json": JSON.stringify({ schemaVersion: "1.0", scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "这是测试口播。" }] }] }),
  };
  for (const [file, content] of Object.entries(documents)) write(workspace, `videos/${slug}/${file}`, content);
  write(workspace, `src/videos/${slug}/generated/audio-manifest.json`, JSON.stringify({ scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3", duration: 1 }] }] }));
  write(workspace, `src/videos/${slug}/generated/subtitle-manifest.json`, JSON.stringify({ scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ start: 0, end: 0.9, text: "这是测试口播" }] }] }] }));
  write(workspace, `src/videos/${slug}/generated/timeline-manifest.json`, JSON.stringify({ duration: 1, scenes: [{ sceneId: "01", offset: 0, duration: 1, end: 1, segments: [{ segmentId: "01-01", offset: 0, duration: 1, end: 1 }] }] }));
  initializeProject(slug, { prototypeBaseline: null });
  const project = loadProject(slug, { refresh: false });
  for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype"]) runStage(project, stage);
  runStage(project, "gate-2");
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");
  return loadProject(slug, { refresh: false });
}

test("freezes Gate 2 prototype fingerprints and enforces per-Scene Remotion alignment", () => {
  const project = createAlignmentFixture();
  const baseline = getPrototypeBaseline(project);
  assert.equal(baseline.alignmentRequired, true);
  assert.deepEqual(baseline.sceneIds, ["01"]);

  const packet = buildTaskPacket(project);
  assert.equal(packet.context.writePaths.includes(remotionAlignmentPath(project)), true);
  assert.equal(packet.context.writePaths.includes("src/Root.tsx"), true);
  assert.equal(packet.context.writePaths.includes(`src/videos/${project.config.slug}/*.tsx`), true);
  assert.equal(validateStage(project, "remotion").some((item) => item.code === "missing-remotion-alignment"), true);

  write(project.config.workspaceRoot, `src/videos/${project.config.slug}/video.config.ts`, "const fps = 30; const subtitleManifest = {}; const timelineManifest = {}; export const videoConfig = { width: 1920, height: 1080, fps, scenes: [] };");
  write(project.config.workspaceRoot, `src/videos/${project.config.slug}/AlignmentVideo.tsx`, "export const AlignmentVideo = () => null;");
  write(project.config.workspaceRoot, "src/Root.tsx", `export const compositionId = "${project.config.slug}";`);
  const timingPlan = buildRemotionTimingPlan({ workspaceRoot: project.config.workspaceRoot, slug: project.config.slug, fps: 30 });
  const expectedScene = timingPlan.scenes[0];
  const expectedSegment = expectedScene.segments[0];
  const expectedCue = expectedSegment.cues[0];
  write(project.config.workspaceRoot, remotionAlignmentPath(project), JSON.stringify({
    schemaVersion: 2,
    slug: project.config.slug,
    prototypeFingerprint: baseline.visualPrototype.fingerprint,
    visualScriptFingerprint: baseline.visualScript.fingerprint,
    timing: {
      fps: timingPlan.fps,
      totalDurationSeconds: timingPlan.durationSeconds,
      totalDurationFrames: timingPlan.durationFrames,
      sources: {
        ttsScript: `videos/${project.config.slug}/tts-script.json`,
        audioManifest: `src/videos/${project.config.slug}/generated/audio-manifest.json`,
        subtitleManifest: `src/videos/${project.config.slug}/generated/subtitle-manifest.json`,
        timelineManifest: `src/videos/${project.config.slug}/generated/timeline-manifest.json`,
      },
    },
    scenes: [{
      sceneId: "01",
      layout: "中心状态卡片",
      visualEvents: ["淡入"],
      screenText: ["状态"],
      implementationFiles: [`src/videos/${project.config.slug}/AlignmentVideo.tsx`],
      timing: {
        timelineSource: `src/videos/${project.config.slug}/generated/timeline-manifest.json`,
        startSeconds: expectedScene.startSeconds,
        endSeconds: expectedScene.endSeconds,
        durationSeconds: expectedScene.durationSeconds,
        startFrame: expectedScene.startFrame,
        endFrame: expectedScene.endFrame,
        durationFrames: expectedScene.durationFrames,
      },
      audioSegments: [{
        segmentId: expectedSegment.segmentId,
        file: expectedSegment.audioFile,
        startSeconds: expectedSegment.startSeconds,
        endSeconds: expectedSegment.endSeconds,
        durationSeconds: expectedSegment.durationSeconds,
        startFrame: expectedSegment.startFrame,
        endFrame: expectedSegment.endFrame,
        durationFrames: expectedSegment.durationFrames,
      }],
      subtitleCues: [{
        cueId: expectedCue.id,
        segmentId: expectedCue.segmentId,
        startSeconds: expectedCue.startSeconds,
        endSeconds: expectedCue.endSeconds,
        startFrame: expectedCue.startFrame,
        endFrame: expectedCue.endFrame,
      }],
      animationEvents: [{
        event: "淡入",
        source: { type: "cue", id: expectedCue.id },
        atSeconds: expectedCue.startSeconds,
        atFrame: expectedCue.startFrame,
      }],
    }],
  }));
  assert.deepEqual(validateStage(loadProject(project.config.slug, { refresh: false }), "remotion"), []);

  const alignmentFile = path.join(project.config.workspaceRoot, remotionAlignmentPath(project));
  const invalidAlignment = JSON.parse(fs.readFileSync(alignmentFile, "utf8"));
  invalidAlignment.scenes[0].animationEvents = [];
  fs.writeFileSync(alignmentFile, `${JSON.stringify(invalidAlignment)}\n`, "utf8");
  assert.equal(validateStage(loadProject(project.config.slug, { refresh: false }), "remotion").some((item) => item.code === "remotion-alignment-animation-events-missing"), true);

  fs.writeFileSync(alignmentFile, `${JSON.stringify(JSON.parse(fs.readFileSync(alignmentFile, "utf8")), null, 2)}\n`, "utf8");
  const restoredAlignment = JSON.parse(fs.readFileSync(alignmentFile, "utf8"));
  restoredAlignment.scenes[0].animationEvents = [{
    event: "淡入",
    source: {type: "cue", id: expectedCue.id},
    atSeconds: expectedCue.startSeconds,
    atFrame: expectedCue.startFrame,
  }];
  fs.writeFileSync(alignmentFile, `${JSON.stringify(restoredAlignment, null, 2)}\n`, "utf8");
  fs.appendFileSync(path.join(project.config.workspaceRoot, `videos/${project.config.slug}/visual-prototype.html`), "\n<!-- changed -->\n", "utf8");
  assert.equal(validateStage(loadProject(project.config.slug, { refresh: false }), "remotion").some((item) => item.code === "prototype-baseline-stale"), true);
});

test("accepts the top-level Scene headings used by Visual Script documents", () => {
  const project = createAlignmentFixture();
  const visualScriptPath = path.join(project.config.workspaceRoot, `videos/${project.config.slug}/visual-script.md`);
  const visualScript = fs.readFileSync(visualScriptPath, "utf8").replace(/^## Scene/m, "# Scene");
  fs.writeFileSync(visualScriptPath, visualScript, "utf8");

  assert.deepEqual(buildPrototypeBaseline(project).sceneIds, ["01"]);
});
