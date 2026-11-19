import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync, spawn} from 'node:child_process';
import {ROOT, cliOptions, fail, inside, isCompleted, main, slug, write} from './lib/files.mjs';
import {discoverInput, entrySource, zipInspect} from './lib/input.mjs';

export function previewCatalog(root, ids, {processes = () => execFileSync('ps', ['-axo', 'pid=,command='], {encoding: 'utf8'})} = {}) {
  const base = inside(root, 'videos');
  const candidates = ids?.length ? ids.map(slug) : (fs.existsSync(base) ? fs.readdirSync(base, {withFileTypes: true})
    .filter(x => x.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.name)).map(x => x.name) : []);
  if (ids?.length > 1) fail('请指定单条视频预览');
  const entries = [], skipped = [];
  for (const id of candidates.sort()) {
    try { entries.push({...discoverInput(root, id), id}); }
    catch (error) { skipped.push({id, reason: error.message}); }
  }
  if (!entries.length) fail(`没有可用输入包：${skipped.map(x => x.id + ' ' + x.reason).join('；')}`);
  if (entries.length > 1) fail(`多个可用输入包，请指定视频：${entries.map(x => x.id).join('、')}`);
  // Inspect running Studio commands before touching the shared entry or creating a session.
  const active = processes().split('\n').some(line => /remotion.*\bstudio\b/i.test(line)
    && (line.includes('RenderInputRoot') || line.includes(path.resolve(root))));
  if (active) fail('Studio 正在使用共享入口，停止覆盖；请保留当前预览并明确安排切换');
  const {manifest, directory, id} = entries[0];
  const session = isCompleted(root, id) ? fs.mkdtempSync(path.join(os.tmpdir(), 'video-preview-'))
    : inside(root, `videos/${id}/preview/${Date.now()}-${randomUUID()}`);
  const publicDir = path.join(session, 'public');
  fs.mkdirSync(publicDir, {recursive: true});
  zipInspect(inside(directory, manifest.payload.assetArchive), path.join(publicDir, 'local-assets'));
  const publicSnapshot = path.join(directory, 'public');
  if (fs.existsSync(publicSnapshot)) fs.cpSync(publicSnapshot, publicDir, {recursive: true});
  const output = inside(root, 'src/RenderInputRoot.tsx');
  const prefix = path.relative(path.dirname(output), directory).split(path.sep).join('/') + '/';
  write(output, entrySource(manifest, prefix));
  const result = {output, publicDir, compositions: [manifest.compositionId], skipped};
  write(path.join(session, 'session.json'), {...result, inputDirectory: directory, packageFingerprint: manifest.packageFingerprint});
  return result;
}

await main(import.meta.url, async args => {
  const {options, positional} = cliOptions(args);
  if (options.help) return {usage: 'node scripts/video-preview.mjs [slug] [--studio]；仅读取已有包，不自动重制视频'};
  const result = previewCatalog(ROOT, positional);
  if (!options.studio) return result;
  const require = createRequire(path.join(ROOT, 'package.json'));
  const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');
  const child = spawn(process.execPath, [cli, 'studio', result.output, '--public-dir', result.publicDir, '--no-open'], {cwd: ROOT, stdio: 'inherit'});
  await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Studio 退出：${code}`)));});
  return result;
});
