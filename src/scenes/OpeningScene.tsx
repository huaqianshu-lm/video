import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {OpeningSceneConfig, VisualBeat} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {StatusChip, VisualCard} from '../components/VisualPrimitives';

type OpeningSceneProps = {
  scene: OpeningSceneConfig;
};

const getCardDetails = (scene: OpeningSceneConfig): VisualBeat[] => {
  return scene.cardDetails ?? scene.cards.map((card) => ({title: card}));
};

export const OpeningScene = ({scene}: OpeningSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = spring({fps, frame: Math.max(0, frame - 8), config: {damping: 16}});
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cards = getCardDetails(scene);
  const cardRevealFrames = getDistributedRevealFrames({
    count: cards.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: 3,
    leadOutSeconds: 2.4,
    revealSeconds: 0.55,
    startSeconds: scene.visualRevealSeconds,
  });

  return (
    <>
      <SceneContainer>
        <div
          style={{
            alignItems: 'center',
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
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 7,
              marginBottom: 24,
              opacity: titleOpacity,
              textTransform: 'uppercase',
            }}
          >
            AI Coding Workflow
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 860,
              letterSpacing: -4,
              lineHeight: 1.08,
              opacity: titleOpacity,
              transform: `scale(${0.94 + titleSpring * 0.06})`,
            }}
          >
            {scene.headline}
          </div>
          <div
            style={{
              color: colors.muted,
              fontSize: 38,
              fontWeight: 600,
              marginTop: 22,
              opacity: interpolate(frame, [24, 42], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.subtitle}
          </div>
          <div
            style={{
              display: 'grid',
              gap: 22,
              gridTemplateColumns: '1fr 1fr',
              marginTop: 56,
              width: '100%',
            }}
          >
            {cards.map((card, index) => {
              const isHighlighted = card.title === scene.highlight;
              const timing = cardRevealFrames[index];
              const opacity = interpolate(frame, [timing.startFrame, timing.endFrame], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const y = interpolate(frame, [timing.startFrame, timing.endFrame], [26, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const focus = isHighlighted && frame > timing.endFrame + fps * 0.4;

              return (
                <VisualCard
                  key={card.title}
                  active={isHighlighted}
                  style={{
                    minHeight: 190,
                    opacity: isHighlighted ? opacity : opacity * 0.82,
                    padding: '28px 26px',
                    position: 'relative',
                    textAlign: 'left',
                    transform: `translateY(${y}px) scale(${focus ? 1.03 : 1})`,
                  }}
                >
                  <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 14}}>
                    <div
                      style={{
                        color: isHighlighted ? colors.text : colors.muted,
                        fontSize: 30,
                        fontWeight: 850,
                      }}
                    >
                      {card.title}
                    </div>
                    {card.label ? <StatusChip active={isHighlighted} tone={card.tone}>{card.label}</StatusChip> : null}
                  </div>
                  {card.description ? (
                    <div
                      style={{
                        color: isHighlighted ? colors.text : colors.muted,
                        fontSize: 24,
                        fontWeight: 650,
                        lineHeight: 1.35,
                        marginTop: 16,
                      }}
                    >
                      {card.description}
                    </div>
                  ) : null}
                  {card.items ? (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18}}>
                      {card.items.map((item) => (
                        <StatusChip key={item} active={isHighlighted} tone={card.tone ?? 'muted'} style={{fontSize: 18, padding: '8px 11px'}}>
                          {item}
                        </StatusChip>
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
