import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createWebServer } from "../src/server.mjs";
import { fingerprintStageArtifacts } from "../src/fingerprints.mjs";
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
    assert.match(app.contentType, /text\/javascript/);
    const application = await request(webServer, "/views/application.js");
    assert.equal(application.status, 200);
    assert.match(application.contentType, /text\/javascript/);
    const styles = await request(webServer, "/styles.css");
    assert.equal(styles.status, 200);
    assert.match(styles.contentType, /text\/css/);
    assert.match(page.body, /导入原文件/);

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

    const workspace = await request(webServer, "/api/projects/claude-code-what-is/workspace");
    assert.equal(workspace.status, 200);
    const workspacePayload = JSON.parse(workspace.body);
    assert.equal(workspacePayload.project.slug, detailPayload.project.slug);
    assert.equal(workspacePayload.project.stages.length, detailPayload.project.stages.length);
    assert.ok(Array.isArray(workspacePayload.files));
    assert.ok(Array.isArray(workspacePayload.jobs));
    assert.ok(Array.isArray(workspacePayload.agentJobs));
    assert.ok(Array.isArray(workspacePayload.remotionTasks));
    assert.ok(workspacePayload.alignment === null || typeof workspacePayload.alignment === "object");

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

test("automatically queues a Remotion modification after Gate 3 rejection", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousTasksRoot = process.env.HARNESS_REMOTION_TASKS_DIR;
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-gate3-reject-projects-"));
  const tasksRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-gate3-reject-tasks-"));
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_REMOTION_TASKS_DIR = tasksRoot;
  const slug = "claude-code-what-is";
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  for (const stage of [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
    "gate-2",
    "tts",
    "subtitle-timeline",
  ]) {
    project.state.stages[stage].status = "succeeded";
  }
  project.state.stages.remotion.status = "succeeded";
  project.state.stages.remotion.outputFingerprint = fingerprintStageArtifacts(project, "remotion");
  project.state.stages["gate-3"].status = "waiting";
  project.state.currentStage = "gate-3";
  writeJson(project.files.state, project.state);
  let executorCalls = 0;
  const rebuildRequests = [];
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
    remotionExecutorFactory: () => ({
      async run({ task }) {
        executorCalls += 1;
        rebuildRequests.push(task.context.rebuildRequest ?? null);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { executor: "web-gate3-rejection-test" };
      },
    }),
  });
  await webServer.listen();

  try {
    const rejected = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", gate: "gate-3", returnTo: "remotion", reason: "修复场景重叠和时间延迟。" }),
    });
    assert.equal(rejected.status, 202, rejected.body);
    const payload = JSON.parse(rejected.body);
    assert.equal(payload.result.status, "queued");
    assert.ok(payload.result.taskId);
    assert.equal(payload.project.currentStage, "remotion");

    let task = null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const listed = await request(webServer, "/api/remotion-tasks");
      task = JSON.parse(listed.body).tasks.find((item) => item.id === payload.result.taskId);
      if (task?.status === "blocked") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(executorCalls, 1);
    assert.equal(task?.status, "blocked");

    const taskPath = path.join(tasksRoot, `${payload.result.taskId}.json`);
    const legacyTask = JSON.parse(fs.readFileSync(taskPath, "utf8"));
    delete legacyTask.context.rebuildRequest;
    legacyTask.context.constraints = legacyTask.context.constraints.filter((constraint) => !constraint.includes("Gate 3 驳回后的 Remotion 重制任务"));
    fs.writeFileSync(taskPath, `${JSON.stringify(legacyTask)}\n`, "utf8");

    const retried = await request(webServer, `/api/remotion-tasks/${payload.result.taskId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run" }),
    });
    assert.equal(retried.status, 202, retried.body);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const listed = await request(webServer, "/api/remotion-tasks");
      task = JSON.parse(listed.body).tasks.find((item) => item.id === payload.result.taskId);
      if (task?.status === "blocked") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(executorCalls, 2);
    assert.equal(task?.status, "blocked");
    assert.equal(rebuildRequests[1]?.reason, "修复场景重叠和时间延迟。");
  } finally {
    await webServer.close();
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousTasksRoot === undefined) delete process.env.HARNESS_REMOTION_TASKS_DIR;
    else process.env.HARNESS_REMOTION_TASKS_DIR = previousTasksRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(tasksRoot, { recursive: true, force: true });
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

test("runs one continuous Gate 2 batch through persisted Agent Jobs and stops for human review", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousAgentJobsRoot = process.env.HARNESS_AGENT_JOBS_DIR;
  const previousBatchesRoot = process.env.HARNESS_BATCHES_DIR;
  const previousWorkspaceRoot = process.env.HARNESS_WORKSPACE_ROOT;
  process.env.HARNESS_PROJECTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-continuous-projects-"));
  process.env.HARNESS_AGENT_JOBS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-continuous-agent-jobs-"));
  process.env.HARNESS_BATCHES_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-continuous-batches-"));
  process.env.HARNESS_WORKSPACE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-web-continuous-workspace-"));
  const documents = {
    "source.md": "# Source\n\n测试内容。",
    "content-analysis.md": "# Content Analysis\n\n## 核心命题\n内容。\n\n## 关键关系\n关系。\n\n## 可视觉化内容\n状态。",
    "video-narrative.md": "# Video Narrative\n\n## 叙事目标\n解释。\n\n## 叙事原则\n清晰。\n\n## 整体叙事结构\n开始到结束。",
    "scene-script.md": "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证。\n\n### narrativeRole\n建立。\n\n### narrationIntent\n解释。\n\n### visualIntent\n展示。\n\n### visualType\n流程。\n\n### keyOnScreenText\n状态。\n\n### videoValue\n可见。",
    "narration-script.md": "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。",
    "visual-script.md": "# Visual Script\n\n## 全局视觉原则\n清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示。\n\n### 画面结构\n中心状态卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\n状态。\n\n### Visual Type\n流程。",
    "visual-prototype.html": "<!doctype html><style>.shell{width:min(1420px,96vw)}.toolbar{margin-bottom:14px}.stage{aspect-ratio:16/9}.scene{inset:0;padding:5.2% 6% 13.8%}.caption{left:8%;right:8%;bottom:4.2%}.progress{display:flex}.meta{display:flex;justify-content:space-between}</style><main class=\"shell\"><header class=\"toolbar\"><div class=\"brand\">测试</div><div class=\"controls\"><button>上一幕</button><button>下一幕</button><button>自动播放</button></div></header><div class=\"stage\"><section class=\"scene\"><div class=\"scene-heading\"><div class=\"eyebrow\">01 / TEST</div><h1>测试</h1></div><div class=\"caption\">测试字幕</div></section></div><div class=\"progress\"></div><div class=\"meta\"></div></main>",
  };
  for (const [file, content] of Object.entries(documents)) {
    const target = path.join(process.env.HARNESS_WORKSPACE_ROOT, "videos", "claude-code-what-is", file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${content}\n`, "utf8");
  }
  const stages = [];
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
    agentExecutorFactory: (stage) => ({
      async run() {
        stages.push(stage);
        if (stage === "content-analysis") await new Promise((resolve) => setTimeout(resolve, 50));
        return { executor: "web-continuous-test-agent", stdout: `${stage} done` };
      },
    }),
  });
  await webServer.listen();

  try {
    const initialized = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize" }),
    });
    assert.equal(initialized.status, 200);

    const started = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-to-gate-2" }),
    });
    assert.equal(started.status, 202);
    const startedPayload = JSON.parse(started.body);
    assert.equal(startedPayload.result.status, "queued");

    const repeated = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-to-gate-2" }),
    });
    assert.equal(repeated.status, 202);
    assert.equal(JSON.parse(repeated.body).result.status, "already-running");
    assert.equal(JSON.parse(repeated.body).batch.id, startedPayload.batch.id);

    let batch = null;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const listed = await request(webServer, "/api/batches");
      batch = JSON.parse(listed.body).batches.find((item) => item.id === startedPayload.batch.id);
      if (batch?.items[0]?.status === "waiting-gate") break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(batch.items[0].status, "waiting-gate", JSON.stringify(batch));
    assert.equal(batch.items[0].phase, "gate-2");
    assert.equal(batch.items[0].internalReviews[0].gate, "gate-1");
    assert.deepEqual(stages, ["content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype"]);

    const rejected = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", gate: "gate-2", returnTo: "visual-script", reason: "标题位置需要按基线统一。" }),
    });
    assert.equal(rejected.status, 200, rejected.body);
    assert.deepEqual(JSON.parse(rejected.body).result.stoppedBatchIds, [startedPayload.batch.id]);
    const rejectedProject = JSON.parse(rejected.body).project;
    assert.equal(rejectedProject.currentStage, "visual-script");
    assert.equal(rejectedProject.next.action, "run-stage");

    const afterReject = JSON.parse((await request(webServer, "/api/batches")).body).batches.find((item) => item.id === startedPayload.batch.id);
    assert.equal(afterReject.items[0].status, "failed");
    assert.match(afterReject.items[0].message, /旧的连续批次已停止/);

    const staleBatchPath = path.join(process.env.HARNESS_BATCHES_DIR, `${startedPayload.batch.id}.json`);
    const staleBatch = JSON.parse(fs.readFileSync(staleBatchPath, "utf8"));
    staleBatch.status = "waiting";
    staleBatch.items[0].status = "waiting-gate";
    staleBatch.items[0].phase = "gate-2";
    fs.writeFileSync(staleBatchPath, `${JSON.stringify(staleBatch)}\n`, "utf8");

    const restarted = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-to-gate-2" }),
    });
    assert.equal(restarted.status, 202);
    assert.equal(JSON.parse(restarted.body).result.status, "queued");
    assert.notEqual(JSON.parse(restarted.body).batch.id, startedPayload.batch.id);
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousAgentJobsRoot === undefined) delete process.env.HARNESS_AGENT_JOBS_DIR;
    else process.env.HARNESS_AGENT_JOBS_DIR = previousAgentJobsRoot;
    if (previousBatchesRoot === undefined) delete process.env.HARNESS_BATCHES_DIR;
    else process.env.HARNESS_BATCHES_DIR = previousBatchesRoot;
    if (previousWorkspaceRoot === undefined) delete process.env.HARNESS_WORKSPACE_ROOT;
    else process.env.HARNESS_WORKSPACE_ROOT = previousWorkspaceRoot;
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

