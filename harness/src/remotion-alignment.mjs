import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertProjectMutable, assertProjectSlugMutable, readJson, writeJson } from "./storage.mjs";
import { buildRemotionTimingPlan } from "./remotion-timing.mjs";
import { validateVisualBindings } from "./visual-timing.mjs";
import { renderInputDirectory, validateCurrentRenderInput } from "./render-input.mjs";
import { workflowPaths, workflowStageDefinition, workflowForProject } from "./workflows/registry.mjs";
import { validatePromoRemotion } from "./workflows/product-promo-validation.mjs";

export const REMOTION_ALIGNMENT_SCHEMA_VERSION = 2;

export function remotionAlignmentPath(project) {
  const paths = workflowPaths(project);
  return workflowForProject(project).timelineMode === "visual-beats"
    ? `${paths.remotionDirectory}/remotion-alignment.json`
    : `videos/${project.config.slug}/remotion-alignment.json`;
}

export function prototypeBaselinePath(project) {
  return project.files?.directory ? path.join(project.files.directory, "prototype-baseline.json") : null;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readWorkspaceText(project, relativePath) {
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  return fs.readFileSync(absolutePath, "utf8");
}

function markdownSceneIds(text) {
  return [...text.matchAll(/^#{1,6}\s+Scene\s+(\d+)/gim)].map((match) => match[1].padStart(2, "0"));
}

function prototypeSceneIds(text) {
  const explicit = [...text.matchAll(/<section\b[^>]*(?:data-scene(?:-id)?|id)=["'][^"']*?(\d+)[^"']*["'][^>]*class=["'][^"']*\bscene\b|<section\b[^>]*class=["'][^"']*\bscene\b[^>]*(?:data-scene(?:-id)?|id)=["'][^"']*?(\d+)[^"']*["']/gi)]
    .map((match) => (match[1] ?? match[2]).padStart(2, "0"));
  if (explicit.length > 0) return explicit;
  return [...text.matchAll(/<section\b[^>]*class=["'][^"']*\bscene\b/gi)]
    .map((_, index) => String(index + 1).padStart(2, "0"));
}

export function buildPrototypeBaseline(project) {
  const visualScriptPath = workflowStageDefinition(project, "visual-script")?.artifacts?.[0]
    ?.replaceAll("{slug}", project.config.slug);
  const prototypeStage = workflowForProject(project).timelineMode === "visual-beats"
    ? "motion-prototype"
    : "visual-prototype";
  const prototypePath = workflowStageDefinition(project, prototypeStage)?.artifacts?.[0]
    ?.replaceAll("{slug}", project.config.slug);
  const visualScript = readWorkspaceText(project, visualScriptPath);
  const prototype = readWorkspaceText(project, prototypePath);
  if (visualScript === null || prototype === null) {
    throw new Error("Gate 2 无法冻结：Visual Script 或 Visual Prototype 不存在");
  }
  const visualSceneIds = markdownSceneIds(visualScript);
  const prototypeIds = prototypeSceneIds(prototype);
  if (visualSceneIds.length === 0 || visualSceneIds.join(",") !== prototypeIds.join(",")) {
    throw new Error("Gate 2 无法冻结：Visual Script 与 Visual Prototype 的 Scene 不一致");
  }
  return {
    schemaVersion: REMOTION_ALIGNMENT_SCHEMA_VERSION,
    kind: "prototype-baseline",
    slug: project.config.slug,
    frozenAt: new Date().toISOString(),
    visualScript: { path: visualScriptPath, fingerprint: hashText(visualScript) },
    visualPrototype: { path: prototypePath, fingerprint: hashText(prototype) },
    sceneIds: visualSceneIds,
  };
}

export function freezePrototypeBaseline(project) {
  assertProjectMutable(project, "冻结 Visual Prototype 基线");
  assertProjectSlugMutable(project.config.slug, "冻结 Visual Prototype 基线");
  const baseline = buildPrototypeBaseline(project);
  const remotionDirectory = path.join(project.config.workspaceRoot, project.config.remotionDirectory);
  const hasExistingImplementation = fs.existsSync(path.join(remotionDirectory, "video.config.ts"))
    && fs.existsSync(remotionDirectory)
    && fs.readdirSync(remotionDirectory).some((entry) => entry.endsWith("Video.tsx"));
  baseline.alignmentRequired = workflowForProject(project).timelineMode === "visual-beats"
    ? true
    : !hasExistingImplementation;
  writeJson(prototypeBaselinePath(project), baseline);
  return baseline;
}

export function getPrototypeBaseline(project) {
  const filePath = prototypeBaselinePath(project);
  return filePath && fs.existsSync(filePath) ? readJson(filePath) : null;
}

export function getRemotionAlignment(project) {
  const relativePath = remotionAlignmentPath(project);
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  try {
    return readJson(absolutePath);
  } catch (error) {
    return { parseError: error instanceof Error ? error.message : String(error) };
  }
}

function alignmentIssue(code, message, issuePath = null, severity = "error") {
  return { code, stage: "remotion", path: issuePath, message, severity };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateTemporaryRenderEntry(project) {
  const entryPath = "src/RenderInputRoot.tsx";
  const packagePath = path.join(renderInputDirectory(project.config.workspaceRoot, project.config.slug), "render-input.json");
  const packageIssues = validateCurrentRenderInput(project);
  const issues = packageIssues.map((message) => alignmentIssue("render-input-package-invalid", message, packagePath));
  if (issues.length > 0) return issues;

  let manifest;
  try {
    manifest = readJson(packagePath);
  } catch (error) {
    return [alignmentIssue("render-input-package-invalid", `无法读取当前输入包清单：${error instanceof Error ? error.message : String(error)}`, packagePath)];
  }
  const source = readWorkspaceText(project, entryPath);
  if (source === null) return [alignmentIssue("render-input-entry-missing", "缺少由当前视频输入包生成的 src/RenderInputRoot.tsx。", entryPath)];

  const componentPath = manifest.entry?.componentPath?.replace(/^src\//, "./").replace(/\.tsx$/, "");
  const configPath = manifest.entry?.configPath?.replace(/^src\//, "./").replace(/\.ts$/, "");
  const componentExport = manifest.entry?.componentExport;
  const configExport = manifest.entry?.configExport;
  const expectedCompositionId = manifest.compositionId;
  const expectedImports = [
    [`import\\s*\\{\\s*${escapeRegExp(componentExport)}\\s*\\}\\s*from\\s*['\"]${escapeRegExp(componentPath)}['\"]`, "组件"],
    [`import\\s*\\{\\s*${escapeRegExp(configExport)}\\s*\\}\\s*from\\s*['\"]${escapeRegExp(configPath)}['\"]`, "配置"],
  ];
  for (const [pattern, label] of expectedImports) {
    if (!new RegExp(pattern).test(source)) {
      issues.push(alignmentIssue("render-input-entry-mismatch", `临时入口没有导入当前输入包的${label}：${label === "组件" ? componentPath : configPath}`, entryPath));
    }
  }
  if (!new RegExp(`\\bid\\s*=\\s*[\"']${escapeRegExp(expectedCompositionId)}[\"']`).test(source)) {
    issues.push(alignmentIssue("render-input-entry-mismatch", `临时入口的 Composition ID 不是 ${expectedCompositionId}。`, entryPath));
  }
  if (!new RegExp(`\\bcomponent\\s*=\\s*\\{\\s*${escapeRegExp(componentExport)}\\s*\\}`).test(source)) {
    issues.push(alignmentIssue("render-input-entry-mismatch", "临时入口没有把当前输入包组件注册到 Composition。", entryPath));
  }
  if (!source.includes("registerRoot(Root)")) {
    issues.push(alignmentIssue("render-input-entry-mismatch", "临时入口没有调用 registerRoot(Root)。", entryPath));
  }
  if (source.includes("src/videos/") || source.includes("from './Root'") || source.includes('from "./Root"')) {
    issues.push(alignmentIssue("render-input-entry-mismatch", "临时入口引用了错误的仓库路径，不能依赖通用 Root 或硬编码本地视频路径。", entryPath));
  }
  return issues;
}

function timingNumberIssue(issues, label, actual, expected, relativePath) {
  if (typeof actual !== "number" || !Number.isFinite(actual) || Math.abs(actual - expected) > 0.02) {
    issues.push(alignmentIssue("remotion-alignment-timing-mismatch", `${label} 时间映射不一致：${actual} ≠ ${expected}。`, relativePath));
  }
}

function timingFrameIssue(issues, label, actual, expected, relativePath) {
  if (actual !== expected) {
    issues.push(alignmentIssue("remotion-alignment-frame-mismatch", `${label} 帧映射不一致：${actual} ≠ ${expected}。`, relativePath));
  }
}

function validateVisualElements(scene, bindings, relativePath, issues) {
  if (scene.visualElements === undefined) return;
  if (!Array.isArray(scene.visualElements) || scene.visualElements.length === 0) {
    issues.push(alignmentIssue("visual-elements-missing", "Scene 声明了逐元素对齐，但没有有效的 visualElements。", relativePath));
    return;
  }

  const bindingById = new Map(bindings.map((binding) => [binding?.id, binding]));
  const elementIds = new Set();
  for (const element of scene.visualElements) {
    if (!element || typeof element.id !== "string" || !element.id.trim()) {
      issues.push(alignmentIssue("visual-element-id-invalid", "视觉元素缺少有效 ID。", relativePath));
      continue;
    }
    if (elementIds.has(element.id)) {
      issues.push(alignmentIssue("visual-element-id-duplicate", `视觉元素 ID 重复：${element.id}。`, relativePath));
      continue;
    }
    elementIds.add(element.id);
    if (typeof element.bindingId !== "string" || !element.bindingId.trim()) {
      issues.push(alignmentIssue("visual-element-binding-missing", `视觉元素 ${element.id} 缺少 bindingId。`, relativePath));
      continue;
    }
    const binding = bindingById.get(element.bindingId);
    if (!binding) {
      issues.push(alignmentIssue("visual-element-binding-missing", `视觉元素 ${element.id} 未绑定有效视觉事件：${element.bindingId}。`, relativePath));
      continue;
    }
    if (typeof element.screenText !== "string" || !Array.isArray(scene.screenText) || !scene.screenText.includes(element.screenText)) {
      issues.push(alignmentIssue("visual-element-text-unmapped", `视觉元素 ${element.id} 的屏幕文字没有出现在 Scene screenText 清单中。`, relativePath));
    }
    if (element.atFrame !== undefined && element.atFrame !== binding.atFrame) {
      issues.push(alignmentIssue("visual-element-frame-mismatch", `视觉元素 ${element.id} 的开始帧没有继承绑定事件。`, relativePath));
    }
  }
}

function validateImplementationTimingPatterns(scene, project, relativePath, issues, strictVisualTiming) {
  if (!strictVisualTiming && (!Array.isArray(scene.visualElements) || scene.visualElements.length === 0)) return;
  if (!Array.isArray(scene.implementationSymbols) || scene.implementationSymbols.length === 0) {
    issues.push(alignmentIssue("visual-timing-symbols-missing", `Scene ${scene.sceneId} 缺少 implementationSymbols，无法检查视觉元素实现。`, relativePath));
    return;
  }

  for (const implementationFile of scene.implementationFiles ?? []) {
    const absolutePath = path.join(project.config.workspaceRoot, implementationFile);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    const source = fs.readFileSync(absolutePath, "utf8");
    for (const symbol of scene.implementationSymbols) {
      const marker = `const ${symbol} =`;
      const start = source.indexOf(marker);
      if (start < 0) {
        issues.push(alignmentIssue("visual-timing-symbol-missing", `Scene ${scene.sceneId} 找不到实现符号：${symbol}。`, relativePath));
        continue;
      }
      const nextDeclaration = source.indexOf("\nconst ", start + marker.length);
      const nextExport = source.indexOf("\nexport ", start + marker.length);
      const endCandidates = [nextDeclaration, nextExport].filter((index) => index >= 0);
      const scopedSource = source.slice(start, endCandidates.length > 0 ? Math.min(...endCandidates) : source.length);
      if (/\b(?:cueFrames|cueReveal)\b|\breveal\s*\(|\b(?:cue|segment)Frames\s*\[|\+\s*index\s*\*\s*\d+/.test(scopedSource)) {
        issues.push(alignmentIssue("visual-timing-pattern-forbidden", `Scene ${scene.sceneId} 的 ${symbol} 使用了 Cue 下标或固定间隔生成视觉时间，必须改为命名 visualBindings。`, relativePath));
      }
    }
  }
}

function validateSceneTiming(scene, expected, relativePath, issues) {
  const timing = scene.timing;
  if (!timing || timing.timelineSource !== expected.timelineSource) {
    issues.push(alignmentIssue("remotion-alignment-timeline-source-missing", `Scene ${expected.sceneId} 缺少正确的 Timeline 来源。`, relativePath));
    return;
  }
  timingNumberIssue(issues, `Scene ${expected.sceneId} 起点`, timing.startSeconds, expected.startSeconds, relativePath);
  timingNumberIssue(issues, `Scene ${expected.sceneId} 终点`, timing.endSeconds, expected.endSeconds, relativePath);
  timingNumberIssue(issues, `Scene ${expected.sceneId} 时长`, timing.durationSeconds, expected.durationSeconds, relativePath);
  timingFrameIssue(issues, `Scene ${expected.sceneId} 起始帧`, timing.startFrame, expected.startFrame, relativePath);
  timingFrameIssue(issues, `Scene ${expected.sceneId} 结束帧`, timing.endFrame, expected.endFrame, relativePath);
  timingFrameIssue(issues, `Scene ${expected.sceneId} 时长帧`, timing.durationFrames, expected.durationFrames, relativePath);

  const audioSegments = Array.isArray(scene.audioSegments) ? scene.audioSegments : [];
  if (audioSegments.length !== expected.segments.length) {
    issues.push(alignmentIssue("remotion-alignment-audio-segments-missing", `Scene ${expected.sceneId} 的 Audio Segment 映射不完整。`, relativePath));
  }
  for (const expectedSegment of expected.segments) {
    const actual = audioSegments.find((segment) => segment.segmentId === expectedSegment.segmentId);
    if (!actual) {
      issues.push(alignmentIssue("remotion-alignment-audio-segment-missing", `Scene ${expected.sceneId} 缺少 Audio Segment ${expectedSegment.segmentId}。`, relativePath));
      continue;
    }
    if (actual.file !== expectedSegment.audioFile) {
      issues.push(alignmentIssue("remotion-alignment-audio-file-mismatch", `Scene ${expected.sceneId}／Segment ${expectedSegment.segmentId} 的音频文件不一致。`, relativePath));
    }
    timingNumberIssue(issues, `Segment ${expectedSegment.segmentId} 起点`, actual.startSeconds, expectedSegment.startSeconds, relativePath);
    timingNumberIssue(issues, `Segment ${expectedSegment.segmentId} 终点`, actual.endSeconds, expectedSegment.endSeconds, relativePath);
    timingNumberIssue(issues, `Segment ${expectedSegment.segmentId} 时长`, actual.durationSeconds, expectedSegment.durationSeconds, relativePath);
    timingFrameIssue(issues, `Segment ${expectedSegment.segmentId} 起始帧`, actual.startFrame, expectedSegment.startFrame, relativePath);
    timingFrameIssue(issues, `Segment ${expectedSegment.segmentId} 结束帧`, actual.endFrame, expectedSegment.endFrame, relativePath);
  }

  const expectedCues = expected.segments.flatMap((segment) => segment.cues);
  const subtitleCues = Array.isArray(scene.subtitleCues) ? scene.subtitleCues : [];
  if (subtitleCues.length !== expectedCues.length) {
    issues.push(alignmentIssue("remotion-alignment-subtitle-cues-missing", `Scene ${expected.sceneId} 的 Subtitle Cue 映射不完整。`, relativePath));
  }
  for (const expectedCue of expectedCues) {
    const actual = subtitleCues.find((cue) => cue.cueId === expectedCue.id);
    if (!actual) {
      issues.push(alignmentIssue("remotion-alignment-subtitle-cue-missing", `Scene ${expected.sceneId} 缺少 Subtitle Cue ${expectedCue.id}。`, relativePath));
      continue;
    }
    if (actual.segmentId !== expectedCue.segmentId) {
      issues.push(alignmentIssue("remotion-alignment-subtitle-segment-mismatch", `Subtitle Cue ${expectedCue.id} 未关联正确的 Segment。`, relativePath));
    }
    timingNumberIssue(issues, `Cue ${expectedCue.id} 起点`, actual.startSeconds, expectedCue.startSeconds, relativePath);
    timingNumberIssue(issues, `Cue ${expectedCue.id} 终点`, actual.endSeconds, expectedCue.endSeconds, relativePath);
    timingFrameIssue(issues, `Cue ${expectedCue.id} 起始帧`, actual.startFrame, expectedCue.startFrame, relativePath);
    timingFrameIssue(issues, `Cue ${expectedCue.id} 结束帧`, actual.endFrame, expectedCue.endFrame, relativePath);
  }

  const animationEvents = Array.isArray(scene.animationEvents) ? scene.animationEvents : [];
  if (animationEvents.length !== scene.visualEvents.length) {
    issues.push(alignmentIssue("remotion-alignment-animation-events-missing", `Scene ${expected.sceneId} 的动画事件没有逐项绑定到 Cue 或 Segment。`, relativePath));
  }
  const segmentById = new Map(expected.segments.map((segment) => [segment.segmentId, segment]));
  const cueById = new Map(expectedCues.map((cue) => [cue.id, cue]));
  animationEvents.forEach((animation, index) => {
    const source = animation?.source;
    const sourceTiming = source?.type === "segment"
      ? segmentById.get(source.id)
      : source?.type === "cue" ? cueById.get(source.id) : null;
    if (!sourceTiming || typeof animation.event !== "string" || animation.event !== scene.visualEvents[index]) {
      issues.push(alignmentIssue("remotion-alignment-animation-source-invalid", `Scene ${expected.sceneId} 的动画事件 ${index + 1} 未绑定有效 Cue／Segment。`, relativePath));
      return;
    }
    const start = sourceTiming.startSeconds;
    const end = sourceTiming.endSeconds;
    if (typeof animation.atSeconds !== "number" || animation.atSeconds < start - 0.02 || animation.atSeconds > end + 0.02) {
      issues.push(alignmentIssue("remotion-alignment-animation-time-invalid", `Scene ${expected.sceneId} 的动画事件 ${index + 1} 不在来源时间范围内。`, relativePath));
    }
    const expectedFrame = Math.round((animation.atSeconds ?? 0) * expected.fps);
    timingFrameIssue(issues, `Scene ${expected.sceneId} 动画事件 ${index + 1}`, animation.atFrame, expectedFrame, relativePath);
  });

  const bindings = Array.isArray(scene.visualBindings) ? scene.visualBindings : [];
  if (scene.visualBindings !== undefined) {
    for (const binding of bindings) {
      const source = binding?.source;
      const sourceTiming = source?.type === "segment"
        ? segmentById.get(source.id)
        : source?.type === "cue" ? cueById.get(source.id) : null;
      if (source && !sourceTiming) {
        issues.push(alignmentIssue("visual-binding-source-invalid", `Scene ${expected.sceneId} 的视觉事件来源不存在。`, relativePath));
        continue;
      }
      if (sourceTiming && binding.atFrame !== sourceTiming.startFrame) {
        issues.push(alignmentIssue("visual-binding-source-frame-mismatch", `Scene ${expected.sceneId} 的视觉事件 ${binding.id} 未从来源起始帧开始。`, relativePath));
      }
    }
    for (const issue of validateVisualBindings(bindings)) {
      issues.push(alignmentIssue(issue.code, issue.message, relativePath));
    }
  }
  validateVisualElements(scene, bindings, relativePath, issues);
}

export function validateRemotionAlignment(project) {
  if (workflowForProject(project).timelineMode === "visual-beats") {
    return [
      ...validatePromoRemotion(project, "remotion"),
      ...validateTemporaryRenderEntry(project),
    ];
  }
  const baseline = getPrototypeBaseline(project);
  const relativePath = remotionAlignmentPath(project);
  if (!baseline) {
    return [];
  }

  let current;
  try {
    current = buildPrototypeBaseline(project);
  } catch (error) {
    return [alignmentIssue("prototype-baseline-invalid", error instanceof Error ? error.message : String(error))];
  }
  const issues = [];
  const strictVisualTiming = baseline.alignmentRequired !== false;
  if (current.visualScript.fingerprint !== baseline.visualScript?.fingerprint
    || current.visualPrototype.fingerprint !== baseline.visualPrototype?.fingerprint) {
    issues.push(alignmentIssue("prototype-baseline-stale", "Gate 2 后 Visual Script 或 Visual Prototype 已变化，必须重新确认 Gate 2。"));
  }

  const alignment = getRemotionAlignment(project);
  if (!alignment) {
    if (baseline.alignmentRequired === false) return issues;
    issues.push(alignmentIssue("missing-remotion-alignment", `缺少 Remotion 对齐清单：${relativePath}`, relativePath));
    return issues;
  }
  if (alignment.parseError) {
    issues.push(alignmentIssue("invalid-remotion-alignment-json", `无法解析 Remotion 对齐清单：${alignment.parseError}`, relativePath));
    return issues;
  }
  if (alignment.schemaVersion !== REMOTION_ALIGNMENT_SCHEMA_VERSION || alignment.slug !== project.config.slug) {
    issues.push(alignmentIssue("invalid-remotion-alignment-schema", "Remotion 对齐清单的 schemaVersion 或 slug 无效。", relativePath));
  }
  if (alignment.prototypeFingerprint !== baseline.visualPrototype.fingerprint
    || alignment.visualScriptFingerprint !== baseline.visualScript.fingerprint) {
    issues.push(alignmentIssue("remotion-alignment-fingerprint-mismatch", "Remotion 对齐清单未引用当前 Gate 2 冻结指纹。", relativePath));
  }

  let timingPlan;
  try {
    timingPlan = buildRemotionTimingPlan({
      workspaceRoot: project.config.workspaceRoot,
      slug: project.config.slug,
      fps: 30,
    });
  } catch (error) {
    issues.push(alignmentIssue("remotion-alignment-timing-source-invalid", error instanceof Error ? error.message : String(error), relativePath));
    timingPlan = null;
  }
  if (alignment.timing) {
    if (alignment.timing.fps !== timingPlan?.fps
      || alignment.timing.totalDurationSeconds !== timingPlan?.durationSeconds
      || alignment.timing.totalDurationFrames !== timingPlan?.durationFrames
      || alignment.timing.sources?.ttsScript !== `videos/${project.config.slug}/tts-script.json`
      || alignment.timing.sources?.audioManifest !== `src/videos/${project.config.slug}/generated/audio-manifest.json`
      || alignment.timing.sources?.subtitleManifest !== `src/videos/${project.config.slug}/generated/subtitle-manifest.json`
      || alignment.timing.sources?.timelineManifest !== `src/videos/${project.config.slug}/generated/timeline-manifest.json`) {
      issues.push(alignmentIssue("remotion-alignment-timing-summary-mismatch", "Remotion 对齐清单的全局时间来源或总时长不一致。", relativePath));
    }
  } else {
    issues.push(alignmentIssue("remotion-alignment-timing-missing", "Remotion 对齐清单缺少全局时间来源和总时长。", relativePath));
  }

  issues.push(...validateTemporaryRenderEntry(project));

  const scenes = Array.isArray(alignment.scenes) ? alignment.scenes : [];
  const actualIds = scenes.map((scene) => String(scene.sceneId ?? "").padStart(2, "0"));
  if (actualIds.join(",") !== baseline.sceneIds.join(",")) {
    issues.push(alignmentIssue("remotion-alignment-scene-mismatch", "Remotion 对齐清单未按顺序覆盖全部 Scene。", relativePath));
  }
  for (const scene of scenes) {
    const sceneId = String(scene.sceneId ?? "").padStart(2, "0");
    if (typeof scene.layout !== "string" || !scene.layout.trim()) {
      issues.push(alignmentIssue("remotion-alignment-layout-missing", `Scene ${sceneId} 缺少布局对齐说明。`, relativePath));
    }
    if (!Array.isArray(scene.visualEvents) || scene.visualEvents.length === 0) {
      issues.push(alignmentIssue("remotion-alignment-events-missing", `Scene ${sceneId} 缺少视觉事件对齐。`, relativePath));
    }
    if (!Array.isArray(scene.screenText)) {
      issues.push(alignmentIssue("remotion-alignment-text-missing", `Scene ${sceneId} 缺少屏幕文字清单。`, relativePath));
    }
    if (!Array.isArray(scene.implementationFiles) || scene.implementationFiles.length === 0) {
      issues.push(alignmentIssue("remotion-alignment-files-missing", `Scene ${sceneId} 缺少实现文件。`, relativePath));
      continue;
    }
    if (strictVisualTiming && !Array.isArray(scene.visualBindings)) {
      issues.push(alignmentIssue("visual-bindings-required", `新视频 Scene ${sceneId} 必须提供逐元素 visualBindings。`, relativePath));
    }
    if (strictVisualTiming && !Array.isArray(scene.visualElements)) {
      issues.push(alignmentIssue("visual-elements-required", `新视频 Scene ${sceneId} 必须提供逐元素 visualElements。`, relativePath));
    }
    if (strictVisualTiming && (!Array.isArray(scene.implementationSymbols) || scene.implementationSymbols.length === 0)) {
      issues.push(alignmentIssue("visual-timing-symbols-required", `新视频 Scene ${sceneId} 必须声明 implementationSymbols。`, relativePath));
    }
    if (timingPlan) {
      const expectedScene = timingPlan.scenes.find((item) => item.sceneId === sceneId);
      if (!expectedScene) {
        issues.push(alignmentIssue("remotion-alignment-timing-scene-missing", `Scene ${sceneId} 缺少对应的 Timeline Scene。`, relativePath));
      } else {
        validateSceneTiming(scene, {
          ...expectedScene,
          fps: timingPlan.fps,
          timelineSource: `src/videos/${project.config.slug}/generated/timeline-manifest.json`,
        }, relativePath, issues);
      }
    }
    for (const implementationFile of scene.implementationFiles) {
      if (typeof implementationFile !== "string"
        || !implementationFile.startsWith("src/")
        || !fs.existsSync(path.join(project.config.workspaceRoot, implementationFile))) {
        issues.push(alignmentIssue("remotion-alignment-file-not-found", `Scene ${sceneId} 引用的实现文件不存在：${implementationFile}`, relativePath));
      }
    }
    validateImplementationTimingPatterns(scene, project, relativePath, issues, strictVisualTiming);
  }
  return issues;
}

export function buildAlignmentView(project) {
  const baseline = getPrototypeBaseline(project);
  const alignment = getRemotionAlignment(project);
  return {
    baseline,
    alignment,
    issues: baseline
      ? validateRemotionAlignment(project)
      : [alignmentIssue("prototype-baseline-missing", "该项目在对齐契约启用前已通过 Gate 2，Gate 3 需人工加强核对。", null, "warning")],
    studioUrl: process.env.HARNESS_REMOTION_STUDIO_URL ?? "http://127.0.0.1:3000",
  };
}
