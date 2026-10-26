import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {localRenderCapabilityFiles} from '../src/local-render.mjs';

const repository = path.resolve(new URL('../..', import.meta.url).pathname);

test('local render snapshot carries the Storyboard schemas needed to load its Harness worker', t => {
  const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'local-render-contract-snapshot-'));
  t.after(() => fs.rmSync(snapshot, {recursive: true, force: true}));

  const requiredContracts = [
    'contracts/video-production/legacy/storyboard-v1.schema.json',
    'contracts/video-production/legacy/storyboard-v2.schema.json',
    'contracts/video-production/legacy/storyboard-design-audit-v1.schema.json',
    'contracts/video-production/current/storyboard.schema.json',
    'contracts/video-production/current/storyboard-design-audit.schema.json',
  ];
  const capabilityFiles = localRenderCapabilityFiles(repository);
  for (const relative of requiredContracts) assert.ok(capabilityFiles.includes(relative), `snapshot file list omitted ${relative}`);

  for (const relative of capabilityFiles.filter(file =>
    file === 'package.json' || file.startsWith('harness/src/') || file.startsWith('contracts/video-production/') || file.startsWith('styles/'))
  ) {
    const destination = path.join(snapshot, relative);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(path.join(repository, relative), destination);
  }
  fs.symlinkSync(path.join(repository, 'node_modules'), path.join(snapshot, 'node_modules'), 'dir');

  const entry = path.join(snapshot, 'harness/src/storyboard.mjs');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(entry)})`], {
    cwd: snapshot,
    encoding: 'utf8',
    timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
