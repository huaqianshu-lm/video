import {networkStatic} from '../network-volume/artwork';
import {drawMetalFrame} from '../metal-volume/artwork';
import {haloSvg,drawMetalShadow} from './lighting';

export const metadata={id:'MaterialComparisonStudy',width:1920,height:1080,fps:30,durationInFrames:264};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};
const phase=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function stateAtFrame(frame:number,fps=30){
 const t=frame/fps,shift=phase(t,2.05,3.05),metalIn=phase(t,0,.8);
 return {t,shift,metalIn,
  metal:{x:mix(960,550,shift),y:512+70*(1-metalIn),r:mix(265,235,shift)*mix(.72,1,metalIn)},
  metalLabel:phase(t,.65,1.05),
  network:phase(t,3.18,4.7),networkLabel:phase(t,4.65,5.05)};
}
export function renderSvg(frame:number,base:string,fps=30){
 const s=stateAtFrame(frame,fps);
 const network=networkStatic({yaw:.35+Math.max(0,s.t-3.18)*.15,meshReveal:s.network,orbitReveal:phase(s.t,4.1,5.2),shellReveal:s.network,signalOffset:Math.max(0,s.t-4.1)*.42});
 const defs=network.match(/<defs>([\s\S]*?)<\/defs>/)![1];
 const group=network.slice(network.indexOf('<g transform='),network.lastIndexOf('</svg>'));
 const background=base.slice(0,base.indexOf('<g id="subjects">'));
 return `${background}<defs>${defs}</defs>
 <ellipse cx="${s.metal.x}" cy="${s.metal.y+s.metal.r+40}" rx="${s.metal.r*.76}" ry="11" fill="#4a7688" opacity="${.16*s.metalIn}" filter="url(#floorBlur)"/>
 <ellipse cx="1300" cy="870" rx="265" ry="16" fill="#397a93" opacity="${.13*s.network}" filter="url(#floorBlur)"/>
 ${haloSvg(s.metal.x,s.metal.y,s.metal.r,'#e7ac58',.85*s.metalIn)}
 ${s.network>0?haloSvg(1300,512,291.3*mix(.84,1,s.network),'#55e5db',s.network):''}
 ${s.network>0?`<g transform="translate(1300 512) scale(${.84*mix(.84,1,s.network)}) translate(-1000 -535)">${group}</g>`:''}
 <g font-family="PingFang SC, sans-serif" font-size="30" font-weight="500" fill="#c6dce6">
 <text x="${s.metal.x}" y="920" text-anchor="middle" opacity="${s.metalLabel}">金属表面</text>
 <text x="1300" y="920" text-anchor="middle" fill="#d8f5fa" opacity="${s.networkLabel}">网络结构</text>
 </g></svg>`;
}
const contexts=new WeakMap<HTMLCanvasElement,{metal:HTMLCanvasElement}>();
export async function drawComparisonFrame(canvas:HTMLCanvasElement,frame:number,base:string,fps=30){
 let state=contexts.get(canvas);
 if(!state){const metal=document.createElement('canvas');metal.width=1920;metal.height=1080;state={metal};contexts.set(canvas,state)}
 const svg=renderSvg(frame,base,fps),blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();
 try{
  await new Promise<Event>((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('比较画面 SVG 加载失败'));img.src=url});
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('此预览需要 Canvas 2D。');
  ctx.clearRect(0,0,1920,1080);ctx.drawImage(img,0,0);
  const s=stateAtFrame(frame,fps);
  if(s.metalIn>0){
   drawMetalFrame(state.metal,frame+36.67,fps);
   ctx.save();ctx.globalAlpha=s.metalIn;ctx.beginPath();ctx.arc(s.metal.x,s.metal.y,s.metal.r,0,Math.PI*2);ctx.clip();
   ctx.drawImage(state.metal,670,194,660,660,s.metal.x-s.metal.r,s.metal.y-s.metal.r,s.metal.r*2,s.metal.r*2);
   drawMetalShadow(ctx,s.metal.x,s.metal.y,s.metal.r);ctx.restore();
  }
 }finally{URL.revokeObjectURL(url)}
}
