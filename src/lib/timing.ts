import type {SceneConfig, VideoConfig} from './videoTypes';

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
  return secondsToFrames(getTotalDurationSeconds(config), config.fps);
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
