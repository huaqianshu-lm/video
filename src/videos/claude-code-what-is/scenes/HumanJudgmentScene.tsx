import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type HumanJudgmentSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const OptionCard = ({
  items,
  label,
  progress,
}: {
  items: string[];
  label: string;
  progress: number;
}) => (
  <VisualCard
    style={{
      background: 'rgba(7, 12, 25, 0.9)',
      minHeight: 286,
      opacity: progress,
      padding: '28px 30px',
      transform: `translateY(${(1 - progress) * 20}px)`,
    }}
  >
    <div style={{fontSize: 34, fontWeight: 920}}>{label}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28}}>
      {items.map((item, index) => (
        <div
          key={item}
          style={{
            alignItems: 'center',
            color: index === 2 ? colors.muted : colors.text,
            display: 'flex',
            fontSize: 21,
            fontWeight: 720,
            gap: 11,
          }}
        >
          <span style={{color: index === 2 ? '#fbbf24' : '#86efac'}}>{index === 2 ? '△' : '＋'}</span>
          {item}
        </div>
      ))}
    </div>
  </VisualCard>
);

export const HumanJudgmentScene = ({durationInFrames}: HumanJudgmentSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const optionAProgress = reveal(frame, segmentFrame('11', '11-02'), segmentFrame('11', '11-02') + 22);
  const optionBProgress = reveal(frame, segmentFrame('11', '11-03'), segmentFrame('11', '11-03') + 22);
  const analyzerProgress = reveal(frame, segmentFrame('11', '11-04'), segmentFrame('11', '11-04') + 24);
  const criteriaStarts = ['11-04', '11-05', '11-06', '11-06'].map((id, index) => segmentFrame('11', id, index === 3 ? 0.55 : 0));
  const humanProgress = reveal(frame, segmentFrame('11', '11-07'), segmentFrame('11', '11-07') + 26);
  const testStageProgress = reveal(frame, segmentFrame('11', '11-09'), segmentFrame('11', '11-09') + 24);
  const businessProgress = reveal(frame, segmentFrame('11', '11-11'), segmentFrame('11', '11-11') + 24);
  const finalStart = segmentFrame('11', '11-13');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 19, mass: 0.8, stiffness: 112},
  });
  const diagramOpacity = interpolate(testStageProgress, [0, 1], [1, 0.12]);
  const testOpacity = interpolate(finalProgress, [0, 1], [1, 0.08]);
  const criteria = ['成本', '性能', '复杂度', '风险'];

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
              Scene 11 · Decision Diagram
            </div>
            <div style={{fontSize: 48, fontWeight: 900, letterSpacing: -1.4}}>AI 可以分析，但最终判断不能外包</div>
          </div>
          <StatusChip active={humanProgress > 0.6} tone="success">
            {humanProgress > 0.6 ? 'Decision · Human' : 'Analyzing options'}
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 28,
            gridTemplateColumns: 'minmax(0, 1fr) 360px minmax(0, 1fr)',
            marginTop: 40,
            opacity: diagramOpacity * (1 - finalProgress),
          }}
        >
          <OptionCard
            items={['更快上线', '当前成本低', '未来扩展较弱']}
            label="方案 A"
            progress={optionAProgress}
          />

          <VisualCard
            active
            style={{
              background: 'rgba(9, 18, 31, 0.94)',
              minHeight: 286,
              opacity: analyzerProgress,
              padding: '26px 28px',
              textAlign: 'center',
              transform: `scale(${0.94 + analyzerProgress * 0.06})`,
            }}
          >
            <div style={{color: colors.accent, fontSize: 19, fontWeight: 840, letterSpacing: 1.4}}>CLAUDE CODE</div>
            <div style={{fontSize: 28, fontWeight: 900, marginTop: 9}}>Pros / Cons</div>
            <div style={{display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginTop: 24}}>
              {criteria.map((criterion, index) => {
                const progress = reveal(frame, criteriaStarts[index], criteriaStarts[index] + 16);
                return (
                  <div
                    key={criterion}
                    style={{
                      background: 'rgba(125, 211, 252, 0.1)',
                      border: '1px solid rgba(125, 211, 252, 0.34)',
                      borderRadius: 12,
                      color: colors.text,
                      fontSize: 19,
                      fontWeight: 760,
                      opacity: progress,
                      padding: '11px 8px',
                      transform: `translateY(${(1 - progress) * 9}px)`,
                    }}
                  >
                    {criterion}
                  </div>
                );
              })}
            </div>
          </VisualCard>

          <OptionCard
            items={['长期可维护', '扩展性更好', '当前投入更高']}
            label="方案 B"
            progress={optionBProgress}
          />

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gridColumn: '1 / -1',
              justifyContent: 'center',
              opacity: humanProgress,
              transform: `translateY(${(1 - humanProgress) * 14}px)`,
            }}
          >
            <div
              style={{
                alignItems: 'center',
                background: 'rgba(134, 239, 172, 0.1)',
                border: '1px solid rgba(134, 239, 172, 0.55)',
                borderRadius: 999,
                color: '#bbf7d0',
                display: 'flex',
                fontSize: 22,
                fontWeight: 840,
                gap: 16,
                padding: '14px 26px',
              }}
            >
              <span style={{color: colors.muted}}>AI 提供分析</span>
              <span>→</span>
              <span>Decision 留给 Human</span>
            </div>
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(6, 11, 22, 0.97)',
            border: `1px solid ${colors.line}`,
            borderRadius: 26,
            display: 'flex',
            flexDirection: 'column',
            left: '50%',
            minHeight: 290,
            opacity: testStageProgress * testOpacity,
            padding: '40px 70px',
            position: 'absolute',
            textAlign: 'center',
            top: '58%',
            transform: `translate(-50%, -50%) scale(${0.94 + testStageProgress * 0.06})`,
            width: 1000,
            zIndex: 2,
          }}
        >
          <div style={{color: '#86efac', fontSize: 43, fontWeight: 920}}>Tests passed ✓</div>
          <div
            style={{
              color: colors.muted,
              fontSize: 38,
              fontWeight: 850,
              margin: '18px 0',
              opacity: businessProgress,
            }}
          >
            ≠
          </div>
          <div
            style={{
              fontSize: 43,
              fontWeight: 920,
              opacity: businessProgress,
              transform: `translateY(${(1 - businessProgress) * 14}px)`,
            }}
          >
            Business correct？
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(6, 10, 21, 0.99)',
            border: '1px solid rgba(125, 211, 252, 0.62)',
            borderRadius: 28,
            boxShadow: '0 28px 96px rgba(0, 0, 0, 0.58), 0 0 48px rgba(125, 211, 252, 0.14)',
            display: 'grid',
            gap: 44,
            gridTemplateColumns: '1fr 90px 1fr',
            left: '50%',
            minHeight: 300,
            opacity: finalProgress,
            padding: '44px 60px',
            position: 'absolute',
            textAlign: 'center',
            top: '57%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1180,
            zIndex: 4,
          }}
        >
          <div>
            <div style={{color: colors.accent, fontSize: 20, fontWeight: 820, letterSpacing: 1.5}}>AI OUTPUT</div>
            <div style={{fontSize: 38, fontWeight: 920, marginTop: 15}}>生成候选结果</div>
          </div>
          <div style={{color: colors.muted, fontSize: 54, fontWeight: 840}}>≠</div>
          <div>
            <div style={{color: '#86efac', fontSize: 20, fontWeight: 820, letterSpacing: 1.5}}>HUMAN REVIEW</div>
            <div style={{fontSize: 38, fontWeight: 920, marginTop: 15}}>负责最终判断</div>
          </div>
          <div
            style={{
              borderTop: `1px solid ${colors.line}`,
              color: colors.muted,
              fontSize: 22,
              fontWeight: 720,
              gridColumn: '1 / -1',
              paddingTop: 24,
            }}
          >
            AI Output ≠ Final Truth
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
