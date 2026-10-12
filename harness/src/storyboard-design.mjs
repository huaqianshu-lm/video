import {validateStoryboardShots, validateTimedShots} from "./storyboard-shots.mjs";
import { getLength } from "@remotion/paths";

// Shared data validation; rendering consumes the same IDs and half-open ranges.
export const STORYBOARD_QUALITY_VERSION = "storyboard-execution-quality-v2";
export const STORYBOARD_QUALITY_CHECKS = Object.freeze(Array.from({ length: 10 }, (_, i) => `SQ-${i + 1}`));
export const STORYBOARD_DESIGN_REFERENCES = Object.freeze([
  "docs/STORYBOARD-EXECUTION-QUALITY.md",
  "docs/VIDEO-PRODUCTION-RULES.md",
  "templates/video-production/tutorial-motion-recipe.md",
  "templates/video-production/storyboard-v3.schema.json",
  "templates/video-production/storyboard-design-audit-v2.schema.json",
]);
export const STORYBOARD_SHARED_REFERENCES = Object.freeze([
  "src/lib/timing.ts", "src/lib/motion.ts", "src/components/TimedCaption.tsx",
  "src/components/SceneContainer.tsx", "src/lib/videoTypes.ts", "src/styles/codex.ts",
]);

export function storyboardDesignReferences(project) {
  return storyboardSchemaVersion(project) === 3 ? STORYBOARD_DESIGN_REFERENCES : STORYBOARD_DESIGN_REFERENCES.map(file => file.replace('storyboard-v3.schema.json', 'storyboard-v2.schema.json').replace('storyboard-design-audit-v2.schema.json', 'storyboard-design-audit.schema.json'));
}

export function storyboardSchemaVersion(project) {
  const version = project.config.storyboardSchemaVersion ?? 1;
  if (![1, 2, 3].includes(version)) throw Object.assign(new Error(`不支持分镜数据版本 ${version}`), { code: "storyboard-version-unsupported" });
  return version;
}

const issue = (code, message, ids = {}) => ({ code, severity: "error", stage: "storyboard", message, ...ids });
const fail = (message, ids) => issue("storyboard-execution-invalid", message, ids);

function indexBoard(board) {
  const scenes = new Map(), events = new Map(), elements = new Map(), issues = [];
  let cursor = 0;
  for (const scene of board.scenes) {
    const start = cursor;
    for (const event of scene.events) {
      events.set(event.id, { ...event, sceneId: scene.id, start: cursor + 1, complete: cursor + 2 });
      cursor += 4;
    }
    scenes.set(scene.id, { start, end: cursor, scene });
    for (const element of scene.elements) {
      if (elements.has(element.id)) issues.push(fail(`元素 ${element.id} 全片 ID 重复；跨幕对象仅声明一次`, { sceneId: scene.id, elementId: element.id }));
      elements.set(element.id, { ...element, sceneId: scene.id });
    }
  }
  return { scenes, events, elements, issues };
}

function boundary(ref, scenes, events) {
  const entry = ref?.type === "scene" ? scenes.get(ref.id) : ref?.type === "event" ? events.get(ref.id) : null;
  const validEdges = ref?.type === "scene" ? ["start", "end"] : ["start", "complete"];
  if (!entry || !validEdges.includes(ref.edge)) throw new Error(`不存在或无效的生命周期边界 ${JSON.stringify(ref)}`);
  return entry[ref.edge];
}

