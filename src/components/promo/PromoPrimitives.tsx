import type {CSSProperties, ReactNode} from 'react';
import {Img} from 'remotion';
import type {PromoBeat, PromoBeatContent, PromoTone, PromoTheme} from '../../lib/promoTypes';

const defaultTheme: Required<PromoTheme> = {
  brand: '',
  accent: '#39d7c2',
  accentStrong: '#a78bfa',
  background: '#071017',
  panel: 'rgba(14, 28, 39, 0.84)',
  text: '#f4f9fb',
  muted: '#9bb0bd',
};

const toneColor = (tone: PromoTone | undefined, theme: Required<PromoTheme>): string => {
  if (tone === 'success') return '#86efac';
  if (tone === 'warning') return '#fbbf24';
  if (tone === 'muted') return theme.muted;
  return theme.accent;
};

type PromoFrameProps = {
  children: ReactNode;
  theme?: PromoTheme;
};

export const PromoFrame = ({children, theme: inputTheme}: PromoFrameProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  return (
    <div
      style={{
        background: `radial-gradient(circle at 12% 10%, ${theme.accent}25, transparent 30%), radial-gradient(circle at 88% 18%, ${theme.accentStrong}20, transparent 34%), linear-gradient(145deg, ${theme.background}, #03080c 72%)`,
        color: theme.text,
        fontFamily: 'Inter, "Noto Sans CJK SC", "PingFang SC", Arial, sans-serif',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          inset: 0,
          opacity: 0.35,
          position: 'absolute',
        }}
      />
      <div style={{inset: '5.2% 6% 13.8%', position: 'absolute', zIndex: 1}}>{children}</div>
    </div>
  );
};

type PromoTitleProps = {
  eyebrow: string;
  title: string;
  description?: string;
  progress: number;
  theme?: PromoTheme;
};

export const PromoTitle = ({eyebrow, title, description, progress, theme: inputTheme}: PromoTitleProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  return (
    <div style={{maxWidth: '76%', opacity: progress, transform: `translateY(${(1 - progress) * 20}px)`}}>
      <div style={{color: theme.accent, fontSize: 23, fontWeight: 800, letterSpacing: 5, textTransform: 'uppercase'}}>{eyebrow}</div>
      <h1 style={{fontSize: 76, lineHeight: 1.04, margin: '14px 0 0'}}>{title}</h1>
      {description ? <p style={{color: theme.muted, fontSize: 27, lineHeight: 1.35, margin: '20px 0 0'}}>{description}</p> : null}
    </div>
  );
};

type PromoBeatCardProps = {
  beat: PromoBeat;
  content?: PromoBeatContent;
  screenText: string[];
  assetSources?: Record<string, string>;
  opacity: number;
  theme?: PromoTheme;
};

