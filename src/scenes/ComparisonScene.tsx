import {interpolate, useCurrentFrame} from 'remotion';
import type {ComparisonColumn, ComparisonSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type ComparisonSceneProps = {
  scene: ComparisonSceneConfig;
};

const Column = ({column, active, delay}: {column: ComparisonColumn; active: boolean; delay: number}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        background: active ? colors.cardStrong : colors.card,
        border: `1px solid ${active ? colors.accent : colors.line}`,
        borderRadius: 34,
        boxShadow: active ? '0 0 52px rgba(125, 211, 252, 0.2)' : 'none',
        flex: 1,
        opacity,
        padding: '42px 34px',
        transform: `translateY(${(1 - opacity) * 26}px)`,
      }}
    >
      <div
        style={{
          color: active ? colors.accent : colors.muted,
          fontSize: 44,
          fontWeight: 850,
          marginBottom: 38,
        }}
      >
        {column.title}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
        {column.items.map((item, index) => {
          const itemOpacity = interpolate(frame, [delay + 14 + index * 8, delay + 28 + index * 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={item}
              style={{
                alignItems: 'center',
                color: active ? colors.text : colors.muted,
                display: 'flex',
                fontSize: 32,
                fontWeight: 650,
                gap: 16,
                opacity: itemOpacity,
              }}
            >
              <span
                style={{
                  background: active ? colors.accent : 'rgba(255,255,255,0.22)',
                  borderRadius: 999,
                  display: 'block',
                  height: 12,
                  width: 12,
                }}
              />
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ComparisonScene = ({scene}: ComparisonSceneProps) => {
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
              fontSize: 66,
              fontWeight: 840,
              letterSpacing: -2,
              lineHeight: 1.14,
              marginBottom: 72,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div style={{display: 'flex', gap: 28}}>
            <Column column={scene.left} active={scene.highlight === 'left'} delay={22} />
            <Column column={scene.right} active={scene.highlight === 'right'} delay={38} />
          </div>
        </div>
      </SceneContainer>
      <Caption text={scene.caption} />
    </>
  );
};
