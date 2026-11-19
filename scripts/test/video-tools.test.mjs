import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {ROOT, assertMutable, fileHash, files, inside, read, write} from '../lib/files.mjs';
import {validateMedia} from '../lib/media.mjs';
import {prepareInput, validateInput, zipInspect, installInput, entryFor, discoverInput, payloadFingerprint} from '../lib/input.mjs';
import {readWordTiming} from '../lib/word-timing.mjs';
import {buildScript, generateTts} from '../video-tts.mjs';
import {previewCatalog} from '../video-preview.mjs';
import {selectSeries} from '../video-series.mjs';
import {inspectRender, renderVideo} from '../video-render.mjs';
import {bindInput, dispatchInput, remoteStatus} from '../video-github.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-video-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const id = 'sample';
  const script = {schemaVersion: '1.0', videoId: id, scenes: [{sceneId: '01', segments: [{id: '01-01', text: '制作视频。'}]}]};
  write(path.join(root, 'videos/sample/narration-script.md'), '## Scene 01｜测试\n\n制作视频。\n');
  script.source = {narrationFingerprint: fileHash(path.join(root, 'videos/sample/narration-script.md'))};
  write(path.join(root, 'videos/sample/tts-script.json'), script);
  const generated = path.join(root, 'videos/sample/generated');
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
  write(path.join(root, 'videos/sample/src/SampleVideo.tsx'), 'export const SampleVideo = () => <div>制作视频</div>;\n');
  write(path.join(root, 'videos/sample/src/video.config.ts'), 'import type {VideoConfig} from "../../../src/lib/videoTypes";\nimport timeline from "../generated/timeline-manifest.json";\nexport const videoConfig: VideoConfig = {slug:"sample",title:String(timeline.duration),format:"horizontal",width:1920,height:1080,fps:30,scenes:[]};\n');
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
test('independent input packs, validates and installs in an isolated workspace; file tampering blocks consumption', async t => {
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
    execFileSync(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--resolveJsonModule', '--esModuleInterop', '--jsx', 'react-jsx', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'ES2020', path.join(workspace, 'src/RenderInputRoot.tsx')], {cwd: workspace, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (error) {throw new Error(error.stdout?.toString() || error.message);}
  const require = createRequire(path.join(ROOT, 'package.json'));
  const {bundle} = require('@remotion/bundler');
  const built = await bundle({entryPoint: path.join(workspace, 'src/RenderInputRoot.tsx'), outDir: path.join(workspace, 'bundle'), publicDir: path.join(workspace, 'public')});
  assert.ok(fs.existsSync(path.join(built, 'index.html')));
  fs.appendFileSync(path.join(input.directory, 'videos/sample/src/SampleVideo.tsx'), '// changed');
  assert.throws(() => validateInput(input.directory), /损坏/);
});
test('Studio uses prepared snapshots and never writes video sources or historical state', t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  const originals = files(path.join(f.root, 'videos/sample/src')).map(p => [p, fileHash(path.join(f.root, 'videos/sample/src', p))]);
  const catalog = previewCatalog(f.root, [f.id], {processes: () => ''});
  const source = fs.readFileSync(catalog.output, 'utf8');
  assert.match(source, /videos\/sample\/render-input\/direct-/);
  assert.ok(fs.existsSync(path.join(catalog.publicDir, 'local-assets/sample/audio/scene-01/01-01.wav')));
  assert.deepEqual(files(path.join(f.root, 'videos/sample/src')).map(p => [p, fileHash(path.join(f.root, 'videos/sample/src', p))]), originals);
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
  const frozenNote = fileHash(note), pointer = path.join(f.root, 'videos/sample/render-input/direct-current.json');
  const frozenPointer = fileHash(pointer);
  const catalog = previewCatalog(f.root, [f.id], {processes: () => ''});
  t.after(() => fs.rmSync(path.dirname(catalog.publicDir), {recursive: true, force: true}));
  assert.equal(path.relative(f.root, catalog.publicDir).startsWith('..'), true);
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
  assert.equal(files(path.join(f.root, 'videos/sample/work/tts')).filter(p => p.endsWith('result.json')).length, 1);
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
  const record = read(path.join(f.root, `videos/sample/output/github/${bound.sha256}/dispatch.json`));
  assert.equal(record.dispatch, 'uncertain'); assert.ok(record.dispatchId);
  await assert.rejects(dispatchInput(f.root, bound.file, options, deps), /禁止重复派发/);
  assert.equal(calls, 1);
});

