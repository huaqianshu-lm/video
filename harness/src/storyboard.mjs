import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getStyleDefinition } from "./styles.mjs";

export const storyboardPath = project => `${project.config.sourceDirectory}/storyboard.json`;
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const nonempty = value => typeof value === "string" && Boolean(value.trim());
const schema = JSON.parse(fs.readFileSync(new URL("../../templates/video-production/storyboard.schema.json", import.meta.url), "utf8"));

function schemaIssues(value, rule, location = "storyboard") {
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value;
  const types = rule.type ? (Array.isArray(rule.type) ? rule.type : [rule.type]) : [];
  if ((types.length && !types.includes(type)) || ("const" in rule && value !== rule.const) || (rule.enum && !rule.enum.includes(value))) return [`${location} 类型或值不符合 Schema`];
  const issues = [];
  if (typeof value === "string" && ((rule.minLength && !value.trim()) || (rule.pattern && !new RegExp(rule.pattern).test(value)))) issues.push(`${location} 文本无效`);
  if (type === "integer" && rule.minimum !== undefined && value < rule.minimum) issues.push(`${location} 数值无效`);
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
  const shapeIssues = schemaIssues(board, schema);
  shapeIssues.forEach(fail);
  if (shapeIssues.length) board = null;
  if (board) {
    if (board.schemaVersion !== 1 || board.videoSlug !== config.slug || board.workflow !== "narrated-tutorial-v1" || board.productionContract !== "storyboard-v1" || board.style !== config.style || JSON.stringify(board.seriesSelection) !== JSON.stringify(config.seriesSelection ?? null)) fail("Storyboard 视频、Workflow、契约、风格或系列选择不一致");
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
        if (typeof element.text !== "string" || !nonempty(element.enter) || !nonempty(element.exit) || typeof element.retain !== "string") fail(`元素 ${element.id} 缺少文字或生命周期`);
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
  }
  const cover = config.seriesSelection;
  if (cover?.mode === "series" && board?.scenes?.at(-1)?.events?.at(-1)?.role !== "next-episode") fail("系列视频最后一个视觉事件必须为有资料依据的下一集预告");
  if (cover) read(`${config.sourceDirectory}/cover.json`);
  if (cover?.mode === "series") read(`public/${cover.src}`);
  if (config.style) {
    const style = getStyleDefinition(config.style);
    if (style) read(style.path); else fail("风格未知");
  }
  const dependencyList = [...dependencies].sort(([a], [b]) => a.localeCompare(b)).map(([file, fingerprint]) => ({ path: file, fingerprint }));
  const reviewVersion = hash(JSON.stringify({ slug: config.slug, style: config.style, seriesSelection: cover ?? null, dependencies: dependencyList }));
  return { schemaVersion: 1, kind: "storyboard-review", slug: config.slug, productionContract: "storyboard-v1", reviewVersion, ready: issues.length === 0, issues, dependencies: dependencyList, storyboardFingerprint: boardBytes ? hash(boardBytes) : null, narrationFingerprint: narrationBytes ? hash(narrationBytes) : null, seriesSelection: cover ?? null, scenes: (Array.isArray(board?.scenes) ? board.scenes : []).filter(Boolean).map(scene => ({ ...scene, narration: narration.find(item => item.id === scene.id)?.text ?? "" })) };
}

export function storyboardBaseline(project) {
  const review = storyboardReview(project);
  if (!review.ready) throw new Error(review.issues.map(item => item.message).join("；"));
  return { schemaVersion: 3, kind: "storyboard-baseline", slug: review.slug, productionContract: "storyboard-v1", frozenAt: new Date().toISOString(), alignmentRequired: true, reviewVersion: review.reviewVersion, storyboardFingerprint: review.storyboardFingerprint, narrationFingerprint: review.narrationFingerprint, dependencies: review.dependencies, sceneIds: review.scenes.map(scene => scene.id), eventIds: review.scenes.flatMap(scene => scene.events.map(event => event.id)) };
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
      ...scene.events.map(event => `${event.id}：${event.before} → ${event.action} → ${event.after}；触发「${event.trigger.anchor}」第 ${event.trigger.occurrence} 次`),
      `屏幕文字：${scene.elements.filter(element => element.text).map(element => element.text).join("、")}`,
      `停留：${scene.holds}`, `衔接：${scene.handoff}`, `素材：${scene.assets.join("、") || "无"}`, `实现条件：${scene.implementation}`,
      ...(scene.diagrams ?? []).map(diagram => `示意图：${diagram.path}（${diagram.caption}）`),
    ]),
  ].join("\n");
}

export function frozenStoryboardIssues(project) {
  const review = storyboardReview(project);
  try {
    const baseline = JSON.parse(fs.readFileSync(path.join(project.files.directory, "prototype-baseline.json"), "utf8"));
    if (baseline.kind === "storyboard-baseline" && baseline.reviewVersion === review.reviewVersion && project.state.stages["gate-2"]?.review?.reviewVersion === review.reviewVersion && project.state.stages["gate-2"]?.review?.decision === "approved") return [];
  } catch { /* Missing or unreadable baseline blocks downstream production. */ }
  return [{ code: "storyboard-baseline-stale", severity: "error", stage: project.state.currentStage, message: "分镜方案未按当前版本通过 Gate 2，或冻结依赖已变化。" }];
}

const semanticText = text => String(text ?? "").replace(/[\p{P}\p{Z}\s]/gu, "");

export function storyboardTimingEvents(project, timingPlan) {
  const review = storyboardReview(project);
  if (!review.ready) throw new Error(review.issues.map(issue => issue.message).join("；"));
  return review.scenes.map(scene => {
    const timedScene = timingPlan.scenes.find(item => item.sceneId === scene.id);
    if (!timedScene) throw new Error(`Scene ${scene.id} 缺少真实时间映射`);
    const cues = timedScene.segments.flatMap(segment => segment.cues);
    const spoken = semanticText(scene.narration);
    const cueText = cues.map(cue => semanticText(cue.text)).join("");
    if (cueText !== spoken) throw new Error(`Scene ${scene.id} 字幕文本未完整对应口播，不能猜测分镜锚点`);
    return { sceneId: scene.id, events: scene.events.map(event => {
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
  });
}
