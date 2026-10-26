import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { saveTtsGenerationRecord, ttsScriptFingerprint, validateTtsGenerationRecord, saveTtsReuseRecord, validateTtsReuseRecord } from "../src/tts-generation.mjs";

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

test("Bailian evidence is bound to its current provider configuration", t => {
  const f = fixture(t);
  f.project.config.tts = { provider: "bailian", model: "qwen3-tts-flash", voice: "Cherry", region: "cn-beijing", languageType: "Chinese", timingProvider: "qwen-audio-3.1-asr-flash", audioSpeed: 1 };
  const record = saveTtsGenerationRecord({ root: f.root, slug: f.slug, task: f.task, inputFingerprint: ttsScriptFingerprint(f.root, f.slug), startedAt: f.task.startedAt, cacheDirectory: "cache/task-1", tts: f.project.config.tts });
  assert.equal(validateTtsGenerationRecord(f.project, f.job, record), true);
  f.project.config.tts = { ...f.project.config.tts, voice: "Serena" };
  assert.throws(() => validateTtsGenerationRecord(f.project, f.job, record), { code: "tts-generation-invalid" });
});

function reuseFixture(t) {
  const f = fixture(t);
  f.project.state = { stages: { 'gate-2': { status: 'succeeded', review: { decision: 'approved', reviewVersion: 'frozen-board' } } } };
  const source = saveTtsGenerationRecord({root: f.root, slug: f.slug, task: f.task, inputFingerprint: ttsScriptFingerprint(f.root, f.slug), startedAt: f.task.startedAt, cacheDirectory: 'cache/task-1', tts: {provider: 'edge', voice: 'zh-CN-XiaoxiaoNeural', rate: '+25%', audioSpeed: 1, timingProvider: 'edge-word-boundaries'}});
  const sourceJob = { ...f.job, status: 'succeeded', stage: 'subtitle-timeline' };
  const job = { ...f.job, id: 'task-2', inputFingerprint: 'new-input', status: 'running', stage: 'subtitle-timeline' };
  const save = () => saveTtsReuseRecord({ project: f.project, job, sourceJob, authorization: '用户授权本视频复用' });
  return { ...f, source, sourceJob, job, save };
}

test('explicit reuse preserves source record and creates distinct current-task evidence', t => {
  const f = reuseFixture(t), before = fs.readFileSync(path.join(f.root, f.source.path));
  const receipt = f.save();
  assert.equal(validateTtsReuseRecord(f.project, f.job, receipt, f.sourceJob), true);
  assert.match(receipt.path, /tts-reuse/);
  assert.equal(receipt.sourceTaskId, 'task-1');
  assert.deepEqual(fs.readFileSync(path.join(f.root, f.source.path)), before);
  assert.equal(fs.existsSync(path.join(f.root, 'local/tts-generation', f.slug, 'task-2-1.json')), false);
  assert.throws(() => validateTtsReuseRecord(f.project, { ...f.job, attempts: 2 }, receipt, f.sourceJob));
  f.project.state.stages['gate-2'].review.reviewVersion = 'other-board';
  assert.throws(() => validateTtsReuseRecord(f.project, f.job, receipt, f.sourceJob));
});

test('reuse rejects missing authorization, unsuccessful or foreign source, and changed configuration', t => {
  const f = reuseFixture(t);
  for (const authorization of [undefined, '', '  ']) assert.throws(() => saveTtsReuseRecord({ project: f.project, job: f.job, sourceJob: f.sourceJob, authorization }));
  for (const sourceJob of [{ ...f.sourceJob, status: 'failed' }, { ...f.sourceJob, slug: 'other' }, f.job]) assert.throws(() => saveTtsReuseRecord({ project: f.project, job: f.job, sourceJob, authorization: '允许复用' }));
  f.project.config.tts = { provider: 'bailian', voice: 'Cherry' };
  assert.throws(() => f.save());
});

test('reuse rejects changed audio, changed script and tampered source record', t => {
  const f = reuseFixture(t), receipt = f.save();
  f.write(`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`, 'different audio');
  assert.throws(() => validateTtsReuseRecord(f.project, f.job, receipt, f.sourceJob));
  f.write(`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`, 'audio bytes');
  const script = fs.readFileSync(path.join(f.root, `videos/${f.slug}/tts-script.json`));
  f.write(`videos/${f.slug}/tts-script.json`, 'different script');
  assert.throws(() => f.save());
  f.write(`videos/${f.slug}/tts-script.json`, script);
  fs.appendFileSync(path.join(f.root, f.source.path), '\n');
  assert.throws(() => validateTtsReuseRecord(f.project, f.job, receipt, f.sourceJob));
});