export const PromoBeatCard = ({beat, content, screenText, assetSources, opacity, theme: inputTheme}: PromoBeatCardProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  const accent = toneColor(content?.tone, theme);
  const assetId = content?.assetId ?? beat.assetIds?.[0];
  const assetSource = assetId ? assetSources?.[assetId] : undefined;
  const cardStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${theme.panel}, rgba(2, 7, 11, .78))`,
    border: `1px solid ${accent}70`,
    borderRadius: 28,
    boxShadow: `0 28px 90px ${accent}18`,
    opacity,
    padding: '28px 32px',
    transform: `translateY(${(1 - opacity) * 16}px)`,
  };

  return (
    <div style={cardStyle}>
      <div style={{alignItems: 'center', display: 'flex', gap: 18, justifyContent: 'space-between'}}>
        <div style={{color: accent, fontSize: 25, fontWeight: 800, letterSpacing: 1}}>{content?.label ?? beat.event}</div>
      </div>
      {content?.detail ? <div style={{color: theme.muted, fontSize: 23, lineHeight: 1.35, marginTop: 16}}>{content.detail}</div> : null}
      {assetSource ? <Img src={assetSource} style={{borderRadius: 18, display: 'block', marginTop: 22, maxHeight: 245, objectFit: 'contain', width: '100%'}} /> : null}
      {screenText.length > 0 ? (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: assetSource || content?.detail ? 22 : 18}}>
          {screenText.map((text) => <span key={text} style={{background: `${accent}18`, borderRadius: 10, color: theme.text, fontSize: 22, padding: '10px 14px'}}>{text}</span>)}
        </div>
      ) : null}
    </div>
  );
};

type PromoBeatVisualProps = PromoBeatCardProps;

const beatAssetSource = ({beat, content, assetSources}: Pick<PromoBeatVisualProps, 'beat' | 'content' | 'assetSources'>) => {
  const assetId = content?.assetId ?? beat.assetIds?.[0];
  return assetId ? assetSources?.[assetId] : undefined;
};

export const PromoLogoReveal = ({beat, content, assetSources, opacity, theme: inputTheme}: PromoBeatVisualProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  const source = beatAssetSource({beat, content, assetSources});
  return (
    <div style={{alignItems: 'center', display: 'flex', gap: 34, opacity, transform: `translateY(${(1 - opacity) * 16}px)`}}>
      {source ? <Img src={source} style={{height: 124, objectFit: 'contain', width: 124}} /> : <div style={{background: theme.accent, borderRadius: 30, height: 72, width: 72}} />}
      <div>
        <div style={{color: theme.accent, fontSize: 26, fontWeight: 800, letterSpacing: 2}}>{content?.label ?? beat.event}</div>
        {content?.detail ? <div style={{color: theme.muted, fontSize: 28, marginTop: 10}}>{content.detail}</div> : null}
      </div>
    </div>
  );
};

export const PromoBrowserShowcase = ({beat, content, assetSources, opacity, theme: inputTheme}: PromoBeatVisualProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  const source = beatAssetSource({beat, content, assetSources});
  return (
    <div style={{background: theme.panel, border: `1px solid ${theme.accent}70`, borderRadius: 24, boxShadow: `0 28px 90px ${theme.accent}18`, opacity, overflow: 'hidden', transform: `translateY(${(1 - opacity) * 16}px)`}}>
      <div style={{alignItems: 'center', background: `${theme.accent}12`, display: 'flex', gap: 9, height: 42, padding: '0 18px'}}>
        {[0, 1, 2].map((item) => <span key={item} style={{background: theme.muted, borderRadius: 50, height: 9, opacity: 0.6, width: 9}} />)}
        <span style={{color: theme.muted, fontSize: 17, marginLeft: 8}}>{content?.label ?? beat.event}</span>
      </div>
      {source ? <Img src={source} style={{display: 'block', maxHeight: 300, objectFit: 'contain', width: '100%'}} /> : <div style={{color: theme.muted, fontSize: 25, padding: 72, textAlign: 'center'}}>{content?.detail ?? beat.event}</div>}
    </div>
  );
};

export const PromoFeatureHighlight = ({beat, content, screenText, opacity, theme: inputTheme}: PromoBeatVisualProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  const accent = toneColor(content?.tone, theme);
  return (
    <div style={{background: `linear-gradient(135deg, ${theme.panel}, rgba(2, 7, 11, .78))`, border: `1px solid ${accent}70`, borderRadius: 28, boxShadow: `0 28px 90px ${accent}18`, opacity, padding: '34px 38px', transform: `translateY(${(1 - opacity) * 16}px)`}}>
      <div style={{color: accent, fontSize: 52, fontWeight: 850, letterSpacing: 1}}>{content?.label ?? beat.event}</div>
      {content?.detail ? <div style={{color: theme.muted, fontSize: 26, lineHeight: 1.35, marginTop: 16}}>{content.detail}</div> : null}
      {screenText.length > 0 ? <div style={{color: theme.text, fontSize: 22, marginTop: 24}}>{screenText.join(' · ')}</div> : null}
    </div>
  );
};

export const PromoKineticText = ({beat, content, opacity, theme: inputTheme}: PromoBeatVisualProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  return <div style={{color: theme.text, fontSize: 86, fontWeight: 900, letterSpacing: -2, lineHeight: 0.98, opacity, textTransform: 'uppercase', transform: `translateX(${(1 - opacity) * 28}px)`}}>{content?.label ?? beat.event}</div>;
};

export const PromoCtaEndCard = ({beat, content, opacity, theme: inputTheme}: PromoBeatVisualProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  return (
    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', opacity, textAlign: 'center', transform: `translateY(${(1 - opacity) * 16}px)`}}>
      <div style={{color: theme.accent, fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase'}}>{content?.label ?? beat.event}</div>
      {content?.detail ? <div style={{color: theme.text, fontSize: 40, fontWeight: 750}}>{content.detail}</div> : null}
    </div>
  );
};

type PromoTransitionProps = {
  opacity: number;
  theme?: PromoTheme;
};

export const PromoTransition = ({opacity, theme: inputTheme}: PromoTransitionProps) => {
  const theme = {...defaultTheme, ...inputTheme};
  return <div style={{background: theme.accent, inset: 0, opacity: opacity * 0.18, pointerEvents: 'none', position: 'absolute', zIndex: 4}} />;
};
