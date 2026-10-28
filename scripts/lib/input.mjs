import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, assertMutable, fail, fileHash, files, hash, inside, optional, read, slug, write} from './files.mjs';
import {validateMedia, validateScript} from './media.mjs';

const identifier = value => {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value ?? '')) fail(`无效的导出名称：${value}`);
  return value;
};
export function payloadFingerprint(directory, relativePaths) {
  const chunks = [];
  for (const relative of [...relativePaths].sort()) chunks.push(`path:${relative}\n`, fs.readFileSync(inside(directory, relative)), '\n');
  return hash(Buffer.concat(chunks.map(x => Buffer.isBuffer(x) ? x : Buffer.from(x))));
}
export function zipInspect(archive, target = null) {
  return JSON.parse(execFileSync('python3', [path.join(ROOT, 'scripts/lib/archive.py'), target ? 'extract' : 'inspect', archive, ...(target ? [target] : [])], {encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024}));
}
export function entryFor(root, id, options = {}) {
  const previous = optional(inside(root, `local/render-input/${id}/render-input.json`));
  const directory = inside(root, `src/videos/${id}`);
  const candidates = fs.existsSync(directory) ? fs.readdirSync(directory).filter(f => /Video\.tsx$/.test(f)) : [];
  const componentPath = options.componentPath ?? previous?.entry?.componentPath
    ?? (candidates.length === 1 ? `src/videos/${id}/${candidates[0]}` : fail('组件不唯一，请显式提供 --component-path 和 --component-export'));
  const configPath = options.configPath ?? previous?.entry?.configPath ?? `src/videos/${id}/video.config.ts`;
  for (const file of [componentPath, configPath]) {
    if (!file.startsWith(`src/videos/${id}/`)) fail('组件和配置必须属于当前视频');
    inside(root, file);
  }
  const entry = {componentPath, componentExport: options.componentExport ?? previous?.entry?.componentExport ?? path.basename(componentPath, '.tsx'),
    configPath, configExport: options.configExport ?? previous?.entry?.configExport ?? 'videoConfig',
    ...(options.durationExport || previous?.entry?.durationExport ? {durationExport: options.durationExport ?? previous.entry.durationExport} : {})};
  const cover = optional(inside(root, `videos/${id}/cover.json`));
  if (cover?.mode === 'series') entry.cover = cover;
  validateEntry(entry, id);
  return entry;
}
function validateEntry(entry, id) {
  if (!entry) fail('输入包缺少 entry');
  if (!entry.componentPath?.endsWith('.tsx') || !entry.configPath?.endsWith('.ts')) fail('组件／配置文件扩展名无效');
  for (const p of [entry.componentPath, entry.configPath]) if (!p.startsWith(`src/videos/${id}/`) && !p.startsWith(`src/videos/product-promo/${id}/`)) fail('输入包组件／配置不属于视频');
  identifier(entry.componentExport); identifier(entry.configExport);
  if (entry.durationExport) identifier(entry.durationExport);
  if (entry.cover && (!Number.isInteger(entry.cover.durationInFrames) || entry.cover.durationInFrames <= 0 || !/^[a-f0-9]{64}$/.test(entry.cover.sha256 ?? ''))) fail('封面快照无效');
}
export function validateInput(directory, {probe = true, legacyPreview = false} = {}) {
  const manifest = read(inside(directory, 'render-input.json')), id = slug(manifest.videoSlug);
  if (manifest.schemaVersion !== 1 || manifest.kind !== 'video-render-input') fail('输入包格式无效');
  const promo = manifest.workflow === 'product-promo-v1';
  if (promo && !legacyPreview) fail('宣传片只允许已有输入包预览');
  if (!promo && manifest.workflow !== 'narrated-tutorial-v1') fail('不支持的输入包 Workflow');
  const namespace = promo ? `product-promo/${id}` : id;
  const payload = {sourceDirectory: `videos/${namespace}`, remotionDirectory: `src/videos/${namespace}`, assetArchive: `assets/${namespace}-assets.zip`};
  for (const [key, value] of Object.entries(payload)) if (manifest.payload?.[key] !== value) fail(`输入包 ${key} 路径不属于本视频`);
  if (!/^[A-Za-z0-9_-]+$/.test(manifest.compositionId ?? '')) fail('输入包 Composition ID 无效');
  validateEntry(manifest.entry, id);
  if (!Array.isArray(manifest.files) || !manifest.files.length) fail('输入包缺少文件清单');
  const seen = new Set();
  for (const file of manifest.files) {
    const p = inside(directory, file.path);
    if (seen.has(file.path) || !fs.existsSync(p) || !fs.statSync(p).isFile() || fs.statSync(p).size !== file.size || fileHash(p) !== file.sha256) fail(`输入包文件损坏或重复：${file.path}`);
    seen.add(file.path);
  }
  const actual = files(directory).filter(x => x !== 'render-input.json');
  if (actual.length !== seen.size || actual.some(x => !seen.has(x))) fail('输入包存在未列出的文件');
  if (payloadFingerprint(directory, actual) !== manifest.packageFingerprint) fail('输入包指纹不一致');
  for (const p of [manifest.entry.configPath, manifest.entry.componentPath]) if (!seen.has(p)) fail(`输入包缺少入口文件：${p}`);
  const archiveRelative = manifest.payload?.assetArchive ?? `assets/${id}-assets.zip`;
  const archive = inside(directory, archiveRelative), entries = zipInspect(archive);
  const assetPrefix = promo && entries.some(x => x.startsWith(`product-promo/${id}/`)) ? `product-promo/${id}` : id;
  if (entries.some(x => x !== assetPrefix && !x.startsWith(`${assetPrefix}/`) && !(promo && x === 'product-promo'))) fail('资源 ZIP 顶层目录不一致');
  if (!promo) {
    const script = read(inside(directory, `videos/${id}/tts-script.json`));
    validateScript(script, id);
    const generated = inside(directory, `src/videos/${id}/generated`);
    validateMedia(generated, script, {probe});
    const audio = read(path.join(generated, 'audio-manifest.json'));
    for (const relative of [...audio.scenes.flatMap(s => s.segments.map(x => x.file)), 'subtitles/captions.srt', 'subtitles/captions.vtt']) {
      if (!entries.includes(`${id}/${relative}`)) fail(`资源 ZIP 缺少 ${relative}`);
      const archivedBytes = execFileSync('unzip', ['-p', archive, `${id}/${relative}`], {maxBuffer: 64 * 1024 * 1024});
      if (hash(archivedBytes) !== fileHash(inside(generated, relative))) fail(`ZIP 与当前音频／字幕不一致：${relative}`);
    }
  }
  if (manifest.entry.cover) {
    const cover = manifest.entry.cover;
    if (!cover.src.startsWith(`local-assets/${id}/cover/`)) fail('封面不属于当前视频');
    const coverPath = `public/${cover.src}`;
    if (!seen.has(coverPath) || fileHash(inside(directory, coverPath)) !== cover.sha256) fail('封面图片与快照不一致');
    const zipPath = cover.src.replace(/^local-assets\//, '');
    if (!entries.includes(zipPath) || hash(execFileSync('unzip', ['-p', archive, zipPath], {maxBuffer: 12 * 1024 * 1024})) !== cover.sha256) fail('ZIP 封面与快照不一致');
  }
  return manifest;
}
function copy(root, target, relative) {
  const source = inside(root, relative);
  if (!fs.existsSync(source)) return;
  const destination = inside(target, relative);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  if (fs.statSync(source).isDirectory()) {
    for (const f of files(source)) copy(root, target, `${relative}/${f}`);
  } else fs.copyFileSync(source, destination);
}
export function prepareInput(root, id, options = {}) {
  slug(id); assertMutable(root, id);
  const entry = entryFor(root, id, options);
  validateMedia(inside(root, `src/videos/${id}/generated`), read(inside(root, `videos/${id}/tts-script.json`)), {probe: options.probe !== false});
  const stamp = `${Date.now()}-${process.pid}`;
  const directory = inside(root, `local/render-input/${id}/direct-${stamp}`);
  fs.mkdirSync(directory, {recursive: true});
  const sourceDirs = [`videos/${id}`, `src/videos/${id}`, `public/local-assets/${id}`, 'src/components', 'src/lib', 'src/scenes', 'styles', 'templates'];
  const configFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'remotion.config.ts'];
  const before = sourceDirs.flatMap(p => {
    const absolute = inside(root, p);
    return fs.existsSync(absolute) ? files(absolute).map(f => `${p}/${f}`) : [];
  }).concat(configFiles.filter(p => fs.existsSync(inside(root, p))));
  const hashes = new Map(before.map(p => [p, fileHash(inside(root, p))]));
  for (const relative of before) copy(root, directory, relative);
  const publicAssets = inside(directory, `public/local-assets/${id}`);
  fs.mkdirSync(publicAssets, {recursive: true});
  for (const name of ['audio', 'subtitles']) fs.cpSync(inside(directory, `src/videos/${id}/generated/${name}`), path.join(publicAssets, name), {recursive: true});
  const assetArchive = `assets/${id}-assets.zip`;
  fs.mkdirSync(inside(directory, 'assets'), {recursive: true});
  execFileSync('zip', ['-q', '-r', inside(directory, assetArchive), id], {cwd: path.dirname(publicAssets), timeout: 60000});
  const list = files(directory);
  const manifest = {schemaVersion: 1, kind: 'video-render-input', videoSlug: id, workflow: 'narrated-tutorial-v1', workflowVersion: 2,
    compositionId: options.compositionId ?? id, createdAt: new Date().toISOString(), entry,
    payload: {sourceDirectory: `videos/${id}`, remotionDirectory: `src/videos/${id}`, assetArchive},
    sourceFingerprint: hash(JSON.stringify([...hashes])), packageFingerprint: payloadFingerprint(directory, list),
    files: list.map(relative => ({path: relative, size: fs.statSync(inside(directory, relative)).size, sha256: fileHash(inside(directory, relative))}))};
  if (!/^[a-zA-Z0-9_-]+$/.test(manifest.compositionId)) fail('Composition ID 无效');
  assertMutable(root, id);
  for (const [p, sha] of hashes) if (fileHash(inside(root, p)) !== sha) fail(`准备期间源文件改变：${p}`);
  write(path.join(directory, 'render-input.json'), manifest);
  validateInput(directory, {probe: options.probe !== false});
  const archive = `${directory}.zip`;
  execFileSync('zip', ['-q', '-r', archive, '.'], {cwd: directory, timeout: 60000});
  const result = {directory, archive, sha256: fileHash(archive), compositionId: manifest.compositionId, packageFingerprint: manifest.packageFingerprint};
  write(inside(root, `local/render-input/${id}/direct-current.json`), result);
  return result;
}
export function entrySource(manifest, prefix = './') {
  const entry = manifest.entry; validateEntry(entry, slug(manifest.videoSlug));
  const config = prefix + entry.configPath.replace(/^src\//, '').replace(/\.ts$/, '');
  const component = prefix + entry.componentPath.replace(/^src\//, '').replace(/\.tsx$/, '');
  return `import {Composition, registerRoot} from 'remotion';\nimport {getTotalDurationFrames} from ${JSON.stringify(prefix + 'lib/timing')};\nimport {createVideoWithCover} from ${JSON.stringify(prefix + 'components/VideoWithCover')};\nimport {${entry.configExport} as config${entry.durationExport ? ', ' + entry.durationExport + ' as duration' : ''}} from ${JSON.stringify(config)};\nimport {${entry.componentExport} as Content} from ${JSON.stringify(component)};\nconst Component = ${entry.cover ? `createVideoWithCover(Content, ${JSON.stringify(entry.cover)}, config)` : 'Content'};\nconst frames = ${entry.durationExport ? 'duration()' : 'getTotalDurationFrames(config)'} + ${entry.cover?.durationInFrames ?? 0};\nexport const Root = () => <Composition id=${JSON.stringify(manifest.compositionId)} component={Component} durationInFrames={frames} fps={config.fps} width={config.width} height={config.height} />;\nregisterRoot(Root);\n`;
}
export function installInput(directory, workspace, {probe = true} = {}) {
  const manifest = validateInput(directory, {probe});
  const relative = path.relative(ROOT, path.resolve(workspace)).split(path.sep).join('/');
  if (!relative.startsWith('../') && !relative.startsWith('local/direct-render/') && !relative.startsWith('local/harness-retirement/')) fail('项目内的安装目标只能位于 local/direct-render/ 或 local/harness-retirement/');
  // Installation is for a new isolated workspace, never the source repository.
  if (fs.existsSync(workspace) && fs.readdirSync(workspace).length) fail('安装目标必须为空目录');
  fs.mkdirSync(workspace, {recursive: true});
  for (const file of manifest.files) copy(directory, workspace, file.path);
  zipInspect(inside(directory, manifest.payload.assetArchive), inside(workspace, 'public/local-assets'));
  write(inside(workspace, 'src/RenderInputRoot.tsx'), entrySource(manifest));
  return manifest;
}
export function discoverInput(root, id) {
  slug(id);
  const current = optional(inside(root, `local/render-input/${id}/direct-current.json`));
  // Completion freezes the existing package; it must not hide the final snapshot.
  const directory = current ? current.directory : inside(root, `local/render-input/${id}`);
  const relative = path.relative(root, directory).split(path.sep).join('/');
  inside(root, relative);
  const manifest = validateInput(directory, {probe: false, legacyPreview: true});
  for (const file of manifest.files.filter(f => f.path.startsWith(`${manifest.payload.sourceDirectory}/`) || f.path.startsWith(`${manifest.payload.remotionDirectory}/`))) {
    // Approval notes do not change rendered content and are finalized after delivery.
    if (file.path === `videos/${id}/production-record.md`) continue;
    if (!fs.existsSync(inside(root, file.path)) || fileHash(inside(root, file.path)) !== file.sha256) fail(`输入包与当前视频不一致，请重新准备：${file.path}`);
  }
  return {directory, manifest};
}
