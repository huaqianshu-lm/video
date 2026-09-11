import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  packageRenderInput,
  prepareRenderInput,
  discoverStudioEntries,
  renderStudioCatalogSource,
  validateRenderInputDirectory,
  writeRenderEntryPoint,
} from "../src/render-input.mjs";

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

test("discovers all local Studio entries and selects the newest matching video version", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-studio-catalog-"));
  const videoRoot = path.join(workspaceRoot, "videos", "claude-code-what-is");
  const remotionRoot = path.join(workspaceRoot, "src", "videos", "claude-code-what-is");
  fs.mkdirSync(videoRoot, {recursive: true});
  fs.mkdirSync(remotionRoot, {recursive: true});
  fs.writeFileSync(path.join(videoRoot, "source.md"), "# Video\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "ClaudeCodeWhatIsVideo.tsx"), "export const ClaudeCodeWhatIsVideo = () => null;\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "video.config.ts"), "export const videoConfig = {slug: 'claude-code-what-is', fps: 30, width: 1920, height: 1080};\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "ClaudeCodeWhatIsVideo14.tsx"), "export const ClaudeCodeWhatIsVideo14 = () => null;\n", "utf8");
  fs.writeFileSync(path.join(remotionRoot, "video14.config.ts"), "export const video14Config = {slug: 'claude-code-what-is-v2', fps: 30, width: 1920, height: 1080};\nexport const getVideo14TotalDurationFrames = () => 420;\n", "utf8");
  const oldTime = new Date("2026-07-30T00:00:00Z");
  const newTime = new Date("2026-08-02T00:00:00Z");
  fs.utimesSync(path.join(remotionRoot, "video.config.ts"), oldTime, oldTime);
  fs.utimesSync(path.join(remotionRoot, "ClaudeCodeWhatIsVideo.tsx"), oldTime, oldTime);
  fs.utimesSync(path.join(remotionRoot, "video14.config.ts"), newTime, newTime);
  fs.utimesSync(path.join(remotionRoot, "ClaudeCodeWhatIsVideo14.tsx"), newTime, newTime);

  try {
    const discovered = discoverStudioEntries(workspaceRoot);
    assert.deepEqual(discovered.skipped, []);
    assert.equal(discovered.entries.length, 1);
    assert.deepEqual(discovered.entries[0], {
      slug: "claude-code-what-is",
      compositionId: "claude-code-what-is-v2",
      componentPath: "src/videos/claude-code-what-is/ClaudeCodeWhatIsVideo14.tsx",
      componentExport: "ClaudeCodeWhatIsVideo14",
      configPath: "src/videos/claude-code-what-is/video14.config.ts",
      configExport: "video14Config",
      durationExport: "getVideo14TotalDurationFrames",
    });
    const source = renderStudioCatalogSource(discovered.entries);
    assert.match(source, /id="claude-code-what-is-v2"/);
    assert.match(source, /getVideo14TotalDurationFrames/);
    assert.match(source, /registerRoot\(Root\)/);
  } finally {
    fs.rmSync(workspaceRoot, {recursive: true, force: true});
  }
});
