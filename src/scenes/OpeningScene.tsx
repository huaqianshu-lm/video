import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {OpeningSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type OpeningSceneProps = {
  scene: OpeningSceneConfig;
};

export const OpeningScene = ({scene}: OpeningSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = spring({fps, frame: Math.max(0, frame - 8), config: {damping: 16}});
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <SceneContainer>
        <div
          style={{
            alignItems: 'center',
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
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 7,
              marginBottom: 32,
              opacity: titleOpacity,
              textTransform: 'uppercase',
            }}
          >
            AI Coding Workflow
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 860,
              letterSpacing: -4,
              lineHeight: 1.08,
              opacity: titleOpacity,
              transform: `scale(${0.94 + titleSpring * 0.06})`,
            }}
          >
            {scene.headline}
          </div>
          <div
            style={{
              color: colors.muted,
              fontSize: 43,
              fontWeight: 600,
              marginTop: 28,
              opacity: interpolate(frame, [24, 42], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.subtitle}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 22,
              marginTop: 74,
            }}
          >
            {scene.cards.map((card, index) => {
              const isHighlighted = card === scene.highlight;
              const opacity = interpolate(frame, [42 + index * 8, 58 + index * 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const y = interpolate(frame, [42 + index * 8, 58 + index * 8], [26, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return (
                <div
                  key={card}
                  style={{
                    background: isHighlighted ? colors.cardStrong : colors.card,
                    border: `1px solid ${isHighlighted ? colors.accent : colors.line}`,
                    borderRadius: 28,
                    boxShadow: isHighlighted
                      ? '0 0 44px rgba(125, 211, 252, 0.24)'
                      : 'none',
                    color: isHighlighted ? colors.text : colors.muted,
                    fontSize: 32,
                    fontWeight: 760,
                    opacity,
                    padding: '24px 26px',
                    transform: `translateY(${y}px)`,
                  }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </SceneContainer>
      <Caption text={scene.caption} />
    </>
  );
};
