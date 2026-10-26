import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderDigitalWorkspace,defaultLabels,type DigitalWorkspaceLabels} from './artwork';
export {renderDigitalWorkspace,defaultLabels} from './artwork';
export type {DigitalWorkspaceLabels} from './artwork';

export type DigitalWorkspaceProps={labels?:DigitalWorkspaceLabels;timeScale?:number};
export const DigitalWorkspaceMotion=({labels=defaultLabels,timeScale=1}:DigitalWorkspaceProps)=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 const svg=renderDigitalWorkspace(frame,fps,labels,timeScale).replace('<svg ','<svg width="100%" height="100%" ');
 return <AbsoluteFill style={{overflow:'hidden'}}>
  <div style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:svg}}/>
 </AbsoluteFill>;
};
