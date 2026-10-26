import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderAlignedComparison,type AlignedComparisonData} from './artwork';
export {renderAlignedComparison} from './artwork';
export type {AlignedComparisonData,Triple} from './artwork';

export type AlignedComparisonProps={data:AlignedComparisonData;timeScale?:number};
export const AlignedComparisonMotion=({data,timeScale=1}:AlignedComparisonProps)=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{overflow:'hidden'}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
  <g dangerouslySetInnerHTML={{__html:renderAlignedComparison(frame,fps,data,timeScale)}}/>
 </svg></AbsoluteFill>;
};
