import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type AdviceToActionSceneProps = {
  durationInFrames: number;
};

type FlowNodeProps = {
  label: string;
  detail?: string;
  progress: number;
  tone?: 'muted' | 'accent' | 'success';
};

const reveal = (frame: number, start: number, end = start + 16) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const toneColor = (tone: FlowNodeProps['tone']) => {
  if (tone === 'accent') return colors.accent;
  if (tone === 'success') return '#86efac';
  return colors.muted;
};

const FlowNode = ({label, detail, progress, tone = 'muted'}: FlowNodeProps) => {
  const color = toneColor(tone);
  const active = tone !== 'muted';

  return (
    <div
      style={{
        alignItems: 'center',
        background: active ? `${color}18` : 'rgba(255, 255, 255, 0.055)',
        border: `1px solid ${active ? `${color}aa` : colors.line}`,
        borderRadius: 16,
        boxShadow: active ? `0 0 30px ${color}18` : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        minHeight: 58,
        opacity: progress,
        padding: '11px 18px',
        transform: `translateY(${(1 - progress) * 12}px) scale(${0.96 + progress * 0.04})`,
      }}
    >
      <div style={{color: active ? colors.text : color, fontSize: 23, fontWeight: 820}}>{label}</div>
      {detail ? <div style={{color, fontFamily: 'monospace', fontSize: 15}}>{detail}</div> : null}
    </div>
  );
};

const FlowArrow = ({progress}: {progress: number}) => (
  <div
    style={{
      color: colors.accent,
      fontSize: 25,
      height: 25,
      opacity: progress,
      textAlign: 'center',
      textShadow: '0 0 18px rgba(125, 211, 252, 0.45)',
      transform: `scaleY(${progress})`,
    }}
  >
    ↓
  </div>
);

