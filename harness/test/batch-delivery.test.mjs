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
  return { workspaceRoot, projectsRoot, projects };
}

test("prepares an independent batch delivery plan with exact paths and bindings", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop", "jetbrains"]);
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/TemplateVideo.tsx"), "// render change\n");
    const result = await prepareBatchRenderDelivery({
      id: "batch-render-plan",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { githubPreflight: async () => {} });

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

test("blocks batch delivery when one video's binding has the wrong slug and checksum", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop", "jetbrains"]);
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
    }, { githubPreflight: async () => {} });

    assert.equal(result.status, "blocked");
    const jetbrains = result.videos.find((video) => video.slug === "jetbrains");
    assert.ok(jetbrains.issues.some((issue) => /videoSlug|archiveSha256|ZIP/.test(issue)));
    assert.throws(
      () => commitPreparedBatchRenderDelivery({
        id: "batch-invalid-binding",
        type: "to-render",
        items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
        renderDelivery: result,
      }, { deliveryPlanId: result.git?.planId, selectedPaths: result.git?.selectedPaths }),
      (error) => error.code === "batch-render-delivery-preflight-blocked",
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks batch delivery before Gate 3 is approved", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop"]);
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
    }, { githubPreflight: async () => {} });
    assert.equal(result.status, "blocked");
    assert.ok(result.issues.some((issue) => /Gate 3|skipped/.test(issue)));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("blocks batch delivery when concrete video code is outside the Git render scope", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop"]);
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src/videos/desktop/video.config.ts"), "// forbidden render scope change\n");
    const result = await prepareBatchRenderDelivery({
      id: "batch-out-of-scope",
      type: "to-render",
      items: [{ slug: projects[0].config.slug, status: "queued" }],
    }, { githubPreflight: async () => {} });

    assert.equal(result.status, "blocked");
    assert.ok(result.issues.some((issue) => /渲染提交范围|渲染相关文件/.test(issue)));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("rechecks every binding before dispatch and does not accept a changed package", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop", "jetbrains"]);
  try {
    const result = await prepareBatchRenderDelivery({
      id: "batch-dispatch-recheck",
      type: "to-render",
      items: projects.map((project) => ({ slug: project.config.slug, status: "queued" })),
    }, { githubPreflight: async () => {} });
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
      () => assertCommittedBatchRenderDelivery(batch, { githubPreflight: async () => {} }),
      (error) => error.code === "batch-render-dispatch-preflight-invalid"
        && error.issues.some((issue) => /jetbrains.*输入包或交付绑定已变化/.test(issue)),
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});

test("commits and pushes only the batch render file list", async () => {
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop", "jetbrains"]);
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
    }, { githubPreflight: async () => {} });

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
  const { workspaceRoot, projectsRoot, projects } = await fixture(["desktop"]);
  try {
    const result = await prepareBatchRenderDelivery({
      id: "batch-github-recheck",
      type: "to-render",
      items: [{ slug: "desktop", status: "queued" }],
    }, { githubPreflight: async () => {} });
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
        githubPreflight: async () => { throw new Error("GitHub 权限已失效"); },
      }),
      (error) => error.code === "batch-render-dispatch-preflight-invalid"
        && error.issues.includes("GitHub 权限已失效"),
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});
