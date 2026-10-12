import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {storyboardImplementationTiming} from './storyboard.mjs';
import {buildRemotionTimingPlanForProject} from './remotion-timing.mjs';
import {STORYBOARD_SHARED_REFERENCES, storyboardSchemaVersion} from './storyboard-design.mjs';
import {usesStoryboardProduction} from './production-contract.mjs';

// Read-only implementation review. This module never creates video code or a drawing tree.
export const usesAuthoredStoryboard = project => usesStoryboardProduction(project) && storyboardSchemaVersion(project) >= 2;
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const read = (project, file) => fs.readFileSync(path.join(project.config.workspaceRoot, file), 'utf8');
export const viewingEvidencePath = project => `${project.config.sourceDirectory}/remotion-viewing-evidence.json`;
export function runtimeFiles(project) {
  const root = path.resolve(project.config.workspaceRoot), files = new Set(STORYBOARD_SHARED_REFERENCES), visited = new Set();
  const directory = project.config.remotionDirectory ?? `src/videos/${project.config.slug}`;
  const visit = relative => {
    if (visited.has(relative)) return;
    visited.add(relative); files.add(relative);
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*|require\(\s*)['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.')) continue;
      const absolute = path.resolve(root, path.dirname(relative), match[1]);
      if (!absolute.startsWith(root + path.sep)) throw new Error(`实现依赖越出工作区：${match[1]}`);
      const found = [absolute, ...['.ts','.tsx','.js','.json','.css'].map(ext => absolute + ext), ...['index.ts','index.tsx'].map(file => path.join(absolute, file))].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!found) throw new Error(`实现依赖不存在：${relative} → ${match[1]}`);
      const dependency = path.relative(root, found);
      visit(dependency);
    }
  };
  const base = path.join(root, directory);
  if (fs.existsSync(base)) for (const file of fs.readdirSync(base).filter(file => /(?:Video\.tsx|video\.config\.ts)$/.test(file))) visit(`${directory}/${file}`);
  return Object.fromEntries([...files].sort().map(file => [file, hash(read(project, file))]));
}
export function storyboardImplementationFingerprint(project) {
  if (!usesAuthoredStoryboard(project)) return null;
  try {return buildStoryboardImplementationReview(project).implementationFingerprint;} catch {return null;}
}
export function buildStoryboardImplementationReview(project, {plan = null, timing = null} = {}) {
  timing ??= buildRemotionTimingPlanForProject(project);
  if (timing.fps !== 30) throw new Error('生产时间基准必须为 30fps');
  plan ??= storyboardImplementationTiming(project, timing);
  const directory = project.config.remotionDirectory;
  const files = runtimeFiles(project);
  if (!Object.keys(files).some(file => file.startsWith(directory + '/') && file.endsWith('Video.tsx'))) throw new Error('缺少 Agent 编写的视频组件');
  if (!files[`${directory}/video.config.ts`]) throw new Error('缺少真实 Timeline 对应的视频配置');
  const audioFiles = timing.scenes.flatMap(scene => scene.segments.map(segment => {
    if (!/^audio\/[A-Za-z0-9_./-]+\.mp3$/.test(segment.audioFile) || segment.audioFile.includes('..')) throw new Error(`音频路径无效：${segment.audioFile}`);
    return {path: segment.audioFile, sha256: hash(fs.readFileSync(path.join(project.config.workspaceRoot, directory, 'generated', segment.audioFile)))};
  }));
  const implementationFingerprint = hash({runtime: files, audioFiles});
  const withShots = storyboardSchemaVersion(project) === 3;
  const alignment = {schemaVersion: withShots ? 5 : 4, kind: 'storyboard-authored-alignment', slug: project.config.slug,
    reviewVersion: plan.reviewVersion, storyboardFingerprint: plan.storyboardFingerprint, timingFingerprint: plan.timingFingerprint,
    implementationFingerprint, runtimeFiles: files, audioFiles,
    scenes: timing.scenes.map(scene => ({sceneId: scene.sceneId, startFrame: scene.startFrame, endFrame: scene.endFrame,
      ...(withShots ? {shots: plan.shots.filter(shot => shot.sceneId === scene.sceneId).map(shot => ({id:shot.id, startFrame:shot.startFrame, endFrame:shot.endFrame}))} : {}),
      events: plan.events.filter(event => event.sceneId === scene.sceneId).map(event => ({id: event.id, ...(withShots ? {shotId:event.shotId} : {}), startFrame: event.start, completeFrame: event.complete}))})),
  };
  return {plan, timing, alignment, implementationFingerprint};
}
export function validateStoryboardImplementation(project, {requireViewing = false, plan = null, timing = null} = {}) {
  const issues = [], issue = (code, message) => issues.push({code, message, stage: 'remotion', severity: 'error'});
  try {
    const expected = buildStoryboardImplementationReview(project, {plan, timing});
    if (requireViewing && project.state?.stages?.remotion?.invalidatedBy === 'gate-3-rejected'
      && project.state.stages.remotion.rebuildImplementationFingerprint === expected.implementationFingerprint) issue('storyboard-runtime-unchanged-after-rejection', 'Gate 3 驳回后实现未变化，不能只改观看记录重新提交');
    const alignment = JSON.parse(read(project, `${project.config.sourceDirectory}/remotion-alignment.json`));
    if (!Array.isArray(alignment.scenes) || alignment.scenes.length !== expected.alignment.scenes.length) issue('storyboard-implementation-events', '实现对齐未完整对应 Scene 清单');
    for (const field of ['schemaVersion','kind','slug','reviewVersion','storyboardFingerprint','timingFingerprint','implementationFingerprint','runtimeFiles','audioFiles']) {
      if (JSON.stringify(alignment[field]) !== JSON.stringify(expected.alignment[field])) issue('storyboard-implementation-stale', `实现对齐字段未绑定当前分镜／源码／音频：${field}`);
    }
    for (const scene of expected.alignment.scenes) {
      const actual = alignment.scenes?.find(item => item.sceneId === scene.sceneId);
      if (expected.alignment.schemaVersion === 5) validateShotImplementation(actual, scene, expected, project, issue);
      if (!actual || actual.startFrame !== scene.startFrame || actual.endFrame !== scene.endFrame || JSON.stringify(actual.events) !== JSON.stringify(scene.events)) issue('storyboard-implementation-events', `Scene ${scene.sceneId} 动作范围未对应真实 Timeline`);
    }
    if (requireViewing) {
      const evidence = JSON.parse(read(project, viewingEvidencePath(project)));
      if (evidence.schemaVersion !== (expected.alignment.schemaVersion === 5 ? 2 : 1) || evidence.kind !== 'storyboard-viewing-evidence' || evidence.slug !== project.config.slug
        || evidence.reviewVersion !== expected.plan.reviewVersion || evidence.storyboardFingerprint !== expected.plan.storyboardFingerprint
        || evidence.implementationFingerprint !== expected.implementationFingerprint || evidence.timingFingerprint !== expected.plan.timingFingerprint
        || typeof evidence.viewer !== 'string' || !evidence.viewer.trim() || !Number.isFinite(Date.parse(evidence.viewedAt))) issue('storyboard-viewing-stale', '观看证据未绑定当前分镜、实现和 Timeline 或缺少观看者');
      const checks = expected.alignment.scenes.flatMap(scene => scene.events.map(event => ({sceneId: scene.sceneId, eventId: event.id, startFrame: event.startFrame, endFrame: event.completeFrame})));
      if (!Array.isArray(evidence.scenes) || evidence.scenes.length !== expected.alignment.scenes.length) issue('storyboard-viewing-scenes', '缺少全片逐 Scene 观看记录');
      for (const scene of expected.alignment.scenes) {
        const actual = evidence.scenes?.find(item => item.sceneId === scene.sceneId);
        if (!actual || actual.startFrame !== scene.startFrame || actual.endFrame !== scene.endFrame || actual.result !== 'pass'
          || actual.method !== 'studio-playback' || typeof actual.note !== 'string' || !actual.note.trim()) issue('storyboard-viewing-scenes', `Scene ${scene.sceneId} 未完整观看`);
      }
      if (!Array.isArray(evidence.checks) || evidence.checks.length !== checks.length) issue('storyboard-viewing-coverage', '观看证据必须逐项覆盖当前 Scene／Event');
      for (const check of checks) {
        const actual = evidence.checks?.find(item => item.sceneId === check.sceneId && item.eventId === check.eventId);
        if (!actual || actual.startFrame !== check.startFrame || actual.endFrame !== check.endFrame || actual.result !== 'pass'
          || actual.method !== 'studio-playback' || actual.boundariesChecked !== true || typeof actual.note !== 'string' || !actual.note.trim()) issue('storyboard-viewing-incomplete', `Event ${check.eventId} 缺少完整动作与边界观看证据`);
      }
      if (expected.alignment.schemaVersion === 5) validateShotViewing(evidence, alignment, expected, issue);
      if (evidence.listening?.normalSpeed !== true || evidence.listening?.result !== 'pass' || evidence.listening?.startFrame !== 0 || evidence.listening?.endFrame !== expected.timing.durationFrames
        || typeof evidence.listening?.note !== 'string' || !evidence.listening.note.trim()) issue('storyboard-listening-incomplete', '缺少当前音频正常速度完整试听证据');
      if (!Array.isArray(evidence.unresolved) || evidence.unresolved.length) issue('storyboard-viewing-unresolved', '观看证据仍有未解决问题');
    }
  } catch (error) {issue('storyboard-runtime-invalid', error.message);}
  return issues;
}


