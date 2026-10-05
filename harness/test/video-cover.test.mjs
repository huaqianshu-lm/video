import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readVideoCover, videoCoverAssetIssues} from '../src/video-cover.mjs';

test('TTS minimal project resolves the canonical cover path without sourceDirectory', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'video-cover-path-'));
  const slug = 'cover-path-fixture';
  const directory = path.join(workspaceRoot, 'videos', slug);
  fs.mkdirSync(directory, {recursive: true});
  const record = {schemaVersion: 1, slug, mode: 'none'};
  fs.writeFileSync(path.join(directory, 'cover.json'), JSON.stringify(record));
  const project = {config: {slug, workspaceRoot}};
  try {
    assert.deepEqual(readVideoCover(project), record);
    assert.deepEqual(videoCoverAssetIssues(project), []);
    fs.writeFileSync(path.join(directory, 'cover.json'), '{invalid');
    assert.equal(videoCoverAssetIssues(project).length, 1);
  } finally {
    fs.rmSync(workspaceRoot, {recursive: true, force: true});
  }
});

test('minimal legacy project without a cover remains compatible, required choice blocks', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'video-cover-legacy-'));
  const project = {config: {slug: 'legacy-cover-fixture', workspaceRoot}};
  try {
    assert.equal(readVideoCover(project), null);
    assert.deepEqual(videoCoverAssetIssues(project), []);
    project.config.seriesSelectionRequired = true;
    assert.match(videoCoverAssetIssues(project)[0], /尚未选择系列/);
  } finally {
    fs.rmSync(workspaceRoot, {recursive: true, force: true});
  }
});
