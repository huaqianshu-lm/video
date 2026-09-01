import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  archiveEntries,
  archiveMatchesAssetDirectory,
  ensureAssetArchive,
  packageVideoAssets,
} from "../src/asset-bundler.mjs";

function fixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-assets-"));
  const slug = "asset-video";
  const sourceRoot = path.join(workspaceRoot, "public", "local-assets", slug);
  fs.mkdirSync(path.join(sourceRoot, "audio", "scene-01"), { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, "subtitles"), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, "audio", "scene-01", "01-01.mp3"), "audio\n");
  fs.writeFileSync(path.join(sourceRoot, "subtitles", "captions.srt"), "srt\n");
  fs.writeFileSync(path.join(sourceRoot, "subtitles", "captions.vtt"), "WEBVTT\n");
  return { workspaceRoot, slug, project: { config: { slug, workspaceRoot } }, sourceRoot };
}

test("packages all local audio and subtitle assets under the video slug", () => {
  const { workspaceRoot, project, slug } = fixture();
  try {
    const result = packageVideoAssets(project);
    assert.equal(result.archiveRelativePath, `assets/${slug}-assets.zip`);
    assert.equal(archiveMatchesAssetDirectory(project), true);
    assert.deepEqual(archiveEntries(result.archivePath).filter((entry) => !entry.endsWith("/")).sort(), [
      `${slug}/audio/scene-01/01-01.mp3`,
      `${slug}/subtitles/captions.srt`,
      `${slug}/subtitles/captions.vtt`,
    ]);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("rebuilds an archive when local assets change", () => {
  const { workspaceRoot, project, sourceRoot } = fixture();
  try {
    packageVideoAssets(project);
    fs.writeFileSync(path.join(sourceRoot, "subtitles", "captions.vtt"), "WEBVTT\nchanged\n");
    assert.equal(archiveMatchesAssetDirectory(project), false);
    const result = ensureAssetArchive(project);
    assert.equal(result.status, "packaged");
    assert.equal(archiveMatchesAssetDirectory(project), true);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("refuses to package assets without both captions formats and audio", () => {
  const { workspaceRoot, project, sourceRoot } = fixture();
  try {
    fs.rmSync(path.join(sourceRoot, "subtitles", "captions.vtt"));
    assert.throws(() => packageVideoAssets(project), /资源目录缺少 subtitles\/captions\.vtt/);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});
