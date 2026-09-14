import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { packageVideoAssets } from "../src/asset-bundler.mjs";
import { createBatch } from "../src/batches.mjs";
import { createJobRecord, getJob, updateJob } from "../src/jobs.mjs";
import { prepareRenderInput, packageRenderInput, writeRenderEntryPoint } from "../src/render-input.mjs";
import { createRemoteJobMonitor } from "../src/remote-jobs.mjs";
import { applySeriesStyle, initializeProject, loadProject, projectFiles, readJson, reconcileCurrentRemotionOutput, reopenGate3ForSeriesCover, writeJson } from "../src/storage.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage } from "../src/runner.mjs";
import { ensureRemotionTask } from "../src/remotion-tasks.mjs";
import { createAgentJob } from "../src/agent-jobs.mjs";
import { markHistoricalProjectCompleted } from "../src/adoption.mjs";
import { ensureTtsScript } from "../src/tts-script.mjs";
import { freezePrototypeBaseline } from "../src/remotion-alignment.mjs";

function pngHeader(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function setEnvironment(root, extra = {}) {
  const keys = ["HARNESS_PROJECTS_DIR", "HARNESS_WORKSPACE_ROOT", "HARNESS_SERIES_DIR", "HARNESS_SERIES_ASSETS_DIR", "HARNESS_RENDER_INPUT_DIR"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_WORKSPACE_ROOT = path.join(root, "workspace");
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  process.env.HARNESS_SERIES_ASSETS_DIR = path.join(root, "series-assets");
  process.env.HARNESS_RENDER_INPUT_DIR = path.join(root, "render-input");
  Object.assign(process.env, extra);
  return () => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  };
}

function markCompleted(slug) {
  const files = projectFiles(slug);
  const state = readJson(files.state);
  state.currentStage = "completed";
  for (const item of Object.values(state.stages)) item.status = "succeeded";
  writeJson(files.state, state);
  return files;
}

test("completed projects reject every mutating Harness entry and remain readable", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-completed-readonly-"));
  const restore = setEnvironment(root);
  try {
    const slug = "completed-fixture";
    fs.mkdirSync(path.join(process.env.HARNESS_WORKSPACE_ROOT, "videos", slug), { recursive: true });
    initializeProject(slug);
    const remoteJob = createJobRecord({ slug, stage: "render" });
    const files = markCompleted(slug);
    const stateBefore = fs.readFileSync(files.state, "utf8");
    fs.writeFileSync(path.join(process.env.HARNESS_WORKSPACE_ROOT, "videos", slug, "source.md"), "changed after completion\n");
    const project = loadProject(slug);
    const manifestPath = path.join(root, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ videoSlug: slug }), "utf8");

    assert.equal(project.state.currentStage, "completed");
    assert.equal(fs.readFileSync(files.state, "utf8"), stateBefore);
    for (const action of [
      () => runStage(project),
      () => approveGate(project, "gate-4"),
      () => rejectGate(project, "gate-4", "render", "test"),
      () => retryStage(project),
      () => applySeriesStyle(slug, "codex"),
      () => reopenGate3ForSeriesCover(slug),
      () => createBatch({ type: "to-gate-2", slugs: [slug] }),
      () => createAgentJob({ slug, stage: "source" }),
      () => ensureRemotionTask({ slug, batchId: null }),
      () => updateJob(slug, remoteJob.id, { status: "failed" }),
      () => prepareRenderInput(project),
      () => packageRenderInput(process.env.HARNESS_WORKSPACE_ROOT, slug),
      () => packageVideoAssets(project),
      () => ensureTtsScript(project),
      () => freezePrototypeBaseline(project),
      () => reconcileCurrentRemotionOutput(project),
      () => writeRenderEntryPoint(manifestPath, path.join(process.env.HARNESS_WORKSPACE_ROOT, "videos", slug, "RenderInputRoot.tsx")),
      () => markHistoricalProjectCompleted(slug),
    ]) {
      assert.throws(action, (error) => error.code === "completed-project-readonly");
    }
    assert.deepEqual(resumeProject(project), {
      stage: "completed",
      status: "completed",
      readOnly: true,
      message: "视频已完成并永久只读，没有可恢复的任务。",
    });

    const monitor = createRemoteJobMonitor({ adapterFactory: () => { throw new Error("adapter must not be called"); } });
    assert.throws(() => monitor.submit({ slug, stage: "render" }), (error) => error.code === "completed-project-readonly");
    assert.equal(getJob(slug, remoteJob.id).status, "queued");
  } finally {
    restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("series style and cover updates preflight all completed members before writing", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-completed-series-"));
  const restore = setEnvironment(root);
  try {
    const { saveSeries, saveSeriesCover, getSeries } = await import("../src/series-assets.mjs");
    const slug = "completed-series-member";
    initializeProject(slug);
    saveSeries({ id: "completed-series", title: "测试系列", style: "current", videos: [slug] });
    markCompleted(slug);
    const seriesBefore = getSeries("completed-series");
    assert.throws(() => saveSeries({ id: "completed-series", title: "改名", videos: [slug] }), (error) => error.code === "completed-project-readonly");
    assert.deepEqual(getSeries("completed-series"), seriesBefore);
    assert.throws(() => saveSeriesCover("completed-series", pngHeader(1920, 1080), "image/png"), (error) => error.code === "completed-project-readonly");
    assert.equal(fs.existsSync(path.join(process.env.HARNESS_SERIES_ASSETS_DIR, "completed-series", "cover.png")), false);
    assert.equal(getSeries("completed-series").cover, null);
  } finally {
    restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("remote polling leaves an existing completed-video Job unchanged", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-completed-poll-"));
  const restore = setEnvironment(root);
  try {
    const slug = "completed-poll-video";
    initializeProject(slug);
    const job = createJobRecord({ slug, stage: "render", metadata: { status: "running" } });
    markCompleted(slug);
    const monitor = createRemoteJobMonitor({ adapterFactory: () => { throw new Error("adapter must not be called"); } });
    const before = getJob(slug, job.id);
    await monitor.processJob(job.id);
    assert.deepEqual(getJob(slug, job.id), before);
  } finally {
    restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
