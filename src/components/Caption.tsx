import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {getCaptionLineDurationsSeconds, LINE_GAP_SECONDS, secondsToFrames} from '../lib/timing';
import {colors} from './SceneContainer';

type CaptionProps = {
  lines: string[];
  durationSeconds: number;
};

export const Caption = ({lines, durationSeconds}: CaptionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (lines.length === 0) {
    return null;
  }

  const safeLines = lines;
  const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));
  const lineDurations = getCaptionLineDurationsSeconds(safeLines);
  const totalEstimatedSeconds = lineDurations.reduce((total, duration) => total + duration, 0) +
    Math.max(0, safeLines.length - 1) * LINE_GAP_SECONDS;
  const timelineScale = durationSeconds / Math.max(1, totalEstimatedSeconds);
  const lineStartFrames = lineDurations.reduce<number[]>((starts, duration, index) => {
    if (index === 0) {
      return [0];
    }

    return [
      ...starts,
      starts[index - 1] + secondsToFrames((lineDurations[index - 1] + LINE_GAP_SECONDS) * timelineScale, fps),
    ];
  }, []);
  let safeLineIndex = 0;

  for (let index = 0; index < lineStartFrames.length; index += 1) {
    if (frame >= lineStartFrames[index]) {
      safeLineIndex = index;
    }
  }

  const lineFrame = frame - lineStartFrames[safeLineIndex];
  const opacity = interpolate(lineFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(lineFrame, [0, 12], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.5)',
        border: `1px solid rgba(148, 163, 184, 0.28)`,
        borderRadius: 999,
        bottom: 72,
        boxShadow: '0 14px 42px rgba(0, 0, 0, 0.22)',
        color: colors.text,
        fontSize: 34,
        fontWeight: 560,
        left: 92,
        letterSpacing: 0.4,
        lineHeight: 1.36,
        opacity: frame >= durationInFrames ? 0 : opacity,
        padding: '18px 30px',
        position: 'absolute',
        right: 92,
        textAlign: 'center',
        transform: `translateY(${y}px)`,
      }}
    >
      {safeLines[safeLineIndex]}
    </div>
  );
};
