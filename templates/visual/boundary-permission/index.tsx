import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {renderBoundaryPermission, type MotionContent, type Phase} from './artwork';
export type {MotionContent, MotionTiming, Phase} from './artwork';
export {renderBoundaryPermission} from './artwork';
export type BoundaryPermissionProps = {
  /** Local Composition/Sequence frames, resolved from this video's real timeline. */
  events:Record<Phase,number>;
  content:MotionContent;
};
/** Subject motion only: no title, audio, subtitles, or fixed duration. */
export const BoundaryPermissionMotion = ({events,content}:BoundaryPermissionProps) => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  return <AbsoluteFill dangerouslySetInnerHTML={{__html:renderBoundaryPermission(frame,{fps,events},content)}} />;
};
