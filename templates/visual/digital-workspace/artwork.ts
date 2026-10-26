import {parts} from './parts';

export type DigitalWorkspaceLabels={separate:string;organized:string};
export const defaultLabels:DigitalWorkspaceLabels={separate:'独立内容',organized:'统一工作空间'};
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
const p=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,v:number)=>a+(b-a)*v;
const wrap=(body:string,attributes='')=>`<g ${attributes}>${body}</g>`;
const starts=[2,3.05,4.1],ends=[2.85,3.9,4.95];
const positions=[[213,186,122,150,-7],[378,434,132,99,6],[166,661,184,98,-3]];
const destinations=[[1232,576,1],[1165,562,1.06],[1232,733,.8]];

export function renderDigitalWorkspace(frame:number,fps=30,labels:DigitalWorkspaceLabels=defaultLabels,timeScale=1){
 const t=frame/fps/timeScale;
 const windowEnter=p(t,1.02,1.8),collapse=p(t,6.15,6.88),narrow=p(t,6.75,7.35),leave=p(t,7.12,7.75);
 const width=mix(1000,130,narrow),height=mix(725,62,collapse);
 const clip=`<defs><clipPath id="motionWindow"><rect x="${1257-width/2}" y="169" width="${width}" height="${height}" rx="${mix(20,10,narrow)}"/></clipPath></defs>`;
 const sourceExit=p(t,6.3,7.35);
 const sources=positions.map((v,i)=>{
   const enter=p(t,.05+i*.13,.65+i*.13);
   const dx=-110*(1-enter)-780*p(t,6.38+i*.09,7.38+i*.09);
   const dy=28*(1-enter);
   return wrap(parts.sources[i],`opacity="${enter}" transform="translate(${dx} ${dy})"`);
 }).join('');
 let content=parts.shell;
 (['document','image','code'] as const).forEach((key,i)=>{
   const reveal=p(t,ends[i]-.14,ends[i]);
   content+=wrap(parts[key],`opacity="${reveal}" transform="translate(0 ${9*(1-reveal)})"`);
   content+=wrap(parts.relations[i],`opacity="${reveal}"`);
 });
 content+=wrap(parts.relationPaths,`opacity="${p(t,4.95,5.14)}"`);
 content+=wrap(parts.status,`opacity="${p(t,5.08,5.3)}"`);
 const workspace=wrap(wrap(content,'clip-path="url(#motionWindow)"'),`font-family="PingFang SC, sans-serif" opacity="${windowEnter}" transform="translate(${65*(1-windowEnter)} ${30*(1-windowEnter)-1120*leave})"`);
 const flights=positions.map((v,i)=>{
   if(t<=starts[i]||t>=ends[i])return '';
   const raw=clamp((t-starts[i])/(ends[i]-starts[i])),travel=ease(raw);
   const [x,y,cx,cy,angle]=v,[tx,ty,targetScale]=destinations[i];
   const px=mix(x+cx,tx,travel),py=mix(y+cy,ty,travel)-Math.sin(raw*Math.PI)*58;
   const scale=mix(1,targetScale,travel),rotate=angle*(1-travel);
   const opacity=p(raw,0,.12)*(1-p(raw,.82,1));
   return wrap(parts.sourceBodies[i],`opacity="${opacity}" transform="translate(${px} ${py}) rotate(${rotate}) scale(${scale}) translate(${-cx} ${-cy})"`);
 }).join('');
 const leftLabel=wrap(`<text x="414" y="963">${escape(labels.separate)}</text>`,`opacity="${p(t,.65,1)}" transform="translate(${-780*sourceExit} 0)"`);
 const rightLabel=wrap(`<text x="1257" y="963">${escape(labels.organized)}</text>`,`opacity="${p(t,1.6,1.9)}" transform="translate(0 ${-1120*leave})"`);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">${parts.background}${clip}${sources}${workspace}${flights}<g font-family="PingFang SC, sans-serif" font-size="31" text-anchor="middle" fill="#c5d5e9" letter-spacing="3">${leftLabel}${rightLabel}</g></svg>`;
}
