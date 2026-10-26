export type FilterLabels={input:string;before:string;after:string;passed:string;blocked:string};
const escape=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const shape=(kind:number,x:number,y:number,scale=1,muted=false)=>{
 const color=muted?'#C08D51':'#376A60';
 const form=kind===0?'<circle r="25"/>':kind===1?'<path d="M0 -29L29 23H-29Z" stroke-linejoin="round"/>':'<rect x="-23" y="-23" width="46" height="46" rx="7"/>';
 return `<g transform="translate(${x} ${y}) scale(${scale})"><rect x="-48" y="-44" width="96" height="88" rx="22" fill="${muted?'#F4E6D1':'#FCFBF5'}" stroke="${muted?'#D6B58B':'#CBD8CE'}" stroke-width="2"/><g fill="${color}" stroke="${color}" stroke-width="3">${form}</g><path d="M-31 -34H27" stroke="white" opacity=".75" stroke-width="3" stroke-linecap="round"/></g>`;
};
export function renderConditionFilter(frame:number,fps:number,labels:FilterLabels,timeScale=1){
 const t=frame/fps/timeScale,enter=smooth(t,.05,.85),exit=smooth(t,7.6,8.35),switchP=smooth(t,3.45,4.05);
 const opacity=enter*(1-exit),shift=28*(1-enter)-24*exit;
 let tokens='';
 for(let i=0;i<3;i++){
  const start=.85+i*.34,p=smooth(t,start,start+1.2),gone=smooth(t,3.18,3.43);
  tokens+=`<g opacity="${smooth(t,.7+i*.1,1+i*.1)*(1-gone)}">${shape(i,mix(320-i*138,1400+i*110,p),510)}</g>`;
  const s=4.2+i*.48,approach=smooth(t,s,s+.75),after=smooth(t,s+.75,s+1.45);
  let x=mix(320-i*138,925,approach),y=510;
  if(i===0)x=mix(x,1510,after);
  else {x=mix(x,i===1?905:1065,after);y=mix(510,805,after*after);}
  const angle=i===0?0:mix(0,i===1?-12:10,after)*(1-smooth(t,s+1.4,s+1.65));
  tokens+=`<g opacity="${smooth(t,3.95+i*.08,4.18+i*.08)}" transform="rotate(${angle} ${x} ${y})">${shape(i,x,y,1,i>0&&after>.1)}</g>`;
 }
 const firstCount=[0,1,2].filter(i=>t>=2.05+i*.34).length;
 const count=t<3.45?firstCount:(t<5.65?0:1);
 const beam=(smooth(t,1.1,1.4)*(1-smooth(t,3.0,3.3))+smooth(t,4.25,4.5)*(1-smooth(t,6.55,6.8)))*.6;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><radialGradient id="bg"><stop stop-color="#FFFEF8"/><stop offset="1" stop-color="#EFEFE5"/></radialGradient><linearGradient id="body" x2=".9" y2="1"><stop stop-color="#638B7F"/><stop offset="1" stop-color="#2F594F"/></linearGradient><linearGradient id="edge" x2="0" y2="1"><stop stop-color="#9DB4A6"/><stop offset="1" stop-color="#638B7F"/></linearGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#304F40" flood-opacity=".15"/></filter></defs><rect width="1920" height="1080" fill="url(#bg)"/>
 <g opacity="${opacity}" transform="translate(0 ${shift})" font-family="PingFang SC, Microsoft YaHei, sans-serif">
 <ellipse cx="980" cy="877" rx="685" ry="39" fill="#214C3E" opacity=".055"/>
 <path d="M240 556H1660" stroke="#CBD3C6" stroke-width="4" stroke-linecap="round"/><path d="M240 563H1660" stroke="white" stroke-width="3"/>
 <path d="M290 510H1640" stroke="#8BA99A" opacity=".17" stroke-width="2" stroke-dasharray="6 14"/>
 <text x="300" y="405" fill="#6E8276" font-size="27" letter-spacing="3">${escape(labels.input)}</text>
 <g filter="url(#shadow)"><path d="M850 281L1124 281L1150 302V689L1124 714H850Z" fill="url(#edge)"/><rect x="836" y="268" width="274" height="432" rx="38" fill="url(#body)" stroke="#476F62" stroke-width="2"/><path d="M868 281H1071" stroke="#C5D7C8" opacity=".45" stroke-width="3" stroke-linecap="round"/>
 <rect x="862" y="302" width="222" height="84" rx="19" fill="#23493F"/><text x="973" y="353" text-anchor="middle" fill="#F1F5E9" font-size="31" opacity="${1-switchP}">${escape(labels.before)}</text><text x="973" y="353" text-anchor="middle" fill="#F1F5E9" font-size="31" opacity="${switchP}">${escape(labels.after)}</text>
 <rect x="871" y="427" width="204" height="169" rx="${mix(25,78,switchP)}" fill="#E4EBDF" stroke="#173F34" stroke-width="7"/><path d="M893 587H1053" stroke="#B4C6B8" stroke-width="4" stroke-linecap="round" opacity="${1-switchP}"/>
 <circle cx="885" cy="643" r="8" fill="#CBE5BF"/><path d="M916 643H990" stroke="#B4CABC" stroke-width="4" stroke-linecap="round"/><circle cx="1044" cy="643" r="16" fill="#1E443A" stroke="#729488" stroke-width="3"/><path d="M1044 643L${1044+11*Math.sin(switchP*1.7)} ${643-11*Math.cos(switchP*1.7)}" stroke="#DFE9D8" stroke-width="3" stroke-linecap="round"/></g>
 <path d="M978 448V573" stroke="#A4D5A9" opacity="${beam}" stroke-width="5"/>
 <g opacity="${smooth(t,.65,1.1)}"><rect x="1340" y="424" width="340" height="173" rx="29" fill="#E5EBDF" stroke="#C7D4C5" stroke-width="2"/><text x="1512" y="374" text-anchor="middle" fill="#476B5D" font-size="28">${escape(labels.passed)} <tspan font-weight="600">${count}</tspan></text></g>
 <g opacity="${switchP}"><path d="M844 761V858Q844 881 868 881H1112Q1136 881 1136 858V761" fill="#EAE3D5" stroke="#C7B89D" stroke-width="3"/><path d="M853 870H1127" stroke="#D7C6A8" stroke-width="5"/><text x="990" y="942" text-anchor="middle" font-size="28" fill="#927347">${escape(labels.blocked)} ${t<6.13?0:t<6.61?1:2}</text></g>
 ${tokens}
 </g></svg>`;
}
