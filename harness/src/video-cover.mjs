import fs from 'node:fs';
import {assertProductionTaskOwner} from './production-lock.mjs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getSeries, listSeries, seriesAssetPath, validateCover} from './series-assets.mjs';
import {assertProjectMutable, loadProject, writeJson} from './storage.mjs';
import {workflowPaths, workflowStages} from './workflows/registry.mjs';
import {getStyleDefinition} from './styles.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const mime = filename => ({png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp'})[path.extname(filename).slice(1)];

export function seriesChoices() {
  return listSeries().map(series => ({...series, coverAvailable: Boolean(series.cover && seriesAssetPath(series.id, path.basename(series.cover)))}));
}

export function readVideoCover(project) {
  const file = path.join(project.config.workspaceRoot, workflowPaths(project).sourceDirectory, 'cover.json');
  if (!fs.existsSync(file)) return null;
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (record.schemaVersion !== 1 || record.slug !== project.config.slug || !['series', 'none'].includes(record.mode)) throw new Error('视频封面快照无效');
  if (record.mode === 'none') return record;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.seriesId ?? '') || !record.seriesTitle || !getStyleDefinition(record.style)
    || !Number.isInteger(record.durationInFrames) || record.durationInFrames <= 0
    || !new RegExp(`^local-assets/${project.config.slug}/cover/[a-f0-9]{64}[.](png|jpg|webp)$`).test(record.src ?? '')
    || !/^[a-f0-9]{64}$/.test(record.sha256 ?? '')) throw new Error('视频封面路径、系列或时长无效');
  return record;
}

export function videoCoverAssetIssues(project) {
  try {
    const cover = readVideoCover(project);
    if (project.config.seriesSelectionRequired && !cover) return ['尚未选择系列，请列出当前系列让用户选择，或明确选择不加入系列'];
    if (project.config.seriesSelection && JSON.stringify(project.config.seriesSelection) !== JSON.stringify(cover)) return ['项目系列选择与封面快照不一致或快照缺失'];
    if (!cover || cover.mode === 'none') return [];
    const file = path.join(project.config.workspaceRoot, 'public', cover.src);
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile()) return ['缺少视频封面副本或图片路径不安全'];
    const bytes = fs.readFileSync(file);
    validateCover(bytes, mime(file));
    return hash(bytes) === cover.sha256 ? [] : ['视频封面副本与冻结 SHA-256 不一致'];
  } catch (error) { return [error.message]; }
}

export function selectVideoSeries(slug, seriesId) {
  const project = loadProject(slug, {refresh: false});
  assertProjectMutable(project, '设置视频系列与封面');
  assertProductionTaskOwner(project);
  const stages = workflowStages(project);
  const visualStage = stages.includes('visual-script') ? 'visual-script' : 'motion-script';
  if (stages.indexOf(project.state.currentStage) >= stages.indexOf(visualStage)) throw new Error('系列与封面须在视觉设计开始前选择；后续变更需要重新审核方案');
  const previous = readVideoCover(project);
  if (previous) {
    if ((previous.mode === 'none' && seriesId === 'none') || previous.seriesId === seriesId) {
      const issues = videoCoverAssetIssues(project);
      if (issues.length) throw new Error(issues.join('；'));
      return previous;
    }
    throw new Error('系列选择已冻结；不能直接覆盖已有选择');
  }
  if (seriesId === 'none' && listSeries().some(item => item.videos.includes(slug))) throw new Error('视频已有系列成员关系，不能直接改为无系列');
  let record = {schemaVersion: 1, slug, mode: 'none'};
  if (seriesId !== 'none') {
    const series = getSeries(seriesId);
    if (!series) throw new Error('系列不存在，请先列出系统中的系列');
    if (!getStyleDefinition(series.style)) throw new Error('系列风格无效');
    const conflict = listSeries().find(item => item.id !== seriesId && item.videos.includes(slug));
    if (conflict) throw new Error(`视频已关联其他系列：${conflict.title}`);
    const file = series.cover && seriesAssetPath(series.id, path.basename(series.cover));
    if (!file) throw new Error('所选系列尚无可用封面，请先提供并确认封面图片');
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('封面不允许符号链接');
    const bytes = fs.readFileSync(file);
    const image = validateCover(bytes, mime(file));
    const sha256 = hash(bytes);
    record = {...record, mode: 'series', seriesId: series.id, seriesTitle: series.title, style: series.style,
      src: `local-assets/${slug}/cover/${sha256}.${image.extension}`, sha256, durationInFrames: series.coverDurationFrames};
    const destination = path.join(project.config.workspaceRoot, 'public', record.src);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, bytes);
    project.config.style = series.style;
  }
  project.config.seriesSelection = record;
  writeJson(project.files.config, project.config);
  writeJson(path.join(project.config.workspaceRoot, project.config.sourceDirectory, 'cover.json'), record);
  return record;
}
