import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
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
import { initializeProject, isCompletedProject, loadProject, projectFiles } from "../src/storage.mjs";

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

test("rechecks the on-disk completed state before rebuilding an input package", () => {
  const fixture = createFixture();
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-render-input-completed-projects-"));
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousWorkspaceRoot = process.env.HARNESS_WORKSPACE_ROOT;
  try {
    process.env.HARNESS_PROJECTS_DIR = projectsRoot;
    process.env.HARNESS_WORKSPACE_ROOT = fixture.workspaceRoot;
    initializeProject(fixture.slug);
    const staleProject = loadProject(fixture.slug, { refresh: false });
    prepareRenderInput(staleProject);

    fs.appendFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "changed before completion\n", "utf8");
    const statePath = projectFiles(fixture.slug).state;
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    state.currentStage = "completed";
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

    const inputDirectory = path.join(fixture.workspaceRoot, "local", "render-input", fixture.slug);
    const before = {
      state: fs.readFileSync(statePath, "utf8"),
      input: fs.readFileSync(path.join(inputDirectory, "render-input.json"), "utf8"),
      source: fs.readFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "utf8"),
    };
    assert.equal(isCompletedProject(staleProject), true);
    assert.throws(
      () => prepareRenderInput(staleProject),
      (error) => error.code === "completed-project-readonly",
    );
    assert.deepEqual({
      state: fs.readFileSync(statePath, "utf8"),
      input: fs.readFileSync(path.join(inputDirectory, "render-input.json"), "utf8"),
      source: fs.readFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "utf8"),
    }, before);
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousWorkspaceRoot === undefined) delete process.env.HARNESS_WORKSPACE_ROOT;
    else process.env.HARNESS_WORKSPACE_ROOT = previousWorkspaceRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("validates the complete render input file set, metadata, and package fingerprint", () => {
  const fixture = createFixture();
  try {
    const prepared = prepareRenderInput(fixture.project);
    const manifestPath = path.join(prepared.directory, "render-input.json");
    const originalManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const firstFile = originalManifest.files[0];

    const cases = [
      {
        name: "empty file list",
        mutate: (manifest) => { manifest.files = []; },
        match: /文件清单/,
      },
      {
        name: "missing declared file",
        mutate: (manifest) => { manifest.files = manifest.files.slice(1); },
        match: /文件清单/,
      },
      {
        name: "extra package file",
        mutate: (manifest) => { fs.writeFileSync(path.join(prepared.directory, "unexpected.txt"), "unexpected\n", "utf8"); },
        match: /文件清单/,
      },
      {
        name: "duplicate path",
        mutate: (manifest) => { manifest.files.push({ ...manifest.files[0] }); },
        match: /重复/,
      },
      {
        name: "invalid size",
        mutate: (manifest) => { manifest.files[0].size += 1; },
        match: /大小/,
      },
      {
        name: "invalid hash",
        mutate: (manifest) => { manifest.files[0].sha256 = "0".repeat(64); },
        match: /哈希/,
      },
      {
        name: "forged package fingerprint",
        mutate: (manifest) => { manifest.packageFingerprint = "0".repeat(64); },
        match: /packageFingerprint/,
      },
      {
        name: "absolute path",
        mutate: (manifest) => { manifest.files[0].path = "/absolute.txt"; },
        match: /路径/,
      },
      {
        name: "parent traversal",
        mutate: (manifest) => { manifest.files[0].path = "../outside.txt"; },
        match: /路径/,
      },
      {
        name: "directory entry",
        mutate: (manifest) => {
          manifest.files[0] = { path: `videos/${fixture.slug}`, size: 0, sha256: "0".repeat(64) };
        },
        match: /普通文件|文件清单/,
      },
    ];

    for (const item of cases) {
      fs.rmSync(path.join(prepared.directory, "unexpected.txt"), { force: true });
      const manifest = JSON.parse(JSON.stringify(originalManifest));
      item.mutate(manifest);
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      const issues = validateRenderInputDirectory(prepared.directory, { expectedSlug: fixture.slug });
      assert.ok(issues.some((issue) => item.match.test(issue)), `${item.name}: ${issues.join("；")}`);
    }

    fs.writeFileSync(path.join(prepared.directory, "package-link.txt"), "unexpected\n", "utf8");
    fs.symlinkSync(path.join(prepared.directory, "videos", fixture.slug, "source.md"), path.join(prepared.directory, "package-link"));
    fs.writeFileSync(manifestPath, `${JSON.stringify(originalManifest, null, 2)}\n`, "utf8");
    const symlinkIssues = validateRenderInputDirectory(prepared.directory, { expectedSlug: fixture.slug });
    assert.ok(symlinkIssues.some((issue) => /符号链接|symbolic links/.test(issue)), symlinkIssues.join("；"));
    assert.equal(firstFile.path, originalManifest.files[0].path);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("only writes a validated current package to the exact temporary entry path", () => {
  const fixture = createFixture();
  try {
    const prepared = prepareRenderInput(fixture.project);
    const manifestPath = path.join(prepared.directory, "render-input.json");
    const entryPath = path.join(fixture.workspaceRoot, "src", "RenderInputRoot.tsx");
    fs.mkdirSync(path.dirname(entryPath), { recursive: true });
    fs.writeFileSync(entryPath, "sentinel\n", "utf8");

    assert.throws(
      () => writeRenderEntryPoint(manifestPath, path.join(fixture.workspaceRoot, "src", "Root.tsx")),
      (error) => error.code === "render-input-entry-output-invalid",
    );
    assert.equal(fs.readFileSync(entryPath, "utf8"), "sentinel\n");

    assert.throws(
      () => writeRenderEntryPoint(manifestPath, path.join(fixture.workspaceRoot, "other-entry.tsx")),
      (error) => error.code === "render-input-entry-output-invalid",
    );
    assert.equal(fs.readFileSync(entryPath, "utf8"), "sentinel\n");

    fs.appendFileSync(path.join(fixture.workspaceRoot, "videos", fixture.slug, "source.md"), "stale source\n", "utf8");
    assert.throws(
      () => writeRenderEntryPoint(manifestPath, entryPath),
      (error) => error.code === "render-input-source-stale" || error.code === "render-input-validation-failed",
    );
    assert.equal(fs.readFileSync(entryPath, "utf8"), "sentinel\n");
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

test("invalidates a binding when the outer ZIP contents diverge from the package directory", async () => {
  const fixture = createFixture();
  const tamperedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-render-input-tampered-"));
  try {
    prepareRenderInput(fixture.project);
    const packaged = packageRenderInput(fixture.workspaceRoot, fixture.slug);
    const archiveBytes = fs.readFileSync(packaged.archivePath);
    await bindRenderInputDelivery(fixture.project, {
      url: "https://inputs.example.test/render-input.zip",
      sha256: packaged.archiveSha256,
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => archiveBytes }),
    });
    const packageRoot = path.join(fixture.workspaceRoot, "local", "render-input", fixture.slug);
    fs.cpSync(packageRoot, tamperedRoot, { recursive: true });
    fs.writeFileSync(path.join(tamperedRoot, "tampered.txt"), "not in the package directory\n", "utf8");
    const tamperedArchive = path.join(fixture.workspaceRoot, "tampered-render-input.zip");
    execFileSync("zip", ["-q", "-r", "-X", tamperedArchive, "."], { cwd: tamperedRoot, stdio: "pipe" });
    fs.copyFileSync(tamperedArchive, packaged.archivePath);
    const delivery = readRenderInputDelivery(fixture.workspaceRoot, fixture.slug);
    delivery.archiveSha256 = createHash("sha256").update(fs.readFileSync(packaged.archivePath)).digest("hex");
    writeJson(renderInputDeliveryPath(fixture.workspaceRoot, fixture.slug), delivery);

    const issues = validateRenderInputDelivery(fixture.project);
    assert.ok(issues.some((issue) => issue.includes("输入包 ZIP 文件集合与目录不一致")));
  } finally {
    fs.rmSync(tamperedRoot, { recursive: true, force: true });
    fs.rmSync(path.join(fixture.workspaceRoot, "tampered-render-input.zip"), { force: true });
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
