export type DocumentItem={label:string;source:string;title:string;detail:string};
export type DocumentContent={name:string;description:string;footer:string;page:string;items:[DocumentItem,DocumentItem,DocumentItem]};
/** Local seconds, derived from the current video timeline for production use. */
export type DocumentTiming={enter:number;park:number;items:[number,number,number];retract:number;paperExit:number;pointExit:number};
export const defaultTiming:DocumentTiming={enter:0,park:1.4,items:[2.5,4.8,7.1],retract:9,paperExit:9.2,pointExit:9.65};
const esc=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const ease = (x:number) => {const p=clamp(x);return p*p*(3-2*p);};
const at = (t:number,start:number,duration:number) => ease((t-start)/duration);
const mix = (a:number,b:number,p:number) => a+(b-a)*p;
export function renderDocumentKeyPoints(frame:number,fps:number,content:DocumentContent,timing:DocumentTiming=defaultTiming) {
  const t=frame/fps, enter=at(t,timing.enter,.65), park=at(t,timing.park,.9), paperExit=at(t,timing.paperExit,.5);
  const scale=mix(1,.79,park), x=mix(590,165,park), y=mix(135,168,park)+24*(1-enter);
  const starts=timing.items;
  const titles=content.items.map(item=>esc(item.title));
  const details=content.items.map(item=>esc(item.detail));
  const labels=content.items.map(item=>esc(item.label));
  const source=content.items.map(item=>esc(item.source));
  let rows='', points='', links='';
  for(let i=0;i<3;i++) {
    const sy=300+i*154, py=295+i*226;
    const active=at(t,starts[i],.3)*(1-at(t,i===2?timing.retract+.1:starts[i+1],.3));
    const retract=at(t,timing.retract+i*.06,.32), pointExit=at(t,timing.pointExit+i*.12,.6);
    const arrival=at(t,starts[i]+.16,.52), reveal=at(t,starts[i]+.48,.48), detail=at(t,starts[i]+.8,.4);
    rows+=`<g><rect x="42" y="${sy-48}" width="676" height="126" rx="7" fill="#E7AF59" opacity="${active*.18}"/><rect x="42" y="${sy-48}" width="4" height="126" fill="#B1762E" opacity="${active}"/><text x="68" y="${sy}" font-size="31" font-weight="650" fill="#23463D">${labels[i]}</text><text x="68" y="${sy+47}" font-size="25" fill="#65746C">${source[i]}</text><circle cx="734" cy="${sy+4}" r="6" fill="#B1762E" opacity="${arrival*(1-retract)}"/></g>`;
    const lx=x+734*scale, ly=y+(sy+4)*scale;
    const path=`M ${lx} ${ly} C 812 ${ly}, 824 ${py}, 923 ${py}`;
    links+=`<path d="${path}" pathLength="1" fill="none" stroke="#B1762E" stroke-width="2" stroke-dasharray="1" stroke-dashoffset="${1-arrival+retract}" opacity="${arrival*(1-retract)*mix(.65,.2,at(t,starts[i]+1.6,.5))}"/>`;
    points+=`<g opacity="${reveal*(1-pointExit)}" transform="translate(${18*(1-reveal)+48*pointExit} ${-16*pointExit})"><circle cx="944" cy="${py}" r="26" fill="#23463D"/><text x="944" y="${py+8}" text-anchor="middle" font-size="23" fill="#FFFDF8" font-family="Arial">0${i+1}</text><text x="1008" y="${py+15}" font-size="49" font-weight="650" fill="#203D34">${titles[i]}</text><text x="1008" y="${py+74}" font-size="29" fill="#68746A" opacity="${detail}">${details[i]}</text><path d="M1008 ${py+117} H1680" stroke="#203D34" stroke-opacity=".12"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1920 1080"><defs><filter id="paper-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#263C30" flood-opacity=".09"/></filter></defs><rect width="1920" height="1080" fill="#F5F3ED"/><g font-family="'PingFang SC','Microsoft YaHei',sans-serif" opacity="${enter}"><g opacity="${1-paperExit}" transform="translate(${x-210*paperExit} ${y+32*paperExit}) rotate(${-4*paperExit} 380 400) scale(${scale*(1-.06*paperExit)})"><path d="M16 20 H734 L774 60 V804 Q774 820 758 820 H16 Q0 820 0 804 V36 Q0 20 16 20Z" fill="#E8E5DC"/><path d="M16 0 H704 L760 56 V784 Q760 800 744 800 H16 Q0 800 0 784 V16 Q0 0 16 0Z" fill="#FFFDF8" stroke="#DADDD3" stroke-width="1.5" filter="url(#paper-shadow)"/><path d="M704 0 V42 Q704 56 718 56 H760" fill="#EFECE3" stroke="#DADDD3" stroke-width="1.5"/><circle cx="28" cy="220" r="6" fill="#E4E4DB"/><circle cx="28" cy="580" r="6" fill="#E4E4DB"/><path d="M68 80 H120" stroke="#B1762E" stroke-width="6"/><text x="68" y="151" font-size="46" font-weight="650" fill="#23463D">${esc(content.name)}</text><text x="68" y="200" font-size="23" fill="#7C8378">${esc(content.description)}</text><path d="M68 236 H694" stroke="#DDE0D6"/>${rows}<path d="M68 739 H694" stroke="#DDE0D6"/><text x="68" y="777" font-size="19" fill="#90978A">${esc(content.footer)}</text><text x="694" y="777" text-anchor="end" font-size="19" fill="#90978A">${esc(content.page)}</text></g>${links}${points}</g></svg>`;
}
