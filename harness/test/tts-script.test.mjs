import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildTtsScript, ensureTtsScript } from "../src/tts-script.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tts-heading-test-"));
  const keys = ["HARNESS_TTS_PROJECT_DIR", "HARNESS_TTS_PYTHON", "HARNESS_TTS_SCRIPT_BUILDER", "HARNESS_PROJECTS_DIR", "HARNESS_WORKSPACE_ROOT"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const builder = path.join(root, "strict-builder.cjs");
  // Model the established builder's pipe-only heading boundary, without TTS/network calls.
  fs.writeFileSync(builder, `
    const fs = require('node:fs');
    const path = require('node:path');
    const arg = name => process.argv[process.argv.indexOf(name) + 1];
    const text = fs.readFileSync(arg('--input'), 'utf8');
    fs.writeFileSync(path.join(arg('--project-dir'), 'builder-input.json'), JSON.stringify({path: arg('--input'), text}));
    const parts = text.split(/^## Scene (\\d+)｜[^\\n]*\\n/gm);
    if (parts.length === 1 || /^## Scene \\d+[：:]/m.test(text)) throw new Error('expected pipe heading');
    const scenes = [];
    for (let i = 1; i < parts.length; i += 2) scenes.push({sceneId: parts[i], segments: [{id: parts[i] + '-01', text: parts[i + 1].trim()}]});
    fs.writeFileSync(arg('--output'), JSON.stringify({schemaVersion: '1.0', videoId: arg('--video-id'), scenes}));
  `);
  Object.assign(process.env, {
    HARNESS_TTS_PROJECT_DIR: root,
    HARNESS_TTS_PYTHON: process.execPath,
    HARNESS_TTS_SCRIPT_BUILDER: builder,
    HARNESS_PROJECTS_DIR: path.join(root, "projects"),
    HARNESS_WORKSPACE_ROOT: root,
  });
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    received: () => JSON.parse(fs.readFileSync(path.join(root, "builder-input.json"), "utf8")),
  };
}

const body = "这里保留中文冒号：原文，以及英文冒号: original。";
const narration = separator => `# Narration Script\n\n## Scene 01${separator}标题\n\n${body}\n\n## Scene 02${separator}后续\n\n继续验证。\n`;
const expectedScenes = [
  { sceneId: "01", segments: [{ id: "01-01", text: body }] },
  { sceneId: "02", segments: [{ id: "02-01", text: "继续验证。" }] },
];

for (const separator of ["：", ":", "｜"]) {
  test(`buildTtsScript accepts ${separator} headings and preserves narration`, t => {
    const f = fixture(t);
    const script = buildTtsScript("heading-fixture", narration(separator));
    assert.deepEqual(script, { schemaVersion: "1.0", videoId: "heading-fixture", scenes: expectedScenes });
    assert.equal(f.received().text, narration("｜"));
    assert.equal(fs.existsSync(f.received().path), false, "temporary input must be cleaned up");
  });

  test(`ensureTtsScript accepts ${separator} headings without rewriting source or fingerprint`, t => {
    const f = fixture(t);
    const slug = "heading-fixture";
    const directory = path.join(f.root, "videos", slug);
    fs.mkdirSync(directory, { recursive: true });
    const input = path.join(directory, "narration-script.md");
    const original = Buffer.from(narration(separator));
    fs.writeFileSync(input, original);
    const project = { config: { slug, workspaceRoot: f.root }, state: { slug, currentStage: "tts" } };
    const result = ensureTtsScript(project);
    const script = JSON.parse(fs.readFileSync(path.join(f.root, result.path), "utf8"));
    assert.equal(result.created, true);
    assert.equal(result.sceneCount, 2);
    assert.deepEqual(script.scenes, expectedScenes);
    assert.deepEqual(fs.readFileSync(input), original);
    assert.equal(script.source.narrationFingerprint, crypto.createHash("sha256").update(original).digest("hex"));
    assert.equal(f.received().text, narration("｜"));
    if (separator === "｜") assert.equal(f.received().path, input);
    else {
      assert.notEqual(f.received().path, input);
      assert.equal(fs.existsSync(f.received().path), false);
    }
    assert.equal(ensureTtsScript(project).created, false, "rebuilding uses the same output path");
    assert.deepEqual(fs.readFileSync(input), original);
  });
}

test("invalid headings fail instead of silently generating a script", t => {
  const f = fixture(t);
  assert.throws(() => buildTtsScript("heading-fixture", narration("/")), /标准 TTS Script 生成失败/);
  assert.equal(fs.existsSync(f.received().path), false);
});
