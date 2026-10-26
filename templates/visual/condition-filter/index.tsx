import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderConditionFilter,type FilterLabels} from './artwork';
export {renderConditionFilter} from './artwork';
export type {FilterLabels} from './artwork';

export type ConditionFilterProps={labels:FilterLabels;timeScale?:number};
export const ConditionFilterMotion=({labels,timeScale=1}:ConditionFilterProps)=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{overflow:'hidden'}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display:'block'}}>
  <g dangerouslySetInnerHTML={{__html:renderConditionFilter(frame,fps,labels,timeScale)}}/>
 </svg></AbsoluteFill>;
};
