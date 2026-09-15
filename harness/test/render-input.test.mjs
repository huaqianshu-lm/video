import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  bindRenderInputDelivery,
  packageRenderInput,
  prepareRenderInput,
  discoverStudioEntries,
  readRenderInputDelivery,
  renderStudioCatalogSource,
  renderInputArchivePath,
  renderInputDeliveryPath,
  validateRenderInputDelivery,
  validateRenderInputDirectory,
  writeRenderEntryPoint,
} from "../src/render-input.mjs";
import { initializeProject, loadProject } from "../src/storage.mjs";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createFixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-render-input-"));
  const slug = "render-input-video";
  const sourceRoot = path.join(workspaceRoot, "videos", slug);
  const remotionRoot = path.join(workspaceRoot, "src", "videos", slug);
  const archiveSource = path.join(workspaceRoot, "archive-source", slug);
  fs.mkdirSync(sourceRoot, { recursive: true });
  fs.mkdirSync(remotionRoot, { recursive: true });
  fs.mkdirSync(path.join(archiveSource, "audio", "scene-01"), { recursive: true });
  fs.mkdirSync(path.join(archiveSource, "subtitles"), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, "source.md"), "# Render input fixture\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "FixtureVideo.tsx"), "export const FixtureVideo = () => null;\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "video.config.ts"), "export const videoConfig = {slug: 'render-input-video', fps: 30, width: 1920, height: 1080};\n", "utf8");
  writeJson(path.join(remotionRoot, "generated", "audio-manifest.json"), {
    videoId: slug,
    scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3" }] }],
  });
  writeJson(path.join(remotionRoot, "generated", "subtitle-manifest.json"), {
    videoId: slug,
    scenes: [{ sceneId: "01" }],
  });
  writeJson(path.join(remotionRoot, "generated", "timeline-manifest.json"), {
    videoId: slug,
    scenes: [{ sceneId: "01" }],
  });
  fs.writeFileSync(path.join(archiveSource, "audio", "scene-01", "01-01.mp3"), "audio", "utf8");
  fs.writeFileSync(path.join(archiveSource, "subtitles", "captions.vtt"), "WEBVTT\n", "utf8");
  fs.writeFileSync(path.join(archiveSource, "subtitles", "captions.srt"), "1\n00:00:00,000 --> 00:00:01,000\nFixture\n", "utf8");
  const archivePath = path.join(workspaceRoot, "assets", `${slug}-assets.zip`);
  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  execFileSync("zip", ["-q", "-r", archivePath, slug], { cwd: path.dirname(archiveSource), stdio: "pipe" });
  return { workspaceRoot, slug, project: { config: { slug, workspaceRoot } } };
}

