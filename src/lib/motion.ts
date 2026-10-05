import {getLength, getPointAtLength} from '@remotion/paths';
import {Easing, interpolate, spring, type SpringConfig} from 'remotion';

export type MotionTime = {startFrame: number; durationFrames: number};
export type Point = {x: number; y: number};
export type CameraPose = Point & {scale: number};

export const assertMotionTime = ({startFrame, durationFrames}: MotionTime) => {
  if (!Number.isFinite(startFrame) || !Number.isFinite(durationFrames) || durationFrames <= 0) {
    throw new Error('动效需要有限起始帧和正数持续帧');
  }
};

export const motionProgress = (frame: number, time: MotionTime) => {
  assertMotionTime(time);
  return interpolate(frame, [time.startFrame, time.startFrame + time.durationFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
};

export const springProgress = (frame: number, fps: number, time: MotionTime, config?: Partial<SpringConfig>) => {
  assertMotionTime(time);
  if (frame <= time.startFrame) return 0;
  if (frame >= time.startFrame + time.durationFrames) return 1;
  return spring({frame: frame - time.startFrame, fps, durationInFrames: time.durationFrames,
    config: {damping: 18, stiffness: 120, mass: 1, ...config}});
};

export const pathPoint = (d: string, progress: number): Point => {
  const length = getLength(d);
  if (!Number.isFinite(length) || length <= 0) throw new Error('运动路径必须有正数长度');
  return getPointAtLength(d, length * Math.max(0, Math.min(1, progress)));
};

export const isFrameVisible = (frame: number, startFrame: number, endFrame: number) => {
  if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame) {
    throw new Error('可见区间必须为有效的 [startFrame, endFrame)');
  }
  return frame >= startFrame && frame < endFrame;
};

export const cameraTransform = (pose: CameraPose, viewport: Point) => {
  if (![pose.x, pose.y, pose.scale, viewport.x, viewport.y].every(Number.isFinite) || pose.scale <= 0) {
    throw new Error('镜头坐标必须有限且缩放必须为正');
  }
  return `translate(${viewport.x} ${viewport.y}) scale(${pose.scale}) translate(${-pose.x} ${-pose.y})`;
};
