import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createWebServer } from "../src/server.mjs";
import { bindRenderInputDelivery, packageRenderInput, prepareRenderInput, renderInputDeliveryPath } from "../src/render-input.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { buildGitRenderCommitPlan, commitAndPushRenderDelivery, validateGitRenderDelivery } from "../src/git-delivery.mjs";

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
  write(workspaceRoot, `videos/${slug}/source.md`, "source\n");
  write(workspaceRoot, "src/Root.tsx", "export default function Root() { return null; }\n");
  write(workspaceRoot, "src/TemplateVideo.tsx", "export default function TemplateVideo() { return null; }\n");
  write(workspaceRoot, "src/lib/timing.ts", "export const timing = {};\n");
  write(workspaceRoot, `src/videos/${slug}/TestVideo.tsx`, "export function TestVideo() { return null; }\n");
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
  write(workspaceRoot, "harness/src/cli.mjs", "export {};\n");
  write(workspaceRoot, "harness/src/render-input.mjs", "export {};\n");
  write(workspaceRoot, "harness/src/remote-executor.mjs", "export {};\n");
  write(workspaceRoot, "harness/src/diagnostics.mjs", "export {};\n");
  write(workspaceRoot, "harness/src/github-auth.mjs", "export {};\n");
  write(workspaceRoot, "harness/src/github-config.mjs", "export {};\n");
  write(workspaceRoot, "package.json", "{}\n");
  write(workspaceRoot, "package-lock.json", "{}\n");
  write(workspaceRoot, ".github/workflows/smoke-test-video.yml", "name: smoke\n");
  write(workspaceRoot, ".github/workflows/render-video.yml", "name: render\n");
  write(workspaceRoot, ".gitignore", "videos/\nsrc/videos/\nassets/\nlocal/\n");

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

