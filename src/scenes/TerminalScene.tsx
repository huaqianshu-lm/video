import {interpolate, useCurrentFrame} from 'remotion';
import type {TerminalSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {colors, SceneContainer} from '../components/SceneContainer';

type TerminalSceneProps = {
  scene: TerminalSceneConfig;
};

export const TerminalScene = ({scene}: TerminalSceneProps) => {
  const frame = useCurrentFrame();
  const typedChars = Math.floor(interpolate(frame, [32, 78], [0, scene.command.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const command = scene.command.slice(0, typedChars);

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
              fontSize: 72,
              fontWeight: 850,
              letterSpacing: -2,
              lineHeight: 1.12,
              marginBottom: 64,
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
              background: 'rgba(2, 6, 23, 0.86)',
              border: `1px solid ${colors.line}`,
              borderRadius: 34,
              boxShadow: '0 30px 100px rgba(0,0,0,0.36)',
              overflow: 'hidden',
              opacity: interpolate(frame, [16, 34], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <div
              style={{
                alignItems: 'center',
                background: 'rgba(255,255,255,0.06)',
                borderBottom: `1px solid ${colors.line}`,
                display: 'flex',
                gap: 12,
                padding: '24px 30px',
              }}
            >
              {['#ef4444', '#f59e0b', '#22c55e'].map((dot) => (
                <span
                  key={dot}
                  style={{
                    background: dot,
                    borderRadius: 999,
                    display: 'block',
                    height: 18,
                    width: 18,
                  }}
                />
              ))}
              <span
                style={{
                  color: colors.muted,
                  fontSize: 24,
                  fontWeight: 700,
                  marginLeft: 16,
                }}
              >
                terminal
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                fontSize: 34,
                lineHeight: 1.55,
                minHeight: 390,
                padding: '42px 38px',
              }}
            >
              <div style={{color: colors.text}}>
                <span style={{color: colors.accent}}>$ </span>
                {command}
                <span
                  style={{
                    opacity: frame % 24 < 12 ? 1 : 0,
                  }}
                >
                  ▊
                </span>
              </div>
              <div style={{marginTop: 36}}>
                {scene.output.map((line, index) => {
                  const opacity = interpolate(frame, [92 + index * 18, 108 + index * 18], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });

                  return (
                    <div
                      key={line}
                      style={{
                        color: index === scene.output.length - 1 ? '#86efac' : colors.muted,
                        opacity,
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SceneContainer>
      <Caption text={scene.caption} />
    </>
  );
};
