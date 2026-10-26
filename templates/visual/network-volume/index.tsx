import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {renderNetworkVolume,networkVolumeLoopSeconds} from './artwork';
export {renderNetworkVolume,networkVolumeLoopSeconds} from './artwork';

export type NetworkVolumeProps={cycleSeconds?:number};
export const NetworkVolumeMotion=({cycleSeconds=networkVolumeLoopSeconds}:NetworkVolumeProps)=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const svg=renderNetworkVolume(frame,fps,cycleSeconds).replace('<svg ','<svg style="width:100%;height:100%;display:block" ');
 return <AbsoluteFill style={{overflow:'hidden',background:'#040914'}}>
  <div style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:svg}}/>
 </AbsoluteFill>;
};
