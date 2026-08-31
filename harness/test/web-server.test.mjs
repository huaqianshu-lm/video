import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createWebServer } from "../src/server.mjs";
import { createJobRecord } from "../src/jobs.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";

async function request(server, pathname, options = {}) {
  const address = server.server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, options);
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    body: await response.text(),
  };
}

test("serves the Web UI shell and health endpoint on localhost", async () => {
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const page = await request(webServer, "/");
    assert.equal(page.status, 200);
    assert.match(page.contentType, /text\/html/);
    assert.match(page.body, /视频项目管理/);

    const app = await request(webServer, "/app.js");
    assert.equal(app.status, 200);
    assert.match(app.body, /payload\.result\?\.taskId \?\? payload\.task\?\.id/);
    assert.match(app.body, /Agent 正在制作/);
    assert.match(app.body, /页面会自动同步任务状态/);
    assert.match(app.body, /hasActiveRemotionTask/);
    assert.match(app.body, /jobsPayload\.activeJob/);
    assert.match(app.body, /远程任务执行中/);
    assert.match(app.body, /请等待完成或在下方查看任务状态/);
    assert.match(
      app.body,
      /const currentRemotionTask = project\.currentStage === "remotion"[\s\S]*?latestRemotionTask\.status !== "completed"/,
      "completed Remotion history must not hide the current stage action",
    );

    const health = await request(webServer, "/api/health");
    assert.equal(health.status, 200);
    assert.match(health.contentType, /application\/json/);
    assert.deepEqual(JSON.parse(health.body), {
      service: "video-production-harness-web",
      harnessVersion: "0.6.0",
      status: "ok",
    });

    const projects = await request(webServer, "/api/projects");
    assert.equal(projects.status, 200);
    const projectPayload = JSON.parse(projects.body);
    assert.ok(projectPayload.projects.some((project) => project.slug === "claude-code-what-is"));
    assert.equal(projectPayload.projects[0].sequence, 1);

    const detail = await request(webServer, "/api/projects/claude-code-what-is");
    assert.equal(detail.status, 200);
    const detailPayload = JSON.parse(detail.body);
    assert.equal(detailPayload.project.slug, "claude-code-what-is");
    assert.equal(detailPayload.project.sequence, 1);
    assert.equal(detailPayload.project.stages.length, 15);

    const files = await request(webServer, "/api/projects/claude-code-what-is/files");
    assert.equal(files.status, 200);
    const filesPayload = JSON.parse(files.body);
    assert.ok(filesPayload.files.some((file) => file.path === "videos/claude-code-what-is/source.md" && file.present));

    const sourcePath = encodeURIComponent("videos/claude-code-what-is/source.md");
    const source = await request(webServer, `/api/projects/claude-code-what-is/file?path=${sourcePath}`);
    assert.equal(source.status, 200);
    assert.match(JSON.parse(source.body).file.content, /Claude Code/);

    const forbidden = await request(webServer, "/api/projects/claude-code-what-is/file?path=package.json");
    assert.equal(forbidden.status, 404);

    const prototype = await request(webServer, "/preview/claude-code-what-is");
    assert.equal(prototype.status, 200);
    assert.match(prototype.contentType, /text\/html/);

    const nextAction = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next" }),
    });
    assert.equal(nextAction.status, 200);
    assert.equal(JSON.parse(nextAction.body).result.action, "complete");

    const unknownAction = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-everything" }),
    });
    assert.equal(unknownAction.status, 400);

    const jobs = await request(webServer, "/api/projects/claude-code-what-is/jobs");
    assert.equal(jobs.status, 200);
    assert.deepEqual(JSON.parse(jobs.body).jobs, []);
    assert.equal(JSON.parse(jobs.body).activeJob, null);

    const globalJobs = await request(webServer, "/api/jobs");
    assert.equal(globalJobs.status, 200);
    assert.ok(Array.isArray(JSON.parse(globalJobs.body).jobs));

    const legacy = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "legacy-validate" }),
    });
    assert.equal(legacy.status, 200);
    assert.equal(JSON.parse(legacy.body).result.readOnly, true);
    assert.equal(JSON.parse(legacy.body).result.validationPolicy, "legacy");
  } finally {
    await webServer.close();
  }
});

