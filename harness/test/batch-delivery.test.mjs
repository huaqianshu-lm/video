import { createDeliveryDependencies } from "./helpers/delivery-fixture.mjs";
import { checkpointRenderDelivery } from "../src/render-delivery.mjs";
import { runRenderDelivery, readRenderDeliverySession } from "../src/render-delivery.mjs";
import { createJobRecord } from "../src/jobs.mjs";
import { createBatch, runBatch } from "../src/batches.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertCommittedBatchRenderDelivery, commitPreparedBatchRenderDelivery, prepareBatchRenderDelivery } from "../src/batch-delivery.mjs";
import { commitAndPushBatchRenderDelivery } from "../src/git-delivery.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { bindRenderInputDelivery, packageRenderInput, prepareRenderInput } from "../src/render-input.mjs";

function write(workspaceRoot, relativePath, content) {
  const filePath = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function git(workspaceRoot, args) {
  return execFileSync("git", ["-C", workspaceRoot, ...args], { encoding: "utf8" }).trim();
}

function createWorkspace(slugs) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batch-delivery-workspace-"));
  for (const relativePath of [
    "src/TemplateVideo.tsx",
    "src/lib/timing.ts",
    "harness/src/cli.mjs",
    "harness/src/render-delivery.mjs",
    "harness/src/video-cover.mjs",
    "harness/src/render-preflight.mjs",
    "harness/src/render-input.mjs",
    "harness/src/remote-executor.mjs",
    "harness/src/diagnostics.mjs",
    "harness/src/github-auth.mjs",
    "harness/src/github-config.mjs",
    "package.json",
    "package-lock.json",
    ".github/workflows/smoke-test-video.yml",
    ".github/workflows/render-video.yml",
  ]) write(workspaceRoot, relativePath, `${relativePath}\n`);
  write(workspaceRoot, ".gitignore", "local/\nassets/\n");

  for (const slug of slugs) {
    write(workspaceRoot, `videos/${slug}/source.md`, `# ${slug}\n`);
    write(workspaceRoot, `src/videos/${slug}/FixtureVideo.tsx`, `export const FixtureVideo = () => null;\n`);
    write(workspaceRoot, `src/videos/${slug}/video.config.ts`, "export const videoConfig = { width: 1920, height: 1080, fps: 30, scenes: [] };\n");
    write(workspaceRoot, `src/videos/${slug}/generated/audio-manifest.json`, JSON.stringify({ videoId: slug, scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3", duration: 1 }] }] }));
    write(workspaceRoot, `src/videos/${slug}/generated/subtitle-manifest.json`, JSON.stringify({ videoId: slug, scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ start: 0, end: 0.9, text: "测试" }] }] }] }));
    write(workspaceRoot, `src/videos/${slug}/generated/timeline-manifest.json`, JSON.stringify({ videoId: slug, duration: 1, scenes: [{ sceneId: "01", offset: 0, duration: 1, end: 1, segments: [{ segmentId: "01-01", offset: 0, duration: 1, end: 1 }] }] }));
    const assetStage = path.join(workspaceRoot, `.asset-stage-${slug}`, slug);
    write(assetStage, "audio/scene-01/01-01.mp3", "audio");
    write(assetStage, "subtitles/captions.vtt", "WEBVTT\n");
    write(assetStage, "subtitles/captions.srt", "1\n00:00:00,000 --> 00:00:01,000\n测试\n");
    fs.mkdirSync(path.join(workspaceRoot, "assets"), { recursive: true });
    execFileSync("zip", ["-q", "-r", "-X", path.join(workspaceRoot, `assets/${slug}-assets.zip`), slug], { cwd: path.dirname(assetStage) });
    fs.rmSync(path.dirname(assetStage), { recursive: true, force: true });
  }

  git(workspaceRoot, ["init", "-b", "main"]);
  git(workspaceRoot, ["config", "user.email", "test@example.com"]);
  git(workspaceRoot, ["config", "user.name", "Harness Test"]);
  git(workspaceRoot, ["add", "."]);
  git(workspaceRoot, ["commit", "-m", "test: batch delivery baseline"]);
  return workspaceRoot;
}

