import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {ProgressBar} from '../../components/ProgressBar';
import {colors, SceneContainer} from '../../components/SceneContainer';
import {video14Config, type Video14SceneConfig} from './video14.config';
import {BugIntroScene} from './scenes/BugIntroScene';

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

  return <PlaceholderScene scene={scene} index={index} />;
};

export const ClaudeCodeWhatIsVideo14 = () => {
  const frame = useCurrentFrame();
  const durationInFrames = getTotalDurationFrames();

  return (
    <>
      {video14Config.scenes.map((scene, index) => (
        <Sequence key={scene.id} from={getSceneStartFrame(index)} durationInFrames={scene.durationInFrames}>
          {renderScene(scene, index)}
        </Sequence>
      ))}
      <ProgressBar currentFrame={frame} durationInFrames={durationInFrames} />
    </>
  );
};
