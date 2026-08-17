import {Audio, Sequence, staticFile} from 'remotion';
import {TimedCaption} from '../../components/TimedCaption';
import {ComparisonScene} from '../../scenes/ComparisonScene';
import {ConceptScene} from '../../scenes/ConceptScene';
import {OpeningScene} from '../../scenes/OpeningScene';
import {StepListScene} from '../../scenes/StepListScene';
import {SummaryScene} from '../../scenes/SummaryScene';
import {TerminalScene} from '../../scenes/TerminalScene';
import {getSceneStartFrame, secondsToFrames} from '../../lib/timing';
import type {SceneConfig} from '../../lib/videoTypes';
import {videoConfig} from './video.config';

const renderScene = (scene: SceneConfig) => {
  switch (scene.type) {
    case 'opening': return <OpeningScene scene={scene} />;
    case 'concept': return <ConceptScene scene={scene} />;
    case 'comparison': return <ComparisonScene scene={scene} />;
    case 'step-list': return <StepListScene scene={scene} />;
    case 'summary': return <SummaryScene scene={scene} />;
    case 'terminal': return <TerminalScene scene={scene} />;
    default: {
      const _exhaustive: never = scene;
      return _exhaustive;
    }
  }
};

export const ClaudeCodeCodingPlanVideo = () => (
  <>
    {videoConfig.audioTracks?.map((track) => (
      <Sequence
        key={track.id ?? track.src}
        from={secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)}
        durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))}
        name={`Audio ${track.id ?? track.src}`}
        premountFor={videoConfig.fps * 2}
      >
        <Audio pauseWhenBuffering src={staticFile(track.src)} />
      </Sequence>
    )) ?? null}
    {videoConfig.scenes.map((scene, index) => {
      const from = getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps);
      return (
        <Sequence key={scene.id} from={from} durationInFrames={secondsToFrames(scene.durationSeconds, videoConfig.fps)} name={scene.id}>
          {renderScene(scene)}
        </Sequence>
      );
    })}
    {videoConfig.subtitleCues ? <TimedCaption cues={videoConfig.subtitleCues} /> : null}
  </>
);
