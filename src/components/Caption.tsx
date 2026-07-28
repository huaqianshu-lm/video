import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from './SceneContainer';

type CaptionProps = {
  text: string;
};

export const Caption = ({text}: CaptionProps) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.68)',
        border: `1px solid ${colors.line}`,
        borderRadius: 28,
        bottom: 72,
        boxShadow: '0 18px 55px rgba(0, 0, 0, 0.28)',
        color: colors.text,
        fontSize: 38,
        fontWeight: 500,
        left: 86,
        letterSpacing: 1,
        lineHeight: 1.42,
        opacity,
        padding: '26px 34px',
        position: 'absolute',
        right: 86,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};