function intervalIssues(elements, scenes, events) {
  const issues = [], intervals = new Map();
  for (const element of elements.values()) {
    const ids = { sceneId: element.sceneId, elementId: element.id };
    const layout = element.layout;
    if (layout.mode === "box" && (![layout.x, layout.y, layout.width, layout.height].every(Number.isFinite) || layout.width <= 0 || layout.height <= 0)) issues.push(fail(`元素 ${element.id} 缺少有效 box 布局`, ids));
    if (layout.mode === "slot" && !layout.slot) issues.push(fail(`元素 ${element.id} 缺少公共布局 slot`, ids));
    if (element.type === "text" && !element.text.trim()) issues.push(fail(`文字元素 ${element.id} 为空`, ids));
    if (element.type === "group" && element.text.trim()) issues.push(fail(`元素 ${element.id} group 文字必须由独立元素声明`, ids));
    if (element.type === "path" && !element.geometry?.trim()) issues.push(fail(`路径 ${element.id} 缺少实际几何关系`, ids));
    if (element.type === "path" && element.geometry?.trim()) {
      try { if (!(getLength(element.geometry) > 0)) throw new Error("路径长度为空"); }
      catch { issues.push(fail(`路径 ${element.id} 几何关系无效`, ids)); }
    }
    try {
      const start = boundary(element.enter, scenes, events), end = boundary(element.exit, scenes, events);
      if (start >= end) issues.push(fail(`元素 ${element.id} 可见区间反向或为空`, ids));
      if (start < scenes.get(element.sceneId).start) issues.push(fail(`元素 ${element.id} 早于声明 Scene 出现`, ids));
      if (end > scenes.get(element.sceneId).end && (!element.retain?.trim() || element.exit.type !== "event" || ![...events.values()].some(e => e.sceneId !== element.sceneId && e.execution.elements.includes(element.id)))) issues.push(fail(`跨幕元素 ${element.id} 缺少具体后续用途或终止事件`, ids));
      if (element.role === "context-title" && start === [...scenes.values()][0].start && end === [...scenes.values()].at(-1).end) issues.push(fail(`标题 ${element.id} 不得全片常驻`, ids));
      intervals.set(element.id, { start, end });
    } catch (error) { issues.push(fail(error.message, ids)); }
  }
  for (const element of elements.values()) {
    if (element.parentId === null) continue;
    const ids = { sceneId: element.sceneId, elementId: element.id };
    const parent = elements.get(element.parentId);
    if (!parent || parent.type !== "group") { issues.push(fail(`元素 ${element.id} 父对象不存在或不是 group`, ids)); continue; }
    const visited = new Set([element.id]);
    let ancestor = parent;
    while (ancestor) {
      if (visited.has(ancestor.id)) { issues.push(fail(`元素 ${element.id} 父子关系存在循环`, ids)); break; }
      visited.add(ancestor.id); ancestor = elements.get(ancestor.parentId);
    }
    const childRange = intervals.get(element.id), parentRange = intervals.get(parent.id);
    if (childRange && parentRange && (childRange.start < parentRange.start || childRange.end > parentRange.end)) issues.push(fail(`元素 ${element.id} 可见区间越出父对象 ${parent.id}`, ids));
    if (element.layout.mode === "box" && parent.layout.mode === "box" && (element.layout.x < 0 || element.layout.y < 0 || element.layout.x + element.layout.width > parent.layout.width || element.layout.y + element.layout.height > parent.layout.height)) issues.push(fail(`元素 ${element.id} 静态布局越出父对象 ${parent.id}；动态遮挡仍须实际观看`, ids));
  }
  return { issues, intervals };
}