function validateShotImplementation(actual, scene, expected, project, issue) {
  if (!Array.isArray(actual?.shots) || actual.shots.length !== scene.shots.length) {issue('storyboard-implementation-shots', `Scene ${scene.sceneId} 缺少逐 Shot 对齐`); return;}
  for (const [i, shot] of scene.shots.entries()) {
    const item = actual.shots[i], design = expected.plan.shots.find(s => s.id === shot.id);
    if (!item || item.id !== shot.id || item.startFrame !== shot.startFrame || item.endFrame !== shot.endFrame) {issue('storyboard-implementation-shots', `Shot ${shot.id} 未对应真实时间或顺序`); continue;}
    if (!Array.isArray(item.implementationFiles) || !item.implementationFiles.length || new Set(item.implementationFiles).size !== item.implementationFiles.length || item.implementationFiles.some(file => !expected.alignment.runtimeFiles[file]) || !Array.isArray(item.implementationSymbols) || !item.implementationSymbols.length || item.implementationSymbols.some(symbol => typeof symbol !== 'string' || !symbol.trim() || !item.implementationFiles.some(file => expected.alignment.runtimeFiles[file] && read(project,file).includes(symbol)))) issue('storyboard-implementation-shots', `Shot ${shot.id} 缺少当前源码中的实现文件／符号`);
    const tr = item.transition, target = design.transitionToNext.target;
    const next = target.type === 'shot' ? expected.plan.shots.find(s => s.id === target.id) : target.type === 'scene' ? expected.plan.shots.find(s => s.sceneId === target.id) : null;
    const ids = new Set([...design.visibleElementIds, ...(next?.visibleElementIds ?? [])]);
    const cut = design.transitionToNext.mechanism === 'cut';
    const validRange = tr && (cut ? tr.startFrame === shot.endFrame && tr.endFrame === shot.endFrame : next ? tr.startFrame >= shot.startFrame && tr.endFrame <= next.endFrame && tr.startFrame < shot.endFrame && tr.endFrame > shot.endFrame : target.type === 'end' && tr.startFrame >= shot.startFrame && tr.startFrame < shot.endFrame && tr.endFrame === shot.endFrame);
    if (!tr || tr.target?.type !== target.type || tr.target?.id !== target.id || tr.mechanism !== design.transitionToNext.mechanism || !Number.isInteger(tr.startFrame) || !Number.isInteger(tr.endFrame) || !Array.isArray(tr.visibleElementIds) || new Set(tr.visibleElementIds).size !== tr.visibleElementIds.length || tr.visibleElementIds.length !== ids.size || tr.visibleElementIds.some(id => !ids.has(id)) || !validRange) issue('storyboard-implementation-transition', `Shot ${shot.id} 转场区间／双镜头对象未对应冻结设计`);
  }
}

