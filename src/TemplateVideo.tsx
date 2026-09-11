import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const colors = {
  accent: '#39d7c2',
  background: '#071017',
  muted: '#9bb0bd',
  panel: 'rgba(14, 28, 39, 0.9)',
  text: '#f4f9fb',
};

export const TemplateVideo = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [0, 30], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: `radial-gradient(circle at 18% 12%, ${colors.accent}22, transparent 30%), ${colors.background}`,
        color: colors.text,
        display: 'flex',
        fontFamily: 'Inter, system-ui, sans-serif',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: colors.panel,
          border: `1px solid ${colors.accent}55`,
          borderRadius: 28,
          boxShadow: '0 28px 90px #0000006b',
          maxWidth: 1120,
          opacity,
          padding: '72px 96px',
          transform: `translateY(${y}px)`,
          width: '72%',
        }}
      >
        <div style={{color: colors.accent, fontSize: 28, fontWeight: 800, letterSpacing: 6}}>
          VIDEO PRODUCTION HARNESS
        </div>
        <div style={{fontSize: 74, fontWeight: 800, lineHeight: 1.1, marginTop: 24}}>
          Reusable video capability
        </div>
        <div style={{color: colors.muted, fontSize: 32, lineHeight: 1.5, marginTop: 28}}>
          This composition is a clean runtime check for the shared Remotion project.
        </div>
      </div>
    </AbsoluteFill>
  );
};
