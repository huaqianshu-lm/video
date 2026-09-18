import type {PromoBeat, PromoTimeline, PromoTimelineScene} from './promoTypes';

export const promoSceneAtFrame = (timeline: PromoTimeline, frame: number): PromoTimelineScene => {
  return timeline.scenes.find((scene) => frame >= scene.startFrame && frame < scene.endFrame)
    ?? timeline.scenes[timeline.scenes.length - 1];
};

export const promoBeatAtFrame = (scene: PromoTimelineScene, frame: number): PromoBeat | undefined => {
  return scene.beats.find((beat) => frame >= beat.startFrame && frame < beat.endFrame);
};

export const promoLocalFrame = (scene: PromoTimelineScene, frame: number): number => {
  return Math.max(0, frame - scene.startFrame);
};

export const promoTimelineDuration = (timeline: PromoTimeline): number => {
  return timeline.durationInFrames;
};