test("complete Render can confirm once, commit only render files, push, then queue one remote job", async () => {
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousToken = process.env.GITHUB_TOKEN;
  const previousAuthSource = process.env.HARNESS_GITHUB_AUTH_SOURCE;
  const previousRepository = process.env.GITHUB_REPOSITORY;
  const previousRef = process.env.HARNESS_GITHUB_REF;
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-git-delivery-projects-"));
  const slug = "02-core-concepts";
  const { workspaceRoot, remoteRoot } = createRenderWorkspace(slug);
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.HARNESS_GITHUB_AUTH_SOURCE = "env";
  process.env.GITHUB_REPOSITORY = "example/video";
  process.env.HARNESS_GITHUB_REF = "main";
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  project.config.workspaceRoot = workspaceRoot;
  project.state.currentStage = "render";
  project.state.stages.render.status = "ready";
  writeJson(project.files.config, project.config);
  writeJson(project.files.state, project.state);
  prepareRenderInput(project);
  const packagedInput = packageRenderInput(workspaceRoot, slug);
  const inputBytes = fs.readFileSync(packagedInput.archivePath);
  await bindRenderInputDelivery(project, {
    url: "https://inputs.example.test/git-delivery.zip",
    sha256: packagedInput.archiveSha256,
    fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => inputBytes }),
  });
  fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// render change\n");
  write(workspaceRoot, "notes.txt", "must remain uncommitted\n");
  let submitCount = 0;
  const webServer = createWebServer({
    port: 0,
    githubPreflight: async () => ({ ok: true }),
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
        body: JSON.stringify({ action: "remote-run", stage: "render" }),
    });
    const initialPayload = JSON.parse(initial.body);
    assert.equal(initial.status, 200);
    assert.equal(initialPayload.result.status, "needs-confirmation");
    assert.equal(submitCount, 0);
    assert.deepEqual(initialPayload.commitPlan.commitPaths, ["src/TemplateVideo.tsx"]);
    assert.equal(initialPayload.commitPlan.selectedPaths[0], "src/TemplateVideo.tsx");
    assert.match(initialPayload.commitPlan.planId, /^[a-f0-9]{64}$/);
    assert.deepEqual(initialPayload.commitPlan.outOfScopePaths, []);

    const confirmed = await request(webServer, `/api/projects/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remote-run",
        stage: "render",
        commitAndPush: true,
        confirmDelivery: true,
        deliveryPlanId: initialPayload.commitPlan.planId,
        selectedPaths: initialPayload.commitPlan.selectedPaths,
      }),
    });
    const confirmedPayload = JSON.parse(confirmed.body);
    assert.equal(confirmed.status, 202);
    assert.equal(confirmedPayload.result.delivery.status, "committed");
    assert.equal(submitCount, 1);
    assert.deepEqual(git(workspaceRoot, ["show", "--format=", "--name-only", "HEAD"]).split(/\r?\n/), ["src/TemplateVideo.tsx"]);
    assert.match(git(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"]), /notes\.txt/);
    assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), git(workspaceRoot, ["rev-parse", "HEAD"]));
  } finally {
    await webServer.close();
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
    if (previousAuthSource === undefined) delete process.env.HARNESS_GITHUB_AUTH_SOURCE;
    else process.env.HARNESS_GITHUB_AUTH_SOURCE = previousAuthSource;
    if (previousRepository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previousRepository;
    if (previousRef === undefined) delete process.env.HARNESS_GITHUB_REF;
    else process.env.HARNESS_GITHUB_REF = previousRef;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("Git delivery preflight ignores legacy global render input variables", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("url-check-video");
  try {
    const issues = validateGitRenderDelivery({ config: { slug: "url-check-video", workspaceRoot } }, {
      environment: {
        GITHUB_TOKEN: "test-token",
        GITHUB_REPOSITORY: "example/video",
        HARNESS_GITHUB_REF: "main",
        HARNESS_RENDER_INPUT_URL: "https://github.com/example/video-render-inputs/releases/download/v1/video.zip",
      },
    });
    assert.equal(issues.some((issue) => /API 资产地址/.test(issue)), false);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("tracked Root stays generic and never imports local video material", () => {
  const source = fs.readFileSync(new URL("../../src/Root.tsx", import.meta.url), "utf8");
  assert.match(source, /TemplateVideo/);
  assert.doesNotMatch(source, /(?:videos|assets|local)\//);
  assert.doesNotMatch(source, /src\/videos/);
});

test("delivery planning excludes Root and concrete video changes from the selected commit list", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("scope-check-video");
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/Root.tsx"), "// local-only entry change\n");
    fs.appendFileSync(path.join(workspaceRoot, "src/videos/scope-check-video/TestVideo.tsx"), "// video change\n");
    write(workspaceRoot, "src/Unrelated.tsx", "export {}\n");
    const plan = buildGitRenderCommitPlan({ config: { slug: "scope-check-video", workspaceRoot } }, {
      environment: { HARNESS_GITHUB_REF: "main" },
    });
    assert.deepEqual(plan.commitPaths, []);
    assert.deepEqual(plan.selectedPaths, []);
    assert.ok(plan.outOfScopePaths.includes("src/Root.tsx"));
    assert.ok(plan.outOfScopePaths.includes("src/Unrelated.tsx"));
    assert.match(plan.planId, /^[a-f0-9]{64}$/);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("only exact render files are auto-committable and generic source changes stay out of scope", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("exact-scope-video");
  try {
    write(workspaceRoot, ".github/workflows/unrelated.yml", "name: unrelated\n");
    write(workspaceRoot, "src/components/Unrelated.tsx", "export {}\n");
    write(workspaceRoot, "src/scenes/Unrelated.tsx", "export {}\n");
    const plan = buildGitRenderCommitPlan({ config: { slug: "exact-scope-video", workspaceRoot } }, {
      environment: { HARNESS_GITHUB_REF: "main" },
    });
    assert.equal(plan.commitPaths.includes(".github/workflows/unrelated.yml"), false);
    assert.equal(plan.commitPaths.includes("src/components/Unrelated.tsx"), false);
    assert.equal(plan.commitPaths.includes("src/scenes/Unrelated.tsx"), false);
    assert.ok(plan.outOfScopePaths.includes(".github/workflows/unrelated.yml"));
    assert.ok(plan.outOfScopePaths.includes("src/components/Unrelated.tsx"));
    assert.ok(plan.outOfScopePaths.includes("src/scenes/Unrelated.tsx"));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("delivery plan binds the current input delivery record and invalidates when it changes", async () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("binding-plan-video");
  try {
    const project = { config: { slug: "binding-plan-video", workspaceRoot } };
    prepareRenderInput(project);
    const packaged = packageRenderInput(workspaceRoot, project.config.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    await bindRenderInputDelivery(project, {
      url: "https://inputs.example.test/binding-plan.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });

    const plan = buildGitRenderCommitPlan(project, { environment: { HARNESS_GITHUB_REF: "main" } });
    assert.equal(plan.videoSlug, project.config.slug);
    assert.equal(plan.compositionId, "binding-plan-video");
    assert.equal(plan.renderInputUrl, "https://inputs.example.test/binding-plan.zip");
    assert.equal(plan.renderInputSha256, packaged.archiveSha256);
    assert.equal(plan.packageFingerprint, plan.packageFingerprint.toLowerCase());
    assert.match(plan.deliveryBindingSha256, /^[a-f0-9]{64}$/);

    const deliveryPath = renderInputDeliveryPath(workspaceRoot, project.config.slug);
    const originalDelivery = JSON.parse(fs.readFileSync(deliveryPath, "utf8"));
    for (const [field, value] of [
      ["url", "https://inputs.example.test/changed.zip"],
      ["archiveSha256", "1".repeat(64)],
      ["compositionId", "changed-composition"],
      ["packageFingerprint", "2".repeat(64)],
    ]) {
      const changed = { ...originalDelivery, [field]: value };
      fs.writeFileSync(deliveryPath, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
      assert.throws(
        () => commitAndPushRenderDelivery(project, {
          environment: { HARNESS_GITHUB_REF: "main" },
          deliveryPlanId: plan.planId,
          selectedPaths: plan.selectedPaths,
        }),
        (error) => error.code === "git-render-commit-plan-stale",
        `changed ${field} must invalidate the confirmed plan`,
      );
      fs.writeFileSync(deliveryPath, `${JSON.stringify(originalDelivery, null, 2)}\n`, "utf8");
    }
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("required render file deletion blocks before staging or commit", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("deletion-check-video");
  try {
    const project = { config: { slug: "deletion-check-video", workspaceRoot } };
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// planned render change\n");
    const plan = buildGitRenderCommitPlan(project, { environment: { HARNESS_GITHUB_REF: "main" } });
    const headBefore = git(workspaceRoot, ["rev-parse", "HEAD"]);
    fs.rmSync(path.join(workspaceRoot, ".github/workflows/render-video.yml"));

    assert.throws(
      () => commitAndPushRenderDelivery(project, {
        environment: { HARNESS_GITHUB_REF: "main" },
        deliveryPlanId: plan.planId,
        selectedPaths: plan.selectedPaths,
      }),
      (error) => error.code === "git-render-commit-deletion-forbidden"
        || error.code === "git-render-commit-required-path-missing",
    );
    assert.equal(git(workspaceRoot, ["rev-parse", "HEAD"]), headBefore);
    assert.equal(git(workspaceRoot, ["diff", "--cached"]), "");
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("delivery confirmation is invalidated when a listed file changes", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("stale-plan-video");
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// planned change\n");
    const project = { config: { slug: "stale-plan-video", workspaceRoot } };
    const plan = buildGitRenderCommitPlan(project, { environment: { HARNESS_GITHUB_REF: "main" } });
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// changed after confirmation\n");
    assert.throws(
      () => commitAndPushRenderDelivery(project, {
        environment: { HARNESS_GITHUB_REF: "main" },
        deliveryPlanId: plan.planId,
        selectedPaths: plan.selectedPaths,
      }),
      (error) => error.code === "git-render-commit-plan-stale",
    );
    assert.equal(git(workspaceRoot, ["rev-parse", "HEAD"]), plan.headCommit);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("ignored video and local input paths never enter the delivery plan", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("ignored-scope-video");
  try {
    write(workspaceRoot, "videos/ignored-scope-video/new.md", "new source\n");
    write(workspaceRoot, "src/videos/ignored-scope-video/ExtraVideo.tsx", "export {}\n");
    write(workspaceRoot, "assets/ignored-scope-video-assets.zip", "new archive\n");
    write(workspaceRoot, "local/render-input/ignored-scope-video/render-input.json", "{}\n");
    const plan = buildGitRenderCommitPlan({ config: { slug: "ignored-scope-video", workspaceRoot } }, {
      environment: { HARNESS_GITHUB_REF: "main" },
    });
    assert.deepEqual(plan.commitPaths, []);
    assert.deepEqual(plan.outOfScopePaths, []);
    assert.equal(git(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"]), "");
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("delivery confirmation blocks a dispatch branch mismatch before push", () => {
  const { workspaceRoot, remoteRoot } = createRenderWorkspace("branch-check-video");
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// branch check\n");
    const project = { config: { slug: "branch-check-video", workspaceRoot } };
    const plan = buildGitRenderCommitPlan(project, { environment: { HARNESS_GITHUB_REF: "release" } });
    assert.equal(plan.branch, "main");
    assert.equal(plan.ref, "release");
    assert.throws(
      () => commitAndPushRenderDelivery(project, {
        environment: { HARNESS_GITHUB_REF: "release" },
        deliveryPlanId: plan.planId,
        selectedPaths: plan.selectedPaths,
      }),
      (error) => error.code === "git-render-commit-branch-mismatch",
    );
    assert.equal(git(workspaceRoot, ["rev-parse", "HEAD"]), plan.headCommit);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});
