import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./storage.mjs";
import { buildRemotionTimingPlan } from "./remotion-timing.mjs";

export const REMOTION_ALIGNMENT_SCHEMA_VERSION = 2;

export function remotionAlignmentPath(project) {
  return `videos/${project.config.slug}/remotion-alignment.json`;
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
  const visualScriptPath = `videos/${project.config.slug}/visual-script.md`;
  const prototypePath = `videos/${project.config.slug}/visual-prototype.html`;
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
  const baseline = buildPrototypeBaseline(project);
  const remotionDirectory = path.join(project.config.workspaceRoot, "src", "videos", project.config.slug);
  const hasExistingImplementation = fs.existsSync(path.join(remotionDirectory, "video.config.ts"))
    && fs.existsSync(remotionDirectory)
    && fs.readdirSync(remotionDirectory).some((entry) => entry.endsWith("Video.tsx"));
  baseline.alignmentRequired = !hasExistingImplementation;
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
}

export function validateRemotionAlignment(project) {
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

  const rootPath = "src/Root.tsx";
  const rootSource = readWorkspaceText(project, rootPath);
  if (rootSource === null || !rootSource.includes(project.config.slug)) {
    issues.push(alignmentIssue("composition-not-registered", `Remotion Composition 未在 ${rootPath} 注册：${project.config.slug}`, rootPath));
  }

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
