// Original deterministic sphere mesh. No source-video assets or code.
const W=1920,H=1080,cx=1000,cy=535,R=334;
type Vec3=[number,number,number];
type Point={x:number;y:number;z:number;s:number};
const fmt=(n:number)=>n.toFixed(2);
function rotate([x,y,z]:Vec3,yaw=0):Vec3{
 const a=.56+yaw,b=-.28,c=.18;
 [x,z]=[x*Math.cos(a)+z*Math.sin(a),z*Math.cos(a)-x*Math.sin(a)];
 [y,z]=[y*Math.cos(b)-z*Math.sin(b),y*Math.sin(b)+z*Math.cos(b)];
 return [x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c),z];
}
function project(v:Vec3,yaw=0):Point{const [x,y,z]=rotate(v,yaw),s=3.8/(3.8-z);return {x:cx+x*R*s,y:cy+y*R*s,z,s};}
function orbit(t:number){return project([1.39*Math.cos(t),.30*Math.sin(t),.96*Math.sin(t)]);}
const circle=(p:Pick<Point,'x'|'y'>,r:number,fill:string,opacity=1)=>`<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="${fmt(r)}" fill="${fill}" opacity="${fmt(opacity)}"/>`;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function networkStatic({yaw=0,meshReveal=1,orbitReveal=1,shellReveal=1,scale=1,verticalScale=1,dx=0,dy=0,signalOffset=0}={}){
 const nodeReveal=(a:Point,delay=0)=>meshReveal>=1?1:smooth((meshReveal-Math.hypot(a.x-780,a.y-330)/(R*2.55)-delay)/.18);
 const rows=19,cols=42,points:Point[]=[];
 for(let i=0;i<rows;i++){
  const lat=Math.PI*(i+.5)/rows;
  for(let j=0;j<cols;j++){
   const lon=2*Math.PI*(j+(i%2)*.5)/cols;
   points.push(project([Math.sin(lat)*Math.cos(lon),Math.cos(lat),Math.sin(lat)*Math.sin(lon)],yaw));
  }
 }
 let lines='',lights='',bloom='',farOrbit='',nearOrbit='';
 const edge=(a:Point,b:Point)=>{
  const depth=(a.z+b.z)/2;
  const front=Math.max(0,depth),alpha=depth<0?.055+.04*(depth+1):.17+.34*front;
  const reveal=nodeReveal(a),end={x:a.x+(b.x-a.x)*reveal,y:a.y+(b.y-a.y)*reveal};
  return `<path d="M${fmt(a.x)} ${fmt(a.y)}L${fmt(end.x)} ${fmt(end.y)}" stroke="${depth>.45?'#75deed':'#468aac'}" stroke-width="${fmt(.6+.42*front)}" opacity="${fmt(alpha*reveal)}"/>`;
 };
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const n=i*cols+j,a=points[n];
  lines+=edge(a,points[i*cols+(j+1)%cols]);
  if(i<rows-1){lines+=edge(a,points[(i+1)*cols+j]);lines+=edge(a,points[(i+1)*cols+(j+(i%2?1:cols-1))%cols]);}
  const strong=(n*37%97)<12,front=Math.max(0,a.z);
  const radius=strong?(1.7+1.4*front):(.65+.65*front);
  const alpha=(a.z<0?.09:(strong?.55+.4*front:.16+.36*front))*nodeReveal(a,.03);
  const hot=strong&&a.x<cx-30&&a.y<cy-35&&a.z>.2;
  const color=hot?'#ffe1a7':strong?'#b9f9ff':'#6ed5e7';
  lights+=circle(a,radius,color,alpha);
  if(strong&&a.z>0){bloom+=circle(a,radius*3,hot?'#f3ba63':'#58d8ee',alpha*.65);}
  if(strong&&a.z>.5){lights+=`<path d="M${fmt(a.x-5)} ${fmt(a.y)}h10M${fmt(a.x)} ${fmt(a.y-5)}v10" stroke="${color}" opacity="${fmt(.33*nodeReveal(a,.03))}" stroke-width=".65"/>`;}
 }
 for(let i=0;i<260;i++){
  if(i/260>orbitReveal)continue;
  const a=orbit(i/260*2*Math.PI),b=orbit((i+1)/260*2*Math.PI);
  const path=`<path d="M${fmt(a.x)} ${fmt(a.y)}L${fmt(b.x)} ${fmt(b.y)}" stroke="${a.z>0?'#d9b782':'#457293'}" stroke-width="${a.z>0?1.2:.85}" opacity="${a.z>0?.5:.22}"/>`;
  if(a.z>0)nearOrbit+=path;else farOrbit+=path;
 }
 let stars='';
 for(let n=0;n<85;n++){
  const x=60+(n*641%1800),y=55+(n*337%965);
  if(Math.hypot(x-cx,y-cy)<440)continue;
  stars+=circle({x,y},n%13===0?1.4:.7,'#7899b7',n%13===0?.3:.12);
 }
 const signal=orbit(1.17+signalOffset);
 const signalGraphic=`<g filter="url(#glow)">${circle(signal,10,'#e4bc7c',.45*orbitReveal)}</g>${circle(signal,3.2,'#ffe8c2',.95*orbitReveal)}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs>
 <radialGradient id="env" cx="53%" cy="45%" r="65%"><stop stop-color="#142b42"/><stop offset=".46" stop-color="#0b172a"/><stop offset="1" stop-color="#040914"/></radialGradient>
 <radialGradient id="volume" cx="35%" cy="27%" r="76%"><stop stop-color="#27485c" stop-opacity=".42"/><stop offset=".58" stop-color="#0a1c2a" stop-opacity=".70"/><stop offset="1" stop-color="#020c15" stop-opacity=".95"/></radialGradient>
 <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d2effb"/><stop offset=".35" stop-color="#71d9f0"/><stop offset=".72" stop-color="#22506e"/><stop offset="1" stop-color="#66bacf"/></linearGradient>
 <filter id="wide" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="45"/></filter>
 <filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5"/></filter>
 <filter id="halo" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="16"/></filter>
 </defs>
 <rect width="1920" height="1080" fill="url(#env)"/>
 <ellipse cx="1070" cy="560" rx="415" ry="360" fill="#245577" opacity=".16" filter="url(#wide)"/>
 <ellipse cx="780" cy="330" rx="110" ry="120" fill="#c4864c" opacity=".08" filter="url(#wide)"/>
 ${stars}
 <g transform="translate(${fmt(cx+dx)} ${fmt(cy+dy)}) scale(${scale.toFixed(5)} ${(scale*verticalScale).toFixed(5)}) translate(${-cx} ${-cy})">
 <g fill="none">${farOrbit}</g>
 ${signal.z<0?signalGraphic:''}
 <circle cx="${cx}" cy="${cy}" r="${R*1.04}" fill="none" stroke="#3bb4cd" stroke-width="8" opacity="${fmt(.16*shellReveal)}" filter="url(#halo)"/>
 <circle cx="${cx}" cy="${cy}" r="${R*1.038}" fill="url(#volume)" opacity="${fmt(shellReveal)}"/>
 <g fill="none">${lines}</g>
 <g filter="url(#glow)">${bloom}</g>
 ${lights}
 <circle cx="${cx}" cy="${cy}" r="${R*1.038}" fill="none" stroke="url(#rim)" stroke-width="1.35" opacity="${fmt(.63*shellReveal)}" pathLength="1" stroke-dasharray="${fmt(shellReveal)} 1" stroke-dashoffset="${fmt(-.37*(1-shellReveal))}"/>
 <path d="M740 315A347 347 0 0 1 1060 194" fill="none" stroke="#aceafa" stroke-width="3" opacity="${fmt(.19*shellReveal)}" filter="url(#glow)"/>
 <g fill="none">${nearOrbit}</g>
 ${signal.z>=0?signalGraphic:''}
 </g>
 </svg>`;
}

export const networkVolumeLoopSeconds=24;
export function renderNetworkVolume(frame:number,fps=30,cycleSeconds=networkVolumeLoopSeconds):string{
 if(!Number.isFinite(cycleSeconds)||cycleSeconds<=0)throw new RangeError('cycleSeconds must be positive and finite');
 const cycleFrames=cycleSeconds*fps;
 const phase=((frame%cycleFrames)+cycleFrames)%cycleFrames/cycleFrames;
 return networkStatic({yaw:phase*Math.PI*2,signalOffset:phase*Math.PI*4});
}