test('repeated packs exclude all output trees; failed preparation retains the valid pointer and immutable snapshot', t => {
  const f = fixture(t);
  for (const dir of ['render-input', 'output', 'preview', 'work']) write(path.join(f.root, `videos/sample/${dir}/sentinel.txt`), 'exclude');
  const first = prepareInput(f.root, f.id), pointer = path.join(f.root, 'videos/sample/render-input/direct-current.json');
  const frozen = fileHash(path.join(first.directory, 'render-input.json'));
  const second = prepareInput(f.root, f.id);
  assert.notEqual(first.directory, second.directory);
  for (const p of validateInput(second.directory).files) assert.doesNotMatch(p.path, /^videos\/sample\/(render-input|output|preview|work)\//);
  assert.equal(fileHash(path.join(first.directory, 'render-input.json')), frozen);
  const current = fileHash(pointer);
  write(path.join(f.root, 'videos/sample/assets/audio/collision.txt'), 'bad');
  assert.throws(() => prepareInput(f.root, f.id), /冲突/);
  assert.equal(fileHash(pointer), current);
  assert.equal(fileHash(path.join(first.directory, 'render-input.json')), frozen);
  for (const dir of ['local', 'out', 'public', 'src/videos']) assert.equal(fs.existsSync(path.join(f.root, dir)), false);
});

test('missing concentrated inputs never fall back; format, payload and cross-video entries are rejected', t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  write(path.join(f.root, 'src/videos/other/OtherVideo.tsx'), 'export const OtherVideo = () => null;');
  write(path.join(f.root, 'local/render-input/other/render-input.json'), {entry: {componentPath: 'src/videos/other/OtherVideo.tsx'}});
  assert.throws(() => entryFor(f.root, 'other'), /组件缺失/);
  assert.throws(() => discoverInput(f.root, 'other'), /缺少当前/);
  const file = path.join(input.directory, 'render-input.json'), manifest = read(file);
  write(file, {...manifest, schemaVersion: 1});
  assert.throws(() => validateInput(input.directory, {legacyPreview: true}), /不再支持旧输入包/);
  write(file, {...manifest, payload: {...manifest.payload, remotionDirectory: 'src/videos/sample'}});
  assert.throws(() => validateInput(input.directory), /路径不属于/);
  write(file, {...manifest, entry: {...manifest.entry, componentPath: 'videos/other/src/OtherVideo.tsx'}});
  assert.throws(() => validateInput(input.directory), /不属于视频/);
  write(file, manifest);
  write(path.join(f.root, 'videos/sample/src/added.ts'), 'export const added = true;');
  assert.throws(() => discoverInput(f.root, f.id), /清单不一致/);
});

test('install protects source, other videos, completed workspaces and nonempty tasks', t => {
  const f = fixture(t), input = prepareInput(f.root, f.id);
  for (const relative of ['videos/sample/src', 'videos/other/output/task/workspace', 'local/direct-render/task']) {
    assert.throws(() => installInput(input.directory, path.join(f.root, relative), {root: f.root}), /只能是本视频/);
  }
  const workspace = path.join(f.root, 'videos/sample/output/task/workspace');
  installInput(input.directory, workspace, {root: f.root});
  assert.throws(() => installInput(input.directory, workspace, {root: f.root}), /空目录/);
  write(path.join(f.root, 'videos/sample/production-record.md'), '状态：completed\n');
  assert.throws(() => installInput(input.directory, path.join(f.root, 'videos/sample/output/another/workspace'), {root: f.root}), /永久只读/);
});

