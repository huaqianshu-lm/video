import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createJob, findActiveJob, listJobs } from "../src/jobs.mjs";
import { createJobRecord, getJob, updateJob } from "../src/jobs.mjs";
import { createRemoteJobMonitor } from "../src/remote-jobs.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";

test("persists a background job and its completed result", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-jobs-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "job-video"), { recursive: true });

  try {
    const { job, done } = createJob({
      slug: "job-video",
      stage: "smoke-render",
      run: async () => ({ outputs: [{ kind: "test-output" }] }),
    });
    assert.equal(job.status, "queued");
    assert.equal(findActiveJob("job-video", "smoke-render")?.id, job.id);
    const finished = await done;
    assert.equal(finished.status, "succeeded");
    assert.deepEqual(finished.result.outputs, [{ kind: "test-output" }]);
    assert.equal(findActiveJob("job-video", "smoke-render"), null);
    assert.equal(listJobs("job-video").length, 1);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("recovers a persisted remote job and advances the Harness stage", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remote-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "remote-video"), { recursive: true });

  try {
    initializeProject("remote-video");
    const project = loadProject("remote-video", { refresh: false });
    project.state.currentStage = "smoke-render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages["smoke-render"].status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({ slug: "remote-video", stage: "smoke-render" });
    const adapter = {
      createDispatch: ({ stage, project: current, dispatchedAt }) => ({
        workflow: "smoke-test-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      findDispatchedRunOnce: async () => null,
      dispatchWorkflow: async ({ stage, project: current, dispatchedAt }) => ({
        workflow: "smoke-test-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      inspectRun: async ({ dispatch }) => ({
        status: "succeeded",
        remote: { ...dispatch, runId: 123, runUrl: "https://github.com/example/video/actions/runs/123" },
        result: { outputs: [{ kind: "github-actions-run", runId: 123, artifactName: "remote-video-smoke-test" }] },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
    await monitor.processJob(job.id);

    const finished = getJob("remote-video", job.id);
    assert.equal(finished.status, "succeeded");
    assert.equal(finished.remote.runId, 123);
    assert.equal(loadProject("remote-video").state.currentStage, "render");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("keeps a remote job waiting when GitHub configuration is unavailable", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-config-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "config-video"), { recursive: true });

  try {
    initializeProject("config-video");
    const job = createJobRecord({ slug: "config-video", stage: "smoke-render" });
    const error = new Error("GITHUB_TOKEN or GH_TOKEN is required");
    error.code = "github-config-invalid";
    error.issues = [{ code: "missing-token" }];
    const monitor = createRemoteJobMonitor({ adapterFactory: () => { throw error; } });
    await monitor.processJob(job.id);
    const waiting = getJob("config-video", job.id);
    assert.equal(waiting.status, "waiting-config");
    assert.equal(waiting.error.code, "github-config-invalid");
    assert.equal(loadProject("config-video", { refresh: false }).state.stages["smoke-render"].status, "pending");
    updateJob("config-video", job.id, { status: "failed" });
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("does not dispatch twice after recovering a persisted dispatch intent", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-recover-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "recover-video"), { recursive: true });

  try {
    initializeProject("recover-video");
    const project = loadProject("recover-video", { refresh: false });
    project.state.currentStage = "smoke-render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages["smoke-render"].status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "recover-video",
      stage: "smoke-render",
      metadata: {
        status: "dispatching",
        dispatchingAt: "2026-08-23T00:00:00.000Z",
        remote: {
          workflow: "smoke-test-video.yml",
          ref: "main",
          slug: "recover-video",
          compositionId: "recover-video",
          dispatchedAt: "2026-08-23T00:00:00.000Z",
        },
      },
    });
    let dispatchCount = 0;
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "smoke-test-video.yml", ref: "main", slug: current.state.slug, compositionId: current.config.slug, dispatchedAt,
      }),
      findDispatchedRunOnce: async () => ({ id: 456, html_url: "https://github.com/example/video/actions/runs/456" }),
      dispatchWorkflow: async () => { dispatchCount += 1; throw new Error("duplicate dispatch"); },
      inspectRun: async ({ dispatch }) => ({
        status: "running",
        remote: { ...dispatch, runId: 456, runUrl: "https://github.com/example/video/actions/runs/456" },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter });
    await monitor.processJob(job.id);

    assert.equal(dispatchCount, 0);
    assert.equal(getJob("recover-video", job.id).status, "running");
    assert.equal(getJob("recover-video", job.id).remote.runId, 456);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});