function prepareProject(workspaceRoot, projectsRoot, slug) {
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;
  initializeProject(slug);
  const project = loadProject(slug, { refresh: false });
  project.config.workspaceRoot = workspaceRoot;
  project.state.currentStage = "render";
  for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype", "gate-2", "tts", "subtitle-timeline", "remotion", "gate-3"]) {
    project.state.stages[stage].status = "succeeded";
  }
  project.state.stages["gate-3"].review = { decision: "approved", reviewedAt: new Date().toISOString() };
  project.state.stages.render.status = "ready";
  writeJson(project.files.config, project.config);
  writeJson(project.files.state, project.state);
  prepareRenderInput(project);
  const packaged = packageRenderInput(workspaceRoot, slug);
  const bytes = fs.readFileSync(packaged.archivePath);
  return bindRenderInputDelivery(project, {
    url: `https://inputs.example.test/${slug}.zip`,
    sha256: packaged.archiveSha256,
    fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes }),
  }).then(() => loadProject(slug, { refresh: true }));
}

async function fixture(slugs = ["batch-video"]) {
  const workspaceRoot = createWorkspace(slugs);
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batch-delivery-projects-"));
  const projects = [];
  for (const slug of slugs) projects.push(await prepareProject(workspaceRoot, projectsRoot, slug));
  return { workspaceRoot, projectsRoot, projects, deliveryDependencies: createDeliveryDependencies(workspaceRoot) };
}

