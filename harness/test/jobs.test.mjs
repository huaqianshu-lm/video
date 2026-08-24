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

test("opens Gate 4 after a remote render Artifact succeeds without a local MP4", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remote-render-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "remote-render-video"), { recursive: true });

  try {
    initializeProject("remote-render-video");
    const project = loadProject("remote-render-video", { refresh: false });
    project.state.currentStage = "render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3", "smoke-render"]) {
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
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3", "smoke-render"]) {
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
          dispatchedAt: "2026-08-23T11:37:50.000Z",
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
    const monitor = createRemoteJobMonitor({ adapterFactory: () => adapter, pollIntervalMs: 10 });
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
          dispatchState: "confirmed",
          dispatchConfirmedAt: "2026-08-23T00:00:01.000Z",
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
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3", "smoke-render"]) {
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
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3", "smoke-render"]) {
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

test("retries an unconfirmed dispatch after the first GitHub check fails", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-retry-dispatch-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "retry-dispatch-video"), { recursive: true });

  try {
    initializeProject("retry-dispatch-video");
    const project = loadProject("retry-dispatch-video", { refresh: false });
    project.state.currentStage = "smoke-render";
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
      project.state.stages[stage].status = "succeeded";
    }
    project.state.stages["smoke-render"].status = "ready";
    writeJson(project.files.state, project.state);

    const job = createJobRecord({ slug: "retry-dispatch-video", stage: "smoke-render" });
    let checkCount = 0;
    let dispatchCount = 0;
    const adapter = {
      createDispatch: ({ project: current, dispatchedAt }) => ({
        workflow: "smoke-test-video.yml",
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
          workflow: "smoke-test-video.yml",
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
    const failed = getJob("retry-dispatch-video", job.id);
    assert.equal(failed.status, "failed");
    assert.equal(failed.remote.dispatchState, "pending");

    await monitor.poll();
    const recovered = getJob("retry-dispatch-video", job.id);
    assert.equal(checkCount, 2);
    assert.equal(dispatchCount, 1);
    assert.equal(recovered.status, "running");
    assert.equal(recovered.remote.dispatchState, "confirmed");
    assert.equal(recovered.remote.runId, 321);
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
    for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3", "smoke-render"]) {
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
