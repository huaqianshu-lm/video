const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);};
const phase=(t:number,start:number,duration:number)=>ease((t-start)/duration);
export type SourceItem={name:string;body:string};
export type SourcesContent={resultName:string;items:[SourceItem,SourceItem,SourceItem]};
export type SourcesTiming={inputs:[number,number,number];result:number;paths:[number,number,number];travel:[number,number,number];reveal:[number,number,number];clear:number;center:number;seal:number;sealExit:number;exit:number};
export const defaultTiming:SourcesTiming={inputs:[.12,.12+.15,.12+2*.15],result:.68,paths:[1.2,1.2+.13,1.2+2*.13],travel:[2.03,2.03+.55,2.03+2*.55],reveal:[2.98,3.53,4.08],clear:4.2,center:4.65,seal:5.18,sealExit:6.28,exit:6.42};
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inputs=[
 {color:'#B17837',y:238},
 {color:'#547C70',y:456},
 {color:'#71849A',y:674}
];
const bezier=(p:number,a:number,b:number,c:number,d:number)=>(1-p)**3*a+3*(1-p)**2*p*b+3*(1-p)*p*p*c+p**3*d;
// Arc-length lookup keeps travel speed independent of the curve shape.
const curves=inputs.map((item,i)=>{
 const points:{x:number;y:number;length:number}[]=[];let length=0,prev:{x:number;y:number}|undefined;
 for(let step=0;step<=120;step++){
  const p=step/120,x=bezier(p,510,820,925,1120),y=bezier(p,item.y+78,item.y+78,448+i*116,448+i*116);
  if(prev)length+=Math.hypot(x-prev.x,y-prev.y);
  points.push({x,y,length});prev={x,y};
 }
 return {points,length};
});
const position=(i:number,p:number)=>{
 const curve=curves[i],target=p*curve.length;
 const j=curve.points.findIndex(v=>v.length>=target);
 if(j<=0)return curve.points[0];
 const a=curve.points[j-1],b=curve.points[j],q=(target-a.length)/(b.length-a.length);
 return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};
};
export function renderSourcesToBrief(frame:number,fps:number,content:SourcesContent,timing:SourcesTiming=defaultTiming){
 const t=frame/fps,center=phase(t,timing.center,.7),exit=phase(t,timing.exit,.7);
 const resultX=1110-420*center,resultY=278-60*exit;
 const paths=inputs.map((item,i)=>{
  const build=phase(t,timing.paths[i],.55),clear=phase(t,timing.clear+i*.07,.36);
  return `<path d="M 740 ${item.y+78} C 875 ${item.y+78}, 935 ${448+i*116}, 1110 ${448+i*116}" fill="none" stroke="${item.color}" stroke-width="2.5" opacity="${.48*(1-clear)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-build}"/>`;
 }).join('');
 const slips=inputs.map((item,i)=>{
  const enter=phase(t,timing.inputs[i],.5),travel=phase(t,timing.travel[i],.95),pos=position(i,travel);
  const scale=1-.91*travel,opacity=enter*(1-phase(t,timing.travel[i]+.77,.18));
  const textOpacity=1-phase(t,timing.travel[i],.35);
  return `<g opacity="${opacity}" transform="translate(${pos.x},${pos.y+22*(1-enter)}) scale(${scale})">
   <rect x="-226" y="-68" width="460" height="156" rx="15" fill="#28473D" opacity=".07"/>
   <rect x="-230" y="-78" width="460" height="156" rx="15" fill="url(#paper)" stroke="#D8DBD1" stroke-width="1.5"/>
   <path d="M -230 -60 Q -230 -78 -212 -78 L -187 -78 L -187 -19 L -207 -30 L -230 -19Z" fill="${item.color}"/>
   <g opacity="${textOpacity}"><text x="-160" y="-17" font-size="33" font-weight="650" fill="#23463D">${escape(content.items[i].name)}</text><text x="-160" y="37" font-size="28" fill="#63756B">${escape(content.items[i].body)}</text></g>
   <path d="M 189 -35 L 197 -27 L 189 -19" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
 }).join('');
 const resultEnter=phase(t,timing.result,.6);
 const rows=inputs.map((item,i)=>{
  const reveal=phase(t,timing.reveal[i],.35);
  return `<g opacity="${reveal}" transform="translate(0,${12*(1-reveal)})">
   <rect x="42" y="${132+i*116}" width="456" height="95" rx="9" fill="${item.color}" opacity=".08"/>
   <rect x="42" y="${132+i*116}" width="4" height="95" rx="2" fill="${item.color}"/>
   <text x="65" y="${168+i*116}" font-size="24" font-weight="650" fill="${item.color}">${escape(content.items[i].name)}</text>
   <text x="65" y="${207+i*116}" font-size="29" fill="#23463D">${escape(content.items[i].body)}</text>
  </g>`;
 }).join('');
 const seal=phase(t,timing.seal,.32)*(1-phase(t,timing.sealExit,.2));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs><linearGradient id="paper" x2=".7" y2="1"><stop stop-color="#FFFDF8"/><stop offset="1" stop-color="#F9F8F0"/></linearGradient><radialGradient id="light"><stop stop-color="#FFFDF7"/><stop offset="1" stop-color="#F1F1E9"/></radialGradient></defs>
 <rect width="1920" height="1080" fill="url(#light)"/>
 <g font-family="PingFang SC, Microsoft YaHei, sans-serif">${paths}${slips}
 <g opacity="${resultEnter*(1-exit)}" transform="translate(${resultX},${resultY+18*(1-resultEnter)}) rotate(${-2*exit},270,260)">
  <rect x="8" y="14" width="540" height="525" rx="18" fill="#274E3E" opacity=".07"/>
  <path d="M 18 0 H 484 L 540 56 V 505 Q 540 525 520 525 H 18 Q 0 525 0 507 V 18 Q 0 0 18 0Z" fill="url(#paper)" stroke="#CDD4C8" stroke-width="1.6"/>
  <path d="M 484 0 V 40 Q 484 56 500 56 H 540" fill="#E5EADD" stroke="#CDD4C8" stroke-width="1.5"/>
  <text x="42" y="78" font-size="38" font-weight="650" fill="#23463D">${escape(content.resultName)}</text>
  <path d="M 42 104 H 462" stroke="#D6DDCF" stroke-width="1.5"/>
  ${rows}
  <g opacity="${seal}" transform="translate(465,77) scale(${.85+.15*seal})"><circle r="21" fill="#23463D"/><path d="M -9 0 L -2 7 L 10 -7" fill="none" stroke="#FFFDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
 </g></g></svg>`;
}
