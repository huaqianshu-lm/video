import {interpolate, useCurrentFrame} from 'remotion';
import type {StepListSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type StepListSceneProps = {
  scene: StepListSceneConfig;
};

export const StepListScene = ({scene}: StepListSceneProps) => {
  const frame = useCurrentFrame();

  return (
    <>
      <SceneContainer>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontSize: 34,
              fontWeight: 760,
              letterSpacing: 5,
              marginBottom: 28,
            }}
          >
            WORKFLOW
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 850,
              letterSpacing: -2,
              lineHeight: 1.1,
              marginBottom: 58,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            {scene.steps.map((step, index) => {
              const start = 24 + index * 14;
              const opacity = interpolate(frame, [start, start + 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const isActive = frame >= start + 12;

              return (
                <div
                  key={step}
                  style={{
                    alignItems: 'center',
                    background: isActive ? colors.cardStrong : colors.card,
                    border: `1px solid ${isActive ? colors.accent : colors.line}`,
                    borderRadius: 30,
                    display: 'flex',
                    gap: 26,
                    opacity,
                    padding: '26px 30px',
                    transform: `translateX(${(1 - opacity) * -28}px)`,
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      background: isActive ? colors.accent : 'rgba(255,255,255,0.14)',
                      borderRadius: 999,
                      color: isActive ? '#06111f' : colors.text,
                      display: 'flex',
                      flexShrink: 0,
                      fontSize: 28,
                      fontWeight: 850,
                      height: 58,
                      justifyContent: 'center',
                      width: 58,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      color: isActive ? colors.text : colors.muted,
                      fontSize: 39,
                      fontWeight: 720,
                    }}
                  >
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SceneContainer>
      <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} />
    </>
  );
};
