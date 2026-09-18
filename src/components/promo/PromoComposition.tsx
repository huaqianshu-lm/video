import {AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {promoSceneAtFrame} from '../../lib/promoTiming';
import type {PromoSceneContent, PromoTheme, PromoTimeline} from '../../lib/promoTypes';
import {
  PromoBeatCard,
  PromoBrowserShowcase,
  PromoCtaEndCard,
  PromoFeatureHighlight,
  PromoFrame,
  PromoKineticText,
  PromoLogoReveal,
  PromoTitle,
  PromoTransition,
} from './PromoPrimitives';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const beatOpacity = (frame: number, startFrame: number, endFrame: number): number => {
  const safeEnd = Math.max(startFrame + 1, endFrame);
  const enterEnd = Math.min(safeEnd, startFrame + 12);
  const exitStart = Math.max(startFrame, safeEnd - 12);
  const entering = interpolate(frame, [startFrame, Math.max(startFrame + 1, enterEnd)], [0, 1], clamp);
  const leaving = interpolate(frame, [exitStart, safeEnd], [1, 0], clamp);
  return Math.min(entering, leaving);
};

const transitionOpacity = (frame: number, atFrame: number): number => {
  return interpolate(frame, [Math.max(0, atFrame - 6), atFrame + 6], [1, 0], clamp);
};

export type PromoCompositionProps = {
  timeline: PromoTimeline;
  scenes: PromoSceneContent[];
  assetSources?: Record<string, string>;
  audioSources?: Record<string, string>;
  theme?: PromoTheme;
};

/**
 * Shared, data-driven promo Composition. Video-specific copy and asset URLs
 * stay in the local video configuration; all timing comes from visual-timeline.json.
 */
export const PromoComposition = ({timeline, scenes, assetSources, audioSources, theme}: PromoCompositionProps) => {
  const frame = useCurrentFrame();
  const scene = promoSceneAtFrame(timeline, frame);
  const content = scenes.find((item) => item.sceneId === scene.sceneId);
  const titleProgress = interpolate(frame, [scene.startFrame, scene.startFrame + 18], [0, 1], clamp);
  const screenText = (scene.screenTextIds ?? [])
    .map((id) => content?.screenText?.[id])
    .filter((text): text is string => Boolean(text));
  const transition = (scene.transitions ?? []).find((item) => {
    const atFrame = item.atFrame ?? item.startFrame;
    return typeof atFrame === 'number' && frame >= atFrame - 6 && frame <= atFrame + 6;
  });
  const transitionFrame = transition?.atFrame ?? transition?.startFrame;
  const musicTracks = timeline.audio?.music ?? [];
  const sfxTracks = timeline.audio?.sfx ?? [];

  return (
    <AbsoluteFill>
      <PromoFrame theme={theme}>
        <PromoTitle
          description={content?.description}
          eyebrow={content?.eyebrow ?? scene.sceneId}
          progress={titleProgress}
          theme={theme}
          title={content?.title ?? scene.sceneId}
        />
        <div style={{bottom: 0, left: 0, position: 'absolute', right: 0, top: 310}}>
          {scene.beats.map((beat) => {
            const beatContent = content?.beats?.[beat.id];
            const visible = frame >= beat.startFrame && frame < beat.endFrame;
            const visualProps = {
              assetSources,
              beat,
              content: beatContent,
              opacity: beatOpacity(frame, beat.startFrame, beat.endFrame),
              screenText,
              theme,
            };
            const beatVisual = beatContent?.kind === 'hero'
              ? <PromoLogoReveal {...visualProps} />
              : beatContent?.kind === 'product'
                ? <PromoBrowserShowcase {...visualProps} />
                : beatContent?.kind === 'proof'
                  ? <PromoFeatureHighlight {...visualProps} />
                  : beatContent?.kind === 'kinetic'
                    ? <PromoKineticText {...visualProps} />
                    : beatContent?.kind === 'cta'
                      ? <PromoCtaEndCard {...visualProps} />
                      : <PromoBeatCard {...visualProps} />;
            return (
              <div key={beat.id} style={{display: visible ? 'block' : 'none', inset: 0, position: 'absolute'}}>
                {beatVisual}
              </div>
            );
          })}
        </div>
        {content?.screenText && screenText.length > 0 ? (
          <div style={{bottom: -4, color: theme?.muted ?? '#9bb0bd', fontSize: 18, left: 0, position: 'absolute'}}>{screenText.join(' · ')}</div>
        ) : null}
        {theme?.brand ? <div style={{color: theme.muted ?? '#9bb0bd', fontSize: 18, letterSpacing: 3, position: 'absolute', right: 0, top: 4}}>{theme.brand}</div> : null}
        {typeof transitionFrame === 'number' ? <PromoTransition opacity={transitionOpacity(frame, transitionFrame)} theme={theme} /> : null}
      </PromoFrame>
      {musicTracks.map((track, index) => {
        const source = audioSources?.[track.assetId];
        if (!source) return null;
        const from = Math.max(0, track.startFrame ?? 0);
        const end = Math.min(timeline.durationInFrames, track.endFrame ?? timeline.durationInFrames);
        const duration = Math.max(1, end - from);
        return <Sequence key={`music-${track.assetId}-${index}`} from={from} durationInFrames={duration}><Audio src={source} volume={0.7} /></Sequence>;
      })}
      {sfxTracks.map((track, index) => {
        const source = audioSources?.[track.assetId];
        if (!source) return null;
        const from = Math.max(0, track.atFrame ?? 0);
        const duration = Math.max(1, Math.min(30, timeline.durationInFrames - from));
        return <Sequence key={`sfx-${track.assetId}-${index}`} from={from} durationInFrames={duration}><Audio src={source} volume={0.9} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
