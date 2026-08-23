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
