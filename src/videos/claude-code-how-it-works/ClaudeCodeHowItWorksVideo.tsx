import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ProgressBar} from '../../components/ProgressBar';
import {TimedCaption} from '../../components/TimedCaption';
import {getSceneStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import {HowItWorksScene, type SceneCueFrames} from './HowItWorksScene';
import {videoConfig} from './video.config';

const getSceneCueFrames = (sceneIndex: number, sceneStartFrame: number, sceneDurationInFrames: number): SceneCueFrames[] => {
  const sceneEndFrame = sceneStartFrame + sceneDurationInFrames;
  return (videoConfig.subtitleCues ?? [])
    .filter((cue) => {
      const startFrame = Math.floor(cue.startSeconds * videoConfig.fps);
      const endFrame = Math.ceil(cue.endSeconds * videoConfig.fps);
      return startFrame < sceneEndFrame && endFrame > sceneStartFrame;
    })
    .map((cue) => ({
      start: Math.max(0, Math.floor(cue.startSeconds * videoConfig.fps) - sceneStartFrame),
      end: Math.min(sceneDurationInFrames, Math.max(1, Math.ceil(cue.endSeconds * videoConfig.fps) - sceneStartFrame)),
    }));
};

const getSceneDurationInFrames = (sceneIndex: number) => {
  const startFrame = getSceneStartFrame(videoConfig.scenes, sceneIndex, videoConfig.fps);
  const nextStartFrame = sceneIndex + 1 < videoConfig.scenes.length
    ? getSceneStartFrame(videoConfig.scenes, sceneIndex + 1, videoConfig.fps)
    : getTotalDurationFrames(videoConfig);

  return Math.max(1, nextStartFrame - startFrame);
};

export const ClaudeCodeHowItWorksVideo = () => {
  const frame = useCurrentFrame();
  const durationInFrames = getTotalDurationFrames(videoConfig);

  return (
    <>
      {videoConfig.audioTracks?.map((track) => (
        <Sequence key={track.id ?? track.src} from={secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))} name={`Audio ${track.id ?? track.src}`} premountFor={videoConfig.fps * 2}>
          <Audio pauseWhenBuffering src={staticFile(track.src)} />
        </Sequence>
      )) ?? null}
      {videoConfig.scenes.map((scene, index) => {
        const from = getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps);
        const durationInFrames = getSceneDurationInFrames(index);
        return <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.id}><HowItWorksScene scene={scene} cueFrames={getSceneCueFrames(index, from, durationInFrames)} /></Sequence>;
      })}
      {videoConfig.subtitleCues ? <TimedCaption bottomMargin={32} cues={videoConfig.subtitleCues} /> : null}
      <ProgressBar currentFrame={frame} durationInFrames={durationInFrames} />
    </>
  );
};
