import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {drawComparisonFrame} from './artwork';
import {baseSvg} from './scene';

export const MaterialComparisonMotion:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null);
 const [initial]=useState(()=>delayRender('Material comparison first frame'));
 const ready=useRef(false);
 useLayoutEffect(()=>{
  const handle=delayRender('Material comparison frame');
  const current=canvas.current;
  if(!current){cancelRender(new Error('Material comparison canvas missing'));return}
  drawComparisonFrame(current,frame,baseSvg,fps).then(()=>{
   continueRender(handle);
   if(!ready.current){ready.current=true;continueRender(initial)}
  }).catch(cancelRender);
 },[frame,fps,initial]);
 return <AbsoluteFill style={{background:'#040912'}}><canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
