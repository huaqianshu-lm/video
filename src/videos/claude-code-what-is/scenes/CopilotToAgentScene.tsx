import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type CopilotToAgentSceneProps = {
  durationInFrames: number;
};

type StepNodeProps = {
  label: string;
  detail?: string;
  progress: number;
  active?: boolean;
  success?: boolean;
};

const reveal = (frame: number, start: number, end = start + 16) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const StepNode = ({label, detail, progress, active = false, success = false}: StepNodeProps) => {
  const color = success ? '#86efac' : active ? colors.accent : colors.muted;

  return (
    <div
      style={{
        background: active || success ? `${color}14` : 'rgba(255, 255, 255, 0.045)',
        border: `1px solid ${active || success ? `${color}9a` : colors.line}`,
        borderRadius: 14,
        boxShadow: active || success ? `0 0 24px ${color}16` : 'none',
        minHeight: 66,
        opacity: progress,
        padding: '12px 16px',
        transform: `translateY(${(1 - progress) * 12}px) scale(${0.96 + progress * 0.04})`,
      }}
    >
      <div style={{color: active || success ? colors.text : color, fontSize: 21, fontWeight: 820}}>{label}</div>
      {detail ? <div style={{color, fontSize: 14, marginTop: 5}}>{detail}</div> : null}
    </div>
  );
};

const DownArrow = ({progress}: {progress: number}) => (
  <div
    style={{
      color: colors.accent,
      fontSize: 25,
      height: 28,
      opacity: progress,
      textAlign: 'center',
      textShadow: '0 0 18px rgba(125, 211, 252, 0.48)',
      transform: `scaleY(${progress})`,
    }}
  >
    ↓
  </div>
);

