import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createJob, findActiveJob, listJobs } from "../src/jobs.mjs";
import { createJobRecord, getJob, updateJob } from "../src/jobs.mjs";
import { createRemoteJobMonitor } from "../src/remote-jobs.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { validateProjectStage } from "../src/validation.mjs";
import { bindRenderInputDelivery, packageRenderInput, prepareRenderInput, renderInputDeliveryPath } from "../src/render-input.mjs";

test("persists a background job and its completed result", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-jobs-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "job-video"), { recursive: true });

  try {
    const { job, done } = createJob({
      slug: "job-video",
      stage: "render",
      run: async () => ({ outputs: [{ kind: "test-output" }] }),
    });
    assert.equal(job.status, "queued");
    assert.equal(findActiveJob("job-video", "render")?.id, job.id);
    const finished = await done;
    assert.equal(finished.status, "succeeded");
    assert.deepEqual(finished.result.outputs, [{ kind: "test-output" }]);
    assert.equal(findActiveJob("job-video", "render"), null);
    assert.equal(listJobs("job-video").length, 1);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("recovers a persisted complete Render job and advances to Gate 4", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remote-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "remote-video"), { recursive: true });

  try {
    initializeProject("remote-video");
    const project = loadProject("remote-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({ slug: "remote-video", stage: "render" });
    const adapter = {
      createDispatch: ({ stage, project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      findDispatchedRunOnce: async () => null,
      dispatchWorkflow: async ({ stage, project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      inspectRun: async ({ dispatch }) => ({
        status: "succeeded",
        remote: { ...dispatch, runId: 123, runUrl: "https://github.com/example/video/actions/runs/123" },
        result: { outputs: [{ kind: "github-actions-run", runId: 123, artifactName: "remote-video" }] },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
    await monitor.processJob(job.id);

    const finished = getJob("remote-video", job.id);
    assert.equal(finished.status, "succeeded");
    assert.equal(finished.remote.runId, 123);
    assert.equal(loadProject("remote-video").state.currentStage, "gate-4");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("opens Gate 4 after a remote render Artifact succeeds without a local MP4", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remote-render-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "remote-render-video"), { recursive: true });

  try {
    initializeProject("remote-render-video");
    const project = loadProject("remote-render-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({ slug: "remote-render-video", stage: "render" });
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      findDispatchedRunOnce: async () => null,
      dispatchWorkflow: async ({ project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      inspectRun: async ({ dispatch }) => ({
        status: "succeeded",
        remote: { ...dispatch, runId: 987, runUrl: "https://github.com/example/video/actions/runs/987" },
        result: {
          outputs: [{
            kind: "github-actions-run",
            stage: "render",
            runId: 987,
            artifactName: "remote-render-video",
            artifacts: [{ name: "remote-render-video", id: 654, sizeInBytes: 100, expired: false }],
          }],
        },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
    await monitor.processJob(job.id);

    const finished = getJob("remote-render-video", job.id);
    assert.equal(finished.status, "succeeded");
    assert.equal(finished.remote.runId, 987);
    const state = loadProject("remote-render-video").state;
    assert.equal(state.currentStage, "gate-4");
    assert.equal(state.stages.render.status, "succeeded");
    assert.equal(state.stages.render.outputFingerprint, null);
    assert.equal(state.stages["gate-4"].status, "waiting");
    assert.deepEqual(validateProjectStage(loadProject("remote-render-video"), "render"), []);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("reconciles a previously dispatched render after the first remote check failed", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-reconcile-render-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "reconcile-render-video"), { recursive: true });

  try {
    initializeProject("reconcile-render-video");
    const project = loadProject("reconcile-render-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "failed";
    project.state.stages.render.error = {
      code: "adapter-failed",
      stage: "render",
      message: "GitHub API 401: Bad credentials",
    };
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "reconcile-render-video",
      stage: "render",
      metadata: {
        status: "waiting-config",
        error: {
          code: "github-config-invalid",
          message: "GITHUB_TOKEN or GH_TOKEN is required",
        },
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "reconcile-render-video",
          compositionId: "reconcile-render-video",
          dispatchId: "dispatch-reconcile-render",
          dispatchedAt: "2026-08-23T11:37:50.000Z",
          dispatchState: "sending",
        },
      },
    });
    const adapter = {
      findDispatchedRunOnce: async () => ({ id: 654, html_url: "https://github.com/example/video/actions/runs/654" }),
      inspectRun: async ({ dispatch, recoverExisting }) => {
        assert.equal(recoverExisting, true);
        return {
          status: "succeeded",
          remote: { ...dispatch, runId: 654, runUrl: "https://github.com/example/video/actions/runs/654" },
          result: {
            outputs: [{
              kind: "github-actions-run",
              stage: "render",
              runId: 654,
              artifactName: "reconcile-render-video",
              artifacts: [{ name: "reconcile-render-video", id: 987, sizeInBytes: 100, expired: false }],
            }],
          },
        };
      },
    };
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => adapter,
      pollIntervalMs: 10,
      now: () => new Date("2026-08-23T11:38:00.000Z"),
    });
    await monitor.poll();

    const finished = getJob("reconcile-render-video", job.id);
    assert.equal(finished.status, "succeeded");
    assert.equal(finished.remote.runId, 654);
    assert.equal(loadProject("reconcile-render-video").state.currentStage, "gate-4");
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
    const job = createJobRecord({ slug: "config-video", stage: "render" });
    const error = new Error("GITHUB_TOKEN or GH_TOKEN is required");
    error.code = "github-config-invalid";
    error.issues = [{ code: "missing-token" }];
    const monitor = createRemoteJobMonitor({ adapterFactory: () => { throw error; } });
    await monitor.processJob(job.id);
    const waiting = getJob("config-video", job.id);
    assert.equal(waiting.status, "waiting-config");
    assert.equal(waiting.error.code, "github-config-invalid");
    assert.equal(loadProject("config-video", { refresh: false }).state.stages.render.status, "pending");
    updateJob("config-video", job.id, { status: "failed" });
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("keeps a remote job waiting when the GitHub token is rejected after queueing", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-auth-failure-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "auth-failure-video"), { recursive: true });

  try {
    initializeProject("auth-failure-video");
    const job = createJobRecord({ slug: "auth-failure-video", stage: "render" });
    const error = new Error("GitHub API 401: Bad credentials");
    error.code = "github-auth-invalid";
    error.issues = [{ code: "github-preflight-authentication", message: "认证失败" }];
    const monitor = createRemoteJobMonitor({ adapterFactory: () => { throw error; } });
    await monitor.processJob(job.id);
    const waiting = getJob("auth-failure-video", job.id);
    assert.equal(waiting.status, "waiting-config");
    assert.equal(waiting.error.code, "github-auth-invalid");
    assert.equal(loadProject("auth-failure-video", { refresh: false }).state.stages.render.status, "pending");
    updateJob("auth-failure-video", job.id, { status: "failed" });
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
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "recover-video",
      stage: "render",
      metadata: {
        status: "dispatching",
        dispatchingAt: "2026-08-23T00:00:00.000Z",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "recover-video",
          compositionId: "recover-video",
          dispatchId: "dispatch-recover-video",
          dispatchedAt: "2026-08-23T00:00:00.000Z",
          dispatchState: "confirmed",
          dispatchConfirmedAt: "2026-08-23T00:00:01.000Z",
        },
      },
    });
    let dispatchCount = 0;
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "render-video.yml", ref: "main", slug: current.state.slug, compositionId: current.config.slug, dispatchedAt,
      }),
      findDispatchedRunOnce: async () => ({ id: 456, html_url: "https://github.com/example/video/actions/runs/456" }),
      dispatchWorkflow: async () => { dispatchCount += 1; throw new Error("duplicate dispatch"); },
      inspectRun: async ({ dispatch }) => ({
        status: "running",
        remote: { ...dispatch, runId: 456, runUrl: "https://github.com/example/video/actions/runs/456" },
      }),
    };
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => adapter,
      now: () => new Date("2026-08-23T00:00:02.000Z"),
    });
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

test("marks a dispatched remote job as timed out and stops scheduling checks", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-timeout-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "timeout-video"), { recursive: true });

  try {
    initializeProject("timeout-video");
    const project = loadProject("timeout-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "running";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "timeout-video",
      stage: "render",
      metadata: {
        status: "running",
        startedAt: "2026-08-23T00:00:00.000Z",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "timeout-video",
          compositionId: "timeout-video",
          dispatchState: "confirmed",
          dispatchConfirmedAt: "2026-08-23T00:00:00.000Z",
          runId: 99,
        },
      },
    });
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => ({ inspectRun: async () => ({ status: "running" }) }),
      now: () => new Date("2026-08-23T01:00:01.000Z"),
      jobTimeoutMs: 60 * 60 * 1_000,
    });

    await monitor.processJob(job.id);

    const timedOut = getJob("timeout-video", job.id);
    assert.equal(timedOut.status, "timeout");
    assert.equal(timedOut.error.code, "remote-job-timeout");
    assert.equal(timedOut.nextCheckAt, null);
    assert.equal(loadProject("timeout-video").state.stages.render.status, "failed");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("keeps transient GitHub API failures recoverable without failing the stage", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-recoverable-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "recoverable-video"), { recursive: true });

  try {
    initializeProject("recoverable-video");
    const project = loadProject("recoverable-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "running";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "recoverable-video",
      stage: "render",
      metadata: {
        status: "running",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "recoverable-video",
          compositionId: "recoverable-video",
          dispatchState: "confirmed",
          dispatchConfirmedAt: new Date().toISOString(),
          runId: 100,
        },
      },
    });
    const error = new Error("GitHub API 503: Service Unavailable");
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => ({ inspectRun: async () => { throw error; } }),
      now: () => new Date(),
    });

    await monitor.processJob(job.id);

    const recoverable = getJob("recoverable-video", job.id);
    assert.equal(recoverable.status, "recoverable");
    assert.equal(recoverable.error.classification, "recoverable");
    assert.ok(recoverable.nextCheckAt);
    assert.equal(loadProject("recoverable-video").state.stages.render.status, "running");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("dispatches a prepared intent without scanning an unrelated latest Run", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-retry-dispatch-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "retry-dispatch-video"), { recursive: true });

  try {
    initializeProject("retry-dispatch-video");
    const project = loadProject("retry-dispatch-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({ slug: "retry-dispatch-video", stage: "render" });
    let checkCount = 0;
    let dispatchCount = 0;
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      findDispatchedRunOnce: async () => {
        checkCount += 1;
        if (checkCount === 1) throw new Error("GitHub API 401: Bad credentials");
        return null;
      },
      dispatchWorkflow: async ({ project: current, dispatchedAt }) => {
        dispatchCount += 1;
        return {
          workflow: "render-video.yml",
          ref: "main",
          slug: current.state.slug,
          compositionId: current.config.slug,
          dispatchedAt,
        };
      },
      inspectRun: async ({ dispatch }) => ({
        status: "running",
        remote: { ...dispatch, runId: 321, runUrl: "https://github.com/example/video/actions/runs/321" },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });

    await monitor.processJob(job.id);
    const dispatched = getJob("retry-dispatch-video", job.id);
    assert.equal(dispatched.status, "running");
    assert.equal(checkCount, 0);
    assert.equal(dispatchCount, 1);
    assert.equal(dispatched.remote.dispatchState, "confirmed");
    assert.equal(dispatched.remote.runId, 321);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("supports explicit adoption of a successful historical render", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-adopt-render-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "adopt-render-video"), { recursive: true });

  try {
    initializeProject("adopt-render-video");
    const project = loadProject("adopt-render-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "running";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "adopt-render-video",
      stage: "render",
      metadata: { status: "waiting-run" },
    });
    const match = {
      run: {
        id: 1001,
        head_branch: "feat/video-production-pending",
        created_at: "2026-08-21T15:14:30.000Z",
        html_url: "https://github.com/example/video/actions/runs/1001",
      },
      artifacts: [{ name: "adopt-render-video", id: 1002, size_in_bytes: 100, expired: false }],
      artifact: { name: "adopt-render-video", id: 1002, size_in_bytes: 100, expired: false },
    };
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "render-video.yml",
        ref: "feat/video-harness-v0.5",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchedAt,
      }),
      findSuccessfulRunsWithArtifactOnce: async () => [match],
      inspectRun: async ({ dispatch }) => ({
        status: "succeeded",
        remote: dispatch,
        result: {
          outputs: [{
            kind: "github-actions-run",
            stage: "render",
            runId: 1001,
            artifactName: "adopt-render-video",
            artifacts: match.artifacts,
          }],
        },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });

    const candidates = await monitor.findHistorical({ slug: "adopt-render-video", stage: "render" });
    assert.deepEqual(candidates, [{
      runId: 1001,
      runUrl: "https://github.com/example/video/actions/runs/1001",
      ref: "feat/video-production-pending",
      createdAt: "2026-08-21T15:14:30.000Z",
      artifactName: "adopt-render-video",
      artifactSizeInBytes: 100,
    }]);

    const adopted = await monitor.adoptHistorical({ slug: "adopt-render-video", stage: "render", runId: 1001 });
    assert.equal(adopted.id, job.id);
    assert.equal(adopted.status, "succeeded");
    assert.equal(adopted.remote.ref, "feat/video-production-pending");
    assert.equal(loadProject("adopt-render-video").state.currentStage, "gate-4");
    assert.equal(loadProject("adopt-render-video").state.stages["gate-4"].status, "waiting");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("persists the exact Run returned by a dispatch and never remaps it by timestamp", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-direct-run-details-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "direct-run-details-video"), { recursive: true });

  try {
    initializeProject("direct-run-details-video");
    const project = loadProject("direct-run-details-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const dispatchId = "dispatch-direct-run-details";
    const job = createJobRecord({
      slug: "direct-run-details-video",
      stage: "render",
      metadata: { remote: { dispatchId, dispatchState: "prepared" } },
    });
    let inspectedRunId = null;
    const adapter = {
      requiresRenderPreflight: false,
      createDispatch: ({ project: current, dispatchedAt, dispatchId: currentDispatchId }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchId: currentDispatchId,
        dispatchedAt,
      }),
      verifyDispatchRef: async () => {},
      dispatchWorkflow: async ({ dispatchId: currentDispatchId }) => ({
        dispatchId: currentDispatchId,
        dispatchState: "confirmed",
        runId: 4242,
        runApiUrl: "https://api.github.com/repos/example/video/actions/runs/4242",
        runUrl: "https://github.com/example/video/actions/runs/4242",
      }),
      inspectRun: async ({ runId, dispatch }) => {
        inspectedRunId = runId;
        return {
          status: "running",
          remote: { ...dispatch, runId, runUrl: "https://github.com/example/video/actions/runs/4242" },
        };
      },
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
    await monitor.processJob(job.id);

    const persisted = getJob("direct-run-details-video", job.id);
    assert.equal(persisted.status, "running");
    assert.equal(persisted.remote.dispatchId, dispatchId);
    assert.equal(persisted.remote.runId, 4242);
    assert.equal(persisted.remote.runApiUrl, "https://api.github.com/repos/example/video/actions/runs/4242");
    assert.equal(inspectedRunId, 4242);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("recovers a sending dispatch by its persisted dispatchId without dispatching twice", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-sending-recovery-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "sending-recovery-video"), { recursive: true });

  try {
    initializeProject("sending-recovery-video");
    const project = loadProject("sending-recovery-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const dispatchId = "dispatch-sending-recovery";
    const job = createJobRecord({
      slug: "sending-recovery-video",
      stage: "render",
      metadata: {
        status: "failed",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "sending-recovery-video",
          compositionId: "sending-recovery-video",
          dispatchId,
          dispatchedAt: "2026-09-15T00:00:00.000Z",
          dispatchState: "sending",
        },
      },
    });
    let dispatchCount = 0;
    let lookupCount = 0;
    const adapter = {
      requiresRenderPreflight: false,
      findDispatchedRunOnce: async (dispatch) => {
        lookupCount += 1;
        assert.equal(dispatch.dispatchId, dispatchId);
        return { id: 5353, html_url: "https://github.com/example/video/actions/runs/5353" };
      },
      dispatchWorkflow: async () => {
        dispatchCount += 1;
        throw new Error("must not create another Run during recovery");
      },
      inspectRun: async ({ runId, dispatch }) => ({
        status: "running",
        remote: { ...dispatch, runId, runUrl: "https://github.com/example/video/actions/runs/5353" },
      }),
    };
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => adapter,
      pollIntervalMs: 10,
      now: () => new Date("2026-09-15T00:00:02.000Z"),
    });
    await monitor.processJob(job.id);

    const recovered = getJob("sending-recovery-video", job.id);
    assert.equal(dispatchCount, 0);
    assert.equal(lookupCount, 1);
    assert.equal(recovered.status, "running");
    assert.equal(recovered.remote.dispatchId, dispatchId);
    assert.equal(recovered.remote.runId, 5353);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("keeps the same dispatchId after a request failure that may have reached GitHub", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-request-recovery-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "request-recovery-video"), { recursive: true });

  try {
    initializeProject("request-recovery-video");
    const project = loadProject("request-recovery-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "request-recovery-video",
      stage: "render",
      metadata: { remote: { dispatchId: "dispatch-request-recovery", dispatchState: "prepared" } },
    });
    let dispatchCount = 0;
    let firstRequest = true;
    const adapter = {
      requiresRenderPreflight: false,
      createDispatch: ({ project: current, dispatchedAt, dispatchId }) => ({
        workflow: "render-video.yml",
        ref: "main",
        slug: current.state.slug,
        compositionId: current.config.slug,
        dispatchId,
        dispatchedAt,
      }),
      verifyDispatchRef: async () => {},
      dispatchWorkflow: async ({ dispatchId }) => {
        dispatchCount += 1;
        assert.equal(dispatchId, "dispatch-request-recovery");
        const persistedBeforeRequest = getJob("request-recovery-video", job.id);
        assert.equal(persistedBeforeRequest.remote.dispatchId, "dispatch-request-recovery");
        assert.equal(persistedBeforeRequest.remote.dispatchState, "sending");
        if (firstRequest) {
          firstRequest = false;
          throw new Error("request result was lost after GitHub accepted it");
        }
        throw new Error("must recover the accepted Run instead of dispatching again");
      },
      findDispatchedRunOnce: async (dispatch) => {
        assert.equal(dispatch.dispatchId, "dispatch-request-recovery");
        return firstRequest ? null : { id: 6464, html_url: "https://github.com/example/video/actions/runs/6464" };
      },
      inspectRun: async ({ runId, dispatch }) => ({
        status: "running",
        remote: { ...dispatch, runId, runUrl: "https://github.com/example/video/actions/runs/6464" },
      }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });

    await monitor.processJob(job.id);
    const afterFailure = getJob("request-recovery-video", job.id);
    assert.equal(afterFailure.status, "failed");
    assert.equal(afterFailure.remote.dispatchId, "dispatch-request-recovery");
    assert.equal(afterFailure.remote.dispatchState, "sending");

    const restartedMonitor = createRemoteJobMonitor({
      adapterFactory: () => adapter,
      pollIntervalMs: 10,
    });
    await restartedMonitor.processJob(job.id);
    const recovered = getJob("request-recovery-video", job.id);
    assert.equal(dispatchCount, 1);
    assert.equal(recovered.status, "running");
    assert.equal(recovered.remote.dispatchId, "dispatch-request-recovery");
    assert.equal(recovered.remote.runId, 6464);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks an ambiguous dispatch instead of selecting one of its matching Runs", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-ambiguous-dispatch-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "ambiguous-dispatch-video"), { recursive: true });

  try {
    initializeProject("ambiguous-dispatch-video");
    const project = loadProject("ambiguous-dispatch-video", { refresh: false });
    project.state.currentStage = "render";
    project.state.stages.render.status = "ready";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "ambiguous-dispatch-video",
      stage: "render",
      metadata: {
        status: "failed",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "ambiguous-dispatch-video",
          compositionId: "ambiguous-dispatch-video",
          dispatchId: "dispatch-ambiguous-job",
          dispatchedAt: new Date().toISOString(),
          dispatchState: "sending",
        },
      },
    });
    let dispatchCount = 0;
    const error = new Error("two Runs have the same dispatch marker");
    error.code = "remote-dispatch-ambiguous";
    const adapter = {
      requiresRenderPreflight: false,
      findDispatchedRunOnce: async () => { throw error; },
      dispatchWorkflow: async () => { dispatchCount += 1; },
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter });
    await monitor.processJob(job.id);

    const blocked = getJob("ambiguous-dispatch-video", job.id);
    assert.equal(dispatchCount, 0);
    assert.equal(blocked.status, "remote-dispatch-ambiguous");
    assert.equal(blocked.error.code, "remote-dispatch-ambiguous");
    assert.equal(blocked.nextCheckAt, null);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("marks a sending dispatch uncertain after its bounded recovery window", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-uncertain-dispatch-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "uncertain-dispatch-video"), { recursive: true });

  try {
    initializeProject("uncertain-dispatch-video");
    const project = loadProject("uncertain-dispatch-video", { refresh: false });
    project.state.currentStage = "render";
    project.state.stages.render.status = "running";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    writeJson(project.files.state, project.state);

    const job = createJobRecord({
      slug: "uncertain-dispatch-video",
      stage: "render",
      metadata: {
        status: "waiting-run",
        remote: {
          workflow: "render-video.yml",
          ref: "main",
          slug: "uncertain-dispatch-video",
          compositionId: "uncertain-dispatch-video",
          dispatchId: "dispatch-long-unknown",
          dispatchedAt: "2026-09-15T00:00:00.000Z",
          dispatchSentAt: "2026-09-15T00:00:00.000Z",
          dispatchState: "sending",
        },
      },
    });
    const monitor = createRemoteJobMonitor({
      adapterFactory: () => ({ inspectRun: async () => ({ status: "waiting-run" }) }),
      now: () => new Date("2026-09-15T01:00:01.000Z"),
      jobTimeoutMs: 60 * 60 * 1_000,
    });
    await monitor.processJob(job.id);

    const uncertain = getJob("uncertain-dispatch-video", job.id);
    assert.equal(uncertain.status, "remote-dispatch-uncertain");
    assert.equal(uncertain.error.code, "remote-dispatch-uncertain");
    assert.equal(uncertain.nextCheckAt, null);
    assert.equal(loadProject("uncertain-dispatch-video").state.stages.render.status, "failed");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("persists the exact input binding on a remote Job and blocks a later rebinding", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-bound-job-projects-"));
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-bound-job-workspace-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  const slug = "bound-job-video";
  try {
    initializeProject(slug);
    const project = loadProject(slug, { refresh: false });
    project.config.workspaceRoot = workspaceRoot;
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages.render.status = "ready";
    writeJson(project.files.config, project.config);
    writeJson(project.files.state, project.state);
    const sourceRoot = path.join(workspaceRoot, "videos", slug);
    const remotionRoot = path.join(workspaceRoot, "src", "videos", slug);
    const assetRoot = path.join(workspaceRoot, "public", "local-assets", slug);
    fs.mkdirSync(sourceRoot, { recursive: true });
    fs.mkdirSync(path.join(remotionRoot, "generated"), { recursive: true });
    fs.mkdirSync(path.join(assetRoot, "audio", "scene-01"), { recursive: true });
    fs.mkdirSync(path.join(assetRoot, "subtitles"), { recursive: true });
    fs.writeFileSync(path.join(sourceRoot, "source.md"), "source\n");
    fs.writeFileSync(path.join(remotionRoot, "BoundJobVideo.tsx"), "export const BoundJobVideo = () => null;\n");
    fs.writeFileSync(path.join(remotionRoot, "video.config.ts"), `export const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080};\n`);
    for (const name of ["audio-manifest.json", "subtitle-manifest.json", "timeline-manifest.json"]) {
      fs.writeFileSync(path.join(remotionRoot, "generated", name), JSON.stringify({ videoId: slug, scenes: [{ sceneId: "01", segments: name === "audio-manifest.json" ? [{ file: "audio/scene-01/01-01.mp3" }] : undefined }] }));
    }
    fs.writeFileSync(path.join(assetRoot, "audio", "scene-01", "01-01.mp3"), "audio");
    fs.writeFileSync(path.join(assetRoot, "subtitles", "captions.vtt"), "WEBVTT\n");
    fs.writeFileSync(path.join(assetRoot, "subtitles", "captions.srt"), "1\n00:00:00,000 --> 00:00:01,000\nBound\n");
    prepareRenderInput(project);
    const packaged = packageRenderInput(workspaceRoot, slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    await bindRenderInputDelivery(project, {
      url: "https://inputs.example.test/bound-job.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });

    const adapter = {
      requiresRenderPreflight: false,
      createDispatch: ({ project: current, dispatchedAt }) => ({ workflow: "render-video.yml", ref: "main", slug: current.state.slug, compositionId: current.config.slug, dispatchedAt }),
      findDispatchedRunOnce: async () => null,
      dispatchWorkflow: async ({ project: current, dispatchedAt }) => ({ workflow: "render-video.yml", ref: "main", slug: current.state.slug, compositionId: current.config.slug, dispatchedAt }),
      inspectRun: async ({ dispatch }) => ({ status: "running", remote: dispatch }),
    };
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
    const job = monitor.submit({ slug, stage: "render" });
    const persisted = getJob(slug, job.id);
    assert.match(persisted.remote.dispatchId, /^[0-9a-f-]{36}$/);
    assert.ok(["prepared", "sending", "confirmed"].includes(persisted.remote.dispatchState));
    assert.equal(persisted.remote.renderInputUrl, "https://inputs.example.test/bound-job.zip");
    assert.equal(persisted.remote.renderInputSha256, packaged.archiveSha256);
    assert.match(persisted.remote.renderInputPackageFingerprint, /^[a-f0-9]{64}$/);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const deliveryPath = renderInputDeliveryPath(workspaceRoot, slug);
    const delivery = JSON.parse(fs.readFileSync(deliveryPath, "utf8"));
    delivery.url = "https://inputs.example.test/newer.zip";
    fs.writeFileSync(deliveryPath, `${JSON.stringify(delivery, null, 2)}\n`);
    await monitor.processJob(job.id);
    const changed = getJob(slug, job.id);
    assert.equal(changed.remote.renderInputUrl, "https://inputs.example.test/bound-job.zip");
    assert.equal(changed.error.code, "remote-job-input-binding-changed");
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});