export function validateStoryboardDesign(board) {
  const { scenes, events, elements, issues } = indexBoard(board);
  const ranges = intervalIssues(elements, scenes, events); issues.push(...ranges.issues);
  for (const event of events.values()) {
    const ids = { sceneId: event.sceneId, eventId: event.id }, action = event.execution;
    if (typeof action.capability !== "string" || !action.capability.trim()) issues.push(fail(`Event ${event.id} 缺少动作说明`, ids));
    if (new Set(action.elements).size !== action.elements.length) issues.push(fail(`Event ${event.id} 重复引用对象`, ids));
    if (action.capability === "focus" && ![1, 2].includes(action.elements.length)) issues.push(fail(`Event ${event.id} focus 需要一个目标或按旧／新顺序的两个目标`, ids));
    if (action.capability === "path-reveal") for (const id of action.elements) if (elements.has(id) && elements.get(id).type !== "path") issues.push(fail(`Event ${event.id} path-reveal 的元素 ${id} 不是 path`, { ...ids, elementId: id }));
    for (const id of action.elements) if (!elements.has(id)) issues.push(fail(`Event ${event.id} 引用不存在的元素 ${id}`, { ...ids, elementId: id }));
    if (!["replace", "create-result"].includes(action.capability)) for (const id of action.elements) {
      const element = elements.get(id), range = ranges.intervals.get(id);
      if (!element || !range) continue;
      if (action.capability === "show" && (element.enter.type !== "event" || element.enter.id !== event.id || element.enter.edge !== "start")) issues.push(fail(`Event ${event.id} show 与元素 ${id} 的进入边界矛盾`, { ...ids, elementId: id }));
      if (action.capability === "hide" && (element.exit.type !== "event" || element.exit.id !== event.id)) issues.push(fail(`Event ${event.id} hide 与元素 ${id} 的退出边界矛盾`, { ...ids, elementId: id }));
      if (!["show", "hide"].includes(action.capability) && (range.start > event.start || range.end < event.complete)) issues.push(fail(`Event ${event.id} 动作期间元素 ${id} 不可见`, { ...ids, elementId: id }));
    }
    if (["replace", "create-result"].includes(action.capability)) {
      const [before, after] = action.elements.map(id => elements.get(id));
      if (action.elements.length !== 2 || !before || !after) { issues.push(fail(`Event ${event.id} 必须分别引用前态／请求与后态／结果`, ids)); continue; }
      if (before.parentId !== after.parentId || before.exit.type !== "event" || before.exit.id !== event.id || after.enter.type !== "event" || after.enter.id !== event.id || after.enter.edge !== "complete") issues.push(fail(`Event ${event.id} 状态替换生命周期或共同父对象矛盾`, ids));
      const a = ranges.intervals.get(before.id), b = ranges.intervals.get(after.id);
      if (a && b && (a.start >= event.start || a.end > b.start)) issues.push(fail(`Event ${event.id} 前态未建立或互斥状态重叠`, ids));
      if (action.capability === "create-result" && (before.role !== "request" || after.role !== "result")) issues.push(fail(`Event ${event.id} 请求与结果身份不明确`, ids));
    }
    for (const id of action.elements) {
      const element = elements.get(id);
      if (element?.type === "path" && !element.geometry?.trim()) issues.push(fail(`路径 ${id} 缺少实际几何关系`, { ...ids, elementId: id }));
    }
    if (action.capability === "move" && (!action.from || !action.to || (action.from.x === action.to.x && action.from.y === action.to.y))) issues.push(fail(`Event ${event.id} 移动缺少不同的前后位置`, ids));
  }
  for (const element of elements.values()) {
    const moves = [...events.values()].filter(e => e.execution.capability === "move" && e.execution.elements.includes(element.id));
    let position = { x: 0, y: 0 };
    for (const event of moves) {
      const { from, to } = event.execution;
      if (from && (from.x !== position.x || from.y !== position.y)) issues.push(fail(`Event ${event.id} 元素 ${element.id} 移动起点与上次终点不连续`, { sceneId: event.sceneId, eventId: event.id, elementId: element.id }));
      if (to) position = to;
    }
  }
  issues.push(...validateStoryboardShots(board));
  return issues;
}

