import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {SubtitleCue} from '../lib/videoTypes';
import {colors} from './SceneContainer';

type TimedCaptionProps = {
  cues: SubtitleCue[];
  bottomMargin?: number;
};

export const TimedCaption = ({cues, bottomMargin = 72}: TimedCaptionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Compare at frame precision. Decimal SRT timestamps often fall between two
  // video frames; using a raw floating-point comparison can leave a blank frame
  // at a cue boundary even when the source cues are continuous.
  const cue = cues.find((item) => {
    const startFrame = Math.floor(item.startSeconds * fps);
    const endFrame = Math.ceil(item.endSeconds * fps);
    return frame >= startFrame && frame < endFrame;
  });

  if (!cue) {
    return null;
  }

  const cueFrame = frame - Math.round(cue.startSeconds * fps);
  const opacity = interpolate(cueFrame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(cueFrame, [0, 10], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        bottom: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        left: 0,
        pointerEvents: 'none',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'rgba(2, 6, 23, 0.86)',
          border: `1px solid rgba(148, 163, 184, 0.38)`,
          borderRadius: 999,
          boxShadow: '0 14px 42px rgba(0, 0, 0, 0.3)',
          color: colors.text,
          fontFamily:
            '"Noto Sans CJK SC", "PingFang SC", "Arial Unicode MS", "Microsoft YaHei", Arial, sans-serif',
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: 0.4,
          lineHeight: 1.36,
          margin: `0 92px ${bottomMargin}px`,
          maxWidth: 'calc(100% - 184px)',
          opacity,
          padding: '18px 30px',
          textAlign: 'center',
          transform: `translateY(${y}px)`,
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
