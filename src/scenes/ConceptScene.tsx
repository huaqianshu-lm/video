import {interpolate, useCurrentFrame} from 'remotion';
import type {ConceptSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type ConceptSceneProps = {
  scene: ConceptSceneConfig;
};

export const ConceptScene = ({scene}: ConceptSceneProps) => {
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
              marginBottom: 30,
            }}
          >
            CORE CONCEPT
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 840,
              letterSpacing: -3,
              lineHeight: 1.14,
              maxWidth: 860,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(frame, [0, 22], [32, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}px)`,
            }}
          >
            {scene.headline}
          </div>
          <div
            style={{
              display: 'grid',
              gap: 24,
              gridTemplateColumns: '1fr 1fr',
              marginTop: 76,
            }}
          >
            {scene.keyPoints.map((point, index) => {
              const opacity = interpolate(frame, [28 + index * 12, 46 + index * 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return (
                <div
                  key={point}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 30,
                    fontSize: 40,
                    fontWeight: 750,
                    opacity,
                    padding: '38px 32px',
                    transform: `translateY(${(1 - opacity) * 22}px)`,
                  }}
                >
                  <span
                    style={{
                      color: colors.accent,
                      marginRight: 16,
                    }}
                  >
                    0{index + 1}
                  </span>
                  {point}
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
