import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {writeJson, readJson} from '../src/storage.mjs';

test('a reader sees the complete old JSON until the new JSON is atomically published', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-atomic-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const file = path.join(root, 'state.json'), old = {status: 'running'}, next = {status: 'succeeded', data: 'x'.repeat(10000)};
  writeJson(file, old);
  const rename = fs.renameSync;
  let observed = false;
  fs.renameSync = (source, target) => {
    if (target === file) {assert.deepEqual(readJson(file), old); assert.deepEqual(readJson(source), next); observed = true;}
    return rename(source, target);
  };
  try {writeJson(file, next);} finally {fs.renameSync = rename;}
  assert.equal(observed, true); assert.deepEqual(readJson(file), next);
});

test('a failed JSON publication preserves the prior state and cleans its own temporary file', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-atomic-failure-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const file = path.join(root, 'state.json'), old = {status: 'running'};
  writeJson(file, old);
  const rename = fs.renameSync;
  fs.renameSync = (source, target) => {if (target === file) throw Object.assign(new Error('injected publication failure'), {code: 'EIO'}); return rename(source, target);};
  try {assert.throws(() => writeJson(file, {status: 'failed'}), {code: 'EIO'});} finally {fs.renameSync = rename;}
  assert.deepEqual(readJson(file), old); assert.deepEqual(fs.readdirSync(root), ['state.json']);
});
