import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Caption} from '../../components/Caption';
import {ProgressBar} from '../../components/ProgressBar';
import {TimedCaption} from '../../components/TimedCaption';
import {ComparisonScene} from '../../scenes/ComparisonScene';
import {ConceptScene} from '../../scenes/ConceptScene';
import {OpeningScene} from '../../scenes/OpeningScene';
import {StepListScene} from '../../scenes/StepListScene';
import {SummaryScene} from '../../scenes/SummaryScene';
import {TerminalScene} from '../../scenes/TerminalScene';
import {getSceneStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import type {SceneConfig} from '../../lib/videoTypes';
import {videoConfig} from './video.config';

const renderScene = (scene: SceneConfig) => {
  switch (scene.type) {
    case 'opening':
      return <OpeningScene scene={scene} />;
    case 'concept':
      return <ConceptScene scene={scene} />;
    case 'comparison':
      return <ComparisonScene scene={scene} />;
    case 'step-list':
      return <StepListScene scene={scene} />;
    case 'terminal':
      return <TerminalScene scene={scene} />;
    case 'summary':
      return <SummaryScene scene={scene} />;
    default: {
      const _exhaustive: never = scene;
      return <Caption lines={[`Unsupported scene: ${String(_exhaustive)}`]} durationSeconds={1} />;
    }
  }
};

const getAudioTrackStartFrame = (trackIndex: number) => {
  const previousDurationSeconds = videoConfig.audioTracks
    ?.slice(0, trackIndex)
    .reduce((total, track) => total + track.durationSeconds, 0) ?? 0;

  return secondsToFrames(previousDurationSeconds, videoConfig.fps);
};

export const ClaudeCodeWhatIsVideo = () => {
  const frame = useCurrentFrame();
  const durationInFrames = getTotalDurationFrames(videoConfig);

  return (
    <>
      {videoConfig.audioTracks?.map((track, index) => (
        <Sequence key={track.src} from={getAudioTrackStartFrame(index)}>
          <Audio src={staticFile(track.src)} />
        </Sequence>
      )) ?? null}
      {videoConfig.scenes.map((scene, index) => {
        const from = getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps);
        const durationInFrames = secondsToFrames(scene.durationSeconds, videoConfig.fps);

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
            {renderScene(scene)}
          </Sequence>
        );
      })}
      {videoConfig.subtitleCues ? <TimedCaption cues={videoConfig.subtitleCues} /> : null}
      <ProgressBar currentFrame={frame} durationInFrames={durationInFrames} />
    </>
  );
};
