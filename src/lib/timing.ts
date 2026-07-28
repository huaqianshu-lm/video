import type {SceneConfig, VideoConfig} from './videoTypes';

export const secondsToFrames = (seconds: number, fps: number) => {
  return Math.round(seconds * fps);
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