export const CopilotToAgentScene = ({durationInFrames}: CopilotToAgentSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const oldCardProgress = reveal(frame, segmentFrame('06', '06-03'), segmentFrame('06', '06-03') + 20);
  const oldStepStarts = ['06-04', '06-05', '06-06', '06-07', '06-08', '06-09'].map((id) => segmentFrame('06', id));
  const transferProgress = reveal(frame, segmentFrame('06', '06-10'), segmentFrame('06', '06-10') + 26);
  const newCardProgress = reveal(frame, segmentFrame('06', '06-11'), segmentFrame('06', '06-11') + 24);
  const goalProgress = reveal(frame, segmentFrame('06', '06-13'), segmentFrame('06', '06-13') + 20);
  const agentProgress = reveal(frame, segmentFrame('06', '06-14'), segmentFrame('06', '06-14') + 22);
  const agentStepStart = segmentFrame('06', '06-15');
  const agentStepStarts = [0, 1, 2, 3, 4, 5].map((index) => agentStepStart + index * 24);
  const resultProgress = reveal(frame, segmentFrame('06', '06-15', 0.72), segmentFrame('06', '06-15', 0.72) + 18);
  const finalStart = segmentFrame('06', '06-16');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.78, stiffness: 118},
  });
  const diagramOpacity = interpolate(finalProgress, [0, 1], [1, 0.16]);
  const diagramScale = interpolate(finalProgress, [0, 1], [1, 0.94]);

  const oldSteps = [
    {label: '发现问题', detail: 'Human'},
    {label: '拆解任务', detail: 'Human'},
    {label: '询问 AI', detail: 'Copilot'},
    {label: '手动执行', detail: 'Human'},
    {label: '判断结果', detail: 'Human'},
    {label: '继续下一步', detail: 'Human'},
  ];

  const agentSteps = ['Search', 'Read', 'Analyze', 'Edit', 'Test', 'Verify'];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          height: '100%',
          paddingBottom: 62,
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
              Scene 06 · Animated System Diagram
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>从 Copilot 到 Agent</div>
          </div>
          <StatusChip active={agentProgress > 0.4} tone="success">
            step control → goal control
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 24,
            gridTemplateColumns: 'minmax(0, 1fr) 116px minmax(0, 1fr)',
            minHeight: 0,
            opacity: diagramOpacity,
            transform: `scale(${diagramScale})`,
          }}
        >
          <VisualCard
            style={{
              background: 'rgba(8, 12, 24, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              opacity: oldCardProgress,
              padding: '22px 24px',
              transform: `translateX(${(1 - oldCardProgress) * -28}px)`,
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: colors.muted, fontSize: 16, fontWeight: 800, letterSpacing: 1.5}}>COPILOT</div>
                <div style={{fontSize: 28, fontWeight: 880, marginTop: 7}}>人管理每一步</div>
              </div>
              <StatusChip active style={{fontSize: 14, padding: '6px 9px'}}>Human in loop</StatusChip>
            </div>

            <div
              style={{
                background: 'rgba(125, 211, 252, 0.08)',
                border: '1px solid rgba(125, 211, 252, 0.42)',
                borderRadius: 14,
                color: colors.text,
                fontSize: 22,
                fontWeight: 850,
                marginTop: 16,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              Human · 始终控制流程
            </div>

            <div
              style={{
                display: 'grid',
                flex: 1,
                gap: 10,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                marginTop: 14,
                minHeight: 0,
              }}
            >
              {oldSteps.map((step, index) => (
                <StepNode
                  key={step.label}
                  {...step}
                  active={step.detail === 'Human'}
                  progress={reveal(frame, oldStepStarts[index], oldStepStarts[index] + 14)}
                />
              ))}
            </div>
          </VisualCard>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: transferProgress,
              transform: `translateX(${(1 - transferProgress) * -18}px)`,
            }}
          >
            <div style={{color: colors.muted, fontSize: 15, fontWeight: 780, lineHeight: 1.4, textAlign: 'center'}}>步骤控制</div>
            <div
              style={{
                color: colors.accent,
                fontSize: 46,
                margin: '6px 0',
                textShadow: '0 0 24px rgba(125, 211, 252, 0.5)',
                transform: `translateX(${(1 - transferProgress) * -34}px)`,
              }}
            >
              →
            </div>
            <div style={{color: colors.accent, fontSize: 15, fontWeight: 820, lineHeight: 1.4, textAlign: 'center'}}>转移给 Agent</div>
          </div>

          <VisualCard
            active
            style={{
              background: 'rgba(9, 18, 31, 0.94)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              opacity: newCardProgress,
              padding: '22px 24px',
              transform: `translateX(${(1 - newCardProgress) * 28}px)`,
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: colors.accent, fontSize: 16, fontWeight: 800, letterSpacing: 1.5}}>AGENT</div>
                <div style={{fontSize: 28, fontWeight: 880, marginTop: 7}}>人管理最终目标</div>
              </div>
              <StatusChip active={resultProgress > 0.5} tone="success" style={{fontSize: 14, padding: '6px 9px'}}>
                autonomous loop
              </StatusChip>
            </div>

            <div style={{marginTop: 12}}>
              <StepNode label="Human" detail="给出完整目标" progress={goalProgress} active />
              <DownArrow progress={reveal(frame, segmentFrame('06', '06-13'), segmentFrame('06', '06-13') + 16)} />
              <StepNode label="Agent" detail="自主规划并执行" progress={agentProgress} active />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                marginTop: 12,
              }}
            >
              {agentSteps.map((step, index) => (
                <StepNode
                  key={step}
                  label={step}
                  progress={reveal(frame, agentStepStarts[index], agentStepStarts[index] + 12)}
                  success={step === 'Verify'}
                />
              ))}
            </div>

            <div
              style={{
                alignItems: 'center',
                color: '#bbf7d0',
                display: 'flex',
                fontSize: 18,
                fontWeight: 820,
                justifyContent: 'center',
                marginTop: 12,
                opacity: resultProgress,
                transform: `translateY(${(1 - resultProgress) * 8}px)`,
              }}
            >
              ✓ 目标完成，等待 Human Review
            </div>
          </VisualCard>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(7, 11, 23, 0.97)',
            border: '1px solid rgba(125, 211, 252, 0.52)',
            borderRadius: 24,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(125, 211, 252, 0.12)',
            display: 'grid',
            gap: 34,
            gridTemplateColumns: 'minmax(0, 1fr) 88px minmax(0, 1fr)',
            left: '50%',
            minHeight: 250,
            opacity: finalProgress,
            padding: '34px 54px',
            position: 'absolute',
            textAlign: 'center',
            top: '54%',
            transform: `translate(-50%, -50%) scale(${0.92 + finalScale * 0.08})`,
            width: 1260,
            zIndex: 5,
          }}
        >
          <div>
            <div style={{color: colors.muted, fontSize: 18, fontWeight: 760, letterSpacing: 1.8}}>过去</div>
            <div style={{fontSize: 42, fontWeight: 900, marginTop: 14}}>告诉 AI 下一步</div>
            <div style={{color: colors.muted, fontSize: 24, marginTop: 10}}>管理每一步操作</div>
          </div>
          <div style={{color: colors.accent, fontSize: 58, textShadow: '0 0 28px rgba(125, 211, 252, 0.55)'}}>→</div>
          <div>
            <div style={{color: colors.accent, fontSize: 18, fontWeight: 800, letterSpacing: 1.8}}>现在</div>
            <div style={{color: colors.text, fontSize: 46, fontWeight: 920, marginTop: 14}}>告诉 AI 最终目标</div>
            <div style={{color: '#86efac', fontSize: 26, fontWeight: 820, marginTop: 10}}>管理目标</div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
