import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {CodeLine, MockWindow, StatusChip} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type ChatGptWorkflowSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

type ChatBubbleProps = {
  children: string;
  side: 'user' | 'assistant';
  progress: number;
};

const ChatBubble = ({children, side, progress}: ChatBubbleProps) => {
  const isUser = side === 'user';

  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        background: isUser ? 'rgba(125, 211, 252, 0.16)' : 'rgba(255, 255, 255, 0.07)',
        border: `1px solid ${isUser ? 'rgba(125, 211, 252, 0.5)' : colors.line}`,
        borderRadius: isUser ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
        color: isUser ? colors.text : colors.muted,
        fontSize: 21,
        lineHeight: 1.42,
        maxWidth: '91%',
        opacity: progress,
        padding: '12px 15px',
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      {children}
    </div>
  );
};

type TransferRowProps = {
  direction: 'right' | 'left';
  label: string;
  progress: number;
};

const TransferRow = ({direction, label, progress}: TransferRowProps) => {
  const goesRight = direction === 'right';

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: progress,
        transform: `translateX(${(1 - progress) * (goesRight ? -18 : 18)}px)`,
      }}
    >
      <div style={{color: colors.muted, fontSize: 16, fontWeight: 760, whiteSpace: 'nowrap'}}>{label}</div>
      <div
        style={{
          alignItems: 'center',
          color: colors.accent,
          display: 'flex',
          fontSize: 28,
          textShadow: '0 0 18px rgba(125, 211, 252, 0.6)',
          width: 116,
        }}
      >
        {goesRight ? '────→' : '←────'}
      </div>
    </div>
  );
};