test("prepares, validates, packages, and generates an isolated render input", () => {
  const fixture = createFixture();
  try {
    const prepared = prepareRenderInput(fixture.project);
    assert.equal(prepared.status, "prepared");
    assert.deepEqual(validateRenderInputDirectory(prepared.directory, { expectedSlug: fixture.slug }), []);

    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    assert.equal(packaged.status, "packaged");
    assert.match(packaged.archiveSha256, /^[a-f0-9]{64}$/);

    const manifestPath = path.join(prepared.directory, "render-input.json");
    const entryPath = path.join(fixture.workspaceRoot, "src", "RenderInputRoot.tsx");
    const entry = writeRenderEntryPoint(manifestPath, entryPath);
    assert.equal(entry.compositionId, fixture.slug);
    assert.match(fs.readFileSync(entryPath, "utf8"), /FixtureVideo/);
    assert.match(fs.readFileSync(entryPath, "utf8"), /videoConfig/);
    assert.match(fs.readFileSync(entryPath, "utf8"), /registerRoot\(Root\)/);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("detects a changed render input file through the manifest hash", () => {
  const fixture = createFixture();
  try {
    const prepared = prepareRenderInput(fixture.project);
    fs.appendFileSync(path.join(prepared.directory, "videos", fixture.slug, "source.md"), "changed\n", "utf8");
    const issues = validateRenderInputDirectory(prepared.directory, { expectedSlug: fixture.slug });
    assert.ok(issues.some((issue) => issue.includes("哈希不一致")));
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("rebuilds the current input package when local source or Remotion files change", () => {
  const fixture = createFixture();
  try {
    const first = prepareRenderInput(fixture.project);
    const firstManifest = JSON.parse(fs.readFileSync(path.join(first.directory, "render-input.json"), "utf8"));
    fs.appendFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "changed source\n", "utf8");
    const second = prepareRenderInput(fixture.project);
    const secondManifest = JSON.parse(fs.readFileSync(path.join(second.directory, "render-input.json"), "utf8"));
    assert.equal(second.status, "prepared");
    assert.notEqual(secondManifest.sourceFingerprint, firstManifest.sourceFingerprint);
    assert.match(fs.readFileSync(path.join(second.directory, "videos", fixture.slug, "source.md"), "utf8"), /changed source/);
    assert.deepEqual(validateRenderInputDirectory(second.directory, { expectedSlug: fixture.slug }), []);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("binds one published package URL and SHA to its current manifest", async () => {
  const fixture = createFixture();
  try {
    const prepared = prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    const result = await bindRenderInputDelivery(fixture.project, {
      url: "https://inputs.example.test/render-input.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });
    assert.equal(result.status, "bound");
    assert.deepEqual(readRenderInputDelivery(fixture.workspaceRoot, fixture.slug), result.delivery);
    assert.deepEqual(validateRenderInputDelivery(fixture.project), []);
    assert.equal(fs.existsSync(renderInputDeliveryPath(fixture.workspaceRoot, fixture.slug)), true);
    assert.equal(prepared.manifest.compositionId, result.delivery.compositionId);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("uses the GitHub CLI credential for a private GitHub input asset instead of stale token variables", async () => {
  const fixture = createFixture();
  try {
    prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    let authorization = null;
    const result = await bindRenderInputDelivery(fixture.project, {
      url: "https://api.github.com/repos/example/video-render-inputs/releases/assets/123",
      sha256: packaged.archiveSha256,
      environment: {
        GITHUB_TOKEN: "stale-token",
        GH_TOKEN: "another-stale-token",
        HARNESS_GITHUB_AUTH_SOURCE: "gh-cli",
      },
      execFileSyncImpl: () => "keychain-token\n",
      fetchImpl: async (_url, options) => {
        authorization = options.headers.Authorization;
        return { ok: true, status: 200, arrayBuffer: async () => archiveBytes };
      },
    });
    assert.equal(result.status, "bound");
    assert.equal(authorization, "Bearer keychain-token");
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("does not create a binding when the published content is unreadable or has a different hash", async () => {
  const fixture = createFixture();
  try {
    prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    await assert.rejects(
      () => bindRenderInputDelivery(fixture.project, {
        url: "https://inputs.example.test/unreadable.zip",
        sha256: packaged.archiveSha256,
        fetchImpl: async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }),
      }),
      (error) => error.code === "render-input-delivery-remote-unavailable",
    );
    await assert.rejects(
      () => bindRenderInputDelivery(fixture.project, {
        url: "https://inputs.example.test/wrong.zip",
        sha256: packaged.archiveSha256,
        fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => Buffer.from("wrong") }),
      }),
      (error) => error.code === "render-input-delivery-remote-hash-mismatch",
    );
    assert.equal(fs.existsSync(renderInputDeliveryPath(fixture.workspaceRoot, fixture.slug)), false);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("invalidates a binding when the local ZIP changes", async () => {
  const fixture = createFixture();
  try {
    prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    await bindRenderInputDelivery(fixture.project, {
      url: "https://inputs.example.test/render-input.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });
    fs.appendFileSync(renderInputArchivePath(fixture.workspaceRoot, fixture.slug), "changed archive\n", "utf8");
    assert.ok(validateRenderInputDelivery(fixture.project).some((issue) => /archiveSha256/.test(issue)));
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("invalidates a binding when the source workspace changes", async () => {
  const fixture = createFixture();
  try {
    prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    await bindRenderInputDelivery(fixture.project, {
      url: "https://inputs.example.test/render-input.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });
    fs.appendFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "changed after binding\n", "utf8");
    assert.ok(validateRenderInputDelivery(fixture.project).some((issue) => issue.includes("源资料已变化")));
    assert.throws(
      () => packageRenderInput(fixture.workspaceRoot, fixture.slug),
      (error) => error.code === "render-input-source-stale",
    );
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("discovers Studio entries from the explicitly packaged video version", () => {
  const fixture = createFixture();
  const remotionRoot = path.join(fixture.workspaceRoot, "src", "videos", fixture.slug);
  try {
    fs.writeFileSync(path.join(remotionRoot, "FixtureVideo14.tsx"), "export const FixtureVideo14 = () => null;\n", "utf8");
    fs.writeFileSync(path.join(remotionRoot, "video14.config.ts"), "export const video14Config = {slug: 'render-input-video-v2', fps: 30, width: 1920, height: 1080};\n", "utf8");
    prepareRenderInput(fixture.project, {
      compositionId: "render-input-video-v2",
      componentFile: "FixtureVideo14.tsx",
      componentExport: "FixtureVideo14",
      configFile: "video14.config.ts",
      configExport: "video14Config",
    });
    packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const discovered = discoverStudioEntries(fixture.workspaceRoot);
    assert.deepEqual(discovered.skipped, []);
    assert.equal(discovered.entries.length, 1);
    assert.deepEqual(discovered.entries[0], {
      slug: fixture.slug,
      compositionId: "render-input-video-v2",
      componentPath: `src/videos/${fixture.slug}/FixtureVideo14.tsx`,
      componentExport: "FixtureVideo14",
      configPath: `src/videos/${fixture.slug}/video14.config.ts`,
      configExport: "video14Config",
      durationExport: null,
      packageFingerprint: discovered.entries[0].packageFingerprint,
      sourceFingerprint: discovered.entries[0].sourceFingerprint,
    });
    const source = renderStudioCatalogSource(discovered.entries);
    assert.match(source, /id="render-input-video-v2"/);
    assert.match(source, /FixtureVideo14/);
    assert.match(source, /registerRoot\(Root\)/);
  } finally {
    fs.rmSync(fixture.workspaceRoot, {recursive: true, force: true});
  }
});

test("does not rebuild a completed video for Studio and explains a missing package", () => {
  const fixture = createFixture();
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-studio-completed-projects-"));
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousWorkspaceRoot = process.env.HARNESS_WORKSPACE_ROOT;
  try {
    process.env.HARNESS_PROJECTS_DIR = projectsRoot;
    process.env.HARNESS_WORKSPACE_ROOT = fixture.workspaceRoot;
    initializeProject(fixture.slug);
    const project = loadProject(fixture.slug, { refresh: false });
    prepareRenderInput(project);
    packageRenderInput(fixture.workspaceRoot, fixture.slug);
    project.state.currentStage = "completed";
    fs.writeFileSync(project.files.state, `${JSON.stringify(project.state, null, 2)}\n`, "utf8");
    fs.rmSync(path.join(fixture.workspaceRoot, "src", "videos"), { recursive: true, force: true });

    const discovered = discoverStudioEntries(fixture.workspaceRoot);
    assert.equal(discovered.entries.length, 1);
    assert.equal(discovered.entries[0].slug, fixture.slug);

    fs.rmSync(path.join(fixture.workspaceRoot, "local", "render-input", fixture.slug), { recursive: true, force: true });
    fs.mkdirSync(path.join(fixture.workspaceRoot, "src", "videos", fixture.slug), { recursive: true });
    const skipped = discoverStudioEntries(fixture.workspaceRoot);
    assert.equal(skipped.entries.length, 0);
    assert.match(skipped.skipped[0].reason, /completed|已有输入包|缺少/);
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousWorkspaceRoot === undefined) delete process.env.HARNESS_WORKSPACE_ROOT;
    else process.env.HARNESS_WORKSPACE_ROOT = previousWorkspaceRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});
