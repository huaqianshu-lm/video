import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderCodeWalkthrough,type CodeContent,type CodeTiming} from './artwork';
export type {TokenRole,CodeToken,CodeContent,CodeTiming} from './artwork';
export {renderCodeWalkthrough,defaultTiming} from './artwork';

export type CodeWalkthroughProps={content:CodeContent;timing?:CodeTiming};
export const CodeWalkthroughMotion=({content,timing}:CodeWalkthroughProps)=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
      <g dangerouslySetInnerHTML={{__html:renderCodeWalkthrough(frame,fps,content,timing)}}/>
    </svg>
  </AbsoluteFill>;
};