test("prepares an independent batch delivery plan with exact paths and bindings", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop", "jetbrains"]);
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// render change\n");
    const result = await prepareBatchRenderDelivery({
      id: "batch-render-plan",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { environment: deliveryDependencies.environment, deliveryDependencies });

    assert.equal(result.status, "needs-confirmation");
    assert.equal(result.videos.length, 2);
    assert.deepEqual(result.videos.map((video) => video.slug), ["desktop", "jetbrains"]);
    assert.ok(result.git.selectedPaths.includes("src/TemplateVideo.tsx"));
    assert.equal(result.git.videoPlans.length, 2);
    assert.equal(result.git.videoPlans[0].videoSlug, "desktop");
    assert.equal(result.git.videoPlans[1].videoSlug, "jetbrains");
    assert.notEqual(result.git.videoPlans[0].renderInputSha256, result.git.videoPlans[1].renderInputSha256);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("fresh preparation replaces a stale binding with the newly validated package", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop", "jetbrains"]);
  try {
    const bindingPath = path.join(workspaceRoot, "local", "render-input", "jetbrains.delivery.json");
    const binding = JSON.parse(fs.readFileSync(bindingPath, "utf8"));
    binding.videoSlug = "desktop";
    binding.archiveSha256 = "0".repeat(64);
    fs.writeFileSync(bindingPath, `${JSON.stringify(binding, null, 2)}\n`, "utf8");
    const result = await prepareBatchRenderDelivery({
      id: "batch-invalid-binding",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { environment: deliveryDependencies.environment, deliveryDependencies });

    assert.equal(result.status, "needs-confirmation", JSON.stringify(result.issues));
    const repaired = JSON.parse(fs.readFileSync(bindingPath, "utf8"));
    assert.equal(repaired.videoSlug, "jetbrains");
    assert.notEqual(repaired.archiveSha256, "0".repeat(64));

  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks batch delivery before Gate 3 is approved", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop"]);
  try {
    const project = projects[0];
    project.state.currentStage = "gate-3";
    project.state.stages.render.status = "idle";
    project.state.stages["gate-3"].status = "waiting";
    project.state.stages["gate-3"].review = null;
    writeJson(project.files.state, project.state);
    const result = await prepareBatchRenderDelivery({
      id: "batch-gate3-blocked",
      type: "to-render",
      items: [{ slug: "desktop", status: "skipped", message: "Gate 3 尚未通过" }],
    }, { environment: deliveryDependencies.environment, deliveryDependencies });
    assert.equal(result.status, "blocked");
    assert.ok(result.issues.some((issue) => /Gate 3|skipped/.test(issue)));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks batch delivery when concrete video code is outside the Git render scope", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop"]);
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/videos/desktop/video.config.ts"), "// forbidden render scope change\n");
    const result = await prepareBatchRenderDelivery({
      id: "batch-out-of-scope",
      type: "to-render",
      items: [{ slug: projects[0].config.slug, status: "queued" }],
    }, { environment: deliveryDependencies.environment, deliveryDependencies });

    assert.equal(result.status, "blocked");
    assert.ok(result.issues.some((issue) => /渲染提交范围|渲染相关文件/.test(issue)));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("rechecks every binding before dispatch and does not accept a changed package", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop", "jetbrains"]);
  try {
    const result = await prepareBatchRenderDelivery({
      id: "batch-dispatch-recheck",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { environment: deliveryDependencies.environment, deliveryDependencies });
    for (const project of projects) checkpointRenderDelivery(project, { confirmedPlan: result.git.planId, commit: git(workspaceRoot, ["rev-parse", "HEAD"]), phase: "pushed" });
    const batch = {
      id: "batch-dispatch-recheck",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
      renderDelivery: {
        ...result,
        status: "committed",
        commit: { sha: git(workspaceRoot, ["rev-parse", "HEAD"]) },
      },
    };
    const bindingPath = path.join(workspaceRoot, "local", "render-input", "jetbrains.delivery.json");
    const binding = JSON.parse(fs.readFileSync(bindingPath, "utf8"));
    binding.url = "https://inputs.example.test/changed-after-confirmation.zip";
    fs.writeFileSync(bindingPath, `${JSON.stringify(binding, null, 2)}\n`, "utf8");

    await assert.rejects(
      () => assertCommittedBatchRenderDelivery(batch, { environment: deliveryDependencies.environment, deliveryDependencies }),
      (error) => error.code === "batch-render-dispatch-preflight-invalid"
        && error.issues.some((issue) => /jetbrains.*输入包或交付绑定已变化/.test(issue)),
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("commits and pushes only the batch render file list", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop", "jetbrains"]);
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batch-delivery-remote-"));
  try {
    execFileSync("git", ["init", "--bare", remoteRoot], { encoding: "utf8" });
    git(workspaceRoot, ["remote", "add", "origin", remoteRoot]);
    git(workspaceRoot, ["push", "-u", "origin", "main"]);
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// batch render change\n");
    write(workspaceRoot, "docs/unrelated-local-note.md", "must stay out of the delivery commit\n");
    const plan = await prepareBatchRenderDelivery({
      id: "batch-commit-push",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { environment: deliveryDependencies.environment, deliveryDependencies });

    const committed = commitAndPushBatchRenderDelivery(projects, {
      deliveryPlanId: plan.git.planId,
      selectedPaths: plan.git.selectedPaths,
    });
    assert.equal(committed.status, "committed");
    assert.deepEqual(committed.commitPaths, ["src/TemplateVideo.tsx"]);
    assert.equal(git(workspaceRoot, ["ls-remote", "--heads", "origin", "main"]).split(/\s+/)[0], committed.commit);
    const committedFiles = git(workspaceRoot, ["show", "--format=", "--name-only", "HEAD"]).split(/\r?\n/).filter(Boolean);
    assert.deepEqual(committedFiles, ["src/TemplateVideo.tsx"]);
    assert.equal(fs.existsSync(path.join(workspaceRoot, "docs/unrelated-local-note.md")), true);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(remoteRoot, { recursive: true, force: true });
  }
});

test("rechecks GitHub Actions readiness before dispatch", async () => {
  const { workspaceRoot, projectsRoot, projects, deliveryDependencies } = await fixture(["desktop"]);
  try {
    const result = await prepareBatchRenderDelivery({
      id: "batch-github-recheck",
      type: "to-render",
      items: [{ slug: "desktop", status: "queued" }],
    }, { environment: deliveryDependencies.environment, deliveryDependencies });
    for (const project of projects) checkpointRenderDelivery(project, { confirmedPlan: result.git.planId, commit: git(workspaceRoot, ["rev-parse", "HEAD"]), phase: "pushed" });
    const batch = {
      id: "batch-github-recheck",
      type: "to-render",
      items: [{ slug: "desktop", status: "queued" }],
      renderDelivery: {
        ...result,
        status: "committed",
        commit: { sha: git(workspaceRoot, ["rev-parse", "HEAD"]) },
      },
    };
    await assert.rejects(
      () => assertCommittedBatchRenderDelivery(batch, {
        environment: deliveryDependencies.environment,
        deliveryDependencies: { ...deliveryDependencies, async checkPreparation() { throw new Error("GitHub 权限已失效"); } },
      }),
      (error) => error.code === "batch-render-dispatch-preflight-invalid"
        && error.issues.includes("GitHub 权限已失效"),
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("shared batch service commits the union once and requires independent render authorization", async t => {
  const f = await fixture(["desktop", "jetbrains"]);
  t.after(() => { fs.rmSync(f.workspaceRoot, { recursive: true, force: true }); fs.rmSync(f.projectsRoot, { recursive: true, force: true }); });
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), "unified-batch-remote-"));
  t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
  execFileSync("git", ["init", "--bare", remote], { stdio: "pipe" });
  git(f.workspaceRoot, ["remote", "add", "origin", remote]); git(f.workspaceRoot, ["push", "origin", "main"]);
  fs.appendFileSync(path.join(f.workspaceRoot, "src/TemplateVideo.tsx"), "// common render correction\n");
  const batch = { id: "unified-batch", type: "to-render", items: f.projects.map(project => ({ slug: project.config.slug, status: "queued" })) };
  const prepared = await prepareBatchRenderDelivery(batch, { environment: f.deliveryDependencies.environment, deliveryDependencies: f.deliveryDependencies });
  assert.equal(prepared.status, "needs-confirmation", JSON.stringify(prepared.issues));
  batch.renderDelivery = prepared;
  await assert.rejects(() => commitPreparedBatchRenderDelivery(batch, { deliveryPlanId: "stale-plan", selectedPaths: prepared.git.selectedPaths, deliveryDependencies: f.deliveryDependencies }), /清单|计划/);
  const committed = await commitPreparedBatchRenderDelivery(batch, { deliveryPlanId: prepared.git.planId, selectedPaths: prepared.git.selectedPaths, environment: f.deliveryDependencies.environment, deliveryDependencies: f.deliveryDependencies });
  assert.equal(git(f.workspaceRoot, ["rev-list", "--count", "HEAD"]), "2");
  for (const project of f.projects) {
    const session = readRenderDeliverySession(project);
    assert.equal(session.commit, committed.commit); assert.equal(session.dispatchAuthorized, false);
    await assert.rejects(() => runRenderDelivery("resume", project.config.slug, {}, f.deliveryDependencies), { code: "batch-render-dispatch-confirmation-required" });
  }
  assert.notEqual(prepared.videos[0].renderInputSha256, prepared.videos[1].renderInputSha256);
  let submissions = 0;
  const dependencies = { ...f.deliveryDependencies, monitor: {
    submit(input) { submissions += 1; return createJobRecord(input); },
    async processJob() {},
  } };
  for (const project of f.projects) {
    checkpointRenderDelivery(project, { dispatchAuthorized: true });
    const first = await runRenderDelivery("resume", project.config.slug, {}, dependencies);
    const second = await runRenderDelivery("resume", project.config.slug, {}, dependencies);
    assert.equal(first.job.id, second.job.id);
  }
  assert.equal(submissions, 2);
});

test("render batch refuses direct dispatch before shared delivery preparation", async t => {
  const f = await fixture();
  const batches = fs.mkdtempSync(path.join(os.tmpdir(), "unified-batch-records-"));
  const previous = process.env.HARNESS_BATCHES_DIR; process.env.HARNESS_BATCHES_DIR = batches;
  t.after(() => { if (previous === undefined) delete process.env.HARNESS_BATCHES_DIR; else process.env.HARNESS_BATCHES_DIR = previous; fs.rmSync(batches, { recursive: true, force: true }); fs.rmSync(f.workspaceRoot, { recursive: true, force: true }); fs.rmSync(f.projectsRoot, { recursive: true, force: true }); });
  const batch = createBatch({ type: "to-render", slugs: [f.projects[0].config.slug] });
  await assert.rejects(() => runBatch(batch.id, { remoteExecutor: { run() { assert.fail("no dispatch authorization"); } } }), { code: "batch-render-delivery-confirmation-required" });
});
