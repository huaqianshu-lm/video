import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,delayRender,continueRender,cancelRender} from 'remotion';
import {drawMetalFrame} from './artwork';
export const MetalVolumeMotion:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null);
 const [handle]=useState(()=>delayRender('Preparing metal material canvas'));
 const ready=useRef(false);
 useLayoutEffect(()=>{
  try{drawMetalFrame(canvas.current!,frame,fps);if(!ready.current){ready.current=true;continueRender(handle)}}catch(error){cancelRender(error as Error)}
 },[frame,fps,handle]);
 return <AbsoluteFill style={{background:'#050a13'}}><canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%',display:'block'}}/></AbsoluteFill>;
};
