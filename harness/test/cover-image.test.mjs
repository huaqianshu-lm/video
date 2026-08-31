import test from "node:test";
import assert from "node:assert/strict";
import { COVER_HEIGHT, COVER_WIDTH, coverCropFor } from "../web/cover-image.js";

test("keeps exact 16:9 cover bounds", () => {
  assert.deepEqual(coverCropFor(COVER_WIDTH, COVER_HEIGHT), {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  });
});

test("center-crops a near-16:9 source without stretching", () => {
  const crop = coverCropFor(1672, 941);
  assert.equal(crop.x, 0);
  assert.ok(Math.abs(crop.y - 0.25) < 1e-9);
  assert.equal(crop.width, 1672);
  assert.equal(crop.height, 940.5);
});

test("rejects a source whose aspect ratio differs by more than one percent", () => {
  assert.throws(() => coverCropFor(1000, 1000), /偏离 16:9 超过 1%/);
});
