import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createMockAdapter } from "../src/adapters.mjs";
import { initializeProject, loadProject } from "../src/storage.mjs";
import { approveGate, rejectGate, resumeProject, runStage } from "../src/runner.mjs";

function createFixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-projects-"));
  const slug = "fixture-video";
  const files = [
    `videos/${slug}/source.md`,
    `videos/${slug}/content-analysis.md`,
    `videos/${slug}/video-narrative.md`,
    `videos/${slug}/scene-script.md`,
    `videos/${slug}/narration-script.md`,
    `videos/${slug}/visual-script.md`,
    `videos/${slug}/visual-prototype.html`,
    `videos/${slug}/tts-script.json`,
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ];

  for (const relativePath of files) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, "fixture\n", "utf8");
  }

  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;
  initializeProject(slug);
  return { slug, projectsRoot };
}

function loadFixture(slug) {
  return loadProject(slug);
}

function runToGate3(project) {
  const preGateStages = [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
  ];
  for (const stage of preGateStages) {
    runStage(project, stage);
  }
  runStage(project, "gate-2");
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");
  runStage(project, "remotion");
  runStage(project, "gate-3");
}

test("completes the fixture workflow with mock adapters", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");

  const smoke = createMockAdapter();
  runStage(project, "smoke-render", { adapters: { "smoke-render": smoke } });
  const render = createMockAdapter();
  runStage(project, "render", { adapters: { render } });
  runStage(project, "gate-4");
  approveGate(project, "gate-4");

  const finalState = loadFixture(slug).state;
  assert.equal(finalState.currentStage, "completed");
  assert.equal(finalState.stages["gate-4"].status, "succeeded");
  assert.deepEqual(smoke.calls, [{ stage: "smoke-render", slug }]);
  assert.deepEqual(render.calls, [{ stage: "render", slug }]);
});

test("resumes an adapter failure without repeating the failed attempt", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");

  const adapter = createMockAdapter({ failOnce: true });
  assert.throws(() => runStage(project, "smoke-render", { adapters: { "smoke-render": adapter } }), /Mock adapter failure/);
  assert.equal(loadFixture(slug).state.stages["smoke-render"].status, "failed");
  assert.equal(loadFixture(slug).state.stages["smoke-render"].attempts, 1);

  assert.deepEqual(resumeProject(loadFixture(slug)), { stage: "smoke-render", status: "ready" });
  runStage(loadFixture(slug), "smoke-render", { adapters: { "smoke-render": adapter } });
  assert.equal(loadFixture(slug).state.stages["smoke-render"].status, "succeeded");
  assert.equal(adapter.calls.length, 2);
});

test("requires an explicit return stage when rejecting a Gate", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);

  rejectGate(project, "gate-3", "remotion", "visual mismatch");
  const state = loadFixture(slug).state;
  assert.equal(state.currentStage, "remotion");
  assert.equal(state.stages.remotion.status, "ready");
  assert.equal(state.stages["gate-3"].status, "pending");
  assert.equal(state.stages["gate-3"].error.message, "visual mismatch");
});
