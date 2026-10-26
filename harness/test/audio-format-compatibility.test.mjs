import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {assetSourceIssues, packageVideoAssets, archiveEntries} from '../src/asset-bundler.mjs';
import {validateRemoteRenderInputs} from '../src/remote-executor.mjs';
import {buildStoryboardImplementationReview} from '../src/storyboard-implementation.mjs';
import {STORYBOARD_SHARED_REFERENCES} from '../src/storyboard-design.mjs';

function fixture(extension) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'video-audio-format-'));
  const slug = 'audio-format-video';
  const directory = `src/videos/${slug}`;
  const audioFile = `audio/scene-01/01-01.${extension}`;
  const bytes = Buffer.from('audio format fixture');
  const write = (file, contents) => {
    const target = path.join(workspaceRoot, file);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, contents);
  };
  write(`public/local-assets/${slug}/${audioFile}`, bytes);
  write(`public/local-assets/${slug}/subtitles/captions.srt`, 'captions');
  write(`public/local-assets/${slug}/subtitles/captions.vtt`, 'WEBVTT');
  write(`${directory}/generated/${audioFile}`, bytes);
  for (const file of STORYBOARD_SHARED_REFERENCES) write(file, '// fixture');
  write(`${directory}/FormatVideo.tsx`, 'export const FormatVideo = () => null;');
  write(`${directory}/video.config.ts`, 'export const videoConfig = {};');
  for (const kind of ['audio', 'subtitle', 'timeline']) {
    write(`${directory}/generated/${kind}-manifest.json`, JSON.stringify({
      videoId: slug, scenes: [{sceneId: '01', segments: [{id: '01-01', file: audioFile}]}],
    }));
  }
  const project = {config: {slug, workspaceRoot, remotionDirectory: directory, productionContract: 'storyboard-v1', storyboardSchemaVersion: 3}};
  const timing = {fps: 30, scenes: [{sceneId: '01', startFrame: 0, endFrame: 30, segments: [{audioFile}]}]};
  const plan = {reviewVersion: 'review', storyboardFingerprint: 'board', timingFingerprint: 'timing', shots: [], events: []};
  return {workspaceRoot, slug, audioFile, bytes, project, timing, plan};
}

for (const extension of ['mp3', 'wav']) {
  test(`${extension}: package and remote preflight preserve audio and reject missing entries`, () => {
    const f = fixture(extension);
    try {
      const bundle = packageVideoAssets(f.project);
      const entries = archiveEntries(bundle.archivePath);
      assert.ok(entries.includes(`${f.slug}/${f.audioFile}`));
      assert.deepEqual(validateRemoteRenderInputs(f.project), []);
      const issues = validateRemoteRenderInputs(f.project, {
        listArchiveEntries: () => entries.filter(entry => entry !== `${f.slug}/${f.audioFile}`),
      });
      assert.ok(issues.some(issue => issue.includes(`ZIP 缺少音频 ${f.slug}/${f.audioFile}`)));
      assert.ok(issues.some(issue => issue.includes('音频数量为 0')));
    } finally {fs.rmSync(f.workspaceRoot, {recursive: true, force: true});}
  });

  test(`${extension}: authored review hashes original bytes and rejects traversal or missing audio`, () => {
    const f = fixture(extension);
    try {
      const result = buildStoryboardImplementationReview(f.project, {plan: f.plan, timing: f.timing});
      assert.deepEqual(result.alignment.audioFiles, [{path: f.audioFile, sha256: crypto.createHash('sha256').update(f.bytes).digest('hex')}]);
      f.timing.scenes[0].segments[0].audioFile = `audio/../escape.${extension}`;
      assert.throws(() => buildStoryboardImplementationReview(f.project, {plan: f.plan, timing: f.timing}), /音频路径无效/);
      f.timing.scenes[0].segments[0].audioFile = `audio/scene-01/missing.${extension}`;
      assert.throws(() => buildStoryboardImplementationReview(f.project, {plan: f.plan, timing: f.timing}), /ENOENT/);
    } finally {fs.rmSync(f.workspaceRoot, {recursive: true, force: true});}
  });
}

test('unsupported audio extensions remain blocked by all three consumers', () => {
  const f = fixture('bin');
  try {
    assert.ok(assetSourceIssues(f.project).some(issue => issue.includes('资源目录缺少 audio/')));
    // Supply an archive so the remote check reaches the manifest format check.
    fs.mkdirSync(path.join(f.workspaceRoot, 'assets'), {recursive: true});
    fs.writeFileSync(path.join(f.workspaceRoot, 'assets', `${f.slug}-assets.zip`), 'fixture');
    assert.ok(validateRemoteRenderInputs(f.project).some(issue => issue.includes('缺少有效音频 Segment')));
    assert.throws(() => buildStoryboardImplementationReview(f.project, {plan: f.plan, timing: f.timing}), /音频路径无效/);
  } finally {fs.rmSync(f.workspaceRoot, {recursive: true, force: true});}
});
