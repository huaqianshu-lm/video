import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ProgressBar} from '../../components/ProgressBar';
import {colors, SceneContainer} from '../../components/SceneContainer';
import {TimedCaption} from '../../components/TimedCaption';
import {
  video14AudioTracks,
  video14Config,
  video14SubtitleCues,
  type Video14SceneConfig,
} from './video14.config';
import {AdviceToActionScene} from './scenes/AdviceToActionScene';
import {AiCodingEvolutionScene} from './scenes/AiCodingEvolutionScene';
import {AiExpectationScene} from './scenes/AiExpectationScene';
import {BugIntroScene} from './scenes/BugIntroScene';
import {ChatGptWorkflowScene} from './scenes/ChatGptWorkflowScene';
import {ClaudeCodeDefinitionScene} from './scenes/ClaudeCodeDefinitionScene';
import {ClaudeCodeWorkflowScene} from './scenes/ClaudeCodeWorkflowScene';
import {CopilotToAgentScene} from './scenes/CopilotToAgentScene';
import {ExternalConnectionsScene} from './scenes/ExternalConnectionsScene';
import {HumanAiCollaborationScene} from './scenes/HumanAiCollaborationScene';
import {HumanJudgmentScene} from './scenes/HumanJudgmentScene';
import {TaskExecutionScene} from './scenes/TaskExecutionScene';
import {ToolRoutingScene} from './scenes/ToolRoutingScene';
import {UnderstandProjectScene} from './scenes/UnderstandProjectScene';

const getSceneStartFrame = (sceneIndex: number) => {
  return video14Config.scenes
    .slice(0, sceneIndex)
    .reduce((total, scene) => total + scene.durationInFrames, 0);
};

const getTotalDurationFrames = () => {
  return video14Config.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
};

const PlaceholderScene = ({scene, index}: {scene: Video14SceneConfig; index: number}) => {
  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 120,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            border: `1px solid ${colors.line}`,
            borderRadius: 28,
            background: 'rgba(255,255,255,0.06)',
            maxWidth: 980,
            padding: '54px 70px',
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontSize: 28,
              fontWeight: 860,
              letterSpacing: 2,
              marginBottom: 22,
              textTransform: 'uppercase',
            }}
          >
            Scene {String(index + 1).padStart(2, '0')} · {scene.visualType}
          </div>
          <div style={{fontSize: 52, fontWeight: 880, lineHeight: 1.18}}>{scene.title}</div>
          <div style={{color: colors.muted, fontSize: 26, marginTop: 28}}>Placeholder · 仅用于确认 14 Scene 时间轴</div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

const renderScene = (scene: Video14SceneConfig, index: number) => {
  if (index === 0) {
    return <BugIntroScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 1) {
    return <ChatGptWorkflowScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 2) {
    return <ClaudeCodeWorkflowScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 3) {
    return <AdviceToActionScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 4) {
    return <ClaudeCodeDefinitionScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 5) {
    return <CopilotToAgentScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 6) {
    return <UnderstandProjectScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 7) {
    return <TaskExecutionScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 8) {
    return <ExternalConnectionsScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 9) {
    return <AiExpectationScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 10) {
    return <HumanJudgmentScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 11) {
    return <HumanAiCollaborationScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 12) {
    return <ToolRoutingScene durationInFrames={scene.durationInFrames} />;
  }

  if (index === 13) {
    return <AiCodingEvolutionScene durationInFrames={scene.durationInFrames} />;
  }

  return <PlaceholderScene scene={scene} index={index} />;
};

export const ClaudeCodeWhatIsVideo14 = () => {
  const frame = useCurrentFrame();
  const durationInFrames = getTotalDurationFrames();

  return (
    <>
      {video14AudioTracks.map((track) => (
        <Sequence
          key={track.id}
          from={track.startInFrames}
          durationInFrames={track.durationInFrames}
          name={`Audio ${track.id}`}
          premountFor={video14Config.fps * 2}
        >
          <Audio pauseWhenBuffering src={staticFile(track.src)} />
        </Sequence>
      ))}
      {video14Config.scenes.map((scene, index) => (
        <Sequence key={scene.id} from={getSceneStartFrame(index)} durationInFrames={scene.durationInFrames}>
          {renderScene(scene, index)}
        </Sequence>
      ))}
      <TimedCaption cues={video14SubtitleCues} />
      <ProgressBar currentFrame={frame} durationInFrames={durationInFrames} />
    </>
  );
};