export function storyboardViewingRanges(alignment) {
  const shots = alignment.scenes.flatMap(scene => (scene.shots ?? []).map(shot => ({sceneId:scene.sceneId, shotId:shot.id, startFrame:shot.startFrame, endFrame:shot.endFrame})));
  const boundaries = shots.slice(0,-1).map((shot,i) => {
    const next = shots[i+1], actual = alignment.scenes.flatMap(s=>s.shots ?? []).find(s=>s.id===shot.shotId);
    return {fromShotId:shot.shotId, toShotId:next.shotId, atFrame:shot.endFrame, startFrame:Math.min(shot.endFrame-1, actual.transition?.startFrame ?? shot.endFrame), endFrame:Math.max(next.startFrame+1, actual.transition?.endFrame ?? next.startFrame)};
  });
  return {shots, boundaries};
}

function validateShotViewing(evidence, alignment, expected, issue) {
  const ranges = storyboardViewingRanges(alignment);
  for (const [field, key] of [['shots','shotId'],['boundaries','fromShotId']]) {
    if (!Array.isArray(evidence[field]) || evidence[field].length !== ranges[field].length) {issue('storyboard-viewing-shots', `缺少完整 ${field} 观看证据`); continue;}
    for (const [i, range] of ranges[field].entries()) {
      const actual = evidence[field][i];
      if (!actual || Object.entries(range).some(([k,v])=>actual[k]!==v) || actual.result !== 'pass' || actual.method !== 'studio-playback' || typeof actual.note !== 'string' || !actual.note.trim()) issue('storyboard-viewing-shots', `${field} ${range[key]} 未完整观看或范围／顺序过期`);
    }
  }
}