export const AdviceToActionScene = ({durationInFrames}: AdviceToActionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const sceneProgress = reveal(frame, segmentFrame('04', '04-01'), segmentFrame('04', '04-01') + 20);
  const leftStarts = ['04-01', '04-02', '04-03', '04-04'].map((id) => segmentFrame('04', id));
  leftStarts.push(segmentFrame('04', '04-04', 0.55));
  const rightStarts = [segmentFrame('04', '04-05'), segmentFrame('04', '04-05', 0.35), segmentFrame('04', '04-05', 0.68)];
  const fileStart = segmentFrame('04', '04-05', 0.72);
  const fileStarts = [fileStart, fileStart + 12, fileStart + 24, fileStart + 36, fileStart + 48];
  const finalStart = segmentFrame('04', '04-06');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.8, stiffness: 118},
  });
  const diagramOpacity = interpolate(finalProgress, [0, 1], [1, 0.22]);
  const diagramScale = interpolate(finalProgress, [0, 1], [1, 0.92]);
  const projectProgress = reveal(frame, rightStarts[2], rightStarts[2] + 18);

  const leftNodes = [
    {label: 'Human', detail: '提出问题'},
    {label: 'ChatGPT', detail: '分析片段'},
    {label: 'Advice', detail: '给出建议', tone: 'accent' as const},
    {label: 'Human', detail: '手动执行'},
    {label: 'Project', detail: '接受修改'},
  ];

  const projectFiles = ['src/', 'components/', 'services/', 'tests/', 'package.json'];

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
              Scene 04 · Concept Diagram
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>真正的区别，不是“更聪明”</div>
          </div>
          <StatusChip active={projectProgress > 0.6} tone="success">
            project distance · removed
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 30,
            gridTemplateColumns: 'minmax(0, 1fr) 104px minmax(0, 1fr)',
            minHeight: 0,
            opacity: sceneProgress * diagramOpacity,
            transform: `scale(${diagramScale}) translateY(${(1 - sceneProgress) * 14}px)`,
          }}
        >
          <VisualCard
            style={{
              background: 'rgba(8, 12, 24, 0.84)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              padding: '24px 28px',
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 18}}>
              <div style={{color: colors.muted, fontSize: 20, fontWeight: 820, letterSpacing: 1.6}}>AI 在项目外</div>
              <StatusChip tone="warning" style={{fontSize: 15, padding: '6px 10px'}}>manual handoff</StatusChip>
            </div>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', minHeight: 0}}>
              {leftNodes.map((node, index) => {
                const nodeProgress = reveal(frame, leftStarts[index], leftStarts[index] + 14);
                const arrowProgress = reveal(frame, leftStarts[index] + 11, leftStarts[index] + 24);
                return (
                  <div key={`${node.label}-${index}`}>
                    <FlowNode {...node} progress={nodeProgress} />
                    {index < leftNodes.length - 1 ? <FlowArrow progress={arrowProgress} /> : null}
                  </div>
                );
              })}
            </div>
          </VisualCard>

          <div style={{alignItems: 'center', color: colors.muted, display: 'flex', fontSize: 34, fontWeight: 900, justifyContent: 'center'}}>
            VS
          </div>

          <VisualCard
            active
            style={{
              background: 'rgba(9, 18, 31, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              padding: '24px 28px',
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 18}}>
              <div style={{color: colors.accent, fontSize: 20, fontWeight: 820, letterSpacing: 1.6}}>AI 直接参与项目</div>
              <StatusChip active tone="success" style={{fontSize: 15, padding: '6px 10px'}}>connected</StatusChip>
            </div>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', minHeight: 0}}>
              <FlowNode label="Human" detail="给出目标" progress={reveal(frame, rightStarts[0], rightStarts[0] + 14)} />
              <FlowArrow progress={reveal(frame, rightStarts[0] + 12, rightStarts[0] + 26)} />
              <FlowNode
                label="Claude Code"
                detail="理解并执行"
                progress={reveal(frame, rightStarts[1], rightStarts[1] + 14)}
                tone="accent"
              />
              <FlowArrow progress={reveal(frame, rightStarts[1] + 12, rightStarts[1] + 26)} />
              <FlowNode label="Project" detail="真实工作区" progress={projectProgress} tone="success" />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center',
                  marginTop: 14,
                  minHeight: 66,
                }}
              >
                {projectFiles.map((file, index) => {
                  const fileProgress = reveal(frame, fileStarts[index], fileStarts[index] + 12);
                  return (
                    <div
                      key={file}
                      style={{
                        background: 'rgba(134, 239, 172, 0.09)',
                        border: '1px solid rgba(134, 239, 172, 0.32)',
                        borderRadius: 9,
                        color: '#bbf7d0',
                        fontFamily: 'Menlo, Monaco, Consolas, monospace',
                        fontSize: 15,
                        opacity: fileProgress,
                        padding: '7px 9px',
                        transform: `translateY(${(1 - fileProgress) * 8}px)`,
                      }}
                    >
                      {file}
                    </div>
                  );
                })}
              </div>
            </div>
          </VisualCard>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(5, 9, 20, 0.96)',
            border: '1px solid rgba(125, 211, 252, 0.5)',
            borderRadius: 28,
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.52)',
            display: 'grid',
            gap: 34,
            gridTemplateColumns: '1fr 82px 1fr',
            left: '50%',
            opacity: finalProgress,
            padding: '34px 46px',
            position: 'absolute',
            top: '54%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1050,
            zIndex: 4,
          }}
        >
          <div style={{textAlign: 'center'}}>
            <div style={{color: colors.muted, fontSize: 20, fontWeight: 780, letterSpacing: 1.8}}>ADVICE</div>
            <div style={{fontSize: 34, fontWeight: 880, marginTop: 10}}>告诉你怎么做</div>
          </div>
          <div style={{color: colors.accent, fontSize: 46, fontWeight: 900, textAlign: 'center'}}>→</div>
          <div style={{textAlign: 'center'}}>
            <div style={{color: '#86efac', fontSize: 20, fontWeight: 780, letterSpacing: 1.8}}>ACTION</div>
            <div style={{fontSize: 34, fontWeight: 880, marginTop: 10}}>参与把事情做完</div>
          </div>
          <div
            style={{
              color: colors.muted,
              fontSize: 21,
              gridColumn: '1 / 4',
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            AI 与项目之间的距离消失了
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