test('preview protects an active Studio and requires one video; completed preview leaves the entire video frozen', t => {
  const f = fixture(t); prepareInput(f.root, f.id);
  write(path.join(f.root, 'src/RenderInputRoot.tsx'), 'active preview');
  const before = files(f.root).map(p => [p, fileHash(path.join(f.root, p))]);
  assert.throws(() => previewCatalog(f.root, [f.id], {processes: () => `123 node remotion studio ${f.root}/src/RenderInputRoot.tsx`}), /停止覆盖/);
  assert.deepEqual(files(f.root).map(p => [p, fileHash(path.join(f.root, p))]), before);
  assert.throws(() => previewCatalog(f.root, [f.id, 'other'], {processes: () => ''}), /单条视频/);
  write(path.join(f.root, 'videos/sample/production-record.md'), '状态：completed\n');
  const frozen = files(path.join(f.root, 'videos/sample')).map(p => [p, fileHash(path.join(f.root, 'videos/sample', p))]);
  const result = previewCatalog(f.root, [f.id], {processes: () => ''});
  t.after(() => fs.rmSync(path.dirname(result.publicDir), {recursive: true, force: true}));
  assert.deepEqual(files(path.join(f.root, 'videos/sample')).map(p => [p, fileHash(path.join(f.root, 'videos/sample', p))]), frozen);
});

test('cover disk source, playback copy and ZIP share bytes; a forged cover SHA is rejected', t => {
  const f = fixture(t), image = path.join(f.root, 'public/series-assets/course/cover.png');
  // Generate a small valid PNG fixture using only Python's standard library.
  fs.mkdirSync(path.dirname(image), {recursive: true});
  execFileSync('python3', ['-c', 'import struct,zlib,sys\ndef chunk(t,b):return struct.pack(">I",len(b))+t+b+struct.pack(">I",zlib.crc32(t+b))\nopen(sys.argv[1],"wb").write(b"\\x89PNG\\r\\n\\x1a\\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",16,9,8,2,0,0,0))+chunk(b"IDAT",zlib.compress((b"\\0"+b"\\x20\\x40\\x60"*16)*9))+chunk(b"IEND",b""))', image]);
  write(path.join(f.root, 'series/course/series.json'), {title: '教程', style: 'test', cover: 'series-assets/course/cover.png'});
  const cover = selectSeries(f.root, f.id, 'course');
  assert.ok(cover.sourcePath.startsWith('videos/sample/assets/cover/'));
  assert.equal(fileHash(path.join(f.root, cover.sourcePath)), cover.sha256);
  assert.equal(fs.existsSync(path.join(f.root, 'public/local-assets')), false);
  const input = prepareInput(f.root, f.id), file = path.join(input.directory, 'render-input.json'), manifest = read(file);
  assert.equal(fileHash(path.join(input.directory, `public/${cover.src}`)), cover.sha256);
  write(file, {...manifest, entry: {...manifest.entry, cover: {...cover, sha256: '0'.repeat(64)}}});
  assert.throws(() => validateInput(input.directory), /封面图片/);
});

