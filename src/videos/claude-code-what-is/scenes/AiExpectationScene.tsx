import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {segmentFrame} from '../sceneTiming';

type AiExpectationSceneProps = {
  durationInFrames: number;
};

const reveal = (frame: number, start: number, end = start + 18) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

export const AiExpectationScene = ({durationInFrames}: AiExpectationSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const abilityStart = segmentFrame('10', '10-02');
  const abilityStarts = [abilityStart, abilityStart + 22, abilityStart + 44];
  const gatherProgress = reveal(frame, segmentFrame('10', '10-02', 0.62), segmentFrame('10', '10-02', 0.9));
  const questionProgress = reveal(frame, segmentFrame('10', '10-03'), segmentFrame('10', '10-03') + 24);
  const fullQuestionProgress = reveal(frame, segmentFrame('10', '10-03', 0.35), segmentFrame('10', '10-03', 0.72));
  const finalStart = segmentFrame('10', '10-04');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 19, mass: 0.78, stiffness: 112},
  });
  const setupOpacity = interpolate(finalProgress, [0, 1], [1, 0.08]);

  const abilities = [
    {detail: '看懂项目', label: '理解'},
    {detail: '修改与验证', label: '执行'},
    {detail: '接入上下文', label: '连接'},
  ];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          height: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            color: colors.accent,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 2.4,
            opacity: setupOpacity,
            textTransform: 'uppercase',
          }}
        >
          Scene 10 · Narrative Pause
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            inset: '60px 0 0',
            justifyContent: 'center',
            opacity: setupOpacity,
            position: 'absolute',
          }}
        >
          <div
            style={{
              color: colors.muted,
              fontSize: 24,
              fontWeight: 760,
              letterSpacing: 1.2,
              opacity: reveal(frame, segmentFrame('10', '10-01'), segmentFrame('10', '10-01') + 20),
            }}
          >
            三层能力已经建立
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: `${interpolate(gatherProgress, [0, 1], [34, 8])}px`,
              marginTop: 34,
              transform: `translateY(${interpolate(gatherProgress, [0, 1], [0, 52])}px) scale(${interpolate(
                gatherProgress,
                [0, 1],
                [1, 0.72],
              )})`,
            }}
          >
            {abilities.map((ability, index) => {
              const abilityProgress = reveal(frame, abilityStarts[index], abilityStarts[index] + 20);
              return (
                <div key={ability.label} style={{alignItems: 'center', display: 'flex', gap: 34}}>
                  {index > 0 ? (
                    <div
                      style={{
                        color: colors.accent,
                        fontSize: 34,
                        fontWeight: 500,
                        opacity: abilityProgress,
                      }}
                    >
                      ＋
                    </div>
                  ) : null}
                  <div
                    style={{
                      background: 'rgba(8, 13, 27, 0.94)',
                      border: `1px solid ${colors.accent}78`,
                      borderRadius: 24,
                      boxShadow: abilityProgress > 0.8 ? '0 16px 54px rgba(0, 0, 0, 0.28)' : 'none',
                      minWidth: 250,
                      opacity: abilityProgress * (1 - questionProgress),
                      padding: '28px 34px',
                      textAlign: 'center',
                      transform: `translateY(${(1 - abilityProgress) * 20}px) scale(${0.92 + abilityProgress * 0.08})`,
                    }}
                  >
                    <div style={{fontSize: 42, fontWeight: 920}}>{ability.label}</div>
                    <div style={{color: colors.muted, fontSize: 18, fontWeight: 680, marginTop: 10}}>{ability.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              opacity: questionProgress,
              position: 'absolute',
              textAlign: 'center',
              transform: `scale(${0.88 + questionProgress * 0.12})`,
            }}
          >
            <div style={{color: colors.accent, fontSize: 78, fontWeight: 940, letterSpacing: -3}}>全自动？</div>
            <div
              style={{
                color: colors.muted,
                fontSize: 30,
                fontWeight: 720,
                marginTop: 22,
                opacity: fullQuestionProgress,
                transform: `translateY(${(1 - fullQuestionProgress) * 12}px)`,
              }}
            >
              那是不是整个项目都可以直接交给 AI？
            </div>
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(6, 10, 21, 0.985)',
            border: '1px solid rgba(167, 139, 250, 0.62)',
            borderRadius: 30,
            boxShadow: '0 28px 96px rgba(0, 0, 0, 0.58), 0 0 52px rgba(167, 139, 250, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            left: '50%',
            minHeight: 340,
            justifyContent: 'center',
            opacity: finalProgress,
            padding: '42px 70px',
            position: 'absolute',
            textAlign: 'center',
            top: '54%',
            transform: `translate(-50%, -50%) scale(${0.9 + finalScale * 0.1})`,
            width: 1080,
            zIndex: 4,
          }}
        >
          <div style={{color: colors.muted, fontSize: 24, fontWeight: 760, letterSpacing: 1.4}}>全自动交付项目？</div>
          <div
            style={{
              color: colors.text,
              fontSize: 92,
              fontWeight: 950,
              letterSpacing: -4,
              lineHeight: 1,
              marginTop: 28,
              textShadow: '0 0 38px rgba(167, 139, 250, 0.2)',
            }}
          >
            还不行。
          </div>
          <div
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.82), transparent)',
              height: 1,
              marginTop: 34,
              width: 560,
            }}
          />
        </div>
      </div>
    </SceneContainer>
  );
};
