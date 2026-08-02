import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type AiCodingEvolutionSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const stages = [
  {accent: '#a78bfa', label: '这段代码怎么写？', flow: 'Human → AI → Code', tag: 'ASK'},
  {accent: colors.accent, label: '这个问题怎么解决？', flow: 'Human ↔ AI → Solution', tag: 'SOLVE'},
  {accent: '#86efac', label: '这个任务要达到这个结果。', flow: 'Goal → Agent → Execution → Review', tag: 'DELIVER'},
];

const workflow = ['Human', 'Goal', 'Agent', 'Execution', 'Human Review'];

export const AiCodingEvolutionScene = ({durationInFrames}: AiCodingEvolutionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stageStarts = [segmentFrame('14', '14-04'), segmentFrame('14', '14-06'), segmentFrame('14', '14-08')];
  const workflowStart = segmentFrame('14', '14-09');
  const workflowEnd = segmentFrame('14', '14-12', 0.7);
  const workflowStarts = [0, 1, 2, 3, 4].map((index) => Math.round(workflowStart + ((workflowEnd - workflowStart) * index) / 4));
  const finalStart = segmentFrame('14', '14-13');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 19, mass: 0.8, stiffness: 112},
  });
  const contentOpacity = interpolate(finalProgress, [0, 1], [1, 0.06]);

  return (
    <SceneContainer>
      <div style={{boxSizing: 'border-box', height: '100%', position: 'relative'}}>
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
              Scene 14 · Evolution + Closing
            </div>
            <div style={{fontSize: 50, fontWeight: 900, letterSpacing: -1.4}}>AI 编程真正发生的变化</div>
          </div>
          <StatusChip active={frame >= workflowStarts[4]} tone="success">
            {frame >= workflowStarts[4] ? 'New collaboration' : 'Workflow evolving'}
          </StatusChip>
        </div>

        <div style={{marginTop: 42, opacity: contentOpacity}}>
          <div style={{alignItems: 'stretch', display: 'grid', gap: 18, gridTemplateColumns: '1fr 42px 1fr 42px 1fr'}}>
            {stages.map((stage, index) => {
              const progress = reveal(frame, stageStarts[index], stageStarts[index] + 24);
              const arrowProgress = index === 0 ? 0 : reveal(frame, stageStarts[index] - 20, stageStarts[index]);
              return (
                <div key={stage.tag} style={{display: 'contents'}}>
                  {index > 0 ? (
                    <div style={{alignItems: 'center', color: stage.accent, display: 'flex', fontSize: 34, justifyContent: 'center', opacity: arrowProgress}}>→</div>
                  ) : null}
                  <VisualCard
                    style={{
                      background: 'rgba(7, 12, 25, 0.93)',
                      borderColor: `${stage.accent}58`,
                      minHeight: 190,
                      opacity: progress,
                      padding: '25px 25px',
                      transform: `translateY(${(1 - progress) * 18}px)`,
                    }}
                  >
                    <div style={{color: stage.accent, fontSize: 15, fontWeight: 850, letterSpacing: 1.8}}>{stage.tag}</div>
                    <div style={{fontSize: 24, fontWeight: 890, lineHeight: 1.32, marginTop: 15}}>{stage.label}</div>
                    <div style={{color: colors.muted, fontSize: 17, fontWeight: 700, marginTop: 18}}>{stage.flow}</div>
                  </VisualCard>
                </div>
              );
            })}
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              marginTop: 52,
              minHeight: 90,
            }}
          >
            {workflow.map((item, index) => {
              const progress = reveal(frame, workflowStarts[index], workflowStarts[index] + 20);
              const isHuman = index === 0 || index === workflow.length - 1;
              return (
                <div key={item} style={{alignItems: 'center', display: 'flex'}}>
                  {index > 0 ? <div style={{color: colors.accent, fontSize: 28, opacity: progress, padding: '0 14px'}}>→</div> : null}
                  <div
                    style={{
                      background: isHuman ? 'rgba(167, 139, 250, 0.13)' : 'rgba(134, 239, 172, 0.11)',
                      border: `1px solid ${isHuman ? 'rgba(167, 139, 250, 0.52)' : 'rgba(134, 239, 172, 0.46)'}`,
                      borderRadius: 999,
                      color: colors.text,
                      fontSize: 19,
                      fontWeight: 820,
                      opacity: progress,
                      padding: '14px 20px',
                      transform: `translateY(${(1 - progress) * 12}px)`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(5, 9, 19, 0.995)',
            border: '1px solid rgba(125, 211, 252, 0.66)',
            borderRadius: 32,
            boxShadow: '0 30px 110px rgba(0, 0, 0, 0.68), 0 0 62px rgba(125, 211, 252, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            left: '50%',
            minHeight: 410,
            opacity: finalProgress,
            padding: '50px 74px',
            position: 'absolute',
            textAlign: 'center',
            top: '56%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1180,
            zIndex: 4,
          }}
        >
          <div style={{color: colors.muted, fontSize: 22, fontWeight: 780, letterSpacing: 2}}>THE NEW DEVELOPMENT WORKFLOW</div>
          <div style={{fontSize: 76, fontWeight: 950, letterSpacing: -3, marginTop: 22}}>
            Human <span style={{color: colors.accent}}>×</span> AI
          </div>
          <div style={{display: 'flex', gap: 52, marginTop: 34}}>
            <div style={{fontSize: 34, fontWeight: 900}}>人负责<span style={{color: '#c4b5fd'}}>判断</span></div>
            <div style={{color: colors.muted, fontSize: 34, fontWeight: 780}}>·</div>
            <div style={{fontSize: 34, fontWeight: 900}}>AI 负责<span style={{color: '#86efac'}}>执行</span></div>
          </div>
          <div style={{color: colors.muted, fontSize: 23, fontWeight: 720, marginTop: 32}}>从聊天框里的建议，走进真实的开发流程</div>
        </div>
      </div>
    </SceneContainer>
  );
};
