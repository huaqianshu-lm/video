import fs from "node:fs";
import path from "node:path";

const EPSILON_SECONDS = 0.02;

function readManifest(workspaceRoot, relativePath, label) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error(`缺少 ${label}：${relativePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} 无法解析：${error instanceof Error ? error.message : String(error)}`);
  }
}

function secondsToFrames(seconds, fps) {
  return Math.round(seconds * fps);
}

function findScene(scenes, sceneId) {
  return (scenes ?? []).find((scene) => String(scene.sceneId).padStart(2, "0") === sceneId) ?? null;
}

function findSegment(segments, segmentId, idKey) {
  return (segments ?? []).find((segment) => String(segment[idKey] ?? "") === segmentId) ?? null;
}

function assertClose(left, right, message) {
  if (Math.abs(left - right) > EPSILON_SECONDS) {
    throw new Error(`${message}：${left} ≠ ${right}`);
  }
}

export function buildRemotionTimingPlan({ workspaceRoot, slug, fps = 30 }) {
  const root = `src/videos/${slug}/generated`;
  const audio = readManifest(workspaceRoot, `${root}/audio-manifest.json`, "Audio Manifest");
  const subtitles = readManifest(workspaceRoot, `${root}/subtitle-manifest.json`, "Subtitle Manifest");
  const timeline = readManifest(workspaceRoot, `${root}/timeline-manifest.json`, "Timeline Manifest");

  if (!Number.isFinite(fps) || fps <= 0) throw new Error(`无效的 Remotion FPS：${fps}`);
  if (!Number.isFinite(timeline.duration) || timeline.duration <= 0) {
    throw new Error("Timeline Manifest 缺少有效总时长");
  }

  const scenes = (timeline.scenes ?? []).map((timelineScene) => {
    const sceneId = String(timelineScene.sceneId ?? "").padStart(2, "0");
    const audioScene = findScene(audio.scenes, sceneId);
    const subtitleScene = findScene(subtitles.scenes, sceneId);
    if (!audioScene) throw new Error(`Scene ${sceneId} 缺少 Audio Manifest 映射`);
    if (!subtitleScene) throw new Error(`Scene ${sceneId} 缺少 Subtitle Manifest 映射`);

    const sceneOffset = Number(timelineScene.offset ?? 0);
    const sceneDuration = Number(timelineScene.duration);
    const sceneEnd = Number(timelineScene.end ?? sceneOffset + sceneDuration);
    if (!Number.isFinite(sceneOffset) || !Number.isFinite(sceneDuration) || sceneDuration <= 0) {
      throw new Error(`Scene ${sceneId} 缺少有效 Timeline 时长`);
    }
    assertClose(sceneOffset + sceneDuration, sceneEnd, `Scene ${sceneId} 的 Timeline end 不一致`);

    const segments = (timelineScene.segments ?? []).map((timelineSegment) => {
      const segmentId = String(timelineSegment.segmentId ?? "");
      const audioSegment = findSegment(audioScene.segments, segmentId, "id");
      const subtitleSegment = findSegment(subtitleScene.segments, segmentId, "segmentId");
      if (!audioSegment) throw new Error(`Scene ${sceneId}／Segment ${segmentId} 缺少 Audio 映射`);
      if (!subtitleSegment) throw new Error(`Scene ${sceneId}／Segment ${segmentId} 缺少 Subtitle 映射`);

      const segmentOffset = Number(timelineSegment.offset ?? 0);
      const segmentDuration = Number(timelineSegment.duration);
      const segmentEnd = Number(timelineSegment.end ?? segmentOffset + segmentDuration);
      assertClose(segmentOffset + segmentDuration, segmentEnd, `Scene ${sceneId}／Segment ${segmentId} 的 Timeline end 不一致`);
      assertClose(Number(audioSegment.duration), segmentDuration, `Scene ${sceneId}／Segment ${segmentId} 的音频时长不一致`);

      const globalStart = sceneOffset + segmentOffset;
      const cues = (subtitleSegment.cues ?? []).map((cue) => {
        const start = Number(cue.start);
        const end = Number(cue.end);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
          throw new Error(`Scene ${sceneId}／Segment ${segmentId} 存在无效字幕 Cue`);
        }
        return {
          id: cue.id,
          segmentId,
          endSeconds: globalStart + end,
          endFrame: secondsToFrames(globalStart + end, fps),
          startSeconds: globalStart + start,
          startFrame: secondsToFrames(globalStart + start, fps),
          text: cue.text,
        };
      });

      return {
        audioDurationSeconds: Number(audioSegment.duration),
        audioFile: audioSegment.file,
        cues,
        durationSeconds: segmentDuration,
        endFrame: secondsToFrames(globalStart + segmentDuration, fps),
        endSeconds: globalStart + segmentDuration,
        segmentId,
        startFrame: secondsToFrames(globalStart, fps),
        startSeconds: globalStart,
      };
    });

    return {
      durationFrames: secondsToFrames(sceneDuration, fps),
      durationSeconds: sceneDuration,
      endFrame: secondsToFrames(sceneEnd, fps),
      endSeconds: sceneEnd,
      sceneId,
      segments,
      startFrame: secondsToFrames(sceneOffset, fps),
      startSeconds: sceneOffset,
    };
  });

  return {
    durationFrames: secondsToFrames(timeline.duration, fps),
    durationSeconds: timeline.duration,
    fps,
    scenes,
    source: "timeline-manifest.json",
  };
}

export function buildRemotionTimingPlanForProject(project) {
  return buildRemotionTimingPlan({
    fps: project.config.fps ?? 30,
    slug: project.config.slug ?? project.state.slug,
    workspaceRoot: project.config.workspaceRoot,
  });
}
