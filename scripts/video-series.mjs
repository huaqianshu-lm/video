import fs from 'node:fs';
import path from 'node:path';
import {ROOT, assertMutable, cliOptions, fail, fileHash, inside, isCompleted, main, optional, slug, write} from './lib/files.mjs';
import {validateCover} from './lib/cover-image.mjs';

const imageType = file => ({'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'})[path.extname(file).toLowerCase()];
export function seriesList(root) {
  const base = inside(root, 'series');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, {withFileTypes: true}).filter(x => x.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.name)).map(x => {
    const config = optional(inside(root, `series/${x.name}/series.json`));
    if (!config) return null;
    let coverAvailable = false;
    try { if (config.cover) { const file = inside(root, `public/${config.cover}`); validateCover(fs.readFileSync(file), imageType(file)); coverAvailable = true; } } catch {}
    return {...config, id: x.name, coverAvailable};
  }).filter(Boolean).sort((a, b) => a.id.localeCompare(b.id));
}
export function selectSeries(root, id, seriesId) {
  slug(id); assertMutable(root, id);
  const target = inside(root, `videos/${id}/cover.json`);
  if (fs.existsSync(target)) fail('封面选择已存在，修改需说明影响并重新确认，不直接覆盖');
  let cover = {schemaVersion: 1, slug: id, mode: 'none'};
  if (seriesId !== 'none') {
    slug(seriesId);
    const series = seriesList(root).find(s => s.id === seriesId);
    if (!series?.coverAvailable) fail('系列不存在或缺少可用封面');
    const file = inside(root, `public/${series.cover}`), bytes = fs.readFileSync(file);
    const image = validateCover(bytes, imageType(file));
    const sha256 = fileHash(file), duration = series.coverDurationFrames ?? 45;
    if (!Number.isInteger(duration) || duration <= 0) fail('封面帧数无效');
    cover = {...cover, mode: 'series', seriesId, seriesTitle: series.title, style: series.style,
      src: `local-assets/${id}/cover/${sha256}.${image.extension}`, sha256, durationInFrames: duration};
    const output = inside(root, `public/${cover.src}`);
    fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, bytes);
  }
  assertMutable(root, id); write(target, cover); return cover;
}
export function createSeries(root, id, title, style, coverFile) {
  slug(id);
  const target = inside(root, `series/${id}/series.json`);
  if (fs.existsSync(target)) fail('系列已存在，不覆盖已有成员或封面；需要新封面请使用新系列标识');
  if (!title || !style) fail('提供 --title 和 --style');
  let cover = null;
  if (coverFile) {
    const file = path.resolve(coverFile);
    const relative = path.relative(root, file).split(path.sep).join('/'); inside(root, relative);
    const bytes = fs.readFileSync(file), image = validateCover(bytes, imageType(file));
    cover = `series-assets/${id}/cover.${image.extension}`;
    const output = inside(root, `public/${cover}`);
    fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, bytes);
  }
  const config = {schemaVersion: 1, id, title, style, cover, coverDurationFrames: 45, videos: []};
  write(target, config); return config;
}
export function addSeriesCover(root, id, coverFile) {
  slug(id);
  const series = optional(inside(root, `series/${id}/series.json`));
  if (!series) fail('系列不存在');
  if (series.cover) fail('系列已有封面，不覆盖历史封面；新版本使用新系列标识');
  if ((series.videos ?? []).some(video => isCompleted(root, video))) fail('系列存在已完成成员，不改写系列配置');
  const relative = path.relative(root, path.resolve(coverFile)).split(path.sep).join('/');
  const file = inside(root, relative), bytes = fs.readFileSync(file), image = validateCover(bytes, imageType(file));
  const cover = `series-assets/${id}/cover.${image.extension}`, target = inside(root, `public/${cover}`);
  fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, bytes);
  write(inside(root, `series/${id}/series.json`), {...series, cover}); return {...series, cover};
}
await main(import.meta.url, args => {
  const {positional: [action, id, series], options} = cliOptions(args);
  if (!action || options.help) return {usage: 'node scripts/video-series.mjs list | select <slug> <series-id|none> | create <series-id> --title <title> --style <style> [--cover <project-image>] | cover <series-id> --file <project-image>'};
  if (action === 'list') return seriesList(ROOT);
  if (action === 'select') return selectSeries(ROOT, id, series);
  if (action === 'create') return createSeries(ROOT, id, options.title, options.style, options.cover);
  if (action === 'cover') return addSeriesCover(ROOT, id, options.file);
  fail('不支持的系列操作');
});
