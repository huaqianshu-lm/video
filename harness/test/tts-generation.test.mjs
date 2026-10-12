import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { saveTtsGenerationRecord, ttsScriptFingerprint, validateTtsGenerationRecord } from "../src/tts-generation.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tts-generation-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const slug = "generation-video";
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  write(`videos/${slug}/tts-script.json`, JSON.stringify({ videoId: slug, scenes: [] }));
  for (const file of ["audio-manifest.json", "subtitle-manifest.json", "timeline-manifest.json"]) write(`src/videos/${slug}/generated/${file}`, "{}");
  write(`src/videos/${slug}/generated/audio/scene-01/01-01.mp3`, "audio bytes");
  write(`src/videos/${slug}/generated/subtitles/captions.srt`, "caption bytes");
  const startedAt = new Date().toISOString();
  const task = { id: "task-1", attempt: 1, inputFingerprint: "task-input", startedAt };
  const job = { id: task.id, slug, attempts: 1, inputFingerprint: task.inputFingerprint, startedAt };
  const project = { config: { workspaceRoot: root } };
  const save = () => saveTtsGenerationRecord({ root, slug, task, inputFingerprint: ttsScriptFingerprint(root, slug), startedAt, cacheDirectory: "cache/task-1" });
  return { root, slug, task, job, project, save, write };
}

test("same bytes remain valid across distinct successful generation attempts", t => {
  const f = fixture(t);
  const first = f.save();
  assert.equal(validateTtsGenerationRecord(f.project, f.job, first), true);
  f.task.attempt = 2; f.job.attempts = 2;
  const second = f.save();
  assert.equal(first.outputFingerprint, second.outputFingerprint);
  assert.notEqual(first.path, second.path);
  assert.equal(validateTtsGenerationRecord(f.project, f.job, second), true);
});

test("touching files does not turn an old task or attempt record into current evidence", t => {
  const f = fixture(t); const record = f.save();
  const audio = path.join(f.root, `src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`);
  fs.utimesSync(audio, new Date(), new Date());
  assert.throws(() => validateTtsGenerationRecord(f.project, { ...f.job, id: "task-2" }, record), { code: "tts-generation-invalid" });
  assert.throws(() => validateTtsGenerationRecord(f.project, { ...f.job, attempts: 2 }, record), { code: "tts-generation-invalid" });
});

test("changed input, audio bytes, or returned timestamp invalidates generation evidence", t => {
  const f = fixture(t); const record = f.save();
  assert.throws(() => validateTtsGenerationRecord(f.project, f.job, { ...record, completedAt: "2099-01-01T00:00:00.000Z" }), { code: "tts-generation-invalid" });
  f.write(`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`, "replaced audio");
  assert.throws(() => validateTtsGenerationRecord(f.project, f.job, record), { code: "tts-generation-invalid" });
  const next = f.save();
  f.write(`videos/${f.slug}/tts-script.json`, "changed input");
  assert.throws(() => validateTtsGenerationRecord(f.project, f.job, next), { code: "tts-generation-invalid" });
});

test("missing or empty media cannot create a successful generation record", t => {
  const f = fixture(t);
  f.write(`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`, "");
  assert.throws(() => f.save(), { code: "tts-generation-invalid" });
  assert.equal(fs.existsSync(path.join(f.root, "local/tts-generation")), false);
});
