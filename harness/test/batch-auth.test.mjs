import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBatch, runBatch } from "../src/batches.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";

function makeRenderReadyProject(slug) {
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  const completedStages = [
    "source", "content-analysis", "video-narrative", "scene-script", "narration-script",
    "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3",
  ];
  for (const stage of completedStages) project.state.stages[stage].status = "succeeded";
  project.state.stages["gate-3"].review = { decision: "approved", kind: "gate", reviewedAt: new Date().toISOString() };
  project.state.currentStage = "render";
  project.state.stages.render.status = "ready";
  writeJson(project.files.state, project.state);
}

test("blocks unauthorised batch dispatch before any executor or authentication side effect", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batch-auth-projects-"));
  const batchesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batch-auth-batches-"));
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousBatchesRoot = process.env.HARNESS_BATCHES_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_BATCHES_DIR = batchesRoot;
  const slug = "batch-auth-video";

  try {
    makeRenderReadyProject(slug);
    const batch = createBatch({ type: "to-render", slugs: [slug] });
    const authError = new Error("GitHub API 返回 HTTP 401");
    authError.code = "github-auth-invalid";
    authError.issues = [{ code: "github-preflight-authentication", message: "认证失败" }];
    let calls = 0;
    await assert.rejects(() => runBatch(batch.id, {
      remoteMonitor: { async poll() {} },
      remoteExecutor: { async run() { calls += 1; throw authError; } },
    }), { code: "batch-render-delivery-confirmation-required" });
    assert.equal(calls, 0);

  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousBatchesRoot === undefined) delete process.env.HARNESS_BATCHES_DIR;
    else process.env.HARNESS_BATCHES_DIR = previousBatchesRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(batchesRoot, { recursive: true, force: true });
  }
});
