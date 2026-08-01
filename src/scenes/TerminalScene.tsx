import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TerminalSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames, secondsToFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {StatusChip, VisualCard, getToneColor} from '../components/VisualPrimitives';

type TerminalSceneProps = {
  scene: TerminalSceneConfig;
};

const getOutputMarker = (index: number, isLast: boolean) => {
  if (isLast) {
    return {color: '#fbbf24', prefix: '! '};
  }

  if (index >= 2) {
    return {color: '#86efac', prefix: '✓ '};
  }

  return {color: colors.accent, prefix: '→ '};
};

export const TerminalScene = ({scene}: TerminalSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const commandStartFrame = secondsToFrames(2.4, fps);
  const commandEndFrame = secondsToFrames(scene.durationSeconds * 0.38, fps);
  const outputRevealFrames = getDistributedRevealFrames({
    count: scene.output.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: scene.durationSeconds * 0.48,
    leadOutSeconds: 2,
    revealSeconds: 0.55,
  });
  const typedChars = Math.floor(interpolate(frame, [commandStartFrame, commandEndFrame], [0, scene.command.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const command = scene.command.slice(0, typedChars);
  const activeFlowIndex = outputRevealFrames.reduce((latest, timing, index) => frame >= timing.startFrame ? index : latest, 0);

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
              fontSize: 60,
              fontWeight: 850,
              letterSpacing: -2,
              lineHeight: 1.12,
              marginBottom: 42,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div style={{display: 'grid', gap: 24, gridTemplateColumns: '1.12fr 0.88fr'}}>
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
                  padding: '22px 28px',
                }}
              >
                {['#ef4444', '#f59e0b', '#22c55e'].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      background: dot,
                      borderRadius: 999,
                      display: 'block',
                      height: 17,
                      width: 17,
                    }}
                  />
                ))}
                <span
                  style={{
                    color: colors.muted,
                    fontSize: 23,
                    fontWeight: 700,
                    marginLeft: 14,
                  }}
                >
                  terminal
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'Menlo, Monaco, Consolas, monospace',
                  fontSize: 27,
                  lineHeight: 1.55,
                  minHeight: 390,
                  padding: '36px 32px',
                }}
              >
                <div style={{color: colors.text}}>
                  <span style={{color: colors.accent}}>$ </span>
                  {command}
                  <span style={{opacity: frame % 24 < 12 ? 1 : 0}}>▊</span>
                </div>
                <div style={{marginTop: 34}}>
                  {scene.output.map((line, index) => {
                    const timing = outputRevealFrames[index];
                    const opacity = interpolate(frame, [timing.startFrame, timing.endFrame], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });
                    const isLast = index === scene.output.length - 1;
                    const marker = getOutputMarker(index, isLast);

                    return (
                      <div
                        key={line}
                        style={{
                          color: marker.color,
                          opacity,
                        }}
                      >
                        <span style={{color: marker.color}}>{marker.prefix}</span>{line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <VisualCard active style={{padding: 28}}>
              <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 24}}>
                <div style={{color: colors.accent, fontSize: 25, fontWeight: 850}}>Review gate</div>
                <StatusChip active tone="warning">waiting for human</StatusChip>
              </div>
              {scene.reviewFlow ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                  {scene.reviewFlow.map((item, index) => {
                    const isActive = index <= activeFlowIndex;
                    const color = getToneColor(isActive ? item.tone ?? 'accent' : 'muted');

                    return (
                      <div
                        key={`${item.title}-${index}`}
                        style={{
                          background: isActive ? `${color}18` : 'rgba(255,255,255,0.055)',
                          border: `1px solid ${isActive ? color : colors.line}`,
                          borderRadius: 18,
                          padding: '16px 18px',
                        }}
                      >
                        <div style={{alignItems: 'center', display: 'flex', gap: 10, marginBottom: 6}}>
                          <span style={{color, fontSize: 20, fontWeight: 900}}>{item.label ?? `0${index + 1}`}</span>
                          <span style={{color: isActive ? colors.text : colors.muted, fontSize: 23, fontWeight: 820}}>{item.title}</span>
                        </div>
                        {item.description ? (
                          <div style={{color: colors.muted, fontSize: 18, lineHeight: 1.35}}>{item.description}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </VisualCard>
          </div>
        </div>
      </SceneContainer>
      <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} />
    </>
  );
};
