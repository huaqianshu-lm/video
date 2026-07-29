import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {SubtitleCue} from '../lib/videoTypes';
import {colors} from './SceneContainer';

type TimedCaptionProps = {
  cues: SubtitleCue[];
};

export const TimedCaption = ({cues}: TimedCaptionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentSeconds = frame / fps;
  const cue = cues.find((item) => currentSeconds >= item.startSeconds && currentSeconds < item.endSeconds);

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
        opacity,
        padding: '18px 30px',
        position: 'absolute',
        right: 92,
        textAlign: 'center',
        transform: `translateY(${y}px)`,
      }}
    >
      {cue.text}
    </div>
  );
};
