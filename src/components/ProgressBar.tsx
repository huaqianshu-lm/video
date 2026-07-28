import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from './SceneContainer';

type ProgressBarProps = {
  currentFrame: number;
  durationInFrames: number;
};

export const ProgressBar = ({currentFrame, durationInFrames}: ProgressBarProps) => {
  const progress = Math.min(1, currentFrame / Math.max(1, durationInFrames));

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 999,
        height: 8,
        left: 86,
        overflow: 'hidden',
        position: 'absolute',
        right: 86,
        top: 64,
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentStrong})`,
          borderRadius: 999,
          height: '100%',
          opacity: interpolate(progress, [0, 1], [0.75, 1]),
          width: `${progress * 100}%`,
        }}
      />
    </div>
  );
};