test("serves explicit GitHub diagnostics without persisting credentials", async () => {
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
    diagnose: async () => ({
      ok: false,
      config: { tokenConfigured: true, repository: "example/video", ref: "main", issues: [] },
      checks: [{ name: "repository", status: "failed", message: "GitHub API 返回 HTTP 403" }],
    }),
  });
  await webServer.listen();

  try {
    const diagnostics = await request(webServer, "/api/diagnostics/github");
    assert.equal(diagnostics.status, 200);
    assert.deepEqual(JSON.parse(diagnostics.body).config, {
      tokenConfigured: true,
      repository: "example/video",
      ref: "main",
      issues: [],
    });
  } finally {
    await webServer.close();
  }
});

test("creates and exposes a batch record without changing video artifacts", async () => {
  const previousBatchesRoot = process.env.HARNESS_BATCHES_DIR;
  process.env.HARNESS_BATCHES_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-batches-"));
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const created = await request(webServer, "/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "to-gate-2", slugs: ["batch-fixture-video"] }),
    });
    assert.equal(created.status, 202);
    const batch = JSON.parse(created.body).batch;
    assert.equal(batch.type, "to-gate-2");
    assert.deepEqual(batch.selectedSlugs, ["batch-fixture-video"]);

    const listed = await request(webServer, "/api/batches");
    assert.equal(listed.status, 200);
    assert.equal(JSON.parse(listed.body).batches[0].id, batch.id);
  } finally {
    if (previousBatchesRoot === undefined) delete process.env.HARNESS_BATCHES_DIR;
    else process.env.HARNESS_BATCHES_DIR = previousBatchesRoot;
    await webServer.close();
  }
});

test("exposes the Remotion production task queue", async () => {
  const previousTasksRoot = process.env.HARNESS_REMOTION_TASKS_DIR;
  process.env.HARNESS_REMOTION_TASKS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remotion-tasks-"));
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const tasks = await request(webServer, "/api/remotion-tasks");
    assert.equal(tasks.status, 200);
    assert.deepEqual(JSON.parse(tasks.body), { tasks: [] });
  } finally {
    if (previousTasksRoot === undefined) delete process.env.HARNESS_REMOTION_TASKS_DIR;
    else process.env.HARNESS_REMOTION_TASKS_DIR = previousTasksRoot;
    await webServer.close();
  }
});

