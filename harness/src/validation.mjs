import fs from "node:fs";
import path from "node:path";
import { STAGE_DEFINITIONS, stageIndex } from "./stages.mjs";
import { matchesArtifactPath } from "./artifact-paths.mjs";

const SOURCE_REFERENCE_PATTERNS = [
  { label: "原文档", test: (text) => text.includes("原文档") },
  { label: "源文档", test: (text) => text.includes("源文档") },
  { label: "本文", test: (text) => text.includes("本文") },
  { label: "这篇文章", test: (text) => text.includes("这篇文章") },
  { label: "上文", test: (text) => text.includes("上文") },
  { label: "下文", test: (text) => /(?<!上)下文/.test(text) },
  { label: "文中", test: (text) => text.includes("文中") },
  { label: "原文", test: (text) => text.includes("原文") },
];

const INTERNAL_NARRATION_PATTERNS = [
  "本段口播作用",
  "视觉说明",
  "制作备注",
  "Gate 检查清单",
];

export function validateStageArtifacts(project, stage) {
  const entries = project.artifacts.stages[stage] ?? [];
  const workspaceRoot = project.config.workspaceRoot;
  return entries
    .filter((entry) => !matchesArtifactPath(workspaceRoot, entry.path))
    .map((entry) => ({
      code: "missing-artifact",
      stage,
      path: entry.path,
      message: `Required artifact is missing: ${entry.path}`,
    }));
}

function issue(stage, code, message, issuePath = null, severity = "error") {
  return { code, stage, path: issuePath, message, severity };
}

function absolutePath(project, relativePath) {
  return path.join(project.config.workspaceRoot, relativePath);
}

function readTextArtifact(project, relativePath) {
  const filePath = absolutePath(project, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function readJsonArtifact(project, relativePath) {
  const text = readTextArtifact(project, relativePath);
  if (text === null) return { value: null, error: null };
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error };
  }
}

