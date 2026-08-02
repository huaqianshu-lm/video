import type {CSSProperties} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type ExternalConnectionsSceneProps = {
  durationInFrames: number;
};

type ConnectionNodeProps = {
  accent?: string;
  detail: string;
  label: string;
  progress: number;
  style: CSSProperties;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const ConnectionNode = ({accent = colors.accent, detail, label, progress, style}: ConnectionNodeProps) => (
  <div
    style={{
      alignItems: 'center',
      background: 'rgba(7, 13, 27, 0.96)',
      border: `1px solid ${accent}94`,
      borderRadius: 20,
      boxShadow: progress > 0.8 ? `0 0 32px ${accent}20` : 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: 108,
      opacity: progress,
      padding: '18px 24px',
      position: 'absolute',
      textAlign: 'center',
      transform: `translate(-50%, -50%) scale(${0.86 + progress * 0.14})`,
      width: 210,
      ...style,
    }}
  >
    <div style={{color: colors.text, fontSize: 28, fontWeight: 900}}>{label}</div>
    <div style={{color: accent, fontSize: 15, fontWeight: 760, marginTop: 7}}>{detail}</div>
  </div>
);

const AnimatedLine = ({progress, x1, x2, y1, y2}: {progress: number; x1: number; x2: number; y1: number; y2: number}) => (
  <line
    pathLength={1}
    stroke={colors.accent}
    strokeDasharray={1}
    strokeDashoffset={1 - progress}
    strokeLinecap="round"
    strokeWidth={0.42}
    x1={x1}
    x2={x2}
    y1={y1}
    y2={y2}
    style={{filter: 'drop-shadow(0 0 5px rgba(125, 211, 252, 0.7))'}}
  />
);

export const ExternalConnectionsScene = ({durationInFrames}: ExternalConnectionsSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const hubProgress = reveal(frame, segmentFrame('09', '09-01'), segmentFrame('09', '09-01') + 22);
  const codebaseProgress = reveal(frame, segmentFrame('09', '09-02'), segmentFrame('09', '09-02') + 22);
  const codebaseLineProgress = reveal(frame, segmentFrame('09', '09-02', 0.25), segmentFrame('09', '09-02', 0.25) + 24);
  const toolStarts = ['09-03', '09-04', '09-05', '09-06'].map((id) => segmentFrame('09', id));
  const scopeProgress = reveal(frame, segmentFrame('09', '09-07'), segmentFrame('09', '09-07') + 24);
  const finalStart = segmentFrame('09', '09-08');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.78, stiffness: 118},
  });
  const diagramOpacity = interpolate(finalProgress, [0, 1], [1, 0.13]);
  const diagramScale = interpolate(finalProgress, [0, 1], [1, 0.95]);

  const tools = [
    {detail: 'project knowledge', label: 'Docs', left: '73%', start: toolStarts[0], top: '15%', x2: 73, y2: 15},
    {detail: 'tasks & issues', label: 'Jira', left: '87%', start: toolStarts[1], top: '36%', x2: 87, y2: 36},
    {detail: 'team context', label: 'Slack', left: '73%', start: toolStarts[2], top: '65%', x2: 73, y2: 65},
    {detail: 'shared files', label: 'Drive', left: '87%', start: toolStarts[3], top: '86%', x2: 87, y2: 86},
  ];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
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
              Scene 09 · Connection Diagram
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>第三层能力：从代码库向外延伸</div>
          </div>
          <StatusChip active={scopeProgress > 0.5} tone="success">
            {scopeProgress > 0.5 ? 'project context connected' : 'MCP connections'}
          </StatusChip>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            opacity: diagramOpacity,
            position: 'relative',
            transform: `scale(${diagramScale})`,
          }}
        >
          <svg
            preserveAspectRatio="none"
            style={{height: '100%', inset: 0, overflow: 'visible', position: 'absolute', width: '100%'}}
            viewBox="0 0 100 100"
          >
            <AnimatedLine progress={codebaseLineProgress} x1={21} x2={40} y1={50} y2={50} />
            {tools.map((tool) => (
              <AnimatedLine
                key={tool.label}
                progress={reveal(frame, tool.start, tool.start + 24)}
                x1={56}
                x2={tool.x2 - 7}
                y1={50}
                y2={tool.y2}
              />
            ))}
          </svg>

          <div
            style={{
              color: colors.muted,
              fontSize: 15,
              fontWeight: 800,
              left: '29%',
              letterSpacing: 1.4,
              opacity: codebaseLineProgress,
              position: 'absolute',
              textTransform: 'uppercase',
              top: '45%',
              transform: 'translate(-50%, -100%)',
            }}
          >
            read · edit · test
          </div>

          <ConnectionNode
            accent="#86efac"
            detail="local project"
            label="Codebase"
            progress={codebaseProgress}
            style={{left: '14%', top: '50%'}}
          />

          <div
            style={{
              alignItems: 'center',
              background: 'linear-gradient(145deg, rgba(125, 211, 252, 0.23), rgba(167, 139, 250, 0.17))',
              border: `2px solid ${colors.accent}`,
              borderRadius: 28,
              boxShadow: '0 0 54px rgba(125, 211, 252, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              height: 178,
              justifyContent: 'center',
              left: '48%',
              opacity: hubProgress,
              position: 'absolute',
              textAlign: 'center',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${0.86 + hubProgress * 0.14})`,
              width: 286,
            }}
          >
            <div style={{color: colors.accent, fontSize: 16, fontWeight: 850, letterSpacing: 2}}>PROJECT HUB</div>
            <div style={{fontSize: 35, fontWeight: 920, marginTop: 10}}>Claude Code</div>
            <div style={{color: colors.muted, fontSize: 17, marginTop: 8}}>understand · act · connect</div>
          </div>

          {tools.map((tool) => (
            <ConnectionNode
              key={tool.label}
              detail={tool.detail}
              label={tool.label}
              progress={reveal(frame, tool.start + 8, tool.start + 28)}
              style={{left: tool.left, top: tool.top}}
            />
          ))}

          <div
            style={{
              background: 'rgba(125, 211, 252, 0.1)',
              border: '1px solid rgba(125, 211, 252, 0.42)',
              borderRadius: 999,
              bottom: 0,
              color: colors.accent,
              fontSize: 20,
              fontWeight: 820,
              left: '48%',
              opacity: scopeProgress,
              padding: '11px 20px',
              position: 'absolute',
              transform: `translate(-50%, ${(1 - scopeProgress) * 16}px)`,
            }}
          >
            代码上下文 → 项目上下文
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(7, 11, 23, 0.98)',
            border: '1px solid rgba(125, 211, 252, 0.68)',
            borderRadius: 24,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.54), 0 0 42px rgba(125, 211, 252, 0.14)',
            display: 'grid',
            gap: 38,
            gridTemplateColumns: '240px minmax(0, 1fr)',
            left: '50%',
            minHeight: 212,
            opacity: finalProgress,
            padding: '30px 46px',
            position: 'absolute',
            top: '55%',
            transform: `translate(-50%, -50%) scale(${0.92 + finalScale * 0.08})`,
            width: 1120,
            zIndex: 5,
          }}
        >
          <div style={{borderRight: `1px solid ${colors.line}`, paddingRight: 38, textAlign: 'center'}}>
            <div style={{color: colors.accent, fontSize: 18, fontWeight: 820, letterSpacing: 2}}>第三层能力</div>
            <div style={{fontSize: 46, fontWeight: 920, marginTop: 10}}>连接</div>
          </div>
          <div>
            <div style={{color: colors.muted, fontSize: 23, fontWeight: 720}}>不只处理代码库里的信息</div>
            <div style={{fontSize: 37, fontWeight: 920, lineHeight: 1.22, marginTop: 10}}>围绕真实项目，连接完成任务所需的上下文</div>
            <div style={{color: colors.accent, fontSize: 22, fontWeight: 780, marginTop: 11}}>理解 → 执行 → 连接</div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