export function validateStoryboardDesignAudit(board, audit, { inputVersion, storyboardFingerprint, narrationFingerprint }) {
  const issues = [], expected = new Map(board.scenes.flatMap(s => s.events.flatMap(e => STORYBOARD_QUALITY_CHECKS.map(check => [`${s.id}/${e.id}/${check}`, e]))));
  if (audit.ruleVersion !== (board.schemaVersion === 3 ? STORYBOARD_QUALITY_VERSION : "storyboard-execution-quality-v1") || audit.videoSlug !== board.videoSlug || audit.inputVersion !== inputVersion || audit.storyboardFingerprint !== storyboardFingerprint || audit.narrationFingerprint !== narrationFingerprint) issues.push(issue("storyboard-audit-stale", "设计审计未绑定当前规则、分镜、口播和资料输入版本"));
  const seen = new Set(), elements = new Set(board.scenes.flatMap(s => s.elements.map(e => e.id)));
  for (const check of audit.checks) {
    const key = `${check.sceneId}/${check.eventId}/${check.checkId}`;
    if (!expected.has(key) || seen.has(key)) issues.push(issue("storyboard-audit-coverage", `设计审计未知或重复项 ${key}`));
    seen.add(key);
    if (check.result !== "pass") issues.push(issue("storyboard-audit-failed", `设计审计 ${key} 为 ${check.result}：${check.note}`));
    if (check.elementIds.some(id => !elements.has(id))) issues.push(issue("storyboard-audit-coverage", `设计审计 ${key} 引用未知对象`));
  }
  if ([...expected.keys()].some(key => !seen.has(key))) issues.push(issue("storyboard-audit-coverage", "设计审计未覆盖每个 Scene／Event 的 SQ-1～SQ-10"));
  if (board.schemaVersion === 3) {
    const expectedShots = new Map(board.scenes.flatMap(s => s.shots.map(shot => [`${s.id}/${shot.id}`, shot]))), found = new Set();
    for (const check of audit.shotChecks ?? []) {
      const key = `${check.sceneId}/${check.shotId}`, shot = expectedShots.get(key);
      if (!shot || found.has(key)) issues.push(issue("storyboard-audit-coverage", `镜头审计未知或重复项 ${key}`));
      found.add(key);
      if (check.result !== "pass" || ['purposeComposition','objectContinuity','transitionBenefit','timingSource','implementation','evidence','note'].some(field => !check[field]?.trim())) issues.push(issue("storyboard-audit-failed", `Shot ${key} 缺少通过的具体设计审计`));
      if (shot && (check.elementIds?.some(id => !shot.visibleElementIds.includes(id)) || shot.visibleElementIds.some(id => !check.elementIds?.includes(id)))) issues.push(issue("storyboard-audit-coverage", `Shot ${key} 审计未覆盖可见对象`));
    }
    if ([...expectedShots.keys()].some(key => !found.has(key))) issues.push(issue("storyboard-audit-coverage", "设计审计缺少逐 Shot 检查"));
  }
  return issues;
}

export function resolveStoryboardTiming(board, timingScenes) {
  const designIssues = validateStoryboardDesign(board);
  if (designIssues.length) throw new Error(designIssues.map(i => i.message).join("；"));
  const index = indexBoard(board);
  const timedScenes = new Map(timingScenes.map(s => [s.sceneId, s]));
  const events = new Map();
  for (const [id, event] of index.events) {
    const scene = timedScenes.get(event.sceneId), timed = scene?.events.find(e => e.id === id);
    if (!timed || !Number.isInteger(timed.atFrame)) throw new Error(`Event ${id} 缺少真实时间`);
    events.set(id, { ...event, start: timed.atFrame, complete: timed.atFrame + event.execution.durationFrames });
    if (events.get(id).complete > scene.endFrame) throw new Error(`Event ${id} 动作越出真实 Scene 时间`);
  }
  for (const scene of timingScenes) {
    for (let i = 1; i < scene.events.length; i++) {
      const before = events.get(scene.events[i - 1].id), after = events.get(scene.events[i].id);
      if (before.complete > after.start) throw new Error(`Event ${before.id}／${after.id} 真实动作区间重叠，需要重设计或细粒度时间能力`);
    }
  }
  const scenes = new Map(timingScenes.map(s => [s.sceneId, { start: s.startFrame, end: s.endFrame }]));
  const result = intervalIssues(index.elements, scenes, events);
  if (result.issues.length) throw new Error(result.issues.map(i => i.message).join("；"));
  const shots = validateTimedShots(board, timingScenes, events, result.intervals);
  return { shots, elements: [...index.elements.values()].map(e => ({ ...e, ...result.intervals.get(e.id) })), events: [...events.values()] };
}
