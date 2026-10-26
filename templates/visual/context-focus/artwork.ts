import {artwork} from './scene';
export const metadata={id:'ContextFocusStudy',width:1920,height:1080,fps:30,durationInFrames:186};
const phase=(t:number,a:number,b:number)=>{const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v)};
export function getState(frame:number,fps=30){
 const t=frame/fps;
 return {t,context:phase(t,0,.55),selection:phase(t,.7,1.05),connector:phase(t,1.05,1.4),detail:phase(t,1.4,2.1),heading:phase(t,2.1,2.35),saved:phase(t,2.35,2.65),current:phase(t,2.7,3.05),matches:[0,1,2].map(i=>phase(t,3.1+i*.25,3.32+i*.25)),newPart:phase(t,3.85,4.15),result:phase(t,4.2,4.5)};
}
export function renderSvg(frame:number,fps=30){
 const s=getState(frame,fps);let svg=artwork;
 const group=(id:string,attrs:string)=>{svg=svg.replace(`<g id="${id}"`, `<g id="${id}" ${attrs}`)};
 group('context',`opacity="${s.context*(1-.23*s.detail)}" transform="translate(0 ${22*(1-s.context)})"`);
 svg=svg.replace('id="selection"',`id="selection" opacity="${s.selection}"`);
 svg=svg.replace('id="connector"',`id="connector" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-s.connector}"`);
 group('locator',`opacity="${s.selection}"`);
 const scale=.28+.72*s.detail,x=482+(1289-482)*s.detail,y=517+(531-517)*s.detail;
 group('detail',`opacity="${Math.min(1,s.detail*4)}" transform="translate(${x} ${y}) scale(${scale}) translate(-1289 -531)"`);
 for(const name of ['heading','saved','current','result'] as const)group(name,`opacity="${s[name]}" transform="translate(0 ${10*(1-s[name])})"`);
 for(let i=0;i<3;i++)group(`match${i}`,`style="opacity:${s.matches[i]*.65}" transform="translate(0 ${-8*(1-s.matches[i])})"`);
 group('new',`opacity="${s.newPart}" transform="translate(${24*(1-s.newPart)} 0)"`);
 // Match pulses emphasize exact pairs after both rows are fully established.
 const pulse=[0,1,2].map(i=>{const a=s.matches[i]*(1-phase(s.t,3.85,4.15));return `<rect x="${1071+i*108}" y="516" width="100" height="43" rx="5" fill="none" stroke="#c2fff2" stroke-width="2" opacity="${a}"/><rect x="${1071+i*108}" y="616" width="100" height="43" rx="5" fill="none" stroke="#c2fff2" stroke-width="2" opacity="${a}"/>`}).join('');
 svg=svg.replace('</g></g></svg>',`${pulse}</g></g></svg>`);
 return svg;
}
export async function drawFrame(canvas:HTMLCanvasElement,frame:number,fps=30){
 const url=URL.createObjectURL(new Blob([renderSvg(frame,fps)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<Event>((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('细节聚焦画面解码失败'));img.src=url});const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');ctx.clearRect(0,0,1920,1080);ctx.drawImage(img,0,0,1920,1080)}finally{URL.revokeObjectURL(url)}
}
