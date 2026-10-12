import {resolveShotRanges} from "./storyboard-shots.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getStyleDefinition } from "./styles.mjs";
import { storyboardSchemaVersion, validateStoryboardDesign, validateStoryboardDesignAudit, resolveStoryboardTiming, storyboardDesignReferences, STORYBOARD_QUALITY_VERSION } from "./storyboard-design.mjs";

export const storyboardPath = project => `${project.config.sourceDirectory}/storyboard.json`;
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const nonempty = value => typeof value === "string" && Boolean(value.trim());
const schema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard.schema.json", import.meta.url), "utf8"));
const executionSchema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard-v2.schema.json", import.meta.url), "utf8"));
const shotSchema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard-v3.schema.json", import.meta.url), "utf8"));
const shotAuditSchema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard-design-audit-v2.schema.json", import.meta.url), "utf8"));
const auditSchema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard-design-audit.schema.json", import.meta.url), "utf8"));

function schemaIssues(value, rule, location = "storyboard") {
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  const types = rule.type ? (Array.isArray(rule.type) ? rule.type : [rule.type]) : [];
  if ((types.length && !types.includes(type) && !(type === "integer" && types.includes("number"))) || ("const" in rule && value !== rule.const) || (rule.enum && !rule.enum.includes(value))) return [`${location} 类型或值不符合 Schema`];
  const issues = [];
  if (typeof value === "string" && ((rule.minLength && !value.trim()) || (rule.pattern && !new RegExp(rule.pattern).test(value)))) issues.push(`${location} 文本无效`);
  if (["integer", "number"].includes(type) && (!Number.isFinite(value) || (rule.minimum !== undefined && value < rule.minimum))) issues.push(`${location} 数值无效`);
  if (type === "array") {
    if (value.length < (rule.minItems ?? 0)) issues.push(`${location} 列表为空`);
    if (rule.items) value.forEach((item, index) => issues.push(...schemaIssues(item, rule.items, `${location}[${index}]`)));
  }
  if (type === "object" && rule.properties) {
    for (const key of rule.required ?? []) if (!(key in value)) issues.push(`${location} 缺少 ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (rule.properties[key]) issues.push(...schemaIssues(item, rule.properties[key], `${location}.${key}`));
      else if (rule.additionalProperties === false) issues.push(`${location} 不支持 ${key}`);
    }
  }
  return issues;
}

// Paths are local reviewed inputs. Check every component, including parent symlinks.
export function storyboardLocalFile(project, relativePath, { image = false } = {}) {
  if (!nonempty(relativePath) || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").some(part => !part || part === "." || part === "..")) throw new Error("资料路径无效");
  const root = path.resolve(project.config.workspaceRoot);
  let current = root;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink()) throw new Error(`缺失或不安全的资料：${relativePath}`);
  }
  if (!fs.statSync(current).isFile()) throw new Error(`资料不是文件：${relativePath}`);
  if (image && !/\.(png|jpe?g|webp)$/i.test(current)) throw new Error("示意图仅支持 PNG／JPEG／WebP");
  return current;
}

export function narrationScenes(text) {
  const matches = [...text.matchAll(/^##\s+Scene\s+(\d+).*$/gim)];
  return matches.map((match, index) => ({ id: match[1].padStart(2, "0"), text: text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length).trim().replace(/^---\s*$/gm, "").trim() }));
}

export function storyboardReview(project) {
  const config = project.config;
  const issues = [];
  const dependencies = new Map();
  const fail = message => issues.push({ code: "storyboard-invalid", stage: "storyboard", path: storyboardPath(project), severity: "error", message });
  const read = (file, options) => {
    try {
      const bytes = fs.readFileSync(storyboardLocalFile(project, file, options));
      dependencies.set(file, hash(bytes));
      return bytes;
    } catch (error) { fail(error.message); return null; }
  };
  const boardBytes = read(storyboardPath(project));
  const narrationBytes = read(`${config.sourceDirectory}/narration-script.md`);
  for (const file of ["source.md", "content-analysis.md", "video-narrative.md"]) read(`${config.sourceDirectory}/${file}`);
  let board = null;
  try { board = boardBytes && JSON.parse(boardBytes.toString("utf8")); } catch { fail("Storyboard JSON 无法解析"); }
  const narration = narrationScenes(narrationBytes?.toString("utf8") ?? "");
  const ids = new Set();
  const eventIds = new Set();
  const sourceRoot = `${config.sourceDirectory}/`;
  let dataVersion = 1;
  try { dataVersion = storyboardSchemaVersion(project); } catch (error) { fail(error.message); }
  const shapeIssues = schemaIssues(board, dataVersion === 3 ? shotSchema : dataVersion === 2 ? executionSchema : schema);
  shapeIssues.forEach(fail);
  if (shapeIssues.length) board = null;
  if (board) {
    if (board.schemaVersion !== dataVersion || board.videoSlug !== config.slug || board.workflow !== "narrated-tutorial-v1" || board.productionContract !== "storyboard-v1" || board.style !== config.style || JSON.stringify(board.seriesSelection) !== JSON.stringify(config.seriesSelection ?? null)) fail("Storyboard 数据版本、视频、Workflow、契约、风格或系列选择不一致；旧格式仅历史读取，继续生产须正常返工");
    if (!Array.isArray(board.scenes) || !board.scenes.length) fail("Storyboard 缺少 scenes");
    for (const scene of Array.isArray(board.scenes) ? board.scenes : []) {
      if (!scene || !/^\d{2}$/.test(scene.id ?? "") || ids.has(scene.id)) { fail("Scene ID 无效或重复"); continue; }
      ids.add(scene.id);
      for (const field of ["objective", "focus", "layout", "holds", "handoff", "implementation"]) if (!nonempty(scene[field])) fail(`Scene ${scene.id} 缺少 ${field}`);
      if (scene.narrationRef !== scene.id || "narration" in scene || "duration" in scene || "startSeconds" in scene) fail(`Scene ${scene.id} 口播引用或时间边界无效`);
      const spoken = narration.find(item => item.id === scene.id)?.text ?? "";
      const refs = Array.isArray(scene.sourceRefs) ? scene.sourceRefs : [];
      if (!refs.length) fail(`Scene ${scene.id} 缺少资料依据`);
      for (const ref of refs) {
        if (!ref || !ref.path?.startsWith(sourceRoot) || ["storyboard.json", "narration-script.md"].some(file => ref.path === sourceRoot + file) || !nonempty(ref.excerpt)) { fail(`Scene ${scene.id} 资料引用无效`); continue; }
        const text = read(ref.path)?.toString("utf8");
        if (text !== undefined && !text.includes(ref.excerpt)) fail(`Scene ${scene.id} 资料依据不存在`);
      }
      const elementIds = new Set();
      if (!Array.isArray(scene.elements) || !scene.elements.length) fail(`Scene ${scene.id} 缺少 elements`);
      for (const element of Array.isArray(scene.elements) ? scene.elements : []) {
        if (!element || !nonempty(element.id) || elementIds.has(element.id)) { fail(`Scene ${scene.id} 元素 ID 无效或重复`); continue; }
        elementIds.add(element.id);
        if (typeof element.text !== "string" || (dataVersion === 1 && (!nonempty(element.enter) || !nonempty(element.exit))) || typeof element.retain !== "string") fail(`元素 ${element.id} 缺少文字或生命周期`);
        if (dataVersion >= 2 && !refs[element.sourceRef]) fail(`元素 ${element.id} 缺少资料依据`);
        if (element.text && (!Number.isInteger(element.sourceRef) || !refs[element.sourceRef]?.excerpt?.includes(element.text))) fail(`元素 ${element.id} 的屏幕文字缺少依据`);
      }
      if (!Array.isArray(scene.events) || !scene.events.length) fail(`Scene ${scene.id} 缺少 events`);
      let lastAnchor = -1;
      for (const event of Array.isArray(scene.events) ? scene.events : []) {
        if (!event || !nonempty(event.id) || eventIds.has(event.id)) { fail("Event ID 无效或重复"); continue; }
        eventIds.add(event.id);
        if (![event.before, event.action, event.after].every(nonempty) || event.before === event.after || "atSeconds" in event || "atFrame" in event) fail(`Event ${event.id} 的变化链或时间边界无效`);
        const trigger = event.trigger;
        const positions = [];
        if (nonempty(trigger?.anchor)) for (let from = 0; from <= spoken.length;) {
          const at = spoken.indexOf(trigger.anchor, from);
          if (at < 0) break;
          positions.push(at); from = at + trigger.anchor.length;
        }
        const occurrence = trigger?.occurrence;
        const at = positions[occurrence - 1];
        if (trigger?.sceneId !== scene.id || !Number.isInteger(occurrence) || occurrence < 1 || at === undefined || at < lastAnchor) fail(`Event ${event.id} 的口播锚点无效、模糊或顺序错误`);
        else lastAnchor = at;
      }
      if (!Array.isArray(scene.assets)) fail(`Scene ${scene.id} 缺少 assets 列表`);
      for (const file of Array.isArray(scene.assets) ? scene.assets : []) read(sourceRoot + file);
      if (scene.diagrams !== undefined && !Array.isArray(scene.diagrams)) fail(`Scene ${scene.id} diagrams 无效`);
      for (const diagram of Array.isArray(scene.diagrams) ? scene.diagrams : []) {
        if (!diagram || !nonempty(diagram.caption)) fail(`Scene ${scene.id} 示意图说明无效`);
        read(sourceRoot + (diagram?.path ?? ""), { image: true });
      }
    }
    if ([...ids].join(",") !== narration.map(scene => scene.id).join(",") || new Set(narration.map(scene => scene.id)).size !== narration.length) fail("分镜与口播 Scene 必须一一对应并保持顺序");
    if (dataVersion >= 2) issues.push(...validateStoryboardDesign({...board, scenes: board.scenes.map(scene => ({...scene, narration: narration.find(n => n.id === scene.id)?.text ?? ""}))}));
  }
  const cover = config.seriesSelection;
  if (cover?.mode === "series" && board?.scenes?.at(-1)?.events?.at(-1)?.role !== "next-episode") fail("系列视频最后一个视觉事件必须为有资料依据的下一集预告");
  if (cover) read(`${config.sourceDirectory}/cover.json`);
  if (cover?.mode === "series") read(`public/${cover.src}`);
  if (config.style) {
    const style = getStyleDefinition(config.style);
    if (style) read(style.path); else fail("风格未知");
  }
  if (dataVersion >= 2) for (const reference of storyboardDesignReferences(project)) read(reference);
  const dependencyList = () => [...dependencies].sort(([a], [b]) => a.localeCompare(b)).map(([file, fingerprint]) => ({ path: file, fingerprint }));
  const version = () => hash(JSON.stringify({ slug: config.slug, style: config.style, seriesSelection: cover ?? null, ...(dataVersion >= 2 ? { storyboardSchemaVersion: dataVersion } : {}), dependencies: dependencyList() }));
  const designInputVersion = version();
  let designAudit = null, designAuditFingerprint = null;
  if (dataVersion >= 2) {
    const bytes = read(`${sourceRoot}storyboard-design-audit.json`);
    designAuditFingerprint = bytes ? hash(bytes) : null;
    try { designAudit = bytes ? JSON.parse(bytes.toString("utf8")) : null; } catch { fail("设计审计 JSON 无法解析"); }
    const auditIssues = schemaIssues(designAudit, dataVersion === 3 ? shotAuditSchema : auditSchema, "designAudit"); auditIssues.forEach(fail);
    if (board && !auditIssues.length) issues.push(...validateStoryboardDesignAudit(board, designAudit, { inputVersion: designInputVersion, storyboardFingerprint: hash(boardBytes), narrationFingerprint: narrationBytes ? hash(narrationBytes) : null }));
    if (auditIssues.length) designAudit = null;
  }
  const reviewVersion = version();
  return { schemaVersion: 1, kind: "storyboard-review", slug: config.slug, productionContract: "storyboard-v1", storyboardSchemaVersion: dataVersion, reviewVersion, designInputVersion, designAudit, designAuditFingerprint, ready: issues.length === 0, issues, dependencies: dependencyList(), storyboardFingerprint: boardBytes ? hash(boardBytes) : null, narrationFingerprint: narrationBytes ? hash(narrationBytes) : null, seriesSelection: cover ?? null, scenes: (Array.isArray(board?.scenes) ? board.scenes : []).filter(Boolean).map(scene => ({ ...scene, narration: narration.find(item => item.id === scene.id)?.text ?? "" })) };
}

export function storyboardBaseline(project) {
  const review = storyboardReview(project);
  if (!review.ready) throw new Error(review.issues.map(item => item.message).join("；"));
  return { schemaVersion: review.storyboardSchemaVersion === 3 ? 5 : review.storyboardSchemaVersion === 2 ? 4 : 3, kind: "storyboard-baseline", slug: review.slug, productionContract: "storyboard-v1", ...(review.storyboardSchemaVersion >= 2 ? { storyboardSchemaVersion: review.storyboardSchemaVersion, ruleVersion: review.storyboardSchemaVersion === 3 ? STORYBOARD_QUALITY_VERSION : "storyboard-execution-quality-v1", designAuditFingerprint: review.designAuditFingerprint } : {}), ...(review.storyboardSchemaVersion === 3 ? {shotIds: review.scenes.flatMap(s => s.shots.map(shot => shot.id)), eventShotMap: Object.fromEntries(review.scenes.flatMap(s => s.events.map(e => [e.id, e.shotId])))} : {}), frozenAt: new Date().toISOString(), alignmentRequired: true, reviewVersion: review.reviewVersion, storyboardFingerprint: review.storyboardFingerprint, narrationFingerprint: review.narrationFingerprint, dependencies: review.dependencies, sceneIds: review.scenes.map(scene => scene.id), eventIds: review.scenes.flatMap(scene => scene.events.map(event => event.id)) };
}

export function formatStoryboardReview(review) {
  return [
    `Gate 2：${review.slug} 口播与分镜审核`,
    `审核版本：${review.reviewVersion}`,
    "实际动画、遮挡、节奏、试听和同步在 Gate 3 验证。",
    ...review.issues.map(issue => `阻塞：${issue.message}`),
    ...review.scenes.flatMap(scene => [
      "", `Scene ${scene.id}：${scene.objective}`, `口播：${scene.narration}`,
      `焦点：${scene.focus}`, `布局：${scene.layout}`,
      ...(scene.shots ?? []).flatMap(shot => [`Shot ${shot.id}：${shot.purpose}`, `取景：${shot.framing}；构图：${shot.composition}；视角：${shot.viewpoint}；焦点：${shot.focus}；运镜：${shot.camera}`, `对象：${shot.visibleElementIds.join("、")}；进入：${shot.entryState}；退出：${shot.exitState}`, `边界：${JSON.stringify(shot.start)} → ${JSON.stringify(shot.end)}；衔接：${JSON.stringify(shot.transitionToNext)}；实现：${shot.implementation}`, ...scene.events.filter(e => e.shotId === shot.id).map(e => `${e.id}：${e.before} → ${e.action} → ${e.after}；触发「${e.trigger.anchor}」第 ${e.trigger.occurrence} 次`)]),
      ...(scene.shots ? [] : scene.events).map(event => `${event.id}：${event.before} → ${event.action} → ${event.after}；触发「${event.trigger.anchor}」第 ${event.trigger.occurrence} 次`),
      `屏幕文字：${scene.elements.filter(element => element.text).map(element => element.text).join("、")}`,
      ...(review.storyboardSchemaVersion >= 2 ? scene.elements.map(e => `元素 ${e.id}（${e.role}，父对象 ${e.parentId ?? "无"}）：${JSON.stringify(e.enter)} → ${JSON.stringify(e.exit)}；用途 ${e.purpose}`) : []),
      ...(review.designAudit?.checks ?? []).filter(c => c.sceneId === scene.id).map(c => `设计审计 ${c.eventId}/${c.checkId} ${c.result}：${c.note}；依据 ${c.evidence}`),
      ...(review.designAudit?.shotChecks ?? []).filter(c => c.sceneId === scene.id).map(c => `镜头审计 ${c.shotId} ${c.result}：${c.note}；构图 ${c.purposeComposition}；连续 ${c.objectContinuity}；切换 ${c.transitionBenefit}；时间 ${c.timingSource}；实现 ${c.implementation}；依据 ${c.evidence}`),
      `停留：${scene.holds}`, `衔接：${scene.handoff}`, `素材：${scene.assets.join("、") || "无"}`, `实现条件：${scene.implementation}`,
      ...(scene.diagrams ?? []).map(diagram => `示意图：${diagram.path}（${diagram.caption}）`),
    ]),
  ].join("\n");
}

export function frozenStoryboardIssues(project) {
  const review = storyboardReview(project);
  try {
    const baseline = JSON.parse(fs.readFileSync(path.join(project.files.directory, "prototype-baseline.json"), "utf8"));
    if (review.ready && baseline.kind === "storyboard-baseline" && (baseline.storyboardSchemaVersion ?? 1) === review.storyboardSchemaVersion && baseline.schemaVersion === (review.storyboardSchemaVersion === 3 ? 5 : review.storyboardSchemaVersion === 2 ? 4 : 3) && (review.storyboardSchemaVersion !== 3 || (JSON.stringify(baseline.shotIds) === JSON.stringify(review.scenes.flatMap(s => s.shots.map(shot => shot.id))) && JSON.stringify(baseline.eventShotMap) === JSON.stringify(Object.fromEntries(review.scenes.flatMap(s => s.events.map(e => [e.id, e.shotId])))))) && baseline.reviewVersion === review.reviewVersion && project.state.stages["gate-2"]?.review?.reviewVersion === review.reviewVersion && project.state.stages["gate-2"]?.review?.decision === "approved") return [];
  } catch { /* Missing or unreadable baseline blocks downstream production. */ }
  return [{ code: "storyboard-baseline-stale", severity: "error", stage: project.state.currentStage, message: "分镜方案未按当前版本通过 Gate 2，或冻结依赖已变化。" }];
}

const semanticText = text => String(text ?? "").replace(/[\p{P}\p{Z}\s]/gu, "");

export function storyboardTimingEvents(project, timingPlan) {
  const review = storyboardReview(project);
  if (!review.ready) throw new Error(review.issues.map(issue => issue.message).join("；"));
  const resolved = review.scenes.map(scene => {
    const timedScene = timingPlan.scenes.find(item => item.sceneId === scene.id);
    if (!timedScene) throw new Error(`Scene ${scene.id} 缺少真实时间映射`);
    const cues = timedScene.segments.flatMap(segment => segment.cues);
    const spoken = semanticText(scene.narration);
    const cueText = cues.map(cue => semanticText(cue.text)).join("");
    if (cueText !== spoken) throw new Error(`Scene ${scene.id} 字幕文本未完整对应口播，不能猜测分镜锚点`);
    const locate = (trigger, label, requireBoundary = false) => {
      const anchor = semanticText(trigger.anchor);
      const positions = [];
      for (let from = 0; from <= scene.narration.length;) { const at = scene.narration.indexOf(trigger.anchor, from); if (at < 0) break; positions.push(at); from = at + trigger.anchor.length; }
      const rawAt = positions[trigger.occurrence - 1];
      if (!anchor || rawAt === undefined) throw new Error(`${label} 锚点在真实字幕中缺失`);
      const at = semanticText(scene.narration.slice(0, rawAt)).length;
      let offset = 0, cueOffset = 0;
      const cue = cues.find(item => { const begin = offset; offset += semanticText(item.text).length; const match = at >= begin && at < offset; if (match) cueOffset = begin; return match; });
      if (!cue?.id || !cue.segmentId) throw new Error(`${label} 缺少真实 Cue／Segment ID`);
      if (requireBoundary && at !== cueOffset) throw new Error(`${label} 锚点在 Cue 中间且缺少词级时间，不能猜测切点`);
      return {cueId:cue.id, segmentId:cue.segmentId, atFrame:cue.startFrame, atSeconds:cue.startSeconds};
    };
    const result = { sceneId: scene.id, ...(review.storyboardSchemaVersion >= 2 ? { startFrame: timedScene.startFrame, endFrame: timedScene.endFrame } : {}), events: scene.events.map(event => {
      const anchor = semanticText(event.trigger.anchor);
      if (!anchor) throw new Error(`Event ${event.id} 缺少可定位锚点`);
      const positions = [];
      for (let from = 0; from <= scene.narration.length;) {
        const at = scene.narration.indexOf(event.trigger.anchor, from);
        if (at < 0) break;
        positions.push(at); from = at + event.trigger.anchor.length;
      }
      const rawAt = positions[event.trigger.occurrence - 1];
      if (rawAt === undefined) throw new Error(`Event ${event.id} 锚点在真实字幕中缺失`);
      const at = semanticText(scene.narration.slice(0, rawAt)).length;
      let offset = 0;
      const cue = cues.find(item => { const end = offset + semanticText(item.text).length; const match = at >= offset && at < end; offset = end; return match; });
      if (!cue?.id || !cue.segmentId) throw new Error(`Event ${event.id} 缺少 Cue／Segment ID`);
      return { id: event.id, cueId: cue.id, segmentId: cue.segmentId, atFrame: cue.startFrame, atSeconds: cue.startSeconds };
    }) };
    if (review.storyboardSchemaVersion === 3) result.shots = resolveShotRanges(scene, timedScene, (ref, label) => locate(ref, label, true).atFrame);
    if (review.storyboardSchemaVersion >= 2 && new Set(result.events.map(e => e.cueId)).size !== result.events.length) throw new Error(`Scene ${scene.id} 同 Cue 多事件没有词级时间来源，不能宣称精确同步；请重设计或补时间能力`);
    return result;
  });
  if (review.storyboardSchemaVersion >= 2) resolveStoryboardTiming({ scenes: review.scenes }, resolved);
  return resolved;
}

// Read-only task bridge. It cannot approve a Gate or enable an unfinished consumer.
export function storyboardImplementationTiming(project, timingPlan) {
  const review = storyboardReview(project);
  if (![2, 3].includes(review.storyboardSchemaVersion)) throw new Error("当前实现时间映射只适用于带对象执行设计的分镜格式");
  const frozenIssues = frozenStoryboardIssues(project);
  if (frozenIssues.length) throw new Error(frozenIssues.map(i => i.message).join("；"));
  const timingScenes = storyboardTimingEvents(project, timingPlan);
  return {
    schemaVersion: 1, kind: "storyboard-timing-plan", videoSlug: project.config.slug,
    reviewVersion: review.reviewVersion, storyboardFingerprint: review.storyboardFingerprint,
    timingFingerprint: hash(JSON.stringify(timingPlan)),
    ...resolveStoryboardTiming({ scenes: review.scenes }, timingScenes),
  };
}
