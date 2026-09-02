import type {SceneConfig, VideoConfig} from './videoTypes';
import type {AudioTrackConfig, SubtitleCue} from './videoTypes';

const CHINESE_CHARS_PER_SECOND = 4;
const ENGLISH_TOKEN_SECONDS = 0.45;
export const LINE_GAP_SECONDS = 0.25;
const DEFAULT_SCENE_TAIL_PAUSE_SECONDS = 0.8;
const SUMMARY_SCENE_TAIL_PAUSE_SECONDS = 1.2;

const roundUpToHalfSecond = (seconds: number) => {
  return Math.ceil(seconds * 2) / 2;
};

const countMatches = (text: string, regex: RegExp) => {
  return text.match(regex)?.length ?? 0;
};

const estimateCaptionLineSeconds = (line: string) => {
  const chineseChars = countMatches(line, /[一-鿿]/g);
  const englishTokens = countMatches(line, /[A-Za-z0-9]+/g);
  const shortPauses = countMatches(line, /[，、,]/g) * 0.2;
  const mediumPauses = countMatches(line, /[：；:;]/g) * 0.3;
  const longPauses = countMatches(line, /[。？！.!?]/g) * 0.45;

  return Math.max(
    1,
    chineseChars / CHINESE_CHARS_PER_SECOND +
      englishTokens * ENGLISH_TOKEN_SECONDS +
      shortPauses +
      mediumPauses +
      longPauses,
  );
};

export const secondsToFrames = (seconds: number, fps: number) => {
  return Math.round(seconds * fps);
};

type TimelineSegmentManifest = {
  segmentId: string;
  offset: number;
  duration: number;
  end?: number;
};

type TimelineSceneManifest = {
  sceneId: string;
  offset: number;
  duration: number;
  end?: number;
  segments: TimelineSegmentManifest[];
};

type AudioSegmentManifest = {
  id: string;
  file: string;
  duration: number;
};

type SubtitleCueManifest = {
  id?: string;
  text: string;
  start: number;
  end: number;
};

type SubtitleSegmentManifest = {
  segmentId: string;
  cues: SubtitleCueManifest[];
};

type ManifestScene<TSegment> = {
  sceneId: string;
  segments: TSegment[];
};

export type NarratedTimingInput = {
  fps: number;
  audioSrcPrefix: string;
  audioManifest: {scenes: ManifestScene<AudioSegmentManifest>[]};
  subtitleManifest: {scenes: ManifestScene<SubtitleSegmentManifest>[]};
  timelineManifest: {
    duration: number;
    scenes: TimelineSceneManifest[];
  };
};

export type NarratedSceneTiming = {
  sceneId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  segments: NarratedSegmentTiming[];
};

export type NarratedCueTiming = {
  id?: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
};

export type NarratedSegmentTiming = {
  segmentId: string;
  audioFile: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  cues: NarratedCueTiming[];
};

export type NarratedTiming = {
  fps: number;
  totalDurationSeconds: number;
  totalDurationFrames: number;
  scenes: NarratedSceneTiming[];
  audioTracks: AudioTrackConfig[];
  subtitleCues: SubtitleCue[];
};

const TIMING_EPSILON_SECONDS = 0.02;

const assertTimingClose = (left: number, right: number, label: string) => {
  if (Math.abs(left - right) > TIMING_EPSILON_SECONDS) {
    throw new Error(`${label} 时间不一致：${left} ≠ ${right}`);
  }
};

