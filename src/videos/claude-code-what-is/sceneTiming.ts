import timelineManifest from './generated/timeline-manifest.json';

const fps = 30;

export const segmentFrame = (sceneId: string, segmentId: string, progress = 0) => {
  const scene = timelineManifest.scenes.find((item) => item.sceneId === sceneId);
  const segment = scene?.segments.find((item) => item.segmentId === segmentId);

  if (!scene || !segment) {
    throw new Error(`Missing narration timing for ${sceneId}/${segmentId}`);
  }

  return Math.round((segment.offset + segment.duration * progress) * fps);
};

export const sceneEndFrame = (sceneId: string) => {
  const scene = timelineManifest.scenes.find((item) => item.sceneId === sceneId);

  if (!scene) {
    throw new Error(`Missing narration timing for scene ${sceneId}`);
  }

  return Math.round(scene.duration * fps);
};
