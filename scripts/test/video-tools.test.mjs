import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, assertMutable, fileHash, files, inside, read, write} from '../lib/files.mjs';
import {validateMedia} from '../lib/media.mjs';
import {prepareInput, validateInput, zipInspect, installInput} from '../lib/input.mjs';
import {generateTts} from '../video-tts.mjs';
import {previewCatalog} from '../video-preview.mjs';
import {selectSeries} from '../video-series.mjs';
import {bindInput, dispatchInput, remoteStatus} from '../video-github.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-video-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const id = 'sample';
  const script = {schemaVersion: '1.0', videoId: id, scenes: [{sceneId: '01', segments: [{id: '01-01', text: '制作视频。'}]}]};
  write(path.join(root, 'videos/sample/narration-script.md'), '## Scene 01｜测试\n\n制作视频。\n');
  script.source = {narrationFingerprint: fileHash(path.join(root, 'videos/sample/narration-script.md'))};
  write(path.join(root, 'videos/sample/tts-script.json'), script);
  const generated = path.join(root, 'src/videos/sample/generated');
  const audio = path.join(generated, 'audio/scene-01/01-01.wav');
  fs.mkdirSync(path.dirname(audio), {recursive: true});
  // A real 0.4 s PCM WAV; no external TTS or video rendering.
  const buffer = Buffer.alloc(44 + 12800);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(16000, 24); buffer.writeUInt32LE(32000, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(12800, 40); fs.writeFileSync(audio, buffer);
  write(path.join(generated, 'audio-manifest.json'), {videoId: id, scenes: [{sceneId: '01', narrationDuration: 0.4, segments: [{id: '01-01', text: '制作视频。', file: 'audio/scene-01/01-01.wav', duration: 0.4}]}]});
  const segment = {segmentId: '01-01', audioFile: 'audio/scene-01/01-01.wav', cues: [{id: 'cue-1', start: 0, end: 0.4, text: '制作视频'}]};
  write(path.join(generated, 'subtitle-manifest.json'), {videoId: id, scenes: [{sceneId: '01', file: 'subtitles/scene-01.json', segments: [segment]}]});
  write(path.join(generated, 'subtitles/scene-01.json'), {videoId: id, sceneId: '01', segments: [segment]});
  write(path.join(generated, 'subtitles/captions.vtt'), 'WEBVTT\n\n00:00:00.000 --> 00:00:00.400\n制作视频\n');
  write(path.join(generated, 'subtitles/captions.srt'), '1\n00:00:00,000 --> 00:00:00,400\n制作视频\n');
  write(path.join(generated, 'timeline-manifest.json'), {videoId: id, duration: 0.4, scenes: [{sceneId: '01', offset: 0, narrationDuration: 0.4, buffer: 0, duration: 0.4, end: 0.4, segments: [{segmentId: '01-01', offset: 0, duration: 0.4, end: 0.4, audioFile: 'audio/scene-01/01-01.wav'}]}]});
  write(path.join(root, 'src/videos/sample/SampleVideo.tsx'), 'export const SampleVideo = () => <div>制作视频</div>;\n');
  write(path.join(root, 'src/videos/sample/video.config.ts'), 'export const videoConfig = {slug:"sample",title:"制作视频",format:"horizontal" as const,width:1920,height:1080,fps:30,scenes:[]};\n');
  for (const dir of ['src/lib', 'src/components', 'src/scenes', 'styles']) fs.cpSync(path.join(ROOT, dir), path.join(root, dir), {recursive: true});
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(root, 'package.json'));
  return {root, id, script, generated};
}
test('real audio, subtitles and Timeline agree; out-of-bounds cues and changed speech are rejected', t => {
  const f = fixture(t);
  assert.equal(validateMedia(f.generated, f.script).duration, 0.4);
  const sub = read(path.join(f.generated, 'subtitle-manifest.json'));
  sub.scenes[0].segments[0].cues[0].end = 2;
  write(path.join(f.generated, 'subtitle-manifest.json'), sub);
  write(path.join(f.generated, 'subtitles/scene-01.json'), {segments: sub.scenes[0].segments});
  assert.throws(() => validateMedia(f.generated, f.script), /字幕/);
  sub.scenes[0].segments[0].cues[0].end = 0.4;
  sub.scenes[0].segments[0].cues[0].text = '其他内容';
  write(path.join(f.generated, 'subtitle-manifest.json'), sub);
  write(path.join(f.generated, 'subtitles/scene-01.json'), {segments: sub.scenes[0].segments});
  assert.throws(() => validateMedia(f.generated, f.script), /文本覆盖/);
});
test('independent input packs, validates and installs in an isolated workspace; file tampering blocks consumption', t => {
  const f = fixture(t), before = fileHash(path.join(f.root, 'videos/sample/tts-script.json'));
  const input = prepareInput(f.root, f.id);
  const m = validateInput(input.directory);
  assert.equal(m.videoSlug, f.id);
  assert.equal(m.entry.componentExport, 'SampleVideo');
  assert.equal(fileHash(path.join(f.root, 'videos/sample/tts-script.json')), before);
  const workspace = path.join(f.root, 'scratch');
  const installed = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, 'scripts/video-input.mjs'), 'install', input.directory, '--workspace', workspace], {encoding: 'utf8'}));
  assert.equal(installed.videoSlug, f.id);
  assert.ok(fs.existsSync(path.join(workspace, 'public/local-assets/sample/audio/scene-01/01-01.wav')));
  assert.throws(() => installInput(input.directory, workspace), /空目录/);
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(workspace, 'node_modules'), 'dir');
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--esModuleInterop', '--jsx', 'react-jsx', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'ES2020', path.join(workspace, 'src/RenderInputRoot.tsx')], {cwd: workspace, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (error) {throw new Error(error.stdout?.toString() || error.message);}
  fs.appendFileSync(path.join(input.directory, 'src/videos/sample/SampleVideo.tsx'), '// changed');
  assert.throws(() => validateInput(input.directory), /损坏/);
});
test('Studio uses prepared snapshots and never writes video sources or historical state', t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  const originals = files(path.join(f.root, 'src/videos/sample')).map(p => [p, fileHash(path.join(f.root, 'src/videos/sample', p))]);
  const catalog = previewCatalog(f.root, [f.id]);
  const source = fs.readFileSync(catalog.output, 'utf8');
  assert.match(source, /local\/render-input\/sample\/direct-/);
  assert.ok(fs.existsSync(path.join(catalog.publicDir, 'local-assets/sample/audio/scene-01/01-01.wav')));
  assert.deepEqual(files(path.join(f.root, 'src/videos/sample')).map(p => [p, fileHash(path.join(f.root, 'src/videos/sample', p))]), originals);
  assert.equal(validateInput(input.directory).packageFingerprint, input.packageFingerprint);
});
test('completed protection rejects pack, TTS and cover writes without changing historical records', t => {
  const f = fixture(t);
  write(path.join(f.root, 'harness/projects/sample/state.json'), {currentStage: 'completed'});
  const before = fileHash(path.join(f.root, 'harness/projects/sample/state.json'));
  assert.throws(() => prepareInput(f.root, f.id), /永久只读/);
  assert.throws(() => generateTts(f.root, f.id), /永久只读/);
  assert.throws(() => selectSeries(f.root, f.id, 'none'), /永久只读/);
  assert.equal(fileHash(path.join(f.root, 'harness/projects/sample/state.json')), before);
  fs.writeFileSync(path.join(f.root, 'harness/projects/sample/state.json'), '{broken');
  assert.throws(() => assertMutable(f.root, f.id));
});
test('completion keeps the final direct snapshot available for read-only preview without repacking', t => {
  const f = fixture(t);
  const note = path.join(f.root, 'videos/sample/production-record.md');
  write(note, '状态：制作中\n');
  const input = prepareInput(f.root, f.id);
  write(note, '状态：completed\n用户确认成片\n');
  const frozenNote = fileHash(note), pointer = path.join(f.root, 'local/render-input/sample/direct-current.json');
  const frozenPointer = fileHash(pointer);
  const catalog = previewCatalog(f.root, [f.id]);
  assert.deepEqual(catalog.compositions, ['sample']);
  assert.equal(fileHash(note), frozenNote);
  assert.equal(fileHash(pointer), frozenPointer);
  assert.equal(validateInput(input.directory).packageFingerprint, input.packageFingerprint);
  assert.throws(() => prepareInput(f.root, f.id), /永久只读/);
});
test('new completed record and symlink/traversal paths block writes', t => {
  const f = fixture(t);
  write(path.join(f.root, 'videos/sample/production-record.md'), '状态：completed\n');
  assert.throws(() => assertMutable(f.root, f.id), /永久只读/);
  assert.throws(() => inside(f.root, '../elsewhere'), /不安全/);
  fs.symlinkSync(os.tmpdir(), path.join(f.root, 'link'));
  assert.throws(() => inside(f.root, 'link/file'), /符号链接/);
});
test('unsafe ZIP entries are rejected before extraction', t => {
  const f = fixture(t), zip = path.join(f.root, 'bad.zip');
  execFileSync('python3', ['-c', 'import zipfile,sys\nwith zipfile.ZipFile(sys.argv[1],"w") as z:z.writestr("../escape","bad")', zip]);
  assert.throws(() => zipInspect(zip, path.join(f.root, 'extract')));
  assert.equal(fs.existsSync(path.join(f.root, 'escape')), false);
});
test('TTS uses explicit +25%, resumes its matching cache, and failed runs do not publish outputs or success', t => {
  const f = fixture(t), calls = [], env = {...process.env, VIDEO_TTS_PYTHON: '/configured/python', VIDEO_TTS_SCRIPTS_DIR: '/configured/scripts'};
  const run = (python, args) => {
    calls.push(args);
    if (args[0].endsWith('generate_audio.py')) {
      const cache = args[args.indexOf('--project-dir') + 1];
      for (const name of ['audio', 'subtitles', 'audio-manifest.json', 'subtitle-manifest.json', 'timeline-manifest.json']) fs.cpSync(path.join(f.generated, name), path.join(cache, 'video-assets', name), {recursive: true});
    }
  };
  const first = generateTts(f.root, f.id, {env, run});
  assert.equal(first.cachedAudioFilesBefore, 0);
  assert.equal(calls[0][calls[0].indexOf('--rate') + 1], '+25%');
  const second = generateTts(f.root, f.id, {env, run});
  assert.equal(second.cachedAudioFilesBefore, 1);
  assert.equal(second.cacheDirectory, first.cacheDirectory);
  const before = fileHash(path.join(f.generated, 'timeline-manifest.json'));
  assert.throws(() => generateTts(f.root, f.id, {tts: {provider: 'edge', voice: 'another-voice'}, env, run() {throw new Error('network failure');}}), /network failure/);
  assert.equal(fileHash(path.join(f.generated, 'timeline-manifest.json')), before);
  assert.equal(files(path.join(f.root, 'local/tts/sample')).filter(p => p.endsWith('result.json')).length, 1);
});
test('GitHub bind rejects a mismatched asset; dispatch confirmation blocks before API; status only queries original Run', async t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  const url = 'https://api.github.com/repos/owner/input/releases/assets/1';
  assert.throws(() => bindInput(f.root, input.directory, input.archive, url, {api: () => Buffer.from('different')}), /不一致/);
  const bound = bindInput(f.root, input.directory, input.archive, url, {api: () => fs.readFileSync(input.archive)});
  let called = false;
  await assert.rejects(dispatchInput(f.root, bound.file, {confirm: 'wrong'}, {preflight() {called = true;}}), /确认/);
  assert.equal(called, false);
  const queries = [];
  const result = remoteStatus('owner/code', 42, {api(args) {queries.push(args[1]); return JSON.stringify(args[1].endsWith('artifacts') ? {artifacts: []} : {id: 42, status: 'completed', conclusion: 'success', head_sha: 'abc', html_url: 'run'});}});
  assert.equal(result.runId, 42); assert.deepEqual(queries, ['/repos/owner/code/actions/runs/42', '/repos/owner/code/actions/runs/42/artifacts']);
});
test('dispatch interruption preserves intent and rejects a second dispatch instead of duplicating a render', async t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  const bound = bindInput(f.root, input.directory, input.archive, 'https://api.github.com/repos/owner/input/releases/assets/1', {api: () => fs.readFileSync(input.archive)});
  const options = {confirm: bound.sha256, repository: 'owner/code', 'input-repository': 'owner/input', 'baseline-run': '1'};
  let calls = 0;
  const deps = {api() {calls++; throw new Error('interrupted');}, preflight: async () => ({ok: true, baseline: {remoteCommit: 'commit'}}),
    gitRun(binary, args) {return args.includes('status') ? '' : args.includes('rev-parse') ? 'commit\n' : '';}};
  await assert.rejects(dispatchInput(f.root, bound.file, options, deps), /派发结果未确认/);
  const record = read(path.join(f.root, `local/github-render/sample/${bound.sha256}/dispatch.json`));
  assert.equal(record.dispatch, 'uncertain'); assert.ok(record.dispatchId);
  await assert.rejects(dispatchInput(f.root, bound.file, options, deps), /禁止重复派发/);
  assert.equal(calls, 1);
});