export const ChatGptWorkflowScene = ({durationInFrames}: ChatGptWorkflowSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const windowsProgress = reveal(frame, segmentFrame('02', '02-01'), segmentFrame('02', '02-01') + 20);
  const errorTransfer = reveal(frame, segmentFrame('02', '02-01', 0.25), segmentFrame('02', '02-01', 0.25) + 22);
  const firstQuestion = reveal(frame, segmentFrame('02', '02-01', 0.62), segmentFrame('02', '02-01', 0.62) + 18);
  const requestCode = reveal(frame, segmentFrame('02', '02-02'), segmentFrame('02', '02-02') + 18);
  const fileFocus = reveal(frame, segmentFrame('02', '02-03'), segmentFrame('02', '02-03') + 20);
  const codeTransfer = reveal(frame, segmentFrame('02', '02-05'), segmentFrame('02', '02-05') + 22);
  const codeMessage = reveal(frame, segmentFrame('02', '02-05', 0.28), segmentFrame('02', '02-05', 0.28) + 18);
  const suggestion = reveal(frame, segmentFrame('02', '02-06'), segmentFrame('02', '02-06') + 20);
  const suggestionTransfer = reveal(frame, segmentFrame('02', '02-06', 0.3), segmentFrame('02', '02-06', 0.3) + 20);
  const manualEdit = reveal(frame, segmentFrame('02', '02-06', 0.58), segmentFrame('02', '02-06', 0.58) + 20);
  const rerun = reveal(frame, segmentFrame('02', '02-07'), segmentFrame('02', '02-07') + 18);
  const finalStart = segmentFrame('02', '02-09');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.75, stiffness: 120},
  });

  const operationSteps = ['复制报错', '切窗口', '粘贴', '找文件', '复制代码', '再切窗口', '手动修改'];
  const operationStepStarts = [
    segmentFrame('02', '02-01', 0.25),
    segmentFrame('02', '02-02'),
    segmentFrame('02', '02-03'),
    segmentFrame('02', '02-05'),
    segmentFrame('02', '02-05', 0.45),
    segmentFrame('02', '02-06'),
    segmentFrame('02', '02-06', 0.58),
  ];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          height: '100%',
          paddingBottom: 78,
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
              Scene 02 · Workflow Simulation
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>ChatGPT：AI 在项目外面</div>
          </div>
          <StatusChip active={requestCode > 0.5} tone="warning">
            project context · unavailable
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 20,
            gridTemplateColumns: 'minmax(0, 1fr) 116px minmax(0, 1fr)',
            minHeight: 0,
            opacity: windowsProgress,
            position: 'relative',
            transform: `translateY(${(1 - windowsProgress) * 18}px)`,
          }}
        >
          <MockWindow
            title="IDE · project"
            style={{display: 'flex', flexDirection: 'column', minHeight: 0}}
            bodyStyle={{display: 'flex', flex: 1, minHeight: 0, padding: 0}}
          >
            <div style={{display: 'grid', flex: 1, gridTemplateColumns: '178px minmax(0, 1fr)', minHeight: 0}}>
              <div
                style={{
                  borderRight: `1px solid ${colors.line}`,
                  color: colors.muted,
                  fontFamily: 'Menlo, Monaco, Consolas, monospace',
                  fontSize: 18,
                  lineHeight: 1.85,
                  overflow: 'hidden',
                  padding: '20px 18px',
                }}
              >
                <div style={{color: colors.text, fontWeight: 800, marginBottom: 10}}>Explorer</div>
                <div>src/</div>
                <div style={{paddingLeft: 14}}>auth.ts</div>
                <div style={{color: fileFocus > 0.4 ? colors.accent : colors.muted, paddingLeft: 14}}>user.ts</div>
                <div style={{paddingLeft: 14}}>service.ts</div>
                <div style={{paddingLeft: 14}}>types.ts</div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', minHeight: 0}}>
                <div style={{flex: 1, overflow: 'hidden', padding: '22px 20px'}}>
                  <CodeLine>async function loadUser() {'{'}</CodeLine>
                  <CodeLine active={fileFocus > 0.25}>const user = await fetchUser();</CodeLine>
                  <CodeLine active={manualEdit > 0.4}>
                    {manualEdit > 0.55 ? 'if (!user) return null;' : 'return user.profile.name;'}
                  </CodeLine>
                  <CodeLine>{'}'}</CodeLine>

                  <div
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      border: '1px solid rgba(248, 113, 113, 0.48)',
                      borderRadius: 12,
                      color: '#fca5a5',
                      fontFamily: 'Menlo, Monaco, Consolas, monospace',
                      fontSize: 18,
                      lineHeight: 1.4,
                      marginTop: 24,
                      opacity: 1 - manualEdit * 0.65,
                      padding: '12px 14px',
                    }}
                  >
                    TypeError: Cannot read properties of undefined
                  </div>
                </div>

                <div
                  style={{
                    alignItems: 'center',
                    background: 'rgba(1, 5, 16, 0.62)',
                    borderTop: `1px solid ${colors.line}`,
                    display: 'flex',
                    gap: 12,
                    minHeight: 74,
                    padding: '14px 18px',
                  }}
                >
                  <span style={{color: '#86efac', fontFamily: 'monospace', fontSize: 20}}>$</span>
                  <span style={{color: colors.muted, fontFamily: 'monospace', fontSize: 18}}>npm run dev</span>
                  {rerun > 0 ? (
                    <StatusChip active tone="warning" style={{fontSize: 16, marginLeft: 'auto', padding: '7px 10px'}}>
                      run again
                    </StatusChip>
                  ) : null}
                </div>
              </div>
            </div>
          </MockWindow>

          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '42px 0'}}>
            <TransferRow direction="right" label="复制报错" progress={errorTransfer} />
            <TransferRow direction="left" label="请求代码" progress={requestCode} />
            <TransferRow direction="right" label="复制代码" progress={codeTransfer} />
            <TransferRow direction="left" label="修改建议" progress={suggestionTransfer} />
          </div>

          <MockWindow
            title="ChatGPT · New chat"
            style={{display: 'flex', flexDirection: 'column', minHeight: 0}}
            bodyStyle={{display: 'flex', flex: 1, minHeight: 0, padding: 0}}
          >
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', gap: 12, overflow: 'hidden', padding: 20}}>
              <ChatBubble side="user" progress={firstQuestion}>这个报错怎么解决？</ChatBubble>
              <ChatBubble side="assistant" progress={requestCode}>可能是 user 为 undefined。请提供相关代码和调用上下文。</ChatBubble>
              <ChatBubble side="user" progress={codeMessage}>这是 user.ts 里的相关代码……</ChatBubble>
              <ChatBubble side="assistant" progress={suggestion}>建议增加空值判断，然后重新运行项目。</ChatBubble>

              <div
                style={{
                  alignItems: 'center',
                  borderTop: `1px solid ${colors.line}`,
                  color: colors.muted,
                  display: 'flex',
                  fontSize: 17,
                  gap: 10,
                  marginTop: 'auto',
                  opacity: suggestion,
                  paddingTop: 14,
                }}
              >
                <span style={{color: '#fbbf24'}}>●</span>
                只能根据你粘贴的片段给建议
              </div>
            </div>
          </MockWindow>

          <div
            style={{
              alignItems: 'center',
              backdropFilter: 'blur(14px)',
              background: 'rgba(3, 7, 18, 0.88)',
              border: `1px solid rgba(251, 191, 36, ${0.35 + finalProgress * 0.35})`,
              borderRadius: 26,
              bottom: 30,
              boxShadow: '0 24px 90px rgba(0, 0, 0, 0.52)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              left: '50%',
              minHeight: 190,
              opacity: finalProgress,
              padding: '30px 48px',
              position: 'absolute',
              transform: `translateX(-50%) scale(${0.9 + finalScale * 0.1})`,
              width: 650,
              zIndex: 3,
            }}
          >
            <div style={{color: '#fbbf24', fontSize: 22, fontWeight: 800, letterSpacing: 2}}>CONTEXT GAP</div>
            <div style={{fontSize: 48, fontWeight: 900, marginTop: 10}}>AI 在项目外面</div>
            <div style={{color: colors.muted, fontSize: 22, marginTop: 12}}>查代码、改代码、运行项目，仍然由人手动衔接</div>
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            bottom: 0,
            display: 'flex',
            gap: 9,
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            right: 0,
          }}
        >
          {operationSteps.map((step, index) => {
            const stepProgress = reveal(frame, operationStepStarts[index], operationStepStarts[index] + 14);
            return (
              <div key={step} style={{alignItems: 'center', display: 'flex', gap: 9, opacity: stepProgress}}>
                <div
                  style={{
                    background: 'rgba(6, 10, 18, 0.84)',
                    border: `1px solid ${colors.line}`,
                    borderRadius: 12,
                    color: colors.muted,
                    fontSize: 18,
                    fontWeight: 720,
                    padding: '9px 12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step}
                </div>
                {index < operationSteps.length - 1 ? <span style={{color: colors.accent}}>→</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    </SceneContainer>
  );
};
