import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderDocumentKeyPoints,type DocumentContent,type DocumentTiming} from './artwork';
export type {DocumentContent,DocumentTiming,DocumentItem} from './artwork';
export {renderDocumentKeyPoints,defaultTiming} from './artwork';

export type DocumentKeyPointsProps={content:DocumentContent;timing?:DocumentTiming};
export const DocumentKeyPointsMotion=({content,timing}:DocumentKeyPointsProps)=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  return <AbsoluteFill dangerouslySetInnerHTML={{__html:renderDocumentKeyPoints(frame,fps,content,timing)}}/>;
};
