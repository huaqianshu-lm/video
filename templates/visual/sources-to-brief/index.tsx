import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderSourcesToBrief,type SourcesContent,type SourcesTiming} from './artwork';
export type {SourceItem,SourcesContent,SourcesTiming} from './artwork';
export {renderSourcesToBrief,defaultTiming} from './artwork';

export type SourcesToBriefProps={content:SourcesContent;timing?:SourcesTiming};
export const SourcesToBriefMotion=({content,timing}:SourcesToBriefProps)=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
      <g dangerouslySetInnerHTML={{__html:renderSourcesToBrief(frame,fps,content,timing)}}/>
    </svg>
  </AbsoluteFill>;
};
