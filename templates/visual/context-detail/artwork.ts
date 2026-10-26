export type ContextDetailData={input:string;process:string;output:string;description:string;items:[string,string,string]};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const p=(t:number,a:number,b:number)=>{const v=clamp((t-a)/(b-a));return v*v*(3-2*v);};
const mix=(a:number,b:number,v:number)=>a+(b-a)*v;
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const text=(x:number,y:number,value:string,size:number,color:string,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(value)}</text>`;
function sideNode(x:number,label:string,kind:number,t:number,expand:number){
 const enter=p(t,kind===0?.05:5.48,kind===0?.8:5.8);
 const active=kind===0?1-p(t,3.05,3.5):p(t,5.48,5.8);
 const opacity=enter*(1-.76*expand*(1-active));
 return `<g transform="translate(${x} ${510+35*(1-enter)})" opacity="${opacity}"><circle r="89" fill="#213D40" stroke="${kind===1&&t>=6.65?'#A7C5A9':'#456367'}" stroke-width="2"/>${text(0,134,label,34,'#BDD0C6','text-anchor="middle"')}</g>`;
}
function detail(t:number,expand:number,data:ContextDetailData){
 const w=mix(230,980,expand),h=mix(210,570,expand),cx=960,cy=mix(510,525,expand);
 const x=cx-w/2,y=cy-h/2,content=p(expand,.35,.98);
 const ix=mix(960,566,expand),iy=mix(485,335,expand);
 const labelX=mix(960,690,expand),labelY=mix(579,351,expand);
 return `<g opacity="${p(t,1.05,1.65)}"><defs><clipPath id="detailClip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/></clipPath></defs><rect x="${x}" y="${y+16}" width="${w}" height="${h}" rx="22" fill="#051D22" opacity=".3" filter="url(#shadow)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="url(#panel)" stroke="#AAC6AE" stroke-width="2"/><g clip-path="url(#detailClip)"><g transform="translate(${ix} ${iy})" stroke="#376D56" stroke-width="5" stroke-linecap="round"><path d="M-26 -18H25M-26 0H12M-26 18H0"/></g>${text(labelX,labelY,data.process,mix(36,46,expand),'#234B3D','text-anchor="middle" font-weight="600"')}<g opacity="${content}"><path d="M534 389H1386" stroke="#C8D5C0" stroke-width="2"/>${text(534,447,data.description,34,'#58725E')}<path d="M660 620H1260" stroke="#D4DECB" stroke-width="2" stroke-dasharray="5 9"/></g></g></g>`;
}

function flowItems(t:number,data:ContextDetailData){
 const sort=p(t,3.28,4.42),targets=[2,0,1],colors=['#B98F56','#568675','#748CA6'];
 return [0,1,2].map(i=>{
  const into=p(t,2.58,3.15),close=p(t,4.75,5.45),out=p(t,5.85,6.65);
  const sortedX=mix(720+240*i,720+240*targets[i],sort);
  const sortedY=620+Math.sin(sort*Math.PI)*[-94,39,82][i];
  const x=mix(mix(mix(310+55*i,sortedX,into),905+55*targets[i],close),1500+55*targets[i],out);
  const y=mix(mix(mix(510,sortedY,into)+45*Math.sin(into*Math.PI),530,close),510,out);
  const scale=mix(mix(.34,1,into),.34,close);
  return `<g transform="translate(${x} ${y}) scale(${scale})" opacity="${p(t,.05,.8)}"><rect x="-74" y="-56" width="148" height="117" rx="14" fill="#28453B" opacity=".08" transform="translate(0 7)"/><rect x="-74" y="-56" width="148" height="117" rx="14" fill="#FFFEF5" stroke="#CED9C7" stroke-width="2"/><rect x="-73" y="-55" width="146" height="7" rx="3" fill="${colors[i]}"/>${text(0,19,data.items[i],58,colors[i],'text-anchor="middle" font-weight="550"')}</g>`;
 }).join('');
}
export function renderContextDetail(frame:number,fps:number,data:ContextDetailData,timeScale=1){
 const t=frame/fps/timeScale,expand=p(t,1.65,2.58)*(1-p(t,4.75,5.45)),exit=p(t,7.0,7.95);
 const inputLine=p(t,.95,1.55),outputLine=p(t,5.48,5.8),contextOpacity=1-.76*expand;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><radialGradient id="background" cx="50%" cy="45%" r="80%"><stop stop-color="#24494B"/><stop offset="1" stop-color="#10282F"/></radialGradient><linearGradient id="panel" x2="0" y2="1"><stop stop-color="#F2F7E8"/><stop offset="1" stop-color="#DBE8D2"/></linearGradient><pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="23" cy="23" r="1" fill="#A9C6BE" opacity=".11"/></pattern><filter id="shadow" x="-25%" y="-50%" width="150%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="1920" height="1080" fill="url(#background)"/><rect x="160" y="140" width="1600" height="800" fill="url(#dots)"/><g transform="translate(0 ${-1250*exit})" font-family="system-ui, sans-serif"><g opacity="${contextOpacity}"><g stroke="#718F87" stroke-width="3" fill="none"><path d="M454 510H845" stroke-dasharray="${391*inputLine} 391"/><path d="M1075 510H1466" stroke-dasharray="${391*outputLine} 391"/></g><g fill="#8BA99E"><path d="M828 503L841 510L828 517Z" opacity="${inputLine}"/><path d="M1449 503L1462 510L1449 517Z" opacity="${outputLine}"/></g></g>${sideNode(365,data.input,0,t,expand)}${sideNode(1555,data.output,1,t,expand)}${detail(t,expand,data)}${flowItems(t,data)}</g></svg>`;
}
