import type {CSSProperties, ReactNode} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

const progress = (frame: number, startFrame: number, durationFrames: number) => {
  if (!Number.isFinite(startFrame) || !Number.isFinite(durationFrames) || durationFrames <= 0) {
    throw new Error('语义动作必须提供有效起始帧和正数持续帧');
  }
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
};

type MotionTime = {startFrame: number; durationFrames: number};
type Rect = {left: number; top: number; width: number; height: number};

/** Frames must be resolved from the video's validated timing bindings. Rects use canvas pixels. */
export const FocusTransfer = ({from, to, startFrame, durationFrames, color, style}: MotionTime & {
  from: Rect; to: Rect; color: string; style?: CSSProperties;
}) => {
  const p = progress(useCurrentFrame(), startFrame, durationFrames);
  const rect = Object.fromEntries((['left', 'top', 'width', 'height'] as const).map(key => [key, from[key] + (to[key] - from[key]) * p]));
  return <div style={{position: 'absolute', border: `2px solid ${color}`, borderRadius: 8, pointerEvents: 'none', ...rect, ...style}} />;
};

/** Old content yields to the new state in the same visual region. */
export const StateReplacement = ({before, after, startFrame, durationFrames, style}: MotionTime & {
  before: ReactNode; after: ReactNode; style?: CSSProperties;
}) => {
  const p = progress(useCurrentFrame(), startFrame, durationFrames);
  return <div style={{position: 'relative', ...style}}>
    <div style={{opacity: 1 - p, pointerEvents: 'none'}}>{before}</div>
    <div style={{position: 'absolute', inset: 0, opacity: p, pointerEvents: 'none'}}>{after}</div>
  </div>;
};

/** The connection is revealed after its source and destination bindings are available. */
export const PathTransfer = ({d, startFrame, durationFrames, color, strokeWidth = 3}: MotionTime & {
  d: string; color: string; strokeWidth?: number;
}) => {
  const p = progress(useCurrentFrame(), startFrame, durationFrames);
  return <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={strokeWidth}
    strokeDasharray={1} strokeDashoffset={1 - p} opacity={p === 0 ? 0 : 1} />;
};
