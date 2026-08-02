import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {MockWindow, StatusChip} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type ClaudeCodeWorkflowSceneProps = {
  durationInFrames: number;
};

type ExecutionStep = {
  command: string;
  detail: string;
  start: number;
};

const executionSteps: ExecutionStep[] = [
  {command: 'Searching files...', detail: 'src/**/*.{ts,tsx}', start: segmentFrame('03', '03-04')},
  {command: 'Reading auth.ts...', detail: 'follow fetchUser() call', start: segmentFrame('03', '03-04', 0.2)},
  {command: 'Checking references...', detail: 'user.ts · service.ts · types.ts', start: segmentFrame('03', '03-04', 0.4)},
  {command: 'Cause found', detail: 'fetchUser() may return undefined', start: segmentFrame('03', '03-04', 0.6)},
  {command: 'Editing user.ts...', detail: '+ if (!user) return null;', start: segmentFrame('03', '03-04', 0.78)},
  {command: 'Running tests...', detail: 'npm test -- user', start: segmentFrame('03', '03-05')},
];

const taskText = '帮我找到这个报错的原因，然后修掉。';

const reveal = (frame: number, start: number, end = start + 16) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const TerminalStep = ({step, frame, index}: {step: ExecutionStep; frame: number; index: number}) => {
  const progress = reveal(frame, step.start, step.start + 14);
  const nextStart = executionSteps[index + 1]?.start ?? segmentFrame('03', '03-06');
  const isComplete = frame >= nextStart;
  const isActive = frame >= step.start && !isComplete;

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gap: 14,
        gridTemplateColumns: '26px minmax(0, 1fr) auto',
        opacity: progress,
        transform: `translateY(${(1 - progress) * 10}px)`,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: isComplete ? 'rgba(134, 239, 172, 0.16)' : isActive ? 'rgba(125, 211, 252, 0.18)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${isComplete ? '#86efac' : isActive ? colors.accent : colors.line}`,
          borderRadius: 999,
          color: isComplete ? '#86efac' : colors.accent,
          display: 'flex',
          fontSize: 13,
          fontWeight: 900,
          height: 24,
          justifyContent: 'center',
          width: 24,
        }}
      >
        {isComplete ? '✓' : '›'}
      </div>
      <div style={{minWidth: 0}}>
        <div
          style={{
            color: isComplete || isActive ? colors.text : colors.muted,
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: 20,
            fontWeight: isActive ? 760 : 560,
          }}
        >
          {step.command}
        </div>
        <div
          style={{
            color: colors.muted,
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: 15,
            marginTop: 3,
          }}
        >
          {step.detail}
        </div>
      </div>
      <div style={{color: colors.muted, fontFamily: 'monospace', fontSize: 14}}>{String(index + 1).padStart(2, '0')}</div>
    </div>
  );
};

const ComparisonCard = ({type}: {type: 'manual' | 'agent'}) => {
  const isAgent = type === 'agent';

  return (
    <div
      style={{
        background: isAgent ? 'rgba(9, 18, 31, 0.9)' : 'rgba(8, 12, 24, 0.96)',
        border: `1px solid ${isAgent ? 'rgba(125, 211, 252, 0.58)' : colors.line}`,
        borderRadius: 26,
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.42)',
        minHeight: 230,
        padding: '30px 34px',
      }}
    >
      <div style={{color: isAgent ? colors.accent : colors.muted, fontSize: 19, fontWeight: 820, letterSpacing: 1.4}}>
        {isAgent ? 'CLAUDE CODE' : 'CHAT WORKFLOW'}
      </div>
      <div style={{fontSize: 36, fontWeight: 880, marginTop: 12}}>{isAgent ? '一个任务' : '一串操作'}</div>
      <div
        style={{
          alignItems: 'center',
          color: isAgent ? colors.text : colors.muted,
          display: 'flex',
          fontFamily: 'Menlo, Monaco, Consolas, monospace',
          fontSize: isAgent ? 22 : 20,
          gap: 8,
          justifyContent: 'center',
          lineHeight: 1.6,
          marginTop: 30,
          minHeight: 62,
          textAlign: 'center',
        }}
      >
        {isAgent ? 'Task ─────────→ Done' : 'IDE ⇄ Chat ⇄ IDE ⇄ Chat'}
      </div>
    </div>
  );
};

