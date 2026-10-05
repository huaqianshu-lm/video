import type {ReactNode} from 'react';
import {evolvePath, interpolatePath} from '@remotion/paths';
import {interpolate, useCurrentFrame, useVideoConfig, type SpringConfig} from 'remotion';
import {cameraTransform, isFrameVisible, motionProgress, pathPoint, springProgress,
  type CameraPose, type MotionTime, type Point} from '../lib/motion';

/** Put the entire SVG element family here, including its base path and labels. End is exclusive. */
export const MotionWindow = ({startFrame, endFrame, children}: {
  startFrame: number; endFrame: number; children: ReactNode;
}) => isFrameVisible(useCurrentFrame(), startFrame, endFrame) ? <g>{children}</g> : null;

export const MotionCamera = ({pose, viewport = {x: 960, y: 480}, children}: {
  pose: CameraPose; viewport?: Point; children: ReactNode;
}) => <g transform={cameraTransform(pose, viewport)}>{children}</g>;

export const SpringTransform = ({from, to, startFrame, durationFrames, config, children}: MotionTime & {
  from: CameraPose; to: CameraPose; config?: Partial<SpringConfig>; children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = springProgress(frame, fps, {startFrame, durationFrames}, config);
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;
  const scale = from.scale + (to.scale - from.scale) * p;
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('弹簧缩放须保持为正，请调整起止值或阻尼');
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{children}</g>;
};

/** Expand children from one origin, then gather them back. Stagger and merge use the same frame clock. */
export const SpringAssembly = ({origin, items, expand, merge, staggerFrames = 0}: {
  origin: Point; items: Array<{id: string; offset: Point; children: ReactNode}>;
  expand: MotionTime; merge: MotionTime; staggerFrames?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gather = motionProgress(frame, merge);
  return <g>{items.map((item, i) => {
    const s = springProgress(frame, fps, {...expand, startFrame: expand.startFrame + i * staggerFrames}) * (1 - gather);
    return <g key={item.id} transform={`translate(${origin.x + item.offset.x * s} ${origin.y + item.offset.y * s}) scale(${0.25 + 0.75 * Math.max(0, Math.min(1, s))})`}>
      {item.children}
    </g>;
  })}</g>;
};

export const SvgFocusTransfer = ({from, to, startFrame, durationFrames, color}: MotionTime & {
  from: Point; to: Point; color: string;
}) => {
  const p = motionProgress(useCurrentFrame(), {startFrame, durationFrames});
  return <rect x={from.x + (to.x - from.x) * p - 38} y={from.y + (to.y - from.y) * p - 38}
    width={76} height={76} rx={15} fill="none" stroke={color} strokeWidth={3} />;
};

export const PathReveal = ({d, startFrame, durationFrames, color, strokeWidth = 4}: MotionTime & {
  d: string; color: string; strokeWidth?: number;
}) => {
  const frame = useCurrentFrame();
  const p = motionProgress(frame, {startFrame, durationFrames});
  return frame < startFrame ? null : <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth}
    {...evolvePath(p, d)} />;
};

export const PathMotion = ({d, startFrame, durationFrames, children}: MotionTime & {
  d: string; children: ReactNode;
}) => {
  const point = pathPoint(d, motionProgress(useCurrentFrame(), {startFrame, durationFrames}));
  return <g transform={`translate(${point.x} ${point.y})`}>{children}</g>;
};

export const ShapeMorph = ({from, to, startFrame, durationFrames, fill, stroke}: MotionTime & {
  from: string; to: string; fill: string; stroke?: string;
}) => <path d={interpolatePath(motionProgress(useCurrentFrame(), {startFrame, durationFrames}), from, to)}
  fill={fill} stroke={stroke} strokeWidth={4} />;

export const SvgStateChange = ({before, after, startFrame, durationFrames}: MotionTime & {
  before: ReactNode; after: ReactNode;
}) => {
  const p = motionProgress(useCurrentFrame(), {startFrame, durationFrames});
  return <g>{p < 1 ? <g opacity={1 - p}>{before}</g> : null}{p > 0 ? <g opacity={p}>{after}</g> : null}</g>;
};

export const ProgressRing = ({startFrame, durationFrames, radius, color}: MotionTime & {
  radius: number; color: string;
}) => {
  const p = motionProgress(useCurrentFrame(), {startFrame, durationFrames});
  return <circle r={radius} fill="none" stroke={color} strokeWidth={7} pathLength={1}
    strokeDasharray={1} strokeDashoffset={1 - p} transform="rotate(-90)" />;
};

export const ArrivalPulse = ({startFrame, durationFrames, radius, color}: MotionTime & {
  radius: number; color: string;
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return <MotionWindow startFrame={startFrame} endFrame={startFrame + durationFrames}>
    <circle r={radius + p * 85} fill="none" stroke={color} strokeWidth={4} opacity={(1 - p) * 0.8} />
  </MotionWindow>;
};
