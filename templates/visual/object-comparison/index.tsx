import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderObjectComparison,type ComparisonLabels} from './artwork';
export {renderObjectComparison} from './artwork';
export type {ComparisonLabels} from './artwork';

export type ObjectComparisonProps={labels:ComparisonLabels;timeScale?:number};
export const ObjectComparisonMotion=({labels,timeScale=1}:ObjectComparisonProps)=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{overflow:'hidden'}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
  <g dangerouslySetInnerHTML={{__html:renderObjectComparison(frame,fps,labels,timeScale)}}/>
 </svg></AbsoluteFill>;
};