test('TTS build, cache and word bindings stay in the video; provider defaults ignore historical task config', t => {
  const f = fixture(t), env = {VIDEO_TTS_PYTHON: '/configured/python', VIDEO_TTS_SCRIPTS_DIR: '/configured/scripts'};
  buildScript(f.root, f.id, {env, run(binary, args) {
    const temporary = args[args.indexOf('--project-dir') + 1];
    assert.ok(temporary.startsWith(path.join(f.root, 'videos/sample/work/tts/script-')));
    write(args[args.indexOf('--output') + 1], f.script);
  }});
  write(path.join(f.root, 'harness/projects/sample/project.json'), {tts: {provider: 'bailian', voice: 'historical'}});
  const result = generateTts(f.root, f.id, {env, run(binary, args) {
    if (args[0].endsWith('generate_audio.py')) {
      const cache = args[args.indexOf('--project-dir') + 1], assets = path.join(cache, 'video-assets');
      for (const name of ['audio', 'subtitles', 'audio-manifest.json', 'subtitle-manifest.json', 'timeline-manifest.json']) fs.cpSync(path.join(f.generated, name), path.join(assets, name), {recursive: true});
      write(path.join(assets, 'timing/scene-01/01-01.json'), {wordBoundaries: [{text: '制作视频', start: 0, duration: 0.4}]});
    }
  }});
  assert.equal(result.provider.provider, 'edge');
  assert.match(result.cacheDirectory, /^videos\/sample\/work\/tts\//);
  const proof = readWordTiming(f.root, f.id);
  assert.equal(proof.segments.length, 1);
  assert.ok(proof.bindings.every(b => b.path.startsWith('videos/sample/')));
  fs.appendFileSync(path.join(f.generated, 'audio/scene-01/01-01.wav'), 'change');
  assert.throws(() => readWordTiming(f.root, f.id), /过期/);
  assert.equal(fs.existsSync(path.join(f.root, 'src/videos')), false);
});

test('render inspection reads only the original task and rejects changed results; completed render cannot start', async t => {
  const f = fixture(t), input = prepareInput(f.root, f.id), task = path.join(f.root, 'videos/sample/output/task');
  const output = path.join(task, 'sample.mp4');
  write(output, 'test result bytes');
  write(path.join(task, 'run.json'), {videoSlug: f.id, pid: process.pid, output});
  write(path.join(task, 'result.json'), {ok: true, path: output, sha256: fileHash(output)});
  const before = files(f.root).map(p => [p, fileHash(path.join(f.root, p))]);
  assert.equal(inspectRender(f.root, task).result.ok, true);
  assert.deepEqual(files(f.root).map(p => [p, fileHash(path.join(f.root, p))]), before);
  fs.appendFileSync(output, 'changed');
  assert.throws(() => inspectRender(f.root, task), /丢失或已改变/);
  write(path.join(f.root, 'videos/sample/production-record.md'), '状态：completed\n');
  await assert.rejects(renderVideo(f.root, input.directory), /永久只读/);
});

test('media semantics and playback bytes remain checked even when package file hashes are recomputed', t => {
  const f = fixture(t), input = prepareInput(f.root, f.id), file = path.join(input.directory, 'render-input.json');
  const manifest = read(file);
  const refresh = () => {
    const list = files(input.directory).filter(p => p !== 'render-input.json');
    manifest.files = list.map(p => ({path: p, size: fs.statSync(path.join(input.directory, p)).size, sha256: fileHash(path.join(input.directory, p))}));
    manifest.packageFingerprint = payloadFingerprint(input.directory, list);
    write(file, manifest);
  };
  const publicAudio = path.join(input.directory, 'public/local-assets/sample/audio/scene-01/01-01.wav');
  const original = fs.readFileSync(publicAudio);
  fs.appendFileSync(publicAudio, 'changed'); refresh();
  assert.throws(() => validateInput(input.directory), /播放素材/);
  fs.writeFileSync(publicAudio, original);
  const audioPath = path.join(input.directory, 'videos/sample/generated/audio-manifest.json'), audio = read(audioPath);
  audio.scenes[0].segments[0].text = 'changed speech'; write(audioPath, audio); refresh();
  assert.throws(() => validateInput(input.directory), /音频原文不一致/);
});

test('TypeScript includes video source and excludes snapshot, preview, work and output copies', t => {
  const f = fixture(t);
  fs.copyFileSync(path.join(ROOT, 'tsconfig.json'), path.join(f.root, 'tsconfig.json'));
  for (const dir of ['render-input', 'output', 'preview', 'work']) write(path.join(f.root, `videos/sample/${dir}/copied.ts`), 'const bad: string = 1;');
  const config = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--showConfig'], {cwd: f.root, encoding: 'utf8'}));
  assert.ok(config.files.some(p => p.endsWith('/videos/sample/src/SampleVideo.tsx')));
  assert.ok(!config.files.some(p => /videos\/sample\/(render-input|output|preview|work)\//.test(p)));
});
