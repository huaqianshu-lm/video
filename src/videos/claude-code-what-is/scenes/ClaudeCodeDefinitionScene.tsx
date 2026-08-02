import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {CodeLine, StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type ClaudeCodeDefinitionSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const ConnectionLine = ({x1, y1, x2, y2, progress}: {x1: number; y1: number; x2: number; y2: number; progress: number}) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    pathLength={1}
    stroke={colors.accent}
    strokeDasharray={1}
    strokeDashoffset={1 - progress}
    strokeLinecap="round"
    strokeWidth={3}
    style={{filter: 'drop-shadow(0 0 8px rgba(125, 211, 252, 0.72))', opacity: 0.72}}
  />
);

export const ClaudeCodeDefinitionScene = ({durationInFrames}: ClaudeCodeDefinitionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const hubProgress = reveal(frame, segmentFrame('05', '05-02'), segmentFrame('05', '05-02') + 24);
  const understandProgress = reveal(frame, segmentFrame('05', '05-03'), segmentFrame('05', '05-03') + 20);
  const understandConnection = reveal(frame, segmentFrame('05', '05-03', 0.24), segmentFrame('05', '05-03', 0.24) + 22);
  const scanProgress = reveal(frame, segmentFrame('05', '05-03', 0.12), segmentFrame('05', '05-03', 0.76));
  const modifyProgress = reveal(frame, segmentFrame('05', '05-05'), segmentFrame('05', '05-05') + 20);
  const modifyConnection = reveal(frame, segmentFrame('05', '05-05', 0.2), segmentFrame('05', '05-05', 0.2) + 22);
  const diffProgress = reveal(frame, segmentFrame('05', '05-05', 0.35), segmentFrame('05', '05-05', 0.78));
  const executeProgress = reveal(frame, segmentFrame('05', '05-06'), segmentFrame('05', '05-06') + 20);
  const executeConnection = reveal(frame, segmentFrame('05', '05-06', 0.25), segmentFrame('05', '05-06', 0.25) + 22);
  const testProgress = reveal(frame, segmentFrame('05', '05-07'), segmentFrame('05', '05-07') + 26);
  const entryProgress = reveal(frame, segmentFrame('05', '05-08'), segmentFrame('05', '05-08') + 24);
  const finalStart = segmentFrame('05', '05-09');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.78, stiffness: 120},
  });
  const diagramOpacity = interpolate(finalProgress, [0, 1], [1, 0.2]);
  const diagramScale = interpolate(finalProgress, [0, 1], [1, 0.94]);
  const scanY = interpolate(scanProgress, [0, 1], [28, 138]);
  const entryOffset = interpolate(entryProgress, [0, 1], [70, 0]);

  const entries = ['Terminal', 'VS Code', 'Cursor', 'JetBrains', 'Desktop', 'Web'];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          height: '100%',
          paddingBottom: 66,
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
              Scene 05 · Concept Hub
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>Claude Code 到底是什么？</div>
          </div>
          <StatusChip active tone="success">
            AI programming partner
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
            viewBox="0 0 1000 540"
            preserveAspectRatio="none"
            style={{height: '100%', inset: 0, overflow: 'visible', position: 'absolute', width: '100%'}}
          >
            <ConnectionLine x1={405} y1={245} x2={270} y2={176} progress={understandConnection} />
            <ConnectionLine x1={595} y1={245} x2={730} y2={176} progress={modifyConnection} />
            <ConnectionLine x1={500} y1={310} x2={500} y2={400} progress={executeConnection} />
          </svg>

          <VisualCard
            style={{
              background: 'rgba(8, 12, 24, 0.94)',
              left: 0,
              minHeight: 205,
              opacity: understandProgress,
              padding: '24px 26px',
              position: 'absolute',
              top: 24,
              transform: `translateX(${(1 - understandProgress) * -24}px)`,
              width: 455,
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: colors.accent, fontSize: 18, fontWeight: 800, letterSpacing: 1.4}}>UNDERSTAND</div>
                <div style={{fontSize: 30, fontWeight: 880, marginTop: 8}}>理解项目</div>
              </div>
              <StatusChip active={scanProgress > 0.2} style={{fontSize: 15, padding: '7px 10px'}}>scanning</StatusChip>
            </div>
            <div
              style={{
                background: 'rgba(1, 5, 16, 0.6)',
                border: `1px solid ${colors.line}`,
                borderRadius: 12,
                color: colors.muted,
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                fontSize: 16,
                lineHeight: 1.62,
                marginTop: 18,
                overflow: 'hidden',
                padding: '10px 14px',
                position: 'relative',
              }}
            >
              <div>src/</div>
              <div style={{paddingLeft: 16}}>auth/</div>
              <div style={{paddingLeft: 16}}>services/</div>
              <div style={{paddingLeft: 16}}>components/</div>
              <div style={{paddingLeft: 16}}>tests/</div>
              <div
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.38), transparent)',
                  height: 28,
                  left: 0,
                  opacity: scanProgress,
                  position: 'absolute',
                  right: 0,
                  top: scanY,
                }}
              />
            </div>
          </VisualCard>

          <VisualCard
            style={{
              background: 'rgba(8, 12, 24, 0.94)',
              minHeight: 205,
              opacity: modifyProgress,
              padding: '24px 26px',
              position: 'absolute',
              right: 0,
              top: 24,
              transform: `translateX(${(1 - modifyProgress) * 24}px)`,
              width: 455,
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: '#a78bfa', fontSize: 18, fontWeight: 800, letterSpacing: 1.4}}>EDIT</div>
                <div style={{fontSize: 30, fontWeight: 880, marginTop: 8}}>修改文件</div>
              </div>
              <StatusChip active={diffProgress > 0.25} tone="success" style={{fontSize: 15, padding: '7px 10px'}}>user.ts</StatusChip>
            </div>
            <div
              style={{
                background: 'rgba(1, 5, 16, 0.6)',
                border: `1px solid ${colors.line}`,
                borderRadius: 12,
                marginTop: 18,
                opacity: diffProgress,
                padding: '10px 8px',
                transform: `translateY(${(1 - diffProgress) * 8}px)`,
              }}
            >
              <CodeLine diff="remove">return user.profile.name;</CodeLine>
              <CodeLine diff="add">if (!user) return null;</CodeLine>
            </div>
          </VisualCard>

          <VisualCard
            active
            style={{
              background: 'rgba(9, 18, 31, 0.96)',
              left: '50%',
              minHeight: 185,
              opacity: hubProgress,
              padding: '28px 34px',
              position: 'absolute',
              textAlign: 'center',
              top: '43%',
              transform: `translate(-50%, -50%) scale(${0.9 + hubProgress * 0.1})`,
              width: 410,
              zIndex: 2,
            }}
          >
            <div style={{color: colors.muted, fontSize: 17, fontWeight: 760, letterSpacing: 1.8}}>ANTHROPIC</div>
            <div style={{fontSize: 42, fontWeight: 920, marginTop: 10}}>Claude Code</div>
            <div style={{color: colors.accent, fontSize: 21, fontWeight: 760, marginTop: 12}}>进入项目 · 理解上下文 · 执行任务</div>
          </VisualCard>

          <VisualCard
            style={{
              alignItems: 'center',
              background: 'rgba(8, 12, 24, 0.94)',
              bottom: 6,
              display: 'grid',
              gap: 22,
              gridTemplateColumns: '210px minmax(0, 1fr)',
              left: '50%',
              minHeight: 150,
              opacity: executeProgress,
              padding: '22px 28px',
              position: 'absolute',
              transform: `translateX(-50%) translateY(${(1 - executeProgress) * 18}px)`,
              width: 640,
            }}
          >
            <div>
              <div style={{color: '#86efac', fontSize: 18, fontWeight: 800, letterSpacing: 1.4}}>EXECUTE</div>
              <div style={{fontSize: 30, fontWeight: 880, marginTop: 8}}>执行命令</div>
              <div style={{color: colors.muted, fontSize: 17, marginTop: 8}}>验证修改是否生效</div>
            </div>
            <div
              style={{
                background: 'rgba(1, 5, 16, 0.72)',
                border: `1px solid ${colors.line}`,
                borderRadius: 12,
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                padding: '15px 18px',
              }}
            >
              <div style={{color: colors.text, fontSize: 18}}><span style={{color: '#86efac'}}>$</span> npm test</div>
              <div style={{color: '#86efac', fontSize: 17, marginTop: 12, opacity: testProgress}}>✓ 12 tests passed</div>
            </div>
          </VisualCard>
        </div>

        <div
          style={{
            alignItems: 'center',
            bottom: 0,
            color: colors.muted,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            left: 0,
            opacity: entryProgress * diagramOpacity,
            position: 'absolute',
            right: 0,
            transform: `translateX(${entryOffset}px)`,
          }}
        >
          <span style={{fontSize: 17, fontWeight: 760, marginRight: 6}}>入口会变：</span>
          {entries.map((entry) => (
            <div
              key={entry}
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: `1px solid ${colors.line}`,
                borderRadius: 999,
                fontSize: 16,
                padding: '7px 11px',
              }}
            >
              {entry}
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'rgba(5, 9, 20, 0.97)',
            border: '1px solid rgba(125, 211, 252, 0.52)',
            borderRadius: 28,
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.55)',
            left: '50%',
            opacity: finalProgress,
            padding: '38px 52px',
            position: 'absolute',
            textAlign: 'center',
            top: '53%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 980,
            zIndex: 4,
          }}
        >
          <div style={{color: colors.accent, fontSize: 19, fontWeight: 820, letterSpacing: 2}}>CLAUDE CODE</div>
          <div style={{fontSize: 40, fontWeight: 920, marginTop: 12}}>不是“会写代码的聊天框”</div>
          <div style={{color: colors.muted, fontSize: 25, lineHeight: 1.45, marginTop: 16}}>
            而是理解项目、修改文件、执行命令的 AI 编程搭档
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