function normalizeText(text) {
  return text.replace(/[`*_~]/g, "").replace(/\s+/g, "").trim();
}

function sceneIdsFromMarkdown(text) {
  return [...text.matchAll(/^##\s+Scene\s+(\d+)/gim)].map((match) => match[1].padStart(2, "0"));
}

function markdownHeadings(text, level = 2) {
  const prefix = "#".repeat(level);
  return [...text.matchAll(new RegExp(`^${prefix}\\s+(.+)$`, "gim"))].map((match) => match[1].trim());
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function requireHeading(stage, text, relativePath, patterns, label) {
  if (hasAny(text, patterns)) return [];
  return [issue(stage, "missing-structure", `缺少 ${label} 结构`, relativePath)];
}

function validateMarkdownStructure(project, stage, relativePath, options) {
  const text = readTextArtifact(project, relativePath);
  if (text === null) return [];

  const issues = [];
  const headings = markdownHeadings(text, options.level ?? 2);
  if (headings.length < (options.minimumHeadings ?? 1)) {
    issues.push(issue(stage, "insufficient-headings", `${options.label} 至少需要 ${options.minimumHeadings ?? 1} 个二级标题`, relativePath));
  }
  for (const requirement of options.requirements ?? []) {
    issues.push(...requireHeading(stage, text, relativePath, requirement.patterns, requirement.label));
  }
  return issues;
}

function validateSceneFields(project, stage, relativePath, fields) {
  const text = readTextArtifact(project, relativePath);
  if (text === null) return [];
  const scenes = sceneBodiesFromNarration(text);
  if (scenes.length === 0) return [];

  return scenes.flatMap(({ sceneId, body }) => fields.flatMap(({ patterns, label }) => {
    if (hasAny(body, patterns)) return [];
    return [issue(stage, "missing-scene-field", `Scene ${sceneId} 缺少 ${label}`, relativePath)];
  }));
}

function validateStageStructure(project, stage) {
  const issues = [];
  const contentAnalysisPath = artifactPathFor(project, "content-analysis", 0);
  const narrativePath = artifactPathFor(project, "video-narrative", 0);
  const sceneScriptPath = artifactPathFor(project, "scene-script", 0);
  const visualScriptPath = artifactPathFor(project, "visual-script", 0);
  const prototypePath = artifactPathFor(project, "visual-prototype", 0);
  const remotionConfigPath = artifactPathFor(project, "remotion", 0);

  if (stageIndex(stage) >= stageIndex("content-analysis")) {
    issues.push(...validateMarkdownStructure(project, stage, contentAnalysisPath, {
      label: "Content Analysis",
      minimumHeadings: 3,
      requirements: [
        { label: "核心命题或核心问题", patterns: [/核心命题|核心问题|核心信息/i] },
        { label: "可视觉化内容", patterns: [/可视觉化|视觉化|视觉表达/i] },
      ],
    }));
  }
  if (stageIndex(stage) >= stageIndex("video-narrative")) {
    issues.push(...validateMarkdownStructure(project, stage, narrativePath, {
      label: "Video Narrative",
      minimumHeadings: 3,
      requirements: [
        { label: "叙事目标", patterns: [/叙事目标|叙事目的/i] },
        { label: "整体叙事结构", patterns: [/整体叙事|叙事结构|逐段叙事/i] },
      ],
    }));
  }
  if (stageIndex(stage) >= stageIndex("scene-script")) {
    issues.push(...validateMarkdownStructure(project, stage, sceneScriptPath, {
      label: "Scene Script",
      minimumHeadings: 1,
      requirements: [{ label: "Scene 标题", patterns: [/^#+\s+Scene\s+\d+/im] }],
    }));
    issues.push(...validateSceneFields(project, stage, sceneScriptPath, [
      { label: "目的", patterns: [/目的|purpose/i] },
      { label: "narrativeRole", patterns: [/narrativeRole/i] },
      { label: "narrationIntent", patterns: [/narrationIntent/i] },
      { label: "visualIntent", patterns: [/visualIntent/i] },
      { label: "visualType", patterns: [/visualType/i] },
      { label: "keyOnScreenText", patterns: [/keyOnScreenText/i] },
      { label: "videoValue", patterns: [/videoValue/i] },
    ]));
  }
  if (stageIndex(stage) >= stageIndex("visual-script")) {
    issues.push(...validateMarkdownStructure(project, stage, visualScriptPath, {
      label: "Visual Script",
      minimumHeadings: 2,
      requirements: [{ label: "全局视觉原则", patterns: [/全局视觉原则|全局视觉/i] }],
    }));
    issues.push(...validateSceneFields(project, stage, visualScriptPath, [
      { label: "视觉目标", patterns: [/视觉目标|视觉意图/i] },
      { label: "画面结构", patterns: [/画面结构|画面内容/i] },
      { label: "动画", patterns: [/动画|动作/i] },
      { label: "屏幕文字", patterns: [/屏幕文字|画面文字/i] },
      { label: "Visual Type", patterns: [/Visual Type|视觉类型/i] },
    ]));
  }
  if (stageIndex(stage) >= stageIndex("visual-prototype")) {
    const prototype = readTextArtifact(project, prototypePath);
    if (prototype !== null) {
      if (!/<section\b[^>]*class=["'][^"']*\bscene\b/i.test(prototype)) {
        issues.push(issue(stage, "missing-prototype-scenes", "Visual Prototype 缺少 Scene 容器", prototypePath));
      }
      if (!/<button\b/i.test(prototype) || !/上一幕|下一幕|自动播放|暂停播放/i.test(prototype)) {
        issues.push(issue(stage, "missing-prototype-controls", "Visual Prototype 缺少预览控制结构", prototypePath));
      }
      if (!/progress|进度|dot/i.test(prototype)) {
        issues.push(issue(stage, "missing-prototype-progress", "Visual Prototype 缺少进度提示结构", prototypePath));
      }
    }
  }
  if (stageIndex(stage) >= stageIndex("remotion")) {
    const config = readTextArtifact(project, remotionConfigPath);
    if (config !== null) {
      if (!/export\s+const\s+videoConfig\b/.test(config)) {
        issues.push(issue(stage, "missing-video-config", "Remotion 配置缺少 videoConfig 导出", remotionConfigPath));
      }
      if (!/width\s*:\s*1920\b/.test(config) || !/height\s*:\s*1080\b/.test(config)) {
        issues.push(issue(stage, "invalid-video-size", "Remotion 配置必须为 1920×1080", remotionConfigPath));
      }
      if (!/(?:const\s+fps\s*=\s*30\b|fps\s*:\s*30\b)/.test(config)) {
        issues.push(issue(stage, "invalid-video-fps", "Remotion 配置必须使用 30fps", remotionConfigPath));
      }
      if (!/\bscenes\s*:/.test(config)) {
        issues.push(issue(stage, "missing-video-scenes", "Remotion 配置缺少 scenes 定义", remotionConfigPath));
      }
      if (!/subtitle-manifest|subtitleManifest/.test(config) || !/timeline-manifest|timelineManifest/.test(config)) {
        issues.push(issue(stage, "missing-resource-manifest", "Remotion 配置未接入字幕和时间轴 Manifest", remotionConfigPath));
      }
    }
  }
  return issues;
}

function sceneBodiesFromNarration(text) {
  const matches = [...text.matchAll(/^##\s+Scene\s+(\d+).*$/gim)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return { sceneId: match[1].padStart(2, "0"), body: text.slice(start, end).trim() };
  });
}

function sceneIdsFromJson(value) {
  return Array.isArray(value?.scenes)
    ? value.scenes.map((scene) => String(scene.sceneId ?? "").padStart(2, "0"))
    : [];
}

function artifactPathFor(project, stage, index) {
  const template = STAGE_DEFINITIONS[stage]?.artifacts[index] ?? null;
  return template?.replaceAll("{slug}", project.config.slug) ?? null;
}

function compareSceneIds(stage, pathsAndIds) {
  const present = pathsAndIds.filter(({ ids }) => ids.length > 0);
  if (present.length < 2) return [];
  const expected = present[0].ids;
  return present.slice(1).flatMap(({ label, ids }) => {
    if (ids.join(",") === expected.join(",")) return [];
    return [issue(stage, "scene-id-mismatch", `${label} 的 Scene ID 与其他生产资料不一致`)];
  });
}

function validateNarration(project, stage, { strict = true } = {}) {
  const relativePath = artifactPathFor(project, "narration-script", 0);
  const text = readTextArtifact(project, relativePath);
  if (text === null) return [];

  const issues = [];
  const bodies = sceneBodiesFromNarration(text);
  for (const { sceneId, body } of bodies) {
    if (!body) {
      issues.push(issue(stage, "empty-narration", `Scene ${sceneId} 没有可朗读正文`, relativePath));
      continue;
    }
    for (const pattern of SOURCE_REFERENCE_PATTERNS) {
      if (pattern.test(body)) {
        issues.push(issue(stage, "forbidden-source-reference", `Scene ${sceneId} 包含禁止的口播文字：${pattern.label}`, relativePath, strict ? "error" : "warning"));
      }
    }
    for (const pattern of INTERNAL_NARRATION_PATTERNS) {
      if (body.includes(pattern)) {
        const code = "internal-narration-text";
        issues.push(issue(stage, code, `Scene ${sceneId} 包含禁止的口播文字：${pattern}`, relativePath));
      }
    }
  }
  if (bodies.length === 0) {
    issues.push(issue(stage, "missing-scenes", "Narration Script 没有可识别的 Scene 标题", relativePath));
  }
  return issues;
}

function validateSceneAlignment(project, stage) {
  const sceneScriptPath = artifactPathFor(project, "scene-script", 0);
  const narrationPath = artifactPathFor(project, "narration-script", 0);
  const visualScriptPath = artifactPathFor(project, "visual-script", 0);
  const prototypePath = artifactPathFor(project, "visual-prototype", 0);
  const sceneScript = readTextArtifact(project, sceneScriptPath);
  const narration = readTextArtifact(project, narrationPath);
  const visualScript = readTextArtifact(project, visualScriptPath);
  const prototype = readTextArtifact(project, prototypePath);
  const entries = [];
  if (sceneScript !== null) entries.push({ label: "Scene Script", ids: sceneIdsFromMarkdown(sceneScript) });
  if (narration !== null) entries.push({ label: "Narration Script", ids: sceneIdsFromMarkdown(narration) });
  if (visualScript !== null) entries.push({ label: "Visual Script", ids: sceneIdsFromMarkdown(visualScript) });
  if (prototype !== null) {
    entries.push({ label: "Visual Prototype", ids: [...prototype.matchAll(/<section\s+class=["']scene\b/gi)].map((_, index) => String(index + 1).padStart(2, "0")) });
  }
  return compareSceneIds(stage, entries);
}

function validateTts(project, stage, { strict = true } = {}) {
  const relativePath = artifactPathFor(project, "tts", 0);
  const { value, error } = readJsonArtifact(project, relativePath);
  if (error) return [issue(stage, "invalid-json", `无法解析 TTS Script：${error.message}`, relativePath)];
  if (!value) return [];

  const issues = [];
  if (value.schemaVersion === undefined || !Array.isArray(value.scenes)) {
    issues.push(issue(stage, "invalid-tts-schema", "TTS Script 缺少 schemaVersion 或 scenes", relativePath));
    return issues;
  }
  for (const scene of value.scenes) {
    if (!scene.sceneId || !Array.isArray(scene.segments) || scene.segments.length === 0) {
      issues.push(issue(stage, "invalid-tts-scene", "TTS Script 存在缺少 sceneId 或 segments 的 Scene", relativePath));
      continue;
    }
    for (const segment of scene.segments) {
      if (!segment.id || !segment.text?.trim()) {
        issues.push(issue(stage, "invalid-tts-segment", `Scene ${scene.sceneId} 存在空 Segment`, relativePath));
      }
      for (const pattern of SOURCE_REFERENCE_PATTERNS) {
        if (pattern.test(segment.text ?? "")) {
          issues.push(issue(stage, "forbidden-tts-text", `Segment ${segment.id} 包含禁止文字：${pattern.label}`, relativePath, strict ? "error" : "warning"));
        }
      }
      for (const pattern of INTERNAL_NARRATION_PATTERNS) {
        if (segment.text?.includes(pattern)) {
          issues.push(issue(stage, "forbidden-tts-text", `Segment ${segment.id} 包含禁止文字：${pattern}`, relativePath));
        }
      }
    }
  }

  const narrationPath = artifactPathFor(project, "narration-script", 0);
  const narration = readTextArtifact(project, narrationPath);
  if (narration !== null) {
    const narrationByScene = Object.fromEntries(sceneBodiesFromNarration(narration).map(({ sceneId, body }) => [sceneId, normalizeText(body)]));
    for (const scene of value.scenes) {
      const ttsText = normalizeText(scene.segments.map((segment) => segment.text ?? "").join(""));
      if (ttsText !== narrationByScene[String(scene.sceneId).padStart(2, "0")]) {
        issues.push(issue(stage, "tts-narration-mismatch", `Scene ${scene.sceneId} 的 TTS 文本未覆盖冻结口播`, relativePath));
      }
    }
  }
  return issues;
}

function validateTimeline(project, stage) {
  const ttsPath = artifactPathFor(project, "tts", 0);
  const audioPath = artifactPathFor(project, "subtitle-timeline", 0);
  const subtitlePath = artifactPathFor(project, "subtitle-timeline", 1);
  const timelinePath = artifactPathFor(project, "subtitle-timeline", 2);
  const tts = readJsonArtifact(project, ttsPath).value;
  const audio = readJsonArtifact(project, audioPath).value;
  const subtitles = readJsonArtifact(project, subtitlePath).value;
  const timeline = readJsonArtifact(project, timelinePath).value;
  const issues = [];
  if (!tts || !audio || !subtitles || !timeline) return issues;

  issues.push(...compareSceneIds(stage, [
    { label: "TTS Script", ids: sceneIdsFromJson(tts) },
    { label: "Audio Manifest", ids: sceneIdsFromJson(audio) },
    { label: "Subtitle Manifest", ids: sceneIdsFromJson(subtitles) },
    { label: "Timeline Manifest", ids: sceneIdsFromJson(timeline) },
  ]));

  const ttsByScene = new Map(tts.scenes.map((scene) => [String(scene.sceneId).padStart(2, "0"), scene]));
  for (const timelineScene of timeline.scenes ?? []) {
    const sceneId = String(timelineScene.sceneId).padStart(2, "0");
    const ttsScene = ttsByScene.get(sceneId);
    const timelineSegments = timelineScene.segments ?? [];
    const expectedSegmentIds = ttsScene?.segments?.map((segment) => segment.id) ?? [];
    const actualSegmentIds = timelineSegments.map((segment) => segment.segmentId);
    if (expectedSegmentIds.join(",") !== actualSegmentIds.join(",")) {
      issues.push(issue(stage, "segment-id-mismatch", `Scene ${sceneId} 的 Timeline Segment 与 TTS Script 不一致`, timelinePath));
    }
    if (typeof timelineScene.duration === "number" && typeof timelineScene.offset === "number" && typeof timelineScene.end === "number") {
      if (Math.abs((timelineScene.offset + timelineScene.duration) - timelineScene.end) > 0.02) {
        issues.push(issue(stage, "timeline-end-mismatch", `Scene ${sceneId} 的 end 不等于 offset + duration`, timelinePath));
      }
    }
    let previousEnd = 0;
    for (const segment of timelineSegments) {
      if (typeof segment.offset !== "number" || typeof segment.duration !== "number" || segment.duration <= 0) {
        issues.push(issue(stage, "invalid-timeline-segment", `Scene ${sceneId} 存在无效时间轴 Segment`, timelinePath));
        continue;
      }
      if (segment.offset < previousEnd - 0.02) {
        issues.push(issue(stage, "timeline-overlap", `Scene ${sceneId} 的时间轴 Segment 发生重叠`, timelinePath));
      }
      previousEnd = segment.offset + segment.duration;
    }
    if (typeof timelineScene.duration === "number" && previousEnd > timelineScene.duration + 0.02) {
      issues.push(issue(stage, "timeline-overflow", `Scene ${sceneId} 的 Segment 超出 Scene 时长`, timelinePath));
    }
  }
  return issues;
}

export function validateStageContent(project, stage, options = {}) {
  const strict = options.strict ?? project.config.validationPolicy !== "legacy";
  const index = stageIndex(stage);
  const issues = [];
  issues.push(...validateStageStructure(project, stage));
  if (index >= stageIndex("scene-script")) issues.push(...validateSceneAlignment(project, stage));
  if (index >= stageIndex("narration-script")) issues.push(...validateNarration(project, stage, { strict }));
  if (index >= stageIndex("tts")) issues.push(...validateTts(project, stage, { strict }));
  if (index >= stageIndex("subtitle-timeline")) issues.push(...validateTimeline(project, stage));
  return issues;
}

export function validateProjectStage(project, stage, options = {}) {
  return [...validateStageArtifacts(project, stage), ...validateStageContent(project, stage, options)];
}
