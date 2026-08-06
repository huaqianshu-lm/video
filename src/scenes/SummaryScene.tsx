import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {SummarySceneConfig, VisualBeat} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {StatusChip, VisualCard} from '../components/VisualPrimitives';

type SummarySceneProps = {
  scene: SummarySceneConfig;
};

const getRoleCards = (scene: SummarySceneConfig): VisualBeat[] => {
  return scene.roleCards ?? scene.bullets.map((bullet) => ({title: bullet}));
};

export const SummaryScene = ({scene}: SummarySceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const summaryStartFrame = Math.round(scene.durationSeconds * fps * 0.12);
  const summaryEndFrame = summaryStartFrame + Math.round(fps * 0.7);
  const roleCards = getRoleCards(scene);
  const bulletRevealFrames = getDistributedRevealFrames({
    count: roleCards.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: scene.durationSeconds * 0.38,
    leadOutSeconds: 3,
    revealSeconds: 0.55,
    startSeconds: scene.visualRevealSeconds,
  });

  return (
    <>
      <SceneContainer>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 7,
              marginBottom: 28,
              transform: 'translateY(28px)',
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 860,
              letterSpacing: -3,
              lineHeight: 1.15,
              margin: '0 auto',
              maxWidth: 890,
              opacity: interpolate(frame, [summaryStartFrame, summaryEndFrame], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              textShadow: '0 0 38px rgba(125, 211, 252, 0.18)',
            }}
          >
            {scene.summary}
          </div>
          <div
            style={{
              display: 'grid',
              gap: 18,
              gridTemplateColumns: '1fr 1fr 1fr',
              margin: '58px auto 0',
              width: '100%',
            }}
          >
            {roleCards.map((card, index) => {
              const timing = bulletRevealFrames[index];
              const opacity = interpolate(frame, [timing.startFrame, timing.endFrame], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const isHighlighted = card.title.includes(scene.highlight);

              return (
                <VisualCard
                  key={card.title}
                  active={isHighlighted}
                  style={{
                    minHeight: 310,
                    opacity,
                    padding: '26px 22px',
                    textAlign: 'left',
                    transform: `translateY(${(1 - opacity) * 20}px)`,
                  }}
                >
                  {card.label ? <StatusChip active={isHighlighted} tone={card.tone}>{card.label}</StatusChip> : null}
                  <div
                    style={{
                      color: isHighlighted ? colors.accent : colors.text,
                      fontSize: 28,
                      fontWeight: 850,
                      lineHeight: 1.25,
                      marginTop: 20,
                    }}
                  >
                    {card.title}
                  </div>
                  {card.description ? (
                    <div
                      style={{
                        color: colors.muted,
                        fontSize: 21,
                        fontWeight: 620,
                        lineHeight: 1.38,
                        marginTop: 14,
                      }}
                    >
                      {card.description}
                    </div>
                  ) : null}
                  {card.items ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22}}>
                      {card.items.map((item) => (
                        <div
                          key={item}
                          style={{
                            alignItems: 'center',
                            color: isHighlighted ? colors.text : colors.muted,
                            display: 'flex',
                            fontSize: 20,
                            fontWeight: 700,
                            gap: 9,
                          }}
                        >
                          <span style={{color: isHighlighted ? colors.accent : colors.muted}}>•</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </VisualCard>
              );
            })}
          </div>
        </div>
      </SceneContainer>
      {scene.showCaption !== false ? <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} /> : null}
    </>
  );
};
