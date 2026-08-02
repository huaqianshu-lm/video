import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {CodeLine, MockWindow, StatusChip} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type BugIntroSceneProps = {
  durationInFrames: number;
};

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

export const BugIntroScene = ({durationInFrames}: BugIntroSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const errorStart = segmentFrame('01', '01-01', 0.55);
  const copyStart = segmentFrame('01', '01-03', 0.12);
  const terminalProgress = interpolate(frame, [segmentFrame('01', '01-01'), segmentFrame('01', '01-01', 0.18)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const errorProgress = interpolate(frame, [errorStart, errorStart + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const errorFocus = spring({
    fps,
    frame: clampFrame(frame, errorStart + 18),
    config: {damping: 16, mass: 0.7, stiffness: 130},
  });
  const selectionProgress = interpolate(frame, [copyStart, copyStart + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const copyProgress = interpolate(frame, [copyStart + 26, copyStart + 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chatHintProgress = interpolate(frame, [segmentFrame('01', '01-03', 0.48), segmentFrame('01', '01-03', 0.72)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          height: '100%',
          paddingBottom: 92,
          position: 'relative',
        }}
      >
        <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <div
              style={{
                color: colors.accent,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 2.4,
                marginBottom: 10,
                textTransform: 'uppercase',
              }}
            >
              Scene 01 · IDE Simulation
            </div>
            <div style={{fontSize: 54, fontWeight: 880, letterSpacing: -1.6}}>开发过程中突然出现 Bug</div>
          </div>
          <StatusChip active tone="success">
            npm run dev · running
          </StatusChip>
        </div>

        <MockWindow
          title="project / src / user.ts"
          style={{display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0}}
          bodyStyle={{display: 'flex', flex: 1, minHeight: 0, padding: 0}}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gridTemplateRows: 'minmax(0, 1fr) 320px',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                borderRight: `1px solid ${colors.line}`,
                color: colors.muted,
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                fontSize: 22,
                lineHeight: 1.9,
                minHeight: 0,
                overflow: 'hidden',
                padding: '24px 26px',
              }}
            >
              <div style={{color: colors.text, fontWeight: 800, marginBottom: 12}}>Explorer</div>
              <div>src/</div>
              <div style={{paddingLeft: 18}}>auth/</div>
              <div style={{paddingLeft: 18}}>api/</div>
              <div style={{color: colors.accent, paddingLeft: 18}}>components/</div>
              <div style={{paddingLeft: 18}}>utils/</div>
              <div style={{paddingLeft: 18}}>user.ts</div>
            </div>

            <div style={{minHeight: 0, overflow: 'hidden', padding: '30px 34px'}}>
              <CodeLine>async function loadUser() {'{'}</CodeLine>
              <CodeLine active>const user = await fetchUser();</CodeLine>
              <CodeLine>return user.profile.name;</CodeLine>
              <CodeLine>{'}'}</CodeLine>
              <div style={{height: 22}} />
              <CodeLine>app.get('/api/me', async () =&gt; {'{'}</CodeLine>
              <CodeLine>return loadUser();</CodeLine>
              <CodeLine>{'}'});</CodeLine>
            </div>

            <div
              style={{
                background: 'rgba(1, 5, 16, 0.68)',
                borderTop: `1px solid ${colors.line}`,
                gridColumn: '1 / 3',
                padding: '22px 28px',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  color: colors.muted,
                  display: 'flex',
                  fontFamily: 'Menlo, Monaco, Consolas, monospace',
                  fontSize: 23,
                  gap: 14,
                  opacity: terminalProgress,
                  transform: `translateY(${(1 - terminalProgress) * 12}px)`,
                }}
              >
                <span style={{color: '#86efac'}}>$</span>
                <span>npm run dev</span>
              </div>
              <div
                style={{
                  color: colors.muted,
                  fontFamily: 'Menlo, Monaco, Consolas, monospace',
                  fontSize: 20,
                  marginTop: 14,
                  opacity: terminalProgress,
                }}
              >
                ready in 420ms · localhost:3000
              </div>

              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 18,
                  marginTop: 18,
                  opacity: errorProgress,
                  transform: `scale(${1 + errorFocus * 0.035})`,
                  transformOrigin: 'left center',
                }}
              >
                <div
                  style={{
                    background: 'rgba(248, 113, 113, 0.14)',
                    border: '1px solid rgba(248, 113, 113, 0.72)',
                    borderRadius: 14,
                    boxShadow: `0 0 ${20 + errorFocus * 34}px rgba(248, 113, 113, 0.22)`,
                    color: '#fca5a5',
                    fontFamily: 'Menlo, Monaco, Consolas, monospace',
                    fontSize: 28,
                    fontWeight: 780,
                    padding: '14px 18px',
                    position: 'relative',
                  }}
                >
                  <span>TypeError: Cannot read properties of undefined</span>
                  <div
                    style={{
                      background: 'rgba(125, 211, 252, 0.28)',
                      border: '1px solid rgba(125, 211, 252, 0.62)',
                      borderRadius: 8,
                      bottom: 8,
                      left: 12,
                      opacity: selectionProgress,
                      position: 'absolute',
                      right: `${Math.max(8, 430 - selectionProgress * 430)}px`,
                      top: 8,
                    }}
                  />
                </div>
                <div
                  style={{
                    opacity: copyProgress,
                    transform: `translateY(${(1 - copyProgress) * 10}px)`,
                  }}
                >
                  <StatusChip active>Copy</StatusChip>
                </div>
              </div>
            </div>
          </div>
        </MockWindow>

        <div
          style={{
            alignItems: 'center',
            bottom: 0,
            display: 'flex',
            gap: 18,
            justifyContent: 'center',
            left: 0,
            opacity: chatHintProgress,
            position: 'absolute',
            right: 0,
            transform: `translateY(${(1 - chatHintProgress) * 10}px)`,
          }}
        >
          <div
            style={{
              background: 'rgba(6, 10, 18, 0.84)',
              border: `1px solid ${colors.line}`,
              borderRadius: 16,
              color: colors.text,
              fontSize: 28,
              fontWeight: 820,
              padding: '14px 22px',
            }}
          >
            遇到 Bug
          </div>
          <div style={{color: colors.muted, fontSize: 26}}>复制报错，准备发给 AI</div>
        </div>
      </div>
    </SceneContainer>
  );
};
