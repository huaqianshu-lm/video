export type TokenRole='plain'|'keyword'|'name'|'string'|'number';
export type CodeToken=[TokenRole,string];
export type CodeContent={fileName:string;lines:CodeToken[][];focusLines:[number,number,number]};
export type CodeTiming={
  enter:[number,number];
  appear:[number,number];
  highlightIn:[number,number];
  next:[number,number];
  last:[number,number];
  highlightOut:[number,number];
  exit:[number,number];
  fadeOut:[number,number];
};
export const defaultTiming:CodeTiming={enter:[.05,1.1],appear:[.05,.55],highlightIn:[1.15,1.3],next:[2.12,2.37],last:[3.37,3.62],highlightOut:[4.5,4.7],exit:[4.75,6.3],fadeOut:[5.05,6.3]};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);};
const progress=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const palette={plain:'#DCE8F0',keyword:'#B8ACED',name:'#91DDC9',string:'#E8C58D',number:'#E8C58D'};
export function renderCodeWalkthrough(frame:number,fps:number,content:CodeContent,timing:CodeTiming=defaultTiming){
 const {lines,focusLines}=content;
 const focusY=focusLines.map(i=>355+i*70);
 const t=frame/fps;
 const enter=progress(t,...timing.enter),next=progress(t,...timing.next),last=progress(t,...timing.last),exit=progress(t,...timing.exit);
 const focus=mix(mix(focusY[0],focusY[1],next),focusY[2],last);
 const emphasis=progress(t,...timing.highlightIn)*(1-progress(t,...timing.highlightOut));
 const zoom=mix(.965,1.14,enter)*(1-.16*exit);
 const cx=960,cy=510,screenY=510+22*(1-enter)+50*exit;
 const visibility=progress(t,...timing.appear)*(1-progress(t,...timing.fadeOut)),context=1-.56*emphasis;
 const active=[(1-next)*(1-last),next*(1-last),last];
 let text=`<rect x="390" y="${focus-42}" width="1090" height="60" rx="8" fill="#86DAC6" opacity="${.105*emphasis}"/><rect x="390" y="${focus-34}" width="4" height="44" rx="2" fill="#91E3CE" opacity="${emphasis}"/>`;
 for(let i=0;i<lines.length;i++){
  const focusIndex=focusLines.indexOf(i);
  const intensity=focusIndex>=0?active[focusIndex]*emphasis:0;
  const opacity=context+(1-context)*intensity;
  const y=355+i*70;
  text+=`<text x="354" y="${y}" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="23" fill="#788B9F" opacity="${opacity}">${i+1}</text><text x="420" y="${y}" xml:space="preserve" font-family="ui-monospace,Menlo,monospace" font-size="32" opacity="${opacity}">${lines[i].map(([role,token])=>`<tspan fill="${palette[role]}">${escape(token)}</tspan>`).join('')}</text>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><radialGradient id="back" cx="35%" cy="35%" r="85%"><stop stop-color="#243D50"/><stop offset="1" stop-color="#101B2B"/></radialGradient><linearGradient id="panel" x2=".7" y2="1"><stop stop-color="#223449"/><stop offset="1" stop-color="#172538"/></linearGradient><radialGradient id="glow"><stop stop-color="#64BDA6" stop-opacity=".17"/><stop offset="1" stop-color="#64BDA6" stop-opacity="0"/></radialGradient><filter id="shadow" x="-30%" y="-40%" width="160%" height="180%"><feDropShadow dx="0" dy="25" stdDeviation="28" flood-color="#050D18" flood-opacity=".45"/></filter></defs><rect width="1920" height="1080" fill="url(#back)"/><ellipse cx="1100" cy="610" rx="${740-90*exit}" ry="480" fill="url(#glow)" opacity="${1-.6*exit}"/><g opacity="${visibility}" transform="translate(960 ${screenY}) scale(${zoom}) translate(${-cx} ${-cy})"><rect x="300" y="200" width="1320" height="620" rx="24" fill="url(#panel)" filter="url(#shadow)"/><rect x="300.75" y="200.75" width="1318.5" height="618.5" rx="23.25" fill="none" stroke="#97B1C8" stroke-opacity=".24" stroke-width="1.5"/><path d="M324 201 H1596" stroke="#D9EBF8" stroke-opacity=".22"/><circle cx="340" cy="244" r="6" fill="#76909D"/><circle cx="362" cy="244" r="6" fill="#76909D"/><circle cx="384" cy="244" r="6" fill="#76909D"/><text x="960" y="252" text-anchor="middle" fill="#9AAEBD" font-family="system-ui,sans-serif" font-size="23">${escape(content.fileName)}</text><path d="M301 286 H1619" stroke="#91A8BD" stroke-opacity=".15"/>${text}<path d="M420 718 H1478" stroke="#91A8BD" stroke-opacity=".13"/></g></svg>`;
}
