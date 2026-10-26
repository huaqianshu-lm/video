import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderContextDetail,type ContextDetailData} from './artwork';
export {renderContextDetail} from './artwork';
export type {ContextDetailData} from './artwork';

export type ContextDetailProps={data:ContextDetailData;timeScale?:number};
export const ContextDetailMotion=({data,timeScale=1}:ContextDetailProps)=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{overflow:'hidden'}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
  <g dangerouslySetInnerHTML={{__html:renderContextDetail(frame,fps,data,timeScale)}}/>
 </svg></AbsoluteFill>;
};
