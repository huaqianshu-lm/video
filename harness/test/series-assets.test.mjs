import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getSeries,
  listSeries,
  saveSeries,
  saveSeriesCover,
  seriesAssetPath,
  validateCover,
} from "../src/series-assets.mjs";
import { initializeProject, projectFiles, readJson, reopenGate3ForSeriesCover, writeJson } from "../src/storage.mjs";

function pngHeader(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test("stores one shared 16:9 cover and keeps series video membership", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-series-"));
  const previousSeriesRoot = process.env.HARNESS_SERIES_DIR;
  const previousAssetsRoot = process.env.HARNESS_SERIES_ASSETS_DIR;
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  process.env.HARNESS_SERIES_ASSETS_DIR = path.join(root, "public", "series-assets");

  try {
    const created = saveSeries({
      id: "codex-guide",
      title: "Codex 教程系列",
      style: "codex",
      coverDurationFrames: 45,
      videos: ["01-what-is-codex", "01-what-is-codex"],
    });
    assert.deepEqual(created.videos, ["01-what-is-codex"]);
    assert.equal(created.style, "codex");
    assert.equal(listSeries().length, 1);

    const result = saveSeriesCover("codex-guide", pngHeader(1920, 1080), "image/png");
    assert.equal(result.series.cover, "series-assets/codex-guide/cover.png");
    assert.equal(result.image.width, 1920);
    assert.ok(seriesAssetPath("codex-guide", "cover.png"));
    assert.equal(getSeries("codex-guide").coverDurationFrames, 45);
  } finally {
    if (previousSeriesRoot === undefined) delete process.env.HARNESS_SERIES_DIR;
    else process.env.HARNESS_SERIES_DIR = previousSeriesRoot;
    if (previousAssetsRoot === undefined) delete process.env.HARNESS_SERIES_ASSETS_DIR;
    else process.env.HARNESS_SERIES_ASSETS_DIR = previousAssetsRoot;
  }
});

test("rejects silent removal of existing series videos", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-series-membership-"));
  const previousSeriesRoot = process.env.HARNESS_SERIES_DIR;
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");

  try {
    saveSeries({ id: "codex-guide", title: "Codex 教程系列", videos: ["01-what-is-codex"] });
    assert.throws(
      () => saveSeries({ id: "codex-guide", videos: ["02-core-concepts"] }),
      /requires explicit confirmation/,
    );
    assert.deepEqual(getSeries("codex-guide").videos, ["01-what-is-codex"]);

    const confirmed = saveSeries({
      id: "codex-guide",
      videos: ["02-core-concepts"],
      confirmVideoRemoval: true,
    });
    assert.deepEqual(confirmed.videos, ["02-core-concepts"]);
  } finally {
    if (previousSeriesRoot === undefined) delete process.env.HARNESS_SERIES_DIR;
    else process.env.HARNESS_SERIES_DIR = previousSeriesRoot;
  }
});

test("rejects unsupported, oversized, and non-16:9 cover inputs", () => {
  assert.throws(() => validateCover(pngHeader(1000, 1000), "image/png"), /must be 16:9/);
  assert.throws(() => validateCover(Buffer.from("not-an-image"), "image/png"), /invalid/);
  assert.throws(() => validateCover(Buffer.from("image"), "image/gif"), /PNG, JPEG, or WebP/);
  assert.throws(() => validateCover(Buffer.alloc(10 * 1024 * 1024 + 1), "image/png"), /10 MB/);
});

test("reopens Gate 3 when a cover changes after review", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-series-gate-"));
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");

  try {
    initializeProject("series-video");
    const files = projectFiles("series-video");
    const state = readJson(files.state);
    state.currentStage = "completed";
    for (const item of Object.values(state.stages)) {
      item.status = "succeeded";
      item.review = item.stage.startsWith("gate-") ? { decision: "approved" } : null;
    }
    writeJson(files.state, state);

    assert.equal(reopenGate3ForSeriesCover("series-video"), true);
    const reopened = readJson(files.state);
    assert.equal(reopened.currentStage, "gate-3");
    assert.equal(reopened.stages["gate-3"].status, "waiting");
    assert.equal(reopened.stages["gate-3"].invalidatedBy, "series-cover");
    assert.equal(reopened.stages["smoke-render"].status, "invalidated");
    assert.equal(reopened.stages["gate-4"].review, null);
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
  }
});
