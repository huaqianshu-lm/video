import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { workflowPaths, workflowStageDefinition, workflowStageIndex } from "./registry.mjs";

const ASSET_TYPES = new Set(["logo", "screenshot", "screen-recording", "image", "font", "music", "sfx"]);
const FORBIDDEN_PROMO_FILES = new Set([
  "narration-script.md",
  "tts-script.json",
  "audio-manifest.json",
  "subtitle-manifest.json",
  "timeline-manifest.json",
]);

function issue(stage, code, message, issuePath = null) {
  return { code, stage, path: issuePath, message, severity: "error" };
}

function absolutePath(project, relativePath) {
  return path.join(project.config.workspaceRoot, relativePath);
}

function safeProjectRelativePath(value) {
  if (typeof value !== "string" || !value.trim() || value.includes("\\")) return null;
  const normalized = value.trim();
  const segments = normalized.split("/");
  if (normalized.startsWith("/")
    || /^[A-Za-z]:\//.test(normalized)
    || segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return normalized;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function allowedPromoImplementationPath(project, relativePath) {
  const remotionDirectory = workflowPaths(project).remotionDirectory;
  return [
    `${remotionDirectory}/`,
    "src/components/",
    "src/scenes/",
    "src/lib/",
    "styles/",
  ].some((prefix) => relativePath.startsWith(prefix));
}

function artifactPath(project, stage, index = 0) {
  return workflowStageDefinition(project, stage)?.artifacts?.[index]
    ?.replaceAll("{slug}", project.config.slug) ?? null;
}

function readText(project, relativePath) {
  if (!relativePath) return null;
  const filePath = absolutePath(project, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  return fs.readFileSync(filePath, "utf8");
}

function readJson(project, relativePath) {
  const text = readText(project, relativePath);
  if (text === null) return { value: null, error: null };
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error };
  }
}

function normalizedSceneId(value) {
  const match = String(value ?? "").match(/(?:scene[-_ ]?)?(\d+)/i);
  return match ? `scene-${match[1].padStart(2, "0")}` : null;
}

function sceneBlocks(text) {
  if (typeof text !== "string") return [];
  const matches = [...text.matchAll(/^##\s+Scene\s+(\d+)(?:\s*[：:-]\s*(.*))?\s*$/gim)];
  return matches.map((match, index) => ({
    sceneId: `scene-${match[1].padStart(2, "0")}`,
    title: match[2]?.trim() ?? "",
    body: text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length).trim(),
  }));
}

function fieldValue(body, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`^\\s*(?:[-*]\\s*)?${escaped}\\s*[:：]\\s*(.+?)\\s*$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function fieldValueFromAny(body, fields) {
  return fields.map((field) => fieldValue(body, field)).find(Boolean) ?? "";
}

function listValue(value) {
  return String(value ?? "")
    .replace(/^\s*[\[（(]/, "")
    .replace(/[\]）)]\s*$/, "")
    .split(/[,，、|]/)
    .map((item) => item.trim().replace(/^['"“”]|['"“”]$/g, ""))
    .filter(Boolean);
}

function screenTextIdsFromValue(value) {
  return listValue(value)
    .map((item) => item.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\s*(?:[:：=]|$)/i)?.[1] ?? null)
    .filter(Boolean);
}

function sceneIdsFromText(text) {
  return sceneBlocks(text).map(({ sceneId }) => sceneId);
}

function compareIds(stage, label, expected, actual, relativePath) {
  if (expected.join(",") === actual.join(",")) return [];
  return [issue(stage, "scene-id-mismatch", `${label} 的 Scene ID 与上游资料不一致`, relativePath)];
}

function validateProjectPaths(project, stage) {
  const expected = workflowPaths(project);
  const fields = ["sourceDirectory", "remotionDirectory", "assetArchive", "renderInputDirectory"];
  return fields.flatMap((field) => project.config[field] === expected[field]
    ? []
    : [issue(stage, "workflow-path-mismatch", `Workflow 路径字段 ${field} 必须为 ${expected[field]}`, "project.json")]);
}

function walkFiles(root, current = root) {
  if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) return walkFiles(root, absolute);
    if (!entry.isFile()) return [];
    return [path.relative(root, absolute).split(path.sep).join("/")];
  });
}

function validateNoNarratedArtifacts(project, stage) {
  const roots = [project.config.sourceDirectory, project.config.remotionDirectory]
    .map((relativePath) => absolutePath(project, relativePath));
  const found = roots.flatMap((root) => walkFiles(root).map((relativePath) => ({ root, relativePath })));
  return found.flatMap(({ root, relativePath }) => {
    const basename = path.posix.basename(relativePath);
    const isGeneratedManifest = relativePath.startsWith("generated/") && FORBIDDEN_PROMO_FILES.has(basename);
    if (!FORBIDDEN_PROMO_FILES.has(basename) && !isGeneratedManifest) return [];
    return [issue(stage, "promo-forbidden-narrated-artifact", `宣传片不得创建 narrated 产物：${path.relative(project.config.workspaceRoot, path.join(root, relativePath))}`)];
  });
}

function validateDocumentFields(project, stage, relativePath, fields, label) {
  const text = readText(project, relativePath);
  if (text === null) return [];
  const issues = [];
  for (const field of fields) {
    if (!fieldValueFromAny(text, Array.isArray(field) ? field : [field])) {
      issues.push(issue(stage, "missing-promo-field", `${label} 缺少 ${Array.isArray(field) ? field.join("／") : field}`, relativePath));
    }
  }
  return issues;
}

function validateSource(project, stage) {
  const relativePath = artifactPath(project, "source");
  const text = readText(project, relativePath);
  if (text === null) return [];
  return validateDocumentFields(project, stage, relativePath, [
    ["产品名称", "产品／个人站名称", "productName"],
    ["一句话定义", "产品定义", "productDefinition"],
    ["目标受众", "受众", "audience"],
    ["核心价值", "核心价值主张", "valueProposition"],
    ["CTA", "行动号召", "cta"],
    ["素材", "品牌素材", "assets"],
    ["来源", "授权", "source"],
  ], "Source");
}

function validateBrief(project, stage) {
  const relativePath = artifactPath(project, "promo-brief");
  const text = readText(project, relativePath);
  if (text === null) return [];
  return validateDocumentFields(project, stage, relativePath, [
    ["目标受众", "受众", "audience"],
    ["观看平台", "平台", "platform"],
    ["传播目标", "唯一传播目标", "objective"],
    ["核心价值", "核心价值主张", "valueProposition"],
    ["核心卖点", "事实依据", "proof"],
    ["CTA", "行动号召", "cta"],
    ["时长", "duration"],
    ["不可说", "限制", "constraints"],
  ], "Promo Brief");
}

function validateConcept(project, stage) {
  const relativePath = artifactPath(project, "creative-concept");
  const text = readText(project, relativePath);
  if (text === null) return [];
  return validateDocumentFields(project, stage, relativePath, [
    ["开头钩子", "钩子", "hook"],
    ["核心视觉概念", "视觉概念", "visualConcept"],
    ["叙事节奏", "节奏", "rhythm"],
    ["视觉证明方式", "证明方式", "proofMethod"],
    ["动效边界", "动效", "motionBoundary"],
    ["素材路线", "素材", "assetPlan"],
    ["音乐", "音乐／音效", "audioPlan"],
  ], "Creative Concept");
}

function validateSceneDocument(project, stage, kind) {
  const stageName = kind === "scene-script" ? "scene-script" : "visual-script";
  const relativePath = artifactPath(project, stageName);
  const text = readText(project, relativePath);
  if (text === null) return [];
  const scenes = sceneBlocks(text);
  const issues = [];
  if (scenes.length < 4 || scenes.length > 6) {
    issues.push(issue(stage, "promo-scene-count-invalid", `宣传片必须有 4～6 个 Scene，当前为 ${scenes.length}`, relativePath));
  }
  const seen = new Set();
  for (const scene of scenes) {
    if (seen.has(scene.sceneId)) issues.push(issue(stage, "duplicate-scene-id", `Scene ID 重复：${scene.sceneId}`, relativePath));
    seen.add(scene.sceneId);
    const fields = kind === "scene-script"
      ? ["sceneId", "title", "purpose", "narrativeRole", "visualIntent", "visualType", "keyOnScreenText", "videoValue", "evidence"]
      : ["sceneId", "visualIntent", ["visualEvents", "视觉事件", "动画"], ["screenText", "屏幕文字", "keyOnScreenText"], ["assets", "素材", "assetNeeds"], "videoValue"];
    issues.push(...fields.flatMap((field) => fieldValueFromAny(scene.body, Array.isArray(field) ? field : [field])
      ? []
      : [issue(stage, "missing-scene-field", `${scene.sceneId} 缺少 ${Array.isArray(field) ? field[0] : field}`, relativePath)]));
    if (kind === "scene-script" && scene.title === "") {
      issues.push(issue(stage, "missing-scene-title", `${scene.sceneId} 缺少标题`, relativePath));
    }
  }
  return issues;
}

function validateSceneAlignment(project, stage) {
  const scenePath = artifactPath(project, "scene-script");
  const visualPath = artifactPath(project, "visual-script");
  const sceneText = readText(project, scenePath);
  const visualText = readText(project, visualPath);
  if (sceneText === null || visualText === null) return [];
  return compareIds(stage, "Visual Script", sceneIdsFromText(sceneText), sceneIdsFromText(visualText), visualPath);
}

function sceneTextIndex(project) {
  const text = readText(project, artifactPath(project, "scene-script"));
  return new Map(sceneBlocks(text ?? "").map((scene) => [scene.sceneId, {
    screenTextIds: screenTextIdsFromValue(fieldValue(scene.body, "keyOnScreenText")),
    screenText: fieldValue(scene.body, "keyOnScreenText"),
  }]));
}

function prototypeSceneIds(text) {
  const sections = [...String(text ?? "").matchAll(/<section\b[^>]*class=["'][^"']*\bscene\b[^"']*["'][^>]*>/gi)];
  return sections.map((match, index) => {
    const explicit = match[0].match(/(?:data-scene(?:-id)?|id)=["']([^"']+)["']/i)?.[1];
    return normalizedSceneId(explicit) ?? `scene-${String(index + 1).padStart(2, "0")}`;
  });
}

function validatePrototype(project, stage) {
  const relativePath = artifactPath(project, "motion-prototype");
  const text = readText(project, relativePath);
  if (text === null) return [];
  const issues = [];
  const requiredPatterns = [
    /<main\b[^>]*class=["'][^"']*\bshell\b/i,
    /<header\b[^>]*class=["'][^"']*\btoolbar\b/i,
    /<div\b[^>]*class=["'][^"']*\bstage\b/i,
    /<section\b[^>]*class=["'][^"']*\bscene\b/i,
    /<div\b[^>]*class=["'][^"']*\bcaption\b/i,
    /<div\b[^>]*class=["'][^"']*\bcontrols\b/i,
    /<div\b[^>]*class=["'][^"']*\bprogress\b/i,
    /<div\b[^>]*class=["'][^"']*\bmeta\b/i,
    /aspect-ratio\s*:\s*16\s*\/\s*9/i,
  ];
  if (!requiredPatterns.every((pattern) => pattern.test(text))) {
    issues.push(issue(stage, "promo-prototype-shell-invalid", "Motion Prototype 必须复用 16:9 shell、toolbar、stage、Scene、caption、controls、progress 和 meta 外壳", relativePath));
  }
  const expectedIds = sceneIdsFromText(readText(project, artifactPath(project, "scene-script")) ?? "");
  const actualIds = prototypeSceneIds(text);
  issues.push(...compareIds(stage, "Motion Prototype", expectedIds, actualIds, relativePath));
  const blocks = [...text.matchAll(/<section\b[^>]*class=["'][^"']*\bscene\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi)].map((match) => match[0]);
  for (const [index, block] of blocks.entries()) {
    const eyebrow = (block.match(/class=["'][^"']*\beyebrow\b[^"']*["']/gi) ?? []).length;
    const headings = (block.match(/<h1\b|class=["'][^"']*\btitle\b[^"']*["']/gi) ?? []).length;
    if (eyebrow !== 1 || headings !== 1) {
      issues.push(issue(stage, "promo-prototype-title-invalid", `Scene ${String(index + 1).padStart(2, "0")} 必须只有一个左上标题区`, relativePath));
    }
  }
  if (/上一幕|下一幕|自动播放|暂停播放/.test(text) === false) {
    issues.push(issue(stage, "promo-prototype-controls-invalid", "Motion Prototype 缺少审核用 Scene 控件", relativePath));
  }
  return issues;
}

function safeRelativeAssetPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const candidate = value.replaceAll("\\", "/");
  return !candidate.startsWith("/")
    && !/^[a-z]+:\/\//i.test(candidate)
    && !candidate.split("/").includes("..")
    && path.posix.normalize(candidate) === candidate
    && candidate !== ".";
}

function validateAssetManifest(project, stage) {
  const relativePath = artifactPath(project, "asset-preparation");
  const { value, error } = readJson(project, relativePath);
  if (error) return [issue(stage, "invalid-json", `无法解析 Asset Manifest：${error.message}`, relativePath)];
  if (!value) return [];
  const issues = [];
  if (value.schemaVersion !== 1 || value.slug !== project.config.slug || !Array.isArray(value.assets) || value.assets.length === 0) {
    issues.push(issue(stage, "invalid-promo-asset-schema", "Asset Manifest 必须包含 schemaVersion=1、正确 slug 和非空 assets", relativePath));
    return issues;
  }
  const sceneIds = sceneIdsFromText(readText(project, artifactPath(project, "scene-script")) ?? "");
  const assetIds = new Set();
  const assetPaths = new Set();
  for (const asset of value.assets) {
    if (!asset || typeof asset.id !== "string" || !asset.id.trim()) {
      issues.push(issue(stage, "invalid-promo-asset", "Asset Manifest 存在无效素材 ID", relativePath));
      continue;
    }
    if (assetIds.has(asset.id)) issues.push(issue(stage, "duplicate-promo-asset-id", `Asset ID 重复：${asset.id}`, relativePath));
    assetIds.add(asset.id);
    if (!ASSET_TYPES.has(asset.type)) issues.push(issue(stage, "invalid-promo-asset-type", `素材 ${asset.id} 的 type 无效：${asset.type}`, relativePath));
    if (!safeRelativeAssetPath(asset.path)) issues.push(issue(stage, "invalid-promo-asset-path", `素材 ${asset.id} 的 path 必须是安全的本地相对路径`, relativePath));
    if (assetPaths.has(asset.path)) issues.push(issue(stage, "duplicate-promo-asset-path", `素材路径重复：${asset.path}`, relativePath));
    assetPaths.add(asset.path);
    if (typeof asset.source !== "string" || !asset.source.trim()) issues.push(issue(stage, "promo-asset-source-missing", `素材 ${asset.id} 缺少可追溯 source`, relativePath));
    if (!Array.isArray(asset.scenes) || asset.scenes.length === 0) issues.push(issue(stage, "promo-asset-scenes-missing", `素材 ${asset.id} 缺少 Scene 关联`, relativePath));
    for (const sceneId of asset.scenes ?? []) {
      if (!sceneIds.includes(normalizedSceneId(sceneId))) issues.push(issue(stage, "promo-asset-scene-invalid", `素材 ${asset.id} 关联了未知 Scene：${sceneId}`, relativePath));
    }
    if (safeRelativeAssetPath(asset.path)) {
      const localPath = path.join(project.config.workspaceRoot, "public", "local-assets", project.config.slug, asset.path);
      if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) issues.push(issue(stage, "promo-asset-file-missing", `素材 ${asset.id} 不存在：public/local-assets/${project.config.slug}/${asset.path}`, relativePath));
    }
  }
  const sourceRoot = path.join(project.config.workspaceRoot, "public", "local-assets", project.config.slug);
  for (const localPath of walkFiles(sourceRoot)) {
    if (!assetPaths.has(localPath)) issues.push(issue(stage, "promo-asset-unlisted", `本地素材未登记到 Asset Manifest：${localPath}`, relativePath));
  }
  return issues;
}

function integerFrame(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateReferenceIds(ids, known, label, stage, relativePath) {
  if (!Array.isArray(ids)) return [issue(stage, "promo-timeline-list-missing", `${label} 必须是数组`, relativePath)];
  return ids.filter((id) => !known.has(id)).map((id) => issue(stage, "promo-timeline-reference-invalid", `${label} 引用了未知 ID：${id}`, relativePath));
}

function validateVisualTimeline(project, stage) {
  const relativePath = artifactPath(project, "visual-timeline");
  const { value, error } = readJson(project, relativePath);
  if (error) return [issue(stage, "invalid-json", `无法解析 Visual Timeline：${error.message}`, relativePath)];
  if (!value) return [];
  const issues = [];
  if (value.schemaVersion !== 1 || value.slug !== project.config.slug || value.fps !== 30 || value.width !== 1920 || value.height !== 1080) {
    issues.push(issue(stage, "invalid-promo-timeline-schema", "Visual Timeline 必须声明 schemaVersion=1、正确 slug、1920×1080 和 30fps", relativePath));
  }
  if (!integerFrame(value.durationInFrames) || value.durationInFrames < 600 || value.durationInFrames > 900) {
    issues.push(issue(stage, "promo-timeline-duration-invalid", "Visual Timeline 总时长必须为 20～30 秒（600～900 帧）", relativePath));
  }
  const sceneIds = sceneIdsFromText(readText(project, artifactPath(project, "scene-script")) ?? "");
  const textIndex = sceneTextIndex(project);
  const { value: assetsValue } = readJson(project, artifactPath(project, "asset-preparation"));
  const assetIds = new Set((assetsValue?.assets ?? []).map((asset) => asset.id));
  const allBeatIds = new Set();
  const allTransitionIds = new Set();
  const actualScenes = Array.isArray(value.scenes) ? value.scenes : [];
  issues.push(...compareIds(stage, "Visual Timeline", sceneIds, actualScenes.map((scene) => normalizedSceneId(scene?.sceneId)), relativePath));
  let expectedStart = 0;
  for (const [index, scene] of actualScenes.entries()) {
    if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
      issues.push(issue(stage, "promo-timeline-scene-invalid", `Scene ${index + 1} 必须是对象`, relativePath));
      continue;
    }
    const sceneId = normalizedSceneId(scene?.sceneId);
    if (!integerFrame(scene?.startFrame) || !integerFrame(scene?.endFrame) || scene.endFrame <= scene.startFrame) {
      issues.push(issue(stage, "promo-timeline-scene-range-invalid", `Scene ${sceneId ?? index + 1} 的帧区间无效`, relativePath));
      continue;
    }
    if (scene.startFrame !== expectedStart) issues.push(issue(stage, "promo-timeline-gap-or-overlap", `Scene ${sceneId} 未从 ${expectedStart} 帧连续开始`, relativePath));
    expectedStart = scene.endFrame;
    if (!Array.isArray(scene.beats) || scene.beats.length === 0) issues.push(issue(stage, "promo-timeline-beats-missing", `Scene ${sceneId} 至少需要一个 Beat`, relativePath));
    issues.push(...validateReferenceIds(scene.assetIds, assetIds, `Scene ${sceneId} 素材`, stage, relativePath));
    const knownTextIds = new Set(textIndex.get(sceneId)?.screenTextIds ?? []);
    issues.push(...validateReferenceIds(scene.screenTextIds, knownTextIds, `Scene ${sceneId} 屏幕文字`, stage, relativePath));
    const beats = Array.isArray(scene.beats) ? scene.beats : [];
    let previousBeatEnd = scene.startFrame;
    for (const beat of beats) {
      if (!beat || typeof beat.id !== "string" || allBeatIds.has(beat.id)) issues.push(issue(stage, "promo-timeline-beat-id-invalid", `Scene ${sceneId} 存在重复或无效 Beat ID`, relativePath));
      allBeatIds.add(beat?.id);
      const validBeatRange = integerFrame(beat?.startFrame)
        && integerFrame(beat?.endFrame)
        && beat.endFrame > beat.startFrame
        && beat.startFrame >= scene.startFrame
        && beat.endFrame <= scene.endFrame;
      if (!validBeatRange) {
        issues.push(issue(stage, "promo-timeline-beat-range-invalid", `Beat ${beat?.id ?? "未知"} 不在 Scene 合法帧范围内`, relativePath));
      }
      if (validBeatRange) {
        if (beat.startFrame < previousBeatEnd) issues.push(issue(stage, "promo-timeline-beat-overlap", `Scene ${sceneId} 的 Beat 发生重叠`, relativePath));
        if (beat.startFrame > previousBeatEnd) issues.push(issue(stage, "promo-timeline-beat-gap", `Scene ${sceneId} 的 Beat 在 ${previousBeatEnd}～${beat.startFrame} 帧之间存在空档`, relativePath));
        previousBeatEnd = beat.endFrame;
      }
      if (typeof beat?.event !== "string" || !beat.event.trim()) issues.push(issue(stage, "promo-timeline-beat-event-missing", `Beat ${beat?.id ?? "未知"} 缺少 visual event`, relativePath));
      issues.push(...validateReferenceIds(beat?.assetIds, new Set(scene.assetIds ?? []), `Beat ${beat?.id ?? "未知"} 素材`, stage, relativePath));
      issues.push(...validateReferenceIds(beat?.screenTextIds, new Set(scene.screenTextIds ?? []), `Beat ${beat?.id ?? "未知"} 屏幕文字`, stage, relativePath));
    }
    if (beats.length > 0 && previousBeatEnd !== scene.endFrame) {
      issues.push(issue(stage, "promo-timeline-beats-not-contiguous", `Scene ${sceneId} 的 Beat 只覆盖到 ${previousBeatEnd} 帧，未覆盖到 ${scene.endFrame} 帧`, relativePath));
    }
    const transitions = Array.isArray(scene.transitions) ? scene.transitions : [];
    if (!Array.isArray(scene.transitions)) issues.push(issue(stage, "promo-timeline-transitions-missing", `Scene ${sceneId} 的 transitions 必须是数组`, relativePath));
    for (const transition of transitions) {
      if (!transition || typeof transition.id !== "string" || allTransitionIds.has(transition.id)) issues.push(issue(stage, "promo-transition-id-invalid", `Scene ${sceneId} 存在重复或无效 Transition ID`, relativePath));
      allTransitionIds.add(transition?.id);
      const start = transition?.startFrame ?? transition?.atFrame;
      const end = transition?.endFrame ?? start;
      if (!integerFrame(start) || !integerFrame(end) || end < start || start < scene.startFrame || end > scene.endFrame) issues.push(issue(stage, "promo-transition-range-invalid", `Transition ${transition?.id ?? "未知"} 不在 Scene 合法帧范围内`, relativePath));
      if (typeof transition?.type !== "string" || !transition.type.trim()) issues.push(issue(stage, "promo-transition-type-missing", `Transition ${transition?.id ?? "未知"} 缺少 type`, relativePath));
    }
  }
  if (integerFrame(value.durationInFrames) && expectedStart !== value.durationInFrames) issues.push(issue(stage, "promo-timeline-not-contiguous", `Scene 只覆盖到 ${expectedStart} 帧，未覆盖到总时长 ${value.durationInFrames} 帧`, relativePath));
  for (const audioType of ["music", "sfx"]) {
    if (!Array.isArray(value.audio?.[audioType])) {
      issues.push(issue(stage, "promo-audio-list-invalid", `audio.${audioType} 必须是数组`, relativePath));
      continue;
    }
    for (const item of value.audio[audioType]) {
      const assetId = item?.assetId ?? item?.id;
      if (!assetIds.has(assetId)) issues.push(issue(stage, "promo-audio-reference-invalid", `${audioType} 引用了未登记素材：${assetId}`, relativePath));
    }
  }
  return issues;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function promoTimelineSourceIssues({ configSource, configPath, timelinePath }) {
  if (typeof configSource !== "string" || typeof configPath !== "string" || typeof timelinePath !== "string") {
    return ["宣传片 Remotion 配置缺少当前 Visual Timeline 的可验证来源"];
  }

  const expectedImportPath = path.posix.relative(path.posix.dirname(configPath), timelinePath);
  const importPattern = new RegExp(
    `import\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s+from\\s+[\"']${escapeRegExp(expectedImportPath)}[\"']`,
  );
  const importMatch = configSource.match(importPattern);
  if (!importMatch) {
    return [`宣传片 Remotion 配置必须从当前 Visual Timeline 导入：${timelinePath}`];
  }

  const timelineIdentifier = importMatch[1];
  const durationAccess = `\\b${escapeRegExp(timelineIdentifier)}(?:\\?\\.)?\\.durationInFrames\\b`;
  const directArrowPattern = new RegExp(
    `export\\s+const\\s+TotalDurationFrames\\b\\s*=\\s*(?:\\([^)]*\\)|[A-Za-z_$][A-Za-z0-9_$]*)\\s*=>\\s*(?:\\(?\\s*${durationAccess}\\s*\\)?\\s*;?|\\{\\s*return\\s+\\(?\\s*${durationAccess}\\s*\\)?\\s*;?\\s*\\})`,
  );
  const directFunctionPattern = new RegExp(
    `export\\s+function\\s+TotalDurationFrames\\b\\s*\\([^)]*\\)\\s*\\{\\s*return\\s+\\(?\\s*${durationAccess}\\s*\\)?\\s*;?\\s*\\}`,
  );
  return directArrowPattern.test(configSource) || directFunctionPattern.test(configSource)
    ? []
    : [`TotalDurationFrames 必须直接返回当前 Visual Timeline 的 ${timelineIdentifier}.durationInFrames`];
}

export function validatePromoRemotion(project, stage) {
  const configPath = artifactPath(project, "remotion", 0);
  const alignmentPath = artifactPath(project, "remotion", 2);
  const config = readText(project, configPath);
  const alignmentRead = readJson(project, alignmentPath);
  const issues = [];
  if (config !== null) {
    if (!/export\s+const\s+videoConfig\b/.test(config)) issues.push(issue(stage, "missing-video-config", "Remotion 配置缺少 videoConfig 导出", configPath));
    if (!/export\s+(?:const|function)\s+TotalDurationFrames\b/.test(config)) issues.push(issue(stage, "promo-remotion-duration-export-invalid", "宣传片 Remotion 必须使用精确的 TotalDurationFrames 导出，并从 Visual Timeline 派生时长", configPath));
    if (!/width\s*:\s*1920\b/.test(config) || !/height\s*:\s*1080\b/.test(config)) issues.push(issue(stage, "invalid-video-size", "宣传片 Remotion 必须为 1920×1080", configPath));
    if (!/fps\s*:\s*30\b/.test(config)) issues.push(issue(stage, "invalid-video-fps", "宣传片 Remotion 必须使用 30fps", configPath));
    issues.push(...promoTimelineSourceIssues({
      configSource: config,
      configPath,
      timelinePath: artifactPath(project, "visual-timeline"),
    }).map((message) => issue(stage, "promo-remotion-timeline-source-missing", message, configPath)));
    if (/tts-script|audio-manifest|subtitle-manifest|timeline-manifest|narration-script/.test(config)) issues.push(issue(stage, "promo-remotion-narrated-dependency", "宣传片 Remotion 不得依赖 narrated 产物", configPath));
  }
  if (alignmentRead.error) {
    issues.push(issue(stage, "invalid-json", `无法解析宣传片 Remotion 对齐清单：${alignmentRead.error.message}`, alignmentPath));
    return issues;
  }
  const alignment = alignmentRead.value;
  if (!alignment) return issues;
  if (alignment.schemaVersion !== 1 || alignment.slug !== project.config.slug || alignment.timelinePath !== artifactPath(project, "visual-timeline")) {
    issues.push(issue(stage, "invalid-promo-remotion-alignment", "宣传片对齐清单的 schemaVersion、slug 或 Timeline 路径无效", alignmentPath));
  }
  const baselinePath = project.files?.directory ? path.join(project.files.directory, "prototype-baseline.json") : null;
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    issues.push(issue(stage, "promo-remotion-baseline-missing", "Remotion 阶段缺少 Gate 2 冻结的 Motion Prototype 基线", alignmentPath));
  } else {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
      if (alignment.visualScriptFingerprint !== baseline.visualScript?.fingerprint || alignment.prototypeFingerprint !== baseline.visualPrototype?.fingerprint) {
        issues.push(issue(stage, "promo-remotion-baseline-stale", "Remotion 对齐清单未引用当前 Gate 2 冻结指纹", alignmentPath));
      }
    } catch {
      issues.push(issue(stage, "promo-remotion-baseline-invalid", "无法读取 Gate 2 原型冻结基线", alignmentPath));
    }
  }
  const timeline = readJson(project, artifactPath(project, "visual-timeline")).value;
  const assetManifest = readJson(project, artifactPath(project, "asset-preparation")).value;
  const knownAssetIds = new Set((assetManifest?.assets ?? []).map((asset) => asset.id));
  const sceneIds = sceneIdsFromText(readText(project, artifactPath(project, "scene-script")) ?? "");
  const alignmentScenes = Array.isArray(alignment.scenes) ? alignment.scenes : [];
  issues.push(...compareIds(stage, "Remotion Alignment", sceneIds, alignmentScenes.map((scene) => normalizedSceneId(scene?.sceneId)), alignmentPath));
  const timelineById = new Map((timeline?.scenes ?? []).map((scene) => [normalizedSceneId(scene.sceneId), scene]));
  for (const scene of alignmentScenes) {
    const sceneId = normalizedSceneId(scene?.sceneId);
    const timelineScene = timelineById.get(sceneId);
    if (!timelineScene) continue;
    if (scene.startFrame !== timelineScene.startFrame || scene.endFrame !== timelineScene.endFrame) issues.push(issue(stage, "promo-remotion-scene-timing-mismatch", `Scene ${sceneId} 的 Remotion 帧区间未对齐 Visual Timeline`, alignmentPath));
    const beatIds = new Set((timelineScene.beats ?? []).map((beat) => beat.id));
    const transitionIds = new Set((timelineScene.transitions ?? []).map((transition) => transition.id));
    const timelineAssetIds = new Set([
      ...(timelineScene.assetIds ?? []),
      ...(timelineScene.beats ?? []).flatMap((beat) => beat.assetIds ?? []),
    ]);
    const alignedAssetIds = new Set(Array.isArray(scene.assetIds) ? scene.assetIds : []);
    for (const assetId of timelineAssetIds) if (!alignedAssetIds.has(assetId)) issues.push(issue(stage, "promo-remotion-asset-missing", `Scene ${sceneId} 缺少素材对齐：${assetId}`, alignmentPath));
    for (const assetId of alignedAssetIds) if (!knownAssetIds.has(assetId)) issues.push(issue(stage, "promo-remotion-asset-invalid", `Scene ${sceneId} 引用了未登记素材：${assetId}`, alignmentPath));
    const alignedBeatIds = new Set((scene.beats ?? []).map((beat) => beat?.beatId));
    const alignedTransitionIds = new Set((scene.transitions ?? []).map((transition) => transition?.transitionId));
    for (const beatId of beatIds) if (!alignedBeatIds.has(beatId)) issues.push(issue(stage, "promo-remotion-beat-missing", `Scene ${sceneId} 缺少 Beat 对齐：${beatId}`, alignmentPath));
    for (const transitionId of transitionIds) if (!alignedTransitionIds.has(transitionId)) issues.push(issue(stage, "promo-remotion-transition-missing", `Scene ${sceneId} 缺少 Transition 对齐：${transitionId}`, alignmentPath));
    if (!Array.isArray(scene.screenText) || !scene.screenText.every((item) => typeof item?.id === "string" && typeof item?.text === "string")) {
      issues.push(issue(stage, "promo-remotion-screen-text-missing", `Scene ${sceneId} 缺少屏幕文字对齐`, alignmentPath));
    } else {
      const alignedTextIds = new Set(scene.screenText.map((item) => item.id));
      for (const textId of timelineScene.screenTextIds ?? []) if (!alignedTextIds.has(textId)) issues.push(issue(stage, "promo-remotion-screen-text-missing", `Scene ${sceneId} 缺少屏幕文字对齐：${textId}`, alignmentPath));
    }
    if (!Array.isArray(scene.implementationFiles) || scene.implementationFiles.length === 0) issues.push(issue(stage, "promo-remotion-files-missing", `Scene ${sceneId} 缺少实现文件对齐`, alignmentPath));
    for (const implementationFile of scene.implementationFiles ?? []) {
      const safePath = safeProjectRelativePath(implementationFile);
      if (!safePath || !allowedPromoImplementationPath(project, safePath)) {
        issues.push(issue(stage, "promo-remotion-file-path-invalid", `Scene ${sceneId} 的实现文件必须是允许的项目内相对路径：${implementationFile ?? "缺失"}`, alignmentPath));
        continue;
      }
      const filePath = absolutePath(project, safePath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) issues.push(issue(stage, "promo-remotion-file-not-found", `Scene ${sceneId} 引用的实现文件不存在：${implementationFile}`, alignmentPath));
      else if (/上一幕|下一幕|自动播放|暂停播放|调试|debug/i.test(fs.readFileSync(filePath, "utf8"))) issues.push(issue(stage, "promo-remotion-control-text", `Scene ${sceneId} 的正式实现包含预览控件或调试文字`, safePath));
    }
  }
  return issues;
}

export function validatePromoStageContent(project, stage) {
  const index = workflowStageIndex(project, stage);
  if (index < 0) return [];
  const issues = [
    ...validateProjectPaths(project, stage),
    ...validateNoNarratedArtifacts(project, stage),
  ];
  if (index >= workflowStageIndex(project, "source")) issues.push(...validateSource(project, stage));
  if (index >= workflowStageIndex(project, "promo-brief")) issues.push(...validateBrief(project, stage));
  if (index >= workflowStageIndex(project, "creative-concept")) issues.push(...validateConcept(project, stage));
  if (index >= workflowStageIndex(project, "scene-script")) issues.push(...validateSceneDocument(project, stage, "scene-script"));
  if (index >= workflowStageIndex(project, "visual-script")) {
    issues.push(...validateSceneDocument(project, stage, "visual-script"));
    issues.push(...validateSceneAlignment(project, stage));
  }
  if (index >= workflowStageIndex(project, "motion-prototype")) issues.push(...validatePrototype(project, stage));
  if (index >= workflowStageIndex(project, "asset-preparation")) issues.push(...validateAssetManifest(project, stage));
  if (index >= workflowStageIndex(project, "visual-timeline")) issues.push(...validateVisualTimeline(project, stage));
  return issues;
}
