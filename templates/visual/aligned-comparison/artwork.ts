export type Triple=[string,string,string];
export type AlignedComparisonData={names:Triple;rows:Triple;values:[Triple,Triple,Triple]};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const p=(t:number,a:number,b:number)=>{const v=clamp((t-a)/(b-a));return v*v*(3-2*v);};
const colors=['#648479','#B48B56','#728397'];
const starts=[1.45,2.85,4.25];
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const text=(x:number,y:number,value:string,size:number,fill:string,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
function emblem(i:number,x:number,y:number){
 const line=`fill="none" stroke="${colors[i]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
 const shape=i===0?'<rect x="-22" y="-17" width="44" height="30" rx="4"/><path d="M-12 21H12M0 13V21"/>':i===1?'<path d="M-20 13H18C38 13 33-11 18-11C11-31-16-23-18-8C-38-8-35 13-20 13Z"/>':'<rect x="-26" y="-14" width="20" height="28" rx="4"/><rect x="6" y="-14" width="20" height="28" rx="4"/><path d="M-6 0H6"/>';
 return `<g transform="translate(${x} ${y})" ${line}>${shape}</g>`;
}
function column(i:number,t:number,data:AlignedComparisonData){
 const {rows,values,names}=data;
 const enter=p(t,.08+i*.17,.75+i*.17),fold=p(t,6.25+i*.09,6.95+i*.09),leave=p(t,6.75+i*.13,7.72+i*.13);
 const x=528+410*i,y=210+58*(1-enter)-1100*leave,w=386,visible=w-(w-12)*fold;
 let cells='';
 for(let r=0;r<3;r++){
  const reveal=p(t,starts[r],starts[r]+.42),active=p(t,starts[r]-.08,starts[r]+.18)*(1-p(t,starts[r]+1.08,starts[r]+1.35));
  const cy=278+r*146;
  cells+=`<path d="M27 ${cy-65}H359" stroke="#DCE1D8" stroke-width="2"/>`;
  cells+=`<rect x="14" y="${cy-59}" width="358" height="126" rx="6" fill="${colors[i]}" opacity="${active*.12}"/><rect x="14" y="${cy-59}" width="4" height="126" rx="2" fill="${colors[i]}" opacity="${active}"/>`;
  cells+=`<g clip-path="url(#cell${i}-${r})"><g transform="translate(0 ${19*(1-reveal)})" opacity="${reveal}">${text(193,cy+10,values[i][r],46,'#264C40','text-anchor="middle" font-weight="550"')}</g></g>`;
 }
 return `<g transform="translate(${x} ${y})"><defs><clipPath id="col${i}"><rect x="${(w-visible)/2}" y="-10" width="${visible}" height="${670*enter}" rx="${12-7*fold}"/></clipPath>${rows.map((_,r)=>`<clipPath id="cell${i}-${r}"><rect x="20" y="${213+r*146}" width="346" height="130"/></clipPath>`).join('')}</defs><g clip-path="url(#col${i})"><rect x="0" y="0" width="386" height="651" rx="12" fill="#FFFDF7" stroke="#D5DCCD" stroke-width="2"/><rect x="0" y="0" width="386" height="8" fill="${colors[i]}"/><rect x="1" y="8" width="384" height="188" fill="${colors[i]}" opacity=".065"/>${emblem(i,193,69)}${text(193,147,names[i],40,'#264C40','text-anchor="middle" font-weight="600"')}${cells}<path d="M27 623H359" stroke="${colors[i]}" stroke-width="3" opacity=".3"/></g><rect x="${(w-visible)/2}" y="0" width="${visible}" height="651" rx="5" fill="${colors[i]}" opacity="${p(fold,.8,1)}"/></g>`;
}
export function renderAlignedComparison(frame:number,fps:number,data:AlignedComparisonData,timeScale=1){
 const {rows}=data;
 const t=frame/fps/timeScale,railEnter=p(t,.28,1.1),railLeave=p(t,6.52,7.3);
 let labels='';
 for(let r=0;r<3;r++){
  const active=p(t,starts[r]-.08,starts[r]+.18)*(1-p(t,starts[r]+1.08,starts[r]+1.35));
  labels+=`<g transform="translate(${-430*railLeave} 0)" opacity="${railEnter}"><circle cx="244" cy="${488+r*146}" r="${4+2*active}" fill="#456C5B" opacity="${.22+.78*active}"/>${text(285,498+r*146,rows[r],32,'#496253','font-weight="500"')}</g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><radialGradient id="background" cx="55%" cy="40%" r="82%"><stop stop-color="#FFFEF8"/><stop offset="1" stop-color="#ECEDE3"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#background)"/><g font-family="system-ui, sans-serif">${labels}${[0,1,2].map(i=>column(i,t,data)).join('')}</g></svg>`;
}
