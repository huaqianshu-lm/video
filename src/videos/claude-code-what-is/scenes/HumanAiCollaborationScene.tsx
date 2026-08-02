import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type HumanAiCollaborationSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const ResponsibilityCard = ({
  accent,
  itemStarts,
  items,
  label,
  progress,
}: {
  accent: string;
  itemStarts: number[];
  items: string[];
  label: string;
  progress: number;
}) => {
  const frame = useCurrentFrame();

  return (
    <VisualCard
      style={{
        background: 'rgba(7, 12, 25, 0.92)',
        borderColor: `${accent}70`,
        minHeight: 330,
        opacity: progress,
        padding: '28px 34px',
        transform: `translateY(${(1 - progress) * 20}px)`,
      }}
    >
      <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
        <div style={{color: accent, fontSize: 34, fontWeight: 920}}>{label}</div>
        <div style={{color: colors.muted, fontSize: 15, fontWeight: 780, letterSpacing: 1.2}}>RESPONSIBILITY</div>
      </div>
      <div style={{display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 30}}>
        {items.map((item, index) => {
          const itemProgress = reveal(frame, itemStarts[index], itemStarts[index] + 16);
          return (
            <div
              key={item}
              style={{
                background: `${accent}12`,
                border: `1px solid ${accent}40`,
                borderRadius: 14,
                color: colors.text,
                fontSize: 22,
                fontWeight: 780,
                opacity: itemProgress,
                padding: '16px 12px',
                textAlign: 'center',
                transform: `translateY(${(1 - itemProgress) * 10}px)`,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </VisualCard>
  );
};

export const HumanAiCollaborationScene = ({durationInFrames}: HumanAiCollaborationSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const humanProgress = reveal(frame, segmentFrame('12', '12-04'), segmentFrame('12', '12-04') + 22);
  const aiProgress = reveal(frame, segmentFrame('12', '12-09'), segmentFrame('12', '12-09') + 22);
  const humanItemStarts = ['12-05', '12-06', '12-07', '12-08'].map((id) => segmentFrame('12', id));
  const aiItemStarts = ['12-10', '12-11', '12-12', '12-13'].map((id) => segmentFrame('12', id));
  const projectProgress = reveal(frame, segmentFrame('12', '12-14'), segmentFrame('12', '12-14') + 24);
  const connectionProgress = reveal(frame, segmentFrame('12', '12-15'), segmentFrame('12', '12-15') + 30);
  const loopStart = segmentFrame('12', '12-15', 0.35);
  const loopEnd = segmentFrame('12', '12-16');
  const loopStarts = [0, 1, 2, 3].map((index) => Math.round(loopStart + ((loopEnd - loopStart) * index) / 3));
  const finalStart = segmentFrame('12', '12-16');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 19, mass: 0.8, stiffness: 112},
  });
  const diagramOpacity = interpolate(finalProgress, [0, 1], [1, 0.1]);
  const loopItems = ['Goal', 'AI Execution', 'Human Review', 'Next Goal'];

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
              Scene 12 · Responsibility Diagram
            </div>
            <div style={{fontSize: 50, fontWeight: 900, letterSpacing: -1.4}}>真正的人机分工</div>
          </div>
          <StatusChip active={connectionProgress > 0.6} tone="success">
            {connectionProgress > 0.6 ? 'Collaboration loop' : 'Clear responsibilities'}
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 100,
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            marginTop: 34,
            opacity: diagramOpacity,
            position: 'relative',
          }}
        >
          <svg
            preserveAspectRatio="none"
            style={{height: 250, left: '25%', overflow: 'visible', position: 'absolute', top: 60, width: '50%', zIndex: 0}}
            viewBox="0 0 100 100"
          >
            <path
              d="M 0 50 C 24 50, 28 50, 45 50"
              fill="none"
              pathLength={1}
              stroke={colors.accent}
              strokeDasharray={1}
              strokeDashoffset={1 - connectionProgress}
              strokeLinecap="round"
              strokeWidth={0.8}
            />
            <path
              d="M 100 50 C 76 50, 72 50, 55 50"
              fill="none"
              pathLength={1}
              stroke="#86efac"
              strokeDasharray={1}
              strokeDashoffset={1 - connectionProgress}
              strokeLinecap="round"
              strokeWidth={0.8}
            />
          </svg>

          <ResponsibilityCard
            accent={colors.accent}
            itemStarts={humanItemStarts}
            items={['Goal', 'Judgment', 'Decision', 'Review']}
            label="Human"
            progress={humanProgress}
          />
          <ResponsibilityCard
            accent="#86efac"
            itemStarts={aiItemStarts}
            items={['Understand', 'Analyze', 'Execute', 'Repeat']}
            label="AI"
            progress={aiProgress}
          />

          <div
            style={{
              alignItems: 'center',
              background: 'linear-gradient(145deg, rgba(125, 211, 252, 0.24), rgba(134, 239, 172, 0.17))',
              border: `2px solid ${colors.accent}`,
              borderRadius: 999,
              boxShadow: '0 0 42px rgba(125, 211, 252, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              justifyContent: 'center',
              left: '50%',
              opacity: projectProgress,
              position: 'absolute',
              textAlign: 'center',
              top: 95,
              transform: `translateX(-50%) scale(${0.86 + projectProgress * 0.14})`,
              width: 140,
              zIndex: 2,
            }}
          >
            <div style={{fontSize: 25, fontWeight: 920}}>Project</div>
            <div style={{color: colors.muted, fontSize: 14, fontWeight: 700, marginTop: 6}}>shared outcome</div>
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gridColumn: '1 / -1',
              justifyContent: 'center',
              marginTop: -66,
              minHeight: 68,
            }}
          >
            {loopItems.map((item, index) => {
              const itemProgress = reveal(frame, loopStarts[index], loopStarts[index] + 18);
              return (
                <div key={item} style={{alignItems: 'center', display: 'flex'}}>
                  {index > 0 ? (
                    <div style={{color: colors.accent, fontSize: 26, opacity: itemProgress, padding: '0 14px'}}>→</div>
                  ) : null}
                  <div
                    style={{
                      background: index === 2 ? 'rgba(134, 239, 172, 0.12)' : 'rgba(125, 211, 252, 0.1)',
                      border: `1px solid ${index === 2 ? 'rgba(134, 239, 172, 0.48)' : 'rgba(125, 211, 252, 0.42)'}`,
                      borderRadius: 999,
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: 780,
                      opacity: itemProgress,
                      padding: '12px 18px',
                      transform: `translateY(${(1 - itemProgress) * 10}px)`,
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
            background: 'rgba(6, 10, 21, 0.99)',
            border: '1px solid rgba(125, 211, 252, 0.62)',
            borderRadius: 30,
            boxShadow: '0 28px 96px rgba(0, 0, 0, 0.58), 0 0 52px rgba(125, 211, 252, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            left: '50%',
            minHeight: 330,
            justifyContent: 'center',
            opacity: finalProgress,
            padding: '44px 70px',
            position: 'absolute',
            textAlign: 'center',
            top: '57%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1120,
            zIndex: 4,
          }}
        >
          <div style={{color: colors.muted, fontSize: 23, fontWeight: 760, letterSpacing: 1.5}}>真正的关键词不是替代</div>
          <div style={{fontSize: 68, fontWeight: 950, letterSpacing: -2.5, marginTop: 22}}>
            <span style={{color: colors.accent}}>协作</span>
            <span style={{color: colors.muted, margin: '0 28px'}}>≠</span>
            <span>托管</span>
          </div>
          <div style={{color: colors.muted, fontSize: 24, fontWeight: 720, marginTop: 28}}>
            人负责方向与验收，AI 承担分析与执行
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
