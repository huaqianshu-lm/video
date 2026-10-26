import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {drawFrame} from './artwork';
export const OpeningQuestionsMotion:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null);
 const [initial]=useState(()=>delayRender('Opening questions initial frame'));
 const ready=useRef(false);
 useLayoutEffect(()=>{
  const handle=delayRender('Opening questions frame'),current=canvas.current;
  if(!current){cancelRender(new Error('Opening questions canvas missing'));return}
  drawFrame(current,frame,fps).then(()=>{continueRender(handle);if(!ready.current){ready.current=true;continueRender(initial)}}).catch(cancelRender);
 },[frame,fps,initial]);
 return <AbsoluteFill style={{background:'#030a16'}}><canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
