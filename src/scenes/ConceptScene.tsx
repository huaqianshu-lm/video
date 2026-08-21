import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ConceptSceneConfig} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {CodeLine, MockWindow, StatusChip} from '../components/VisualPrimitives';

type ConceptSceneProps = {
  scene: ConceptSceneConfig;
};

export const ConceptScene = ({scene}: ConceptSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const demo = scene.workspaceDemo;
  const actionRevealFrames = getDistributedRevealFrames({
    count: demo?.actions.length ?? scene.keyPoints.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: 2.4,
    leadOutSeconds: 1.8,
    revealSeconds: 0.55,
    startSeconds: scene.visualRevealSeconds,
  });
  const activeActionIndex = actionRevealFrames.reduce((latest, timing, index) => frame >= timing.startFrame ? index : latest, 0);
  const activeFileIndex = demo ? Math.min(demo.files.length - 1, activeActionIndex) : 0;
  const scanY = interpolate(frame, [actionRevealFrames[0]?.startFrame ?? 0, actionRevealFrames[1]?.endFrame ?? fps * 5], [18, 150], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
              fontSize: 30,
              fontWeight: 760,
              letterSpacing: 5,
              marginBottom: 24,
            }}
          >
            CORE CONCEPT
          </div>
          <div
            style={{
              fontSize: 62,
              fontWeight: 840,
              letterSpacing: -2,
              lineHeight: 1.12,
              maxWidth: 880,
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
          {demo ? (
            <div
              style={{
                display: 'grid',
                gap: 22,
                gridTemplateRows: '1fr auto',
                marginTop: 42,
              }}
            >
              <MockWindow title={demo.windowTitle ?? 'claude-code-what-is — project'} bodyStyle={{padding: 0}}>
                <div style={{display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 555}}>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.48)',
                      borderRight: `1px solid ${colors.line}`,
                      padding: '24px 18px',
                    }}
                  >
                    <div style={{color: colors.muted, fontSize: 18, fontWeight: 800, marginBottom: 16}}>{demo.filePanelTitle ?? 'PROJECT FILES'}</div>
                    {demo.files.map((file, index) => {
                      const active = index === activeFileIndex;
                      const seen = index <= activeFileIndex;

                      return (
                        <div
                          key={file}
                          style={{
                            background: active ? 'rgba(125, 211, 252, 0.16)' : 'transparent',
                            border: `1px solid ${active ? colors.accent : 'transparent'}`,
                            borderRadius: 12,
                            color: seen ? colors.text : colors.muted,
                            fontFamily: 'Menlo, Monaco, Consolas, monospace',
                            fontSize: 17,
                            fontWeight: active ? 800 : 540,
                            marginBottom: 10,
                            overflow: 'hidden',
                            padding: '9px 10px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {active ? '› ' : '  '}{file}
                        </div>
                      );
                    })}
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20}}>
                      {(demo.statusLabels ?? ['reading', 'editing', 'checking']).map((label, index) => (
                        <StatusChip
                          key={label}
                          active={activeActionIndex >= index}
                          tone={index === 0 ? 'accent' : index === 1 ? 'success' : 'warning'}
                          style={{fontSize: 15, padding: '7px 10px'}}
                        >
                          {label}
                        </StatusChip>
                      ))}
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', padding: 22, position: 'relative'}}>
                    <div
                      style={{
                        alignItems: 'center',
                        borderBottom: `1px solid ${colors.line}`,
                        color: colors.muted,
                        display: 'flex',
                        fontFamily: 'Menlo, Monaco, Consolas, monospace',
                        fontSize: 18,
                        fontWeight: 760,
                        gap: 12,
                        margin: '-2px -2px 18px',
                        paddingBottom: 14,
                      }}
                    >
                      <span style={{color: colors.accent}}>●</span>
                      {demo.files[activeFileIndex]}
                    </div>
                    <div style={{flex: 1, position: 'relative'}}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.32), transparent)',
                          height: 30,
                          left: 0,
                          opacity: activeActionIndex <= 1 ? 1 : 0.28,
                          position: 'absolute',
                          right: 0,
                          top: scanY,
                        }}
                      />
                      {demo.codeLines.map((line, index) => {
                        const isActive = index === activeActionIndex || (activeActionIndex >= 2 && index === 2);
                        const isDiff = activeActionIndex >= 2 && (index === 2 || index === 3);

                        return (
                          <CodeLine
                            key={line}
                            active={isActive}
                            diff={isDiff ? 'add' : undefined}
                          >
                            {line}
                          </CodeLine>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.72)',
                        border: `1px solid ${colors.line}`,
                        borderRadius: 18,
                        color: activeActionIndex >= 3 ? '#86efac' : colors.muted,
                        fontFamily: 'Menlo, Monaco, Consolas, monospace',
                        fontSize: 19,
                        fontWeight: 760,
                        marginTop: 18,
                        padding: '14px 16px',
                      }}
                    >
                      <span style={{color: colors.accent}}>$ </span>
                      {activeActionIndex >= demo.actions.length - 1
                        ? `${demo.readyStatus ?? 'npm run check  ✓ passed'}`
                        : (demo.command ? `${demo.command}  …` : 'waiting for command...')}
                    </div>
                  </div>
                </div>
              </MockWindow>
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 26,
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: `repeat(${demo.actions.length}, 1fr)`,
                  padding: '18px 20px',
                }}
              >
                {demo.actions.map((action, index) => {
                  const active = index <= activeActionIndex;
                  const toneColor = action.tone === 'success' ? '#86efac' : action.tone === 'warning' ? '#fbbf24' : colors.accent;

                  return (
                    <div key={action.title} style={{opacity: active ? 1 : 0.45}}>
                      <div style={{color: active ? toneColor : colors.muted, fontSize: 17, fontWeight: 840, marginBottom: 5}}>
                        {index + 1}. {action.title}
                      </div>
                      <div style={{color: colors.muted, fontSize: 15, lineHeight: 1.35}}>{action.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 24,
                gridTemplateColumns: '1fr 1fr',
                marginTop: 76,
              }}
            >
              {scene.keyPoints.map((point, index) => {
                const timing = actionRevealFrames[index];
                const opacity = interpolate(frame, [timing.startFrame, timing.endFrame], [0, 1], {
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
                    <span style={{color: colors.accent, marginRight: 16}}>0{index + 1}</span>
                    {point}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SceneContainer>
      {scene.showCaption !== false ? <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} /> : null}
    </>
  );
};
