import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {drawFrame} from './artwork';
export const ContextFocusMotion:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null);
 const [initial]=useState(()=>delayRender('Context focus initial frame'));
 const ready=useRef(false);
 useLayoutEffect(()=>{
  const handle=delayRender('Context focus frame'),current=canvas.current;
  if(!current){cancelRender(new Error('Context focus canvas missing'));return}
  drawFrame(current,frame,fps).then(()=>{continueRender(handle);if(!ready.current){ready.current=true;continueRender(initial)}}).catch(cancelRender);
 },[frame,fps,initial]);
 return <AbsoluteFill style={{background:'#050b17'}}><canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
