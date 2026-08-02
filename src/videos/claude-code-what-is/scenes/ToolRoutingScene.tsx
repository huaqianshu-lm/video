import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type ToolRoutingSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const tools = [
  {
    accent: '#a78bfa',
    detail: '问知识 · 讨论方案 · 分析问题',
    label: 'ChatGPT',
    relation: '你问 → 它答',
    task: '解释 OAuth',
  },
  {
    accent: colors.accent,
    detail: '实时编码 · 代码补全 · 编辑器协作',
    label: 'Cursor / Copilot',
    relation: '你写 → 它补',
    task: '补全函数',
  },
  {
    accent: '#86efac',
    detail: '项目任务 · 跨文件修改 · 测试重构',
    label: 'Claude Code',
    relation: '任务 → 执行 → 验收',
    task: '重构 auth 模块',
  },
];

export const ToolRoutingScene = ({durationInFrames}: ToolRoutingSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const developerProgress = reveal(frame, segmentFrame('13', '13-01'), segmentFrame('13', '13-01') + 20);
  const cardStarts = [segmentFrame('13', '13-02'), segmentFrame('13', '13-05'), segmentFrame('13', '13-10')];
  const routeStarts = [segmentFrame('13', '13-03'), segmentFrame('13', '13-06'), segmentFrame('13', '13-11')];
  const finalStart = segmentFrame('13', '13-14');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 19, mass: 0.8, stiffness: 112},
  });
  const routingOpacity = interpolate(finalProgress, [0, 1], [1, 0.08]);

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
              Scene 13 · Task Routing
            </div>
            <div style={{fontSize: 48, fontWeight: 900, letterSpacing: -1.4}}>这些工具不是二选一，而是按任务派工</div>
          </div>
          <StatusChip active={frame >= routeStarts[2] + 24} tone="success">
            {frame >= routeStarts[2] + 24 ? '3 tasks routed' : 'Routing tasks'}
          </StatusChip>
        </div>

        <div style={{marginTop: 30, opacity: routingOpacity, position: 'relative'}}>
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(125, 211, 252, 0.12)',
              border: '1px solid rgba(125, 211, 252, 0.54)',
              borderRadius: 999,
              display: 'flex',
              fontSize: 21,
              fontWeight: 860,
              height: 56,
              justifyContent: 'center',
              margin: '0 auto',
              opacity: developerProgress,
              transform: `scale(${0.9 + developerProgress * 0.1})`,
              width: 190,
            }}
          >
            Developer
          </div>

          <svg
            preserveAspectRatio="none"
            style={{height: 108, left: '8%', overflow: 'visible', position: 'absolute', top: 52, width: '84%', zIndex: 0}}
            viewBox="0 0 100 100"
          >
            {[18, 50, 82].map((endX, index) => {
              const routeProgress = reveal(frame, routeStarts[index], routeStarts[index] + 28);
              return (
                <path
                  key={endX}
                  d={`M 50 0 C 50 44, ${endX} 44, ${endX} 100`}
                  fill="none"
                  pathLength={1}
                  stroke={tools[index].accent}
                  strokeDasharray={1}
                  strokeDashoffset={1 - routeProgress}
                  strokeLinecap="round"
                  strokeWidth={0.55}
                />
              );
            })}
          </svg>

          <div style={{display: 'grid', gap: 26, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 72, position: 'relative', zIndex: 1}}>
            {tools.map((tool, index) => {
              const cardProgress = reveal(frame, cardStarts[index], cardStarts[index] + 22);
              const taskProgress = reveal(frame, routeStarts[index] + 12, routeStarts[index] + 36);
              return (
                <VisualCard
                  key={tool.label}
                  style={{
                    background: 'rgba(7, 12, 25, 0.94)',
                    borderColor: `${tool.accent}68`,
                    minHeight: 318,
                    opacity: cardProgress,
                    padding: '28px 28px 24px',
                    transform: `translateY(${(1 - cardProgress) * 20}px)`,
                  }}
                >
                  <div style={{color: tool.accent, fontSize: 29, fontWeight: 920}}>{tool.label}</div>
                  <div style={{fontSize: 23, fontWeight: 850, marginTop: 20}}>{tool.relation}</div>
                  <div style={{color: colors.muted, fontSize: 17, fontWeight: 690, lineHeight: 1.5, marginTop: 16}}>{tool.detail}</div>
                  <div
                    style={{
                      background: `${tool.accent}14`,
                      border: `1px solid ${tool.accent}58`,
                      borderRadius: 14,
                      bottom: 24,
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: 800,
                      left: 28,
                      opacity: taskProgress,
                      padding: '14px 16px',
                      position: 'absolute',
                      right: 28,
                      transform: `translateY(${(1 - taskProgress) * -34}px) scale(${0.94 + taskProgress * 0.06})`,
                    }}
                  >
                    <span style={{color: tool.accent, marginRight: 10}}>TASK</span>
                    {tool.task}
                  </div>
                </VisualCard>
              );
            })}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(6, 10, 21, 0.99)',
            border: '1px solid rgba(125, 211, 252, 0.64)',
            borderRadius: 30,
            boxShadow: '0 28px 96px rgba(0, 0, 0, 0.6), 0 0 52px rgba(125, 211, 252, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            left: '50%',
            minHeight: 310,
            opacity: finalProgress,
            padding: '46px 72px',
            position: 'absolute',
            textAlign: 'center',
            top: '57%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1120,
            zIndex: 4,
          }}
        >
          <div style={{color: colors.muted, fontSize: 24, fontWeight: 760}}>工具不必互相替代</div>
          <div style={{fontSize: 70, fontWeight: 950, letterSpacing: -2.4, marginTop: 22}}>
            按<span style={{color: colors.accent}}>任务</span>派工
          </div>
          <div style={{color: colors.muted, fontSize: 22, fontWeight: 700, marginTop: 26}}>讨论 · 实时编码 · 项目级执行，各自交给更合适的工具</div>
        </div>
      </div>
    </SceneContainer>
  );
};
