import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createWebServer } from "../src/server.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";

function git(workspaceRoot, args) {
  return execFileSync("git", ["-C", workspaceRoot, ...args], { encoding: "utf8" }).trim();
}

function write(workspaceRoot, relativePath, content) {
  const filePath = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function request(server, pathname, options = {}) {
  const address = server.server.address();
  return fetch(`http://127.0.0.1:${address.port}${pathname}`, options).then(async (response) => ({
    status: response.status,
    body: await response.text(),
  }));
}

function createRenderWorkspace(slug) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-git-delivery-workspace-"));
  write(workspaceRoot, "src/Root.tsx", "export default function Root() { return null; }\n");
  write(workspaceRoot, `src/videos/${slug}/TestVideo.tsx`, "export default function TestVideo() { return null; }\n");
  write(workspaceRoot, `src/videos/${slug}/video.config.ts`, "export const config = {};\n");
  write(workspaceRoot, `src/videos/${slug}/generated/audio-manifest.json`, JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "scene-01", segments: [{ file: "audio/scene-01/01-01.mp3" }] }],
  }));
  write(workspaceRoot, `src/videos/${slug}/generated/subtitle-manifest.json`, JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "scene-01" }],
  }));
  write(workspaceRoot, `src/videos/${slug}/generated/timeline-manifest.json`, JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "scene-01" }],
  }));

  const archiveRoot = path.join(workspaceRoot, "asset-stage", slug);
  write(archiveRoot, "audio/scene-01/01-01.mp3", "audio");
  write(archiveRoot, "subtitles/captions.vtt", "WEBVTT\n");
  write(archiveRoot, "subtitles/captions.srt", "1\n00:00:00,000 --> 00:00:00,100\nTest\n");
  fs.mkdirSync(path.join(workspaceRoot, "assets"), { recursive: true });
  execFileSync("zip", ["-q", "-r", "-X", path.join(workspaceRoot, `assets/${slug}-assets.zip`), slug], {
    cwd: path.join(workspaceRoot, "asset-stage"),
  });
  fs.rmSync(path.join(workspaceRoot, "asset-stage"), { recursive: true, force: true });

  git(workspaceRoot, ["init", "-b", "main"]);
  git(workspaceRoot, ["config", "user.email", "test@example.com"]);
  git(workspaceRoot, ["config", "user.name", "Harness Test"]);
  git(workspaceRoot, ["add", "."]);
  git(workspaceRoot, ["commit", "-m", "test: baseline render delivery"]);
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-git-delivery-remote-"));
  execFileSync("git", ["init", "--bare", remoteRoot], { encoding: "utf8" });
  git(workspaceRoot, ["remote", "add", "origin", remoteRoot]);
  git(workspaceRoot, ["push", "origin", "main"]);
  return { workspaceRoot, remoteRoot };
}

test("Smoke Render can confirm once, commit only render files, push, then queue one remote job", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousToken = process.env.GITHUB_TOKEN;
  const previousRepository = process.env.GITHUB_REPOSITORY;
  const previousRef = process.env.HARNESS_GITHUB_REF;
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-git-delivery-projects-"));
  const slug = "02-core-concepts";
  const { workspaceRoot, remoteRoot } = createRenderWorkspace(slug);
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_REPOSITORY = "example/video";
  process.env.HARNESS_GITHUB_REF = "main";
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  project.config.workspaceRoot = workspaceRoot;
  project.state.currentStage = "smoke-render";
  project.state.stages["smoke-render"].status = "ready";
  writeJson(project.files.config, project.config);
  writeJson(project.files.state, project.state);
  fs.appendFileSync(path.join(workspaceRoot, "src/Root.tsx"), "// render change\n");
  write(workspaceRoot, "notes.txt", "must remain uncommitted\n");
  let submitCount = 0;
  const webServer = createWebServer({
    port: 0,
    remoteJobMonitor: {
      start() {},
      stop() {},
      async poll() {},
      submit() {
        submitCount += 1;
        return { id: "smoke-job-1", status: "queued" };
      },
    },
  });
  await webServer.listen();

  try {
    const initial = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remote-run", stage: "smoke-render" }),
    });
    const initialPayload = JSON.parse(initial.body);
    assert.equal(initial.status, 200);
    assert.equal(initialPayload.result.status, "needs-confirmation");
    assert.equal(submitCount, 0);
    assert.deepEqual(initialPayload.commitPlan.commitPaths, ["src/Root.tsx"]);
    assert.deepEqual(initialPayload.commitPlan.outOfScopePaths, []);

    const confirmed = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remote-run",
        stage: "smoke-render",
        commitAndPush: true,
        confirmDelivery: true,
      }),
    });
    const confirmedPayload = JSON.parse(confirmed.body);
    assert.equal(confirmed.status, 202);
    assert.equal(confirmedPayload.result.delivery.status, "committed");
    assert.equal(submitCount, 1);
    assert.deepEqual(git(workspaceRoot, ["show", "--format=", "--name-only", "HEAD"]).split(/\r?\n/), ["src/Root.tsx"]);
    assert.match(git(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"]), /notes\.txt/);
    assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), git(workspaceRoot, ["rev-parse", "HEAD"]));
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
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});
