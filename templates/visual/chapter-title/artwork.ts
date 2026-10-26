import {artwork,layout} from './scene';
export const metadata={id:'ChapterTitleStudy',width:1920,height:1080,fps:30,durationInFrames:153};
const phase=(t:number,a:number,b:number)=>{const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v)};
const offsets=[[-60,-24,-3],[-28,30,2],[20,-35,-2],[-18,24,2],[30,-28,-2],[60,28,3]];
export function getState(frame:number,fps=30){
 const t=frame/fps;
 return {t,chars:offsets.map((v,i)=>{
  const enter=phase(t,.03*i,.68+.03*i);
  return {enter,dx:v[0]*(1-enter),dy:v[1]*(1-enter),rotation:v[2]*(1-enter)};
 }),beam:phase(t,.7,1.08),exit:phase(t,2.45,3.5),beamFade:phase(t,2.75,4.15),flash:Math.max(0,1-Math.abs(t-1.06)/.25)};
}
const glyphSources=Array.from({length:6},(_,i)=>artwork.match(new RegExp(`<g id="char${i}"[^>]*>[\\s\\S]*?<\\/g>`))![0].replace(`id="char${i}"`,`id="sourceGlyph${i}"`));
const hash=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export type Fragment={id:string;glyph:number;x:number;y:number;cx:number;cy:number;birth:number;speed:number;drift:number;spin:number};
export const fragments=layout.boxes.flatMap((box,i)=>{
 const cells:Fragment[]=[];let n=0;
 for(let y=box.y-4;y<box.y+box.height+6;y+=22)for(let x=box.x-4;x<box.x+box.width+6;x+=22){
  const seed=i*1000+n++,cx=x+11,cy=y+11;
  cells.push({id:`piece${seed}`,glyph:i,x,y,cx,cy,birth:2.45+(1560-cx)/1180*.95+hash(seed)*.07,speed:110+hash(seed+3)*180,drift:(hash(seed+6)-.6)*95,spin:(hash(seed+9)-.5)*240});
 }
 return cells;
});
export function fragmentState(piece:Fragment,t:number){
 const age=Math.max(0,t-piece.birth),life=1.12+hash(piece.glyph*1000+piece.x)*.24;
 return {age,dx:-piece.speed*Math.pow(age,1.12),dy:piece.drift*age+Math.sin(age*6+piece.cy*.04)*age*15,rotation:piece.spin*age,scale:Math.max(.12,1-age/life*.7),opacity:Math.pow(Math.max(0,1-age/life),1.35)};
}
export function renderSvg(frame:number,fps=30){
 const s=getState(frame,fps);let svg=artwork;
 const beamRight=Math.min(140+1640*s.beam,1780-1640*s.exit);
 let clips=`<clipPath id="titleVisibility"><rect x="100" y="260" width="1720" height="${layout.beamY-260}"/></clipPath><clipPath id="beamVisibility"><rect x="140" y="${layout.beamY-40}" width="${Math.max(0,beamRight-140)}" height="80"/></clipPath>`;
 if(s.t>=2.45){
  clips+=glyphSources.join('')+fragments.map(p=>`<clipPath id="${p.id}"><rect x="${p.x}" y="${p.y}" width="22.5" height="22.5"/></clipPath>`).join('');
  for(let i=0;i<6;i++)clips+=`<clipPath id="intact${i}">${fragments.filter(p=>p.glyph===i&&s.t<=p.birth).map(p=>`<rect x="${p.x}" y="${p.y}" width="22.5" height="22.5"/>`).join('')}</clipPath>`;
 }
 svg=svg.replace('</defs>',`${clips}</defs>`);
 for(let i=0;i<6;i++){
  const item=s.chars[i],center=layout.centers[i];
  const re=new RegExp(`(<g id="char${i}"[^>]*>[\\s\\S]*?<\\/g>)`);
  svg=svg.replace(re,`<g clip-path="url(#titleVisibility)"><g transform="translate(${item.dx} ${item.dy}) rotate(${item.rotation} ${center.x} ${center.y})">$1</g></g>`);
 }
 if(s.t>=2.45){
  let pieces=Array.from({length:6},(_,i)=>`<g clip-path="url(#intact${i})"><use href="#sourceGlyph${i}"/></g>`).join('');
  for(const piece of fragments){const p=fragmentState(piece,s.t);if(p.age===0||p.opacity<=0)continue;pieces+=`<g opacity="${p.opacity}" transform="translate(${p.dx} ${p.dy}) translate(${piece.cx} ${piece.cy}) rotate(${p.rotation}) scale(${p.scale}) translate(${-piece.cx} ${-piece.cy})"><g clip-path="url(#${piece.id})"><use href="#sourceGlyph${piece.glyph}"/></g></g>`}
  for(let i=0;i<6;i++){const item=s.chars[i],center=layout.centers[i];const re=new RegExp(`<g clip-path="url\\(#titleVisibility\\)"><g transform="translate\\(${item.dx} ${item.dy}\\) rotate\\(${item.rotation} ${center.x} ${center.y}\\)"><g id="char${i}"[^>]*>[\\s\\S]*?<\\/g><\\/g><\\/g>`);svg=svg.replace(re,i===0?`<g id="windFragments">${pieces}</g>`:'')}
 }
 svg=svg.replace('<g id="baseline">',`<g id="baseline" opacity="${1-s.beamFade}" clip-path="url(#beamVisibility)">`);
 if(s.flash>0){
  const flash=`<ellipse cx="${layout.flareX}" cy="${layout.beamY}" rx="${30+30*s.flash}" ry="${10+10*s.flash}" fill="url(#flare)" opacity="${s.flash*.8}"/>`;
  svg=svg.replace('</g>\n</svg>',`${flash}</g>\n</svg>`);
 }
 return svg;
}
export async function drawFrame(canvas:HTMLCanvasElement,frame:number,fps=30){
 const url=URL.createObjectURL(new Blob([renderSvg(frame,fps)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<Event>((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('章节标题画面解码失败'));img.src=url});const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');ctx.clearRect(0,0,1920,1080);ctx.drawImage(img,0,0,1920,1080)}finally{URL.revokeObjectURL(url)}
}