export const ClaudeCodeWorkflowScene = ({durationInFrames}: ClaudeCodeWorkflowSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const terminalProgress = reveal(frame, segmentFrame('03', '03-01'), segmentFrame('03', '03-01') + 20);
  const promptProgress = reveal(frame, segmentFrame('03', '03-02'), segmentFrame('03', '03-03', 0.7));
  const typedCharacters = Math.floor(taskText.length * promptProgress);
  const testsPassed = reveal(frame, segmentFrame('03', '03-05', 0.55), segmentFrame('03', '03-05', 0.55) + 18);
  const finalStart = segmentFrame('03', '03-06');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.75, stiffness: 120},
  });
  const terminalScale = interpolate(finalProgress, [0, 1], [1, 0.88]);
  const terminalOpacity = interpolate(finalProgress, [0, 1], [1, 0.18]);

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          height: '100%',
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
              Scene 03 · Terminal Simulation
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>Claude Code：给一个任务，让它自己往下做</div>
          </div>
          <StatusChip active tone="success">
            project access · connected
          </StatusChip>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            minHeight: 0,
            opacity: terminalProgress * terminalOpacity,
            transform: `scale(${terminalScale}) translateY(${(1 - terminalProgress) * 16}px)`,
          }}
        >
          <MockWindow
            title="claude-code · project"
            style={{display: 'flex', flexDirection: 'column', minHeight: 0, width: 1260}}
            bodyStyle={{display: 'flex', flex: 1, minHeight: 0, padding: 0}}
          >
            <div style={{display: 'grid', flex: 1, gridTemplateColumns: 'minmax(0, 1fr) 280px', minHeight: 0}}>
              <div style={{display: 'flex', flexDirection: 'column', minHeight: 0, padding: '24px 30px'}}>
                <div
                  style={{
                    background: 'rgba(125, 211, 252, 0.08)',
                    border: '1px solid rgba(125, 211, 252, 0.28)',
                    borderRadius: 16,
                    color: colors.text,
                    fontFamily: 'Menlo, Monaco, Consolas, monospace',
                    fontSize: 23,
                    lineHeight: 1.45,
                    minHeight: 66,
                    padding: '15px 18px',
                  }}
                >
                  <span style={{color: colors.accent, marginRight: 12}}>›</span>
                  {taskText.slice(0, typedCharacters)}
                  {promptProgress < 1 ? <span style={{color: colors.accent}}>▋</span> : null}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    gap: 13,
                    justifyContent: 'center',
                    minHeight: 0,
                    padding: '16px 8px 6px',
                  }}
                >
                  {executionSteps.map((step, index) => (
                    <TerminalStep key={step.command} step={step} frame={frame} index={index} />
                  ))}
                </div>

                <div
                  style={{
                    alignItems: 'center',
                    background: 'rgba(134, 239, 172, 0.11)',
                    border: '1px solid rgba(134, 239, 172, 0.55)',
                    borderRadius: 14,
                    color: '#86efac',
                    display: 'flex',
                    fontFamily: 'Menlo, Monaco, Consolas, monospace',
                    fontSize: 23,
                    fontWeight: 820,
                    justifyContent: 'space-between',
                    minHeight: 58,
                    opacity: testsPassed,
                    padding: '12px 18px',
                    transform: `translateY(${(1 - testsPassed) * 8}px)`,
                  }}
                >
                  <span>✓ Tests passed</span>
                  <span style={{fontSize: 16, fontWeight: 620}}>1 file changed · task complete</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(1, 5, 16, 0.4)',
                  borderLeft: `1px solid ${colors.line}`,
                  color: colors.muted,
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: 17,
                  gap: 18,
                  padding: '26px 24px',
                }}
              >
                <div style={{color: colors.text, fontSize: 19, fontWeight: 820}}>Task context</div>
                <div>
                  <div style={{fontSize: 14, letterSpacing: 1, marginBottom: 6}}>WORKSPACE</div>
                  <div style={{color: colors.accent}}>project/</div>
                </div>
                <div>
                  <div style={{fontSize: 14, letterSpacing: 1, marginBottom: 8}}>FILES TOUCHED</div>
                  <div style={{lineHeight: 1.75}}>auth.ts</div>
                  <div style={{lineHeight: 1.75}}>user.ts</div>
                  <div style={{lineHeight: 1.75}}>service.ts</div>
                </div>
                <div style={{marginTop: 'auto'}}>
                  <StatusChip active={testsPassed > 0.6} tone={testsPassed > 0.6 ? 'success' : 'accent'} style={{fontSize: 16}}>
                    {testsPassed > 0.6 ? 'completed' : 'executing'}
                  </StatusChip>
                </div>
              </div>
            </div>
          </MockWindow>
        </div>

        <div
          style={{
            bottom: 54,
            left: '50%',
            opacity: finalProgress,
            position: 'absolute',
            transform: `translateX(-50%) scale(${0.92 + finalScale * 0.08})`,
            width: 1280,
            zIndex: 4,
          }}
        >
          <div style={{display: 'grid', gap: 28, gridTemplateColumns: '1fr 126px 1fr'}}>
            <ComparisonCard type="manual" />
            <div style={{alignItems: 'center', color: colors.muted, display: 'flex', fontSize: 38, fontWeight: 900, justifyContent: 'center'}}>
              VS
            </div>
            <ComparisonCard type="agent" />
          </div>
          <div
            style={{
              color: colors.text,
              fontSize: 38,
              fontWeight: 900,
              marginTop: 26,
              textAlign: 'center',
            }}
          >
            一个任务，而不是一串操作
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
