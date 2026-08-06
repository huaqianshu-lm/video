import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {StepListSceneConfig, VisualBeat} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {StatusChip, VisualCard} from '../components/VisualPrimitives';

type StepListSceneProps = {
  scene: StepListSceneConfig;
};

const getStepVisuals = (scene: StepListSceneConfig): VisualBeat[] => {
  return scene.stepVisuals ?? scene.steps.map((step) => ({title: step}));
};

const getActiveIndex = (frame: number, revealFrames: {startFrame: number}[]) => {
  return revealFrames.reduce((latest, timing, index) => frame >= timing.startFrame ? index : latest, 0);
};

const PreviewPanel = ({visual, index, active}: {visual: VisualBeat; index: number; active: boolean}) => {
  const items = visual.items ?? [];

  return (
    <VisualCard active={active} style={{minHeight: 340, padding: '30px 28px'}}>
      <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 16}}>
        <div
          style={{
            color: active ? colors.accent : colors.muted,
            fontSize: 26,
            fontWeight: 850,
          }}
        >
          0{index + 1} / {visual.title}
        </div>
        {visual.label ? <StatusChip active={active} tone={visual.tone}>{visual.label}</StatusChip> : null}
      </div>
      {visual.description ? (
        <div
          style={{
            color: colors.muted,
            fontSize: 24,
            fontWeight: 620,
            lineHeight: 1.38,
            marginTop: 18,
          }}
        >
          {visual.description}
        </div>
      ) : null}
      <div style={{display: 'grid', gap: 14, marginTop: 28}}>
        {items.map((item, itemIndex) => {
          const done = active && itemIndex <= 1 + (index % 2);

          return (
            <div
              key={item}
              style={{
                alignItems: 'center',
                background: done ? 'rgba(134, 239, 172, 0.12)' : 'rgba(255,255,255,0.055)',
                border: `1px solid ${done ? '#86efac' : colors.line}`,
                borderRadius: 18,
                color: done ? colors.text : colors.muted,
                display: 'flex',
                fontSize: 24,
                fontWeight: 760,
                gap: 14,
                padding: '15px 18px',
              }}
            >
              <span style={{color: done ? '#86efac' : colors.muted}}>{done ? '✓' : '•'}</span>
              {item}
            </div>
          );
        })}
      </div>
    </VisualCard>
  );
};

export const StepListScene = ({scene}: StepListSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const revealFrames = getDistributedRevealFrames({
    count: scene.steps.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: 2.2,
    leadOutSeconds: 2,
    revealSeconds: 0.55,
    startSeconds: scene.visualRevealSeconds,
  });
  const visuals = getStepVisuals(scene);
  const activeIndex = getActiveIndex(frame, revealFrames);
  const activeVisual = visuals[Math.min(activeIndex, visuals.length - 1)];

  return (
    <>
      <SceneContainer>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontSize: 30,
              fontWeight: 760,
              letterSpacing: 5,
              marginBottom: 24,
            }}
          >
            WORKFLOW
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 850,
              letterSpacing: -2,
              lineHeight: 1.1,
              marginBottom: 42,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div style={{display: 'grid', gap: 26, gridTemplateColumns: '0.95fr 1.05fr'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {scene.steps.map((step, index) => {
                const timing = revealFrames[index];
                const opacity = interpolate(frame, [timing.startFrame, timing.endFrame], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const isActive = index <= activeIndex;

                return (
                  <div
                    key={step}
                    style={{
                      alignItems: 'center',
                      background: isActive ? colors.cardStrong : colors.card,
                      border: `1px solid ${isActive ? colors.accent : colors.line}`,
                      borderRadius: 24,
                      display: 'flex',
                      gap: 20,
                      opacity,
                      padding: '20px 22px',
                      transform: `translateX(${(1 - opacity) * -28}px)`,
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        background: isActive ? colors.accent : 'rgba(255,255,255,0.14)',
                        borderRadius: 999,
                        color: isActive ? '#06111f' : colors.text,
                        display: 'flex',
                        flexShrink: 0,
                        fontSize: 22,
                        fontWeight: 850,
                        height: 48,
                        justifyContent: 'center',
                        width: 48,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        color: isActive ? colors.text : colors.muted,
                        fontSize: 30,
                        fontWeight: 720,
                        lineHeight: 1.2,
                      }}
                    >
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
            {activeVisual ? <PreviewPanel visual={activeVisual} index={Math.min(activeIndex, visuals.length - 1)} active /> : null}
          </div>
        </div>
      </SceneContainer>
      {scene.showCaption !== false ? <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} /> : null}
    </>
  );
};
