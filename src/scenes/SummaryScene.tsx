import {interpolate, useCurrentFrame} from 'remotion';
import type {SummarySceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type SummarySceneProps = {
  scene: SummarySceneConfig;
};

export const SummaryScene = ({scene}: SummarySceneProps) => {
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
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: 7,
              marginBottom: 34,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 860,
              letterSpacing: -3,
              lineHeight: 1.15,
              margin: '0 auto',
              maxWidth: 850,
              opacity: interpolate(frame, [16, 34], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              textShadow: '0 0 38px rgba(125, 211, 252, 0.18)',
            }}
          >
            {scene.summary}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              margin: '70px auto 0',
              maxWidth: 760,
              width: '100%',
            }}
          >
            {scene.bullets.map((bullet, index) => {
              const opacity = interpolate(frame, [58 + index * 12, 74 + index * 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return (
                <div
                  key={bullet}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 999,
                    color: bullet.includes(scene.highlight) ? colors.accent : colors.text,
                    fontSize: 35,
                    fontWeight: 720,
                    opacity,
                    padding: '24px 34px',
                    transform: `translateY(${(1 - opacity) * 20}px)`,
                  }}
                >
                  {bullet}
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
