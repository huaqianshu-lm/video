import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const HelloIntro = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, 45, 70], [0.94, 1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glow = interpolate(frame, [95, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowAlpha = 0.18 + glow * 0.55;
  const textShadow = [
    `0 0 ${8 + glow * 10}px rgba(103, 194, 58, ${glowAlpha})`,
    `0 0 ${24 + glow * 24}px rgba(103, 194, 58, ${glowAlpha * 0.7})`,
    `0 0 ${56 + glow * 36}px rgba(103, 194, 58, ${glowAlpha * 0.45})`,
  ].join(', ');

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        backgroundColor: '#000000',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: 18,
          lineHeight: 1,
          opacity,
          textShadow,
          transform: `scale(${scale})`,
        }}
      >
        HELLO
      </div>
    </AbsoluteFill>
  );
};