const assertFiniteTiming = (value: number, label: string) => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} 不是有效时间：${value}`);
  }
};

const findManifestScene = <T,>(scenes: ManifestScene<T>[], sceneId: string) => {
  return scenes.find((scene) => String(scene.sceneId).padStart(2, '0') === sceneId);
};

/**
 * narrated 视频唯一的 Remotion 时间入口。
 *
 * Timeline 决定 Scene 边界，Audio Manifest 决定音频文件和真实时长，
 * Subtitle Manifest 决定 Cue 文本和相对时间。三者缺一或映射不一致时必须停止，
 * 不能退回到估算时长或任意硬编码时间。
 */
export const createNarratedTiming = ({
  fps,
  audioSrcPrefix,
  audioManifest,
  subtitleManifest,
  timelineManifest,
}: NarratedTimingInput): NarratedTiming => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`无效的 Remotion FPS：${fps}`);
  }
  assertFiniteTiming(timelineManifest.duration, 'Timeline 总时长');
  if (timelineManifest.duration <= 0) {
    throw new Error('Timeline 总时长必须大于 0');
  }

  const scenes = timelineManifest.scenes.map((timelineScene) => {
    const sceneId = String(timelineScene.sceneId).padStart(2, '0');
    const audioScene = findManifestScene(audioManifest.scenes, sceneId);
    const subtitleScene = findManifestScene(subtitleManifest.scenes, sceneId);
    if (!audioScene) throw new Error(`Scene ${sceneId} 缺少 Audio Manifest 映射`);
    if (!subtitleScene) throw new Error(`Scene ${sceneId} 缺少 Subtitle Manifest 映射`);

    const sceneStart = timelineScene.offset;
    const sceneEnd = timelineScene.end ?? sceneStart + timelineScene.duration;
    assertFiniteTiming(sceneStart, `Scene ${sceneId} 起点`);
    assertFiniteTiming(timelineScene.duration, `Scene ${sceneId} 时长`);
    assertFiniteTiming(sceneEnd, `Scene ${sceneId} 终点`);
    if (timelineScene.duration <= 0) throw new Error(`Scene ${sceneId} 时长必须大于 0`);
    assertTimingClose(sceneStart + timelineScene.duration, sceneEnd, `Scene ${sceneId}`);

    const segments = timelineScene.segments.map((timelineSegment) => {
      const audioSegment = audioScene.segments.find((segment) => segment.id === timelineSegment.segmentId);
      const subtitleSegment = subtitleScene.segments.find((segment) => segment.segmentId === timelineSegment.segmentId);
      if (!audioSegment) throw new Error(`Scene ${sceneId}／Segment ${timelineSegment.segmentId} 缺少 Audio Manifest 映射`);
      if (!subtitleSegment) throw new Error(`Scene ${sceneId}／Segment ${timelineSegment.segmentId} 缺少 Subtitle Manifest 映射`);

      assertFiniteTiming(timelineSegment.offset, `Scene ${sceneId}／Segment ${timelineSegment.segmentId} 起点`);
      assertFiniteTiming(timelineSegment.duration, `Scene ${sceneId}／Segment ${timelineSegment.segmentId} 时长`);
      assertFiniteTiming(audioSegment.duration, `Scene ${sceneId}／Segment ${timelineSegment.segmentId} 音频时长`);
      assertTimingClose(timelineSegment.duration, audioSegment.duration, `Scene ${sceneId}／Segment ${timelineSegment.segmentId} 音频`);

      const startSeconds = sceneStart + timelineSegment.offset;
      const endSeconds = startSeconds + timelineSegment.duration;
      const cues = subtitleSegment.cues.map((cue) => {
        assertFiniteTiming(cue.start, `字幕 Cue ${cue.id ?? 'unknown'} 起点`);
        assertFiniteTiming(cue.end, `字幕 Cue ${cue.id ?? 'unknown'} 终点`);
        if (cue.end <= cue.start) throw new Error(`字幕 Cue ${cue.id ?? 'unknown'} 时间范围无效`);
        return {
          id: cue.id,
          endSeconds: startSeconds + cue.end,
          endFrame: secondsToFrames(startSeconds + cue.end, fps),
          startSeconds: startSeconds + cue.start,
          startFrame: secondsToFrames(startSeconds + cue.start, fps),
          text: cue.text,
        };
      });

      return {
        segmentId: timelineSegment.segmentId,
        audioFile: audioSegment.file,
        startSeconds,
        endSeconds,
        durationSeconds: timelineSegment.duration,
        startFrame: secondsToFrames(startSeconds, fps),
        endFrame: secondsToFrames(endSeconds, fps),
        durationFrames: secondsToFrames(timelineSegment.duration, fps),
        cues,
      };
    });

    return {
      sceneId,
      startSeconds: sceneStart,
      endSeconds: sceneEnd,
      durationSeconds: timelineScene.duration,
      startFrame: secondsToFrames(sceneStart, fps),
      endFrame: secondsToFrames(sceneEnd, fps),
      durationFrames: secondsToFrames(timelineScene.duration, fps),
      segments,
    };
  });

  const result = {
    fps,
    totalDurationSeconds: timelineManifest.duration,
    totalDurationFrames: secondsToFrames(timelineManifest.duration, fps),
    scenes,
    audioTracks: scenes.flatMap((scene) => scene.segments.map((segment) => ({
      id: segment.segmentId,
      src: `${audioSrcPrefix}/${segment.audioFile}`,
      startSeconds: segment.startSeconds,
      durationSeconds: segment.durationSeconds,
    }))),
    subtitleCues: scenes.flatMap((scene) => scene.segments.flatMap((segment) => segment.cues.map((cue) => ({
      startSeconds: cue.startSeconds,
      endSeconds: cue.endSeconds,
      text: cue.text,
    })))),
  };

  assertTimingClose(
    result.scenes[result.scenes.length - 1]?.endSeconds ?? 0,
    result.totalDurationSeconds,
    'Timeline 最后一幕与总时长',
  );
  return result;
};

type DistributedRevealOptions = {
  count: number;
  durationSeconds: number;
  fps: number;
  leadInSeconds?: number;
  leadOutSeconds?: number;
  revealSeconds?: number;
  startSeconds?: number[];
};

export const getDistributedRevealFrames = ({
  count,
  durationSeconds,
  fps,
  leadInSeconds = 1,
  leadOutSeconds = 1,
  revealSeconds = 0.5,
  startSeconds,
}: DistributedRevealOptions) => {
  if (count <= 0) {
    return [];
  }

  const durationFrames = secondsToFrames(durationSeconds, fps);
  const leadInFrames = secondsToFrames(leadInSeconds, fps);
  const leadOutFrames = secondsToFrames(leadOutSeconds, fps);
  const revealFrames = Math.max(1, secondsToFrames(revealSeconds, fps));

  if (startSeconds) {
    if (startSeconds.length !== count) {
      throw new Error(`Expected ${count} explicit reveal times, received ${startSeconds.length}`);
    }

    return startSeconds.map((seconds) => {
      const startFrame = secondsToFrames(Math.max(0, seconds), fps);

      return {
        startFrame,
        endFrame: startFrame + revealFrames,
      };
    });
  }

  const firstStartFrame = Math.min(leadInFrames, Math.max(0, durationFrames - revealFrames));
  const lastStartFrame = Math.max(firstStartFrame, durationFrames - leadOutFrames - revealFrames);
  const gapFrames = count === 1 ? 0 : (lastStartFrame - firstStartFrame) / (count - 1);

  return Array.from({length: count}, (_, index) => {
    const startFrame = Math.round(firstStartFrame + gapFrames * index);

    return {
      startFrame,
      endFrame: startFrame + revealFrames,
    };
  });
};

export const getCaptionLineDurationsSeconds = (lines: string[]) => {
  return lines.map(estimateCaptionLineSeconds);
};

export const estimateNarrationSeconds = (lines: string[]) => {
  if (lines.length === 0) {
    return 0;
  }

  const lineDurations = getCaptionLineDurationsSeconds(lines);
  const lineGaps = Math.max(0, lines.length - 1) * LINE_GAP_SECONDS;

  return lineDurations.reduce((total, duration) => total + duration, 0) + lineGaps;
};

export const getSceneVisualMinimumSeconds = (scene: SceneConfig, fps: number) => {
  const secondsFromFrame = (frame: number) => frame / fps;

  switch (scene.type) {
    case 'opening':
      return Math.max(3.2, secondsFromFrame(58 + (scene.cards.length - 1) * 8));
    case 'concept':
      return Math.max(3.5, secondsFromFrame(46 + (scene.keyPoints.length - 1) * 12));
    case 'comparison': {
      const columns = Array.isArray(scene.columns)
        ? scene.columns
        : [scene.left, scene.right].filter((column): column is NonNullable<typeof column> => Boolean(column));
      const maxItemCount = columns.reduce((max, column) => Math.max(max, column.items.length), 0);

      return Math.max(
        3.5,
        secondsFromFrame(38 + 28 + (maxItemCount - 1) * 8),
      );
    }
    case 'step-list':
      return Math.max(3.8, secondsFromFrame(24 + (scene.steps.length - 1) * 14 + 18));
    case 'terminal':
      return Math.max(5.5, secondsFromFrame(108 + (scene.output.length - 1) * 18));
    case 'summary':
      return Math.max(4, secondsFromFrame(74 + (scene.bullets.length - 1) * 12));
    default: {
      const _exhaustive: never = scene;
      return _exhaustive;
    }
  }
};

export const estimateSceneDurationSeconds = (scene: SceneConfig, fps: number) => {
  const tailPause = scene.type === 'summary'
    ? SUMMARY_SCENE_TAIL_PAUSE_SECONDS
    : DEFAULT_SCENE_TAIL_PAUSE_SECONDS;

  return roundUpToHalfSecond(
    Math.max(estimateNarrationSeconds(scene.caption) + tailPause, getSceneVisualMinimumSeconds(scene, fps)),
  );
};

export const getTotalDurationSeconds = (config: VideoConfig) => {
  const sceneDuration = config.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
  const audioDuration = config.audioTracks?.reduce((total, track) => {
    const startSeconds = track.startSeconds ?? total;
    return Math.max(total, startSeconds + track.durationSeconds);
  }, 0) ?? 0;
  const subtitleDuration = config.subtitleCues?.reduce((latest, cue) => Math.max(latest, cue.endSeconds), 0) ?? 0;

  return Math.max(sceneDuration, audioDuration, subtitleDuration);
};

export const getTotalDurationFrames = (config: VideoConfig) => {
  return getContentStartFrame(config) + secondsToFrames(getTotalDurationSeconds(config), config.fps);
};

export const getContentStartFrame = (config: VideoConfig) => {
  if (!config.series?.coverSrc) return 0;
  return Math.max(0, Math.round(config.series.coverDurationFrames));
};

export const getSceneStartFrame = (
  scenes: SceneConfig[],
  sceneIndex: number,
  fps: number,
) => {
  const previousDuration = scenes
    .slice(0, sceneIndex)
    .reduce((total, scene) => total + scene.durationSeconds, 0);

  return secondsToFrames(previousDuration, fps);
};
