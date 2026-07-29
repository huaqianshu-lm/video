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
    case 'comparison':
      return Math.max(
        3.5,
        secondsFromFrame(38 + 28 + (Math.max(scene.left.items.length, scene.right.items.length) - 1) * 8),
      );
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

export const getTotalDurationSeconds = (scenes: SceneConfig[]) => {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
};

export const getTotalDurationFrames = (config: VideoConfig) => {
  return secondsToFrames(getTotalDurationSeconds(config.scenes), config.fps);
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
