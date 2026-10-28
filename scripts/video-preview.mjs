import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {ROOT, cliOptions, fail, fileHash, inside, main, slug, write} from './lib/files.mjs';
import {discoverInput, zipInspect} from './lib/input.mjs';

export function previewCatalog(root, ids) {
  const entries = [], skipped = [];
  const candidates = ids?.length ? ids.map(slug) : fs.readdirSync(inside(root, 'local/render-input'), {withFileTypes: true})
    .filter(x => x.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.name)).map(x => x.name);
  for (const id of candidates.sort()) {
    try { entries.push({...discoverInput(root, id), id}); }
    catch (error) { skipped.push({id, reason: error.message}); }
  }
  if (!entries.length) fail(`没有可用输入包：${skipped.map(x => x.id + ' ' + x.reason).join('；')}`);
  const imports = ["import {Composition, registerRoot} from 'remotion';", "import {getTotalDurationFrames} from './lib/timing';", "import {createVideoWithCover} from './components/VideoWithCover';"];
  const wrappers = [], compositions = [], seen = new Set();
  const publicDir = inside(root, `local/studio-assets/${Date.now()}-${process.pid}/public`);
  fs.mkdirSync(publicDir, {recursive: true});
  for (const [index, {manifest, directory}] of entries.entries()) {
    if (seen.has(manifest.compositionId)) fail(`重复 Composition ID：${manifest.compositionId}`);
    seen.add(manifest.compositionId);
    const entry = manifest.entry;
    // New snapshots carry their shared runtime. Historical packages remain read-only.
    const snapshotRuntime = fs.existsSync(path.join(directory, 'src/lib/timing.ts'));
    const prefix = snapshotRuntime ? '../' + path.relative(root, directory).split(path.sep).join('/') + '/src/' : './';
    for (const p of [entry.componentPath, entry.configPath]) {
      const actual = snapshotRuntime ? inside(directory, p) : inside(root, p);
      const listed = manifest.files.find(x => x.path === p);
      if (!listed) fail(`入口未列入包：${p}`);
      if (fileHash(actual) !== listed.sha256) fail(`预览入口源已改变：${p}`);
    }
    const config = prefix + entry.configPath.replace(/^src\//, '').replace(/\.ts$/, '');
    const component = prefix + entry.componentPath.replace(/^src\//, '').replace(/\.tsx$/, '');
    imports.push(`import {${entry.configExport} as config${index}${entry.durationExport ? ', ' + entry.durationExport + ' as duration' + index : ''}} from ${JSON.stringify(config)};`);
    imports.push(`import {${entry.componentExport} as Content${index}} from ${JSON.stringify(component)};`);
    wrappers.push(`const Component${index} = ${entry.cover ? `createVideoWithCover(Content${index}, ${JSON.stringify(entry.cover)}, config${index})` : `Content${index}`};`);
    const duration = entry.durationExport ? `duration${index}()` : `getTotalDurationFrames(config${index})`;
    compositions.push(`<Composition id=${JSON.stringify(manifest.compositionId)} component={Component${index}} durationInFrames={${duration} + ${entry.cover?.durationInFrames ?? 0}} fps={config${index}.fps} width={config${index}.width} height={config${index}.height} />`);
    zipInspect(inside(directory, manifest.payload.assetArchive), path.join(publicDir, 'local-assets'));
    const publicSnapshot = path.join(directory, 'public');
    if (fs.existsSync(publicSnapshot)) fs.cpSync(publicSnapshot, publicDir, {recursive: true});
  }
  const output = inside(root, 'src/RenderInputRoot.tsx');
  write(output, `${imports.join('\n')}\n${wrappers.join('\n')}\nexport const Root = () => <>${compositions.join('\n')}</>;\nregisterRoot(Root);\n`);
  return {output, publicDir, compositions: entries.map(x => x.manifest.compositionId), skipped};
}

await main(import.meta.url, async args => {
  const {options, positional} = cliOptions(args);
  if (options.help) return {usage: 'node scripts/video-preview.mjs [slug ...] [--studio]；仅读取已有包，不自动重制视频'};
  const result = previewCatalog(ROOT, positional);
  if (!options.studio) return result;
  const require = createRequire(path.join(ROOT, 'package.json'));
  const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');
  const child = spawn(process.execPath, [cli, 'studio', result.output, '--public-dir', result.publicDir, '--no-open'], {cwd: ROOT, stdio: 'inherit'});
  await new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Studio 退出：${code}`)));});
  return result;
});