test("treats a repeated run request for an in-progress Remotion task as idempotent", async () => {
  const previousTasksRoot = process.env.HARNESS_REMOTION_TASKS_DIR;
  process.env.HARNESS_REMOTION_TASKS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remotion-idempotent-"));
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const id = "33333333-3333-4333-8333-333333333333";
    fs.writeFileSync(path.join(process.env.HARNESS_REMOTION_TASKS_DIR, `${id}.json`), `${JSON.stringify({
      schemaVersion: 1,
      id,
      kind: "remotion-production-task",
      stage: "remotion",
      slug: "idempotent-video",
      batchId: null,
      status: "in-progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      outputArtifacts: [],
    })}\n`);

    const repeated = await request(webServer, `/api/remotion-tasks/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run" }),
    });
    assert.equal(repeated.status, 202);
    assert.equal(JSON.parse(repeated.body).task.status, "in-progress");
  } finally {
    if (previousTasksRoot === undefined) delete process.env.HARNESS_REMOTION_TASKS_DIR;
    else process.env.HARNESS_REMOTION_TASKS_DIR = previousTasksRoot;
    await webServer.close();
  }
});

test("queues a persisted Agent Job from the Web UI action and exposes its result", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousAgentJobsRoot = process.env.HARNESS_AGENT_JOBS_DIR;
  process.env.HARNESS_PROJECTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-agent-projects-"));
  process.env.HARNESS_AGENT_JOBS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-agent-jobs-"));
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
    agentExecutorFactory: () => ({ async run() { return { executor: "web-test-agent", stdout: "done" }; } }),
  });
  await webServer.listen();

  try {
    const initialized = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize" }),
    });
    assert.equal(initialized.status, 200);

    const queued = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", stage: "source" }),
    });
    assert.equal(queued.status, 202);
    const jobId = JSON.parse(queued.body).job.id;

    let job = null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const listed = await request(webServer, "/api/projects/claude-code-what-is/agent-jobs");
      job = JSON.parse(listed.body).jobs.find((item) => item.id === jobId);
      if (job?.status === "succeeded") break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(job?.status, "succeeded");
    assert.equal(job.logs.stdout, "done");
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousAgentJobsRoot === undefined) delete process.env.HARNESS_AGENT_JOBS_DIR;
    else process.env.HARNESS_AGENT_JOBS_DIR = previousAgentJobsRoot;
    await webServer.close();
  }
});

test("creates a series and uploads its shared 16:9 cover", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-series-web-"));
  const previousSeriesRoot = process.env.HARNESS_SERIES_DIR;
  const previousAssetsRoot = process.env.HARNESS_SERIES_ASSETS_DIR;
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  process.env.HARNESS_SERIES_ASSETS_DIR = path.join(root, "public", "series-assets");
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const created = await request(webServer, "/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "codex-guide",
        title: "Codex 教程系列",
        coverDurationFrames: 45,
        videos: ["01-what-is-codex"],
      }),
    });
    assert.equal(created.status, 200);

    const rejectedRemoval = await request(webServer, "/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "codex-guide",
        title: "Codex 教程系列",
        coverDurationFrames: 45,
        videos: ["02-core-concepts"],
      }),
    });
    assert.equal(rejectedRemoval.status, 400);
    assert.match(JSON.parse(rejectedRemoval.body).error, /requires explicit confirmation/);
    const preserved = await request(webServer, "/api/series/codex-guide");
    assert.deepEqual(JSON.parse(preserved.body).series.videos, ["01-what-is-codex"]);

    const cover = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(cover);
    cover.write("IHDR", 12, "ascii");
    cover.writeUInt32BE(1920, 16);
    cover.writeUInt32BE(1080, 20);
    const uploaded = await request(webServer, "/api/series/codex-guide/cover", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: cover,
    });
    assert.equal(uploaded.status, 200);
    assert.equal(JSON.parse(uploaded.body).series.cover, "series-assets/codex-guide/cover.png");

    const image = await request(webServer, "/series-assets/codex-guide/cover.png");
    assert.equal(image.status, 200);
    assert.match(image.contentType, /image\/png/);

    const listed = await request(webServer, "/api/series");
    assert.equal(JSON.parse(listed.body).series[0].coverDurationFrames, 45);
  } finally {
    if (previousSeriesRoot === undefined) delete process.env.HARNESS_SERIES_DIR;
    else process.env.HARNESS_SERIES_DIR = previousSeriesRoot;
    if (previousAssetsRoot === undefined) delete process.env.HARNESS_SERIES_ASSETS_DIR;
    else process.env.HARNESS_SERIES_ASSETS_DIR = previousAssetsRoot;
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    await webServer.close();
  }
});

test("rejects path traversal and unsupported methods", async () => {
  const webServer = createWebServer({ port: 0 });
  await webServer.listen();

  try {
    const traversal = await request(webServer, "/../package.json");
    assert.equal(traversal.status, 404);

    const method = await request(webServer, "/api/health", { method: "POST" });
    assert.equal(method.status, 405);
  } finally {
    await webServer.close();
  }
});

test("refreshes an initialized project before returning its detail", async () => {
  let pollCount = 0;
  const monitor = {
    start() {},
    stop() {},
    async poll() {
      pollCount += 1;
    },
  };
  const webServer = createWebServer({ port: 0, remoteJobMonitor: monitor });
  await webServer.listen();

  try {
    const detail = await request(webServer, "/api/projects/claude-code-api-config");
    assert.equal(detail.status, 200);
    assert.equal(pollCount, 1);
  } finally {
    await webServer.close();
  }
});

test("exposes the active remote job and treats repeated submission as idempotent", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousToken = process.env.GITHUB_TOKEN;
  const previousRepository = process.env.GITHUB_REPOSITORY;
  const previousRef = process.env.GITHUB_REF_NAME;
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-active-remote-"));
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_REPOSITORY = "example/video";
  process.env.GITHUB_REF_NAME = "main";
  const slug = "claude-code-what-is";
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  project.state.currentStage = "smoke-render";
  project.state.stages["smoke-render"].status = "ready";
  writeJson(project.files.state, project.state);
  const activeJob = createJobRecord({ slug, stage: "smoke-render" });
  let submitCount = 0;
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: {
      start() {},
      stop() {},
      async poll() {},
      submit() {
        submitCount += 1;
      },
    },
  });
  await webServer.listen();

  try {
    const jobs = await request(webServer, `/api/projects/${slug}/jobs`);
    assert.equal(jobs.status, 200);
    assert.equal(JSON.parse(jobs.body).activeJob.id, activeJob.id);

    const repeated = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remote-run", stage: "smoke-render" }),
    });
    assert.equal(repeated.status, 200);
    assert.equal(JSON.parse(repeated.body).result.status, "already-running");
    assert.equal(JSON.parse(repeated.body).job.id, activeJob.id);
    assert.equal(submitCount, 0);
  } finally {
    await webServer.close();
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
    if (previousRepository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previousRepository;
    if (previousRef === undefined) delete process.env.GITHUB_REF_NAME;
    else process.env.GITHUB_REF_NAME = previousRef;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks a new remote job when the render asset archive is incomplete", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousToken = process.env.GITHUB_TOKEN;
  const previousRepository = process.env.GITHUB_REPOSITORY;
  const previousRef = process.env.HARNESS_GITHUB_REF;
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-render-preflight-"));
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-render-preflight-workspace-"));
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_REPOSITORY = "example/video";
  process.env.HARNESS_GITHUB_REF = "main";
  const slug = "02-core-concepts";
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  project.config.workspaceRoot = workspaceRoot;
  project.state.currentStage = "smoke-render";
  project.state.stages["smoke-render"].status = "ready";
  writeJson(project.files.config, project.config);
  writeJson(project.files.state, project.state);
  let submitCount = 0;
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: {
      start() {},
      stop() {},
      async poll() {},
      submit() {
        submitCount += 1;
      },
    },
  });
  await webServer.listen();

  try {
    const response = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remote-run", stage: "smoke-render" }),
    });
    assert.equal(response.status, 400);
    assert.match(JSON.parse(response.body).error, /远程渲染输入预检失败/);
    assert.equal(submitCount, 0);
  } finally {
    await webServer.close();
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
    if (previousRepository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previousRepository;
    if (previousRef === undefined) delete process.env.HARNESS_GITHUB_REF;
    else process.env.HARNESS_GITHUB_REF = previousRef;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("serves explicit historical Artifact discovery and adoption actions", async () => {
  const previousToken = process.env.GITHUB_TOKEN;
  const previousRepository = process.env.GITHUB_REPOSITORY;
  const previousRef = process.env.GITHUB_REF_NAME;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_REPOSITORY = "example/video";
  process.env.GITHUB_REF_NAME = "feat/video-harness-v0.5";
  const monitor = {
    start() {},
    stop() {},
    async poll() {},
    async findHistorical({ slug, stage }) {
      return [{
        runId: 1001,
        runUrl: "https://github.com/example/video/actions/runs/1001",
        ref: "feat/video-production-pending",
        createdAt: "2026-08-21T15:14:30.000Z",
        artifactName: slug,
        artifactSizeInBytes: 100,
        stage,
      }];
    },
    async adoptHistorical({ slug, stage, runId }) {
      return { id: "job-1001", slug, stage, runId, status: "succeeded" };
    },
  };
  const webServer = createWebServer({ port: 0, remoteJobMonitor: monitor });
  await webServer.listen();

  try {
    const search = await request(webServer, "/api/projects/claude-code-api-config/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "find-historical", stage: "render" }),
    });
    assert.equal(search.status, 200);
    assert.equal(JSON.parse(search.body).result.candidates[0].runId, 1001);

    const adopt = await request(webServer, "/api/projects/claude-code-api-config/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adopt-historical", stage: "render", runId: 1001 }),
    });
    assert.equal(adopt.status, 200);
    assert.equal(JSON.parse(adopt.body).job.status, "succeeded");
  } finally {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
    if (previousRepository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previousRepository;
    if (previousRef === undefined) delete process.env.GITHUB_REF_NAME;
    else process.env.GITHUB_REF_NAME = previousRef;
    await webServer.close();
  }
});