test("imports an original text file into a new initialized video project", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-source-import-web-"));
  const previousWorkspaceRoot = process.env.HARNESS_WORKSPACE_ROOT;
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousSeriesRoot = process.env.HARNESS_SERIES_DIR;
  process.env.HARNESS_WORKSPACE_ROOT = root;
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "harness-projects");
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  fs.mkdirSync(path.join(root, "series", "codex-guide"), { recursive: true });
  fs.writeFileSync(path.join(root, "series", "codex-guide", "series.json"), `${JSON.stringify({
    schemaVersion: 1,
    id: "codex-guide",
    title: "Codex 教程系列",
    style: "codex",
    videos: [],
  })}\n`, "utf8");
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: { start() {}, stop() {}, async poll() {} },
  });
  await webServer.listen();

  try {
    const imported = await request(webServer, "/api/projects/import?filename=02-what-is-agents.md", {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: "# 02 · Agent 是什么？\n\n这是上传的原始内容。\n",
    });
    assert.equal(imported.status, 201);
    const importedPayload = JSON.parse(imported.body);
    assert.equal(importedPayload.result.slug, "02-what-is-agents");
    assert.equal(importedPayload.result.sourcePath, "videos/02-what-is-agents/source.md");
    assert.equal(importedPayload.project.initialized, true);
    assert.equal(importedPayload.project.currentStage, "source");
    assert.equal(
      fs.readFileSync(path.join(root, "videos", "02-what-is-agents", "source.md"), "utf8"),
      "# 02 · Agent 是什么？\n\n这是上传的原始内容。\n",
    );

    const codexImported = await request(webServer, "/api/projects/import?filename=03-install.md&seriesId=codex-guide", {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: "# 03 · 安装 Codex\n\n这是 Codex 系列内容。\n",
    });
    assert.equal(codexImported.status, 201);
    const codexPayload = JSON.parse(codexImported.body);
    assert.deepEqual(codexPayload.result.series, {
      id: "codex-guide",
      title: "Codex 教程系列",
      style: "codex",
    });
    assert.equal(codexPayload.project.style, "codex");
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "series", "codex-guide", "series.json"), "utf8")).videos, ["03-install"]);

    const listed = await request(webServer, "/api/projects");
    assert.ok(JSON.parse(listed.body).projects.some((project) => project.slug === "02-what-is-agents"));

    const duplicate = await request(webServer, "/api/projects/import?filename=ignored.txt&slug=02-what-is-agents", {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: "不能覆盖已有项目",
    });
    assert.equal(duplicate.status, 409);
    assert.match(JSON.parse(duplicate.body).error, /拒绝覆盖/);

    const unsupported = await request(webServer, "/api/projects/import?filename=source.docx", {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: "not supported",
    });
    assert.equal(unsupported.status, 400);
    assert.equal(JSON.parse(unsupported.body).code, "source-file-type-invalid");
  } finally {
    if (previousWorkspaceRoot === undefined) delete process.env.HARNESS_WORKSPACE_ROOT;
    else process.env.HARNESS_WORKSPACE_ROOT = previousWorkspaceRoot;
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousSeriesRoot === undefined) delete process.env.HARNESS_SERIES_DIR;
    else process.env.HARNESS_SERIES_DIR = previousSeriesRoot;
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
    assert.match(JSON.parse(response.body).error, /远程渲染(输入|交付)预检失败/);
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
