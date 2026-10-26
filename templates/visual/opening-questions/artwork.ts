import {artwork} from './scene';
export const metadata={id:'OpeningQuestionsStudy',width:1920,height:1080,fps:30,durationInFrames:222};
const phase=(t:number,a:number,b:number)=>{const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v)};
export function getState(frame:number,fps=30){
 const t=frame/fps;
 return {t,core:phase(t,0,.7),questionOne:phase(t,.8,1.15),capabilities:[0,1,2].map(i=>phase(t,1.2+i*.38,1.58+i*.38)),connections:phase(t,1.15,2.4),boundary:phase(t,3.0,3.45),outbound:phase(t,3.65,4.6),questionTwo:phase(t,4.8,5.2),contact:Math.sin(Math.PI*phase(t,4.6,5.2)),shift:phase(t,4.8,5.2)};
}
export function renderSvg(frame:number,fps=30){
 const s=getState(frame,fps);let svg=artwork;
 const group=(id:string,attrs:string)=>{svg=svg.replace(`<g id="${id}"`, `<g id="${id}" ${attrs}`)};
 const reveal=(id:string,x:number,y:number,w:number,h:number,p:number)=>{svg=svg.replace('</defs>',`<clipPath id="reveal-${id}"><rect x="${x}" y="${y}" width="${w*p}" height="${h}"/></clipPath></defs>`);group(id,`clip-path="url(#reveal-${id})"`)};
 group('core',`opacity="${Math.min(1,s.core*4)}" transform="translate(960 660) scale(${.86+.14*s.core}) translate(-960 -660) translate(0 ${55*(1-s.core)})"`);
 reveal('question-one',145,170,500,220,s.questionOne);
 group('question-one',`opacity="${1-.3*s.shift}"`);
 group('capabilities',`opacity="${1-.25*s.shift}"`);
 const positions=[[293,377],[200,553],[405,713]];
 s.capabilities.forEach((p,i)=>{const [x,y]=positions[i];svg=svg.replace(`<g id="capability${i}" transform="translate(${x} ${y})">`,`<g id="capability${i}" opacity="${Math.min(1,p*4)}" transform="translate(${x+170*(1-p)} ${y+35*(1-p)}) scale(${.8+.2*p})">`)});
 group('connections',`opacity="${s.connections*(1-.25*s.shift)}"`);
 // The boundary belongs to the second question and is absent during ability introduction.
 group('boundary',`opacity="${s.boundary}" transform="translate(${50*(1-s.boundary)} 0)"`);
 group('outbound',`opacity="${Math.min(1,s.outbound*4)}" transform="translate(${-200*(1-s.outbound)+38*s.outbound} 0)"`);
 reveal('question-two',1250,170,500,250,s.questionTwo);
 svg=svg.replace('</g></svg>',`<g id="contact-feedback" opacity="${s.contact}" stroke="#ffe4b3" fill="none"><path d="M1473 548V738" stroke-width="7" filter="url(#glow)"/><path d="M1473 585h25M1473 645h25M1473 705h25" stroke-width="2"/></g></g></svg>`);
 return svg;
}
export async function drawFrame(canvas:HTMLCanvasElement,frame:number,fps=30){
 const url=URL.createObjectURL(new Blob([renderSvg(frame,fps)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<Event>((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('开场问题画面解码失败'));img.src=url});const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');ctx.clearRect(0,0,1920,1080);ctx.drawImage(img,0,0,1920,1080)}finally{URL.revokeObjectURL(url)}
}
