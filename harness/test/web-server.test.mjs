import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.mjs";

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
  const webServer = createWebServer({ port: 0 });
  await webServer.listen();

  try {
    const page = await request(webServer, "/");
    assert.equal(page.status, 200);
    assert.match(page.contentType, /text\/html/);
    assert.match(page.body, /视频项目管理/);

    const health = await request(webServer, "/api/health");
    assert.equal(health.status, 200);
    assert.match(health.contentType, /application\/json/);
    assert.deepEqual(JSON.parse(health.body), {
      service: "video-production-harness-web",
      harnessVersion: "0.5.0",
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
    assert.equal(JSON.parse(nextAction.body).result.action, "initialize");

    const unknownAction = await request(webServer, "/api/projects/claude-code-what-is/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-everything" }),
    });
    assert.equal(unknownAction.status, 409);

    const jobs = await request(webServer, "/api/projects/claude-code-what-is/jobs");
    assert.equal(jobs.status, 200);
    assert.deepEqual(JSON.parse(jobs.body).jobs, []);

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
