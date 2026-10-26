const smooth = (frame:number,start:number,length:number) => {const t=Math.max(0,Math.min(1,(frame-start)/length));return t*t*(3-2*t);};
const lerp = (a:number,b:number,t:number) => a+(b-a)*t;
const esc = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export type Phase = 'write'|'network'|'enforce'|'approval'|'claim'|'closed'|'reassure'|'noPrompt'|'return'|'damage'|'final';
export type MotionTiming = {fps:number;events:Record<Phase,number>};
export type MotionContent = {
  scopeLabel:string;
  permissionLabel:string;
  pendingLabel:string;
  claimLabel:string;
  summaries:Partial<Record<Phase,string>>;
  showPermission?:boolean;
};
/** Authored SVG motion, with caller-supplied content and local-frame anchors. */
export function renderBoundaryPermission(frame:number,timing:MotionTiming,content:MotionContent):string {
 const ease=(f:number,start:number,length=24)=>smooth(f,start,length*timing.fps/30);
 const e=timing.events, build=ease(frame,0),write=ease(frame,e.write,26),network=ease(frame,e.network,30),enforce=ease(frame,e.enforce,28),approval=ease(frame,e.approval,28),back=ease(frame,e.noPrompt,40),damage=ease(frame,e.damage,28);
 const request=ease(frame,e.approval+28*timing.fps/30,44),claim=ease(frame,e.claim,24),closed=ease(frame,e.closed,20),pair=ease(frame,e.reassure,35)*(1-back),secondWrite=ease(frame,e.return,26);
 const paperOpacity=lerp(1,.45,approval)*(1-back)+back;
 const permissionOpacity=content.showPermission===false?0:lerp(.12,1,approval)*(1-back)+.18*back;
 const tokenX=lerp(lerp(lerp(380,470,write),953,network),470,back);
 const phase:Phase=frame>=e.final?'final':frame>=e.damage?'damage':frame>=e.return?'return':frame>=e.noPrompt?'noPrompt':frame>=e.reassure?'reassure':frame>=e.closed?'closed':frame>=e.claim?'claim':frame>=e.approval?'approval':frame>=e.enforce?'enforce':frame>=e.network?'network':'write';
 const note=frame<e.write?'':esc(content.summaries[phase]??'');
 const noteStart=frame>=e.final?e.final:frame>=e.damage?e.damage:frame>=e.return?e.return:frame>=e.noPrompt?e.noPrompt:frame>=e.reassure?e.reassure:frame>=e.closed?e.closed:frame>=e.claim?e.claim:frame>=e.approval?e.approval:frame>=e.enforce?e.enforce:frame>=e.network?e.network:e.write;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" style="display:block;width:100%;height:100%">
 <defs><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#E8EDE2"/><stop offset="1" stop-color="#D4DDD1"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#203E35" flood-opacity=".12"/></filter></defs>
 <rect width="1920" height="1080" fill="#F7F5EF"/>
 <g font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#183D33">
 <g opacity="${build}" transform="translate(0 ${12*(1-build)})">
 <path d="M206 705L346 749H1110L1030 705Z" fill="#193E34" opacity=".16"/>
 <rect x="206" y="327" width="864" height="395" rx="35" fill="url(#floor)" filter="url(#shadow)"/>
 <rect x="206" y="327" width="864" height="395" rx="35" fill="none" stroke="#205445" stroke-width="5"/>
 <path d="M242 652H1004" stroke="#BCD0BF" stroke-width="2"/>
 <text x="252" y="393" font-size="30" fill="#5C7868">${esc(content.scopeLabel)}</text>
 <g opacity="${paperOpacity}"><path d="M555 380H690L730 420V620H555Z" fill="#FFFDF7" stroke="#213E38" stroke-width="3"/><path d="M690 380V420H730" fill="none" stroke="#213E38" stroke-width="3"/>
 <path d="M584 464h110m-110 30h86m-86 30h98" stroke="#BBC9BF" stroke-width="8" opacity="${1-damage}"/>
 <path d="M584 555h102" stroke="#205445" stroke-width="8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-write}" opacity="${1-damage}"/>
 <path d="M584 585h74" stroke="#205445" stroke-width="8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-secondWrite}" opacity="${back*(1-damage)}"/>
 <path d="M625 380L609 441L642 467L616 526L657 559L643 620" stroke="#B44730" stroke-width="7" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-damage}"/>
 <path d="M669 530l57 10-10 65-57-10z" fill="#FFFDF7" stroke="#B44730" stroke-width="3" opacity="${damage}" transform="translate(${damage*14} ${damage*25}) rotate(${damage*12} 700 560)"/></g>
 <path d="M1008 382v285" stroke="#205445" stroke-width="${15+7*enforce}"/>
 <path d="M1008 485v72" stroke="#F7F5EF" stroke-width="21"/>
 <path d="M1008 485v72" stroke="#205445" stroke-width="9" opacity="${network}"/>
 <g opacity="${network*(1-approval)}">
 <path d="M1015 445L1155 320" stroke="#BEC7BB" stroke-width="3" stroke-dasharray="8 10"/>
 <circle cx="1190" cy="290" r="47" fill="#FFFCF5" stroke="#93A898" stroke-width="3"/>
 <ellipse cx="1190" cy="290" rx="19" ry="40" fill="none" stroke="#93A898" stroke-width="3"/><path d="M1146 290h88m-78-20h68m-68 40h68" stroke="#93A898" stroke-width="3"/>
 <circle cx="1008" cy="521" r="${12+12*enforce}" fill="#F7F5EF" stroke="#205445" stroke-width="4"/>
 <path d="M998 511l20 20m0-20l-20 20" stroke="#205445" stroke-width="4" opacity="${enforce}"/>
 </g>
 <path d="M1008 521H1310" stroke="#BB8637" stroke-width="4" stroke-dasharray="9 10" opacity="${approval*(1-back)}"/>
 <g opacity="${approval*(1-back)}" transform="translate(${lerp(1090,1270,request)} 521)"><path d="M-20-27H10L20-17V27H-20Z" fill="#FFFCF5" stroke="#BB8637" stroke-width="3"/><path d="M-10-3h20m-20 13h15" stroke="#BB8637" stroke-width="3"/></g>
 <g opacity="${permissionOpacity}" transform="translate(${16*(1-approval)} 0)">
 <rect x="1310" y="385" width="400" height="280" rx="14" fill="#FFFCF5" stroke="#D4BC8C" stroke-width="2" filter="url(#shadow)"/>
 <rect x="1310" y="385" width="12" height="280" rx="6" fill="#B68132"/>
 <text x="1358" y="447" font-size="32" fill="#8C632B">${esc(content.permissionLabel)}</text><path d="M1358 475H1660" stroke="#E4D7BE" stroke-width="2"/>
 <path d="M1485 539v-26a25 25 0 0 1 50 0v26" fill="none" stroke="#A47430" stroke-width="6"/><rect x="1473" y="539" width="75" height="62" rx="8" fill="#E6D3AF"/><circle cx="1510" cy="567" r="6" fill="#986E32"/>
 <text x="1605" y="575" text-anchor="middle" font-size="29" fill="#8C632B" opacity="${request}">${esc(content.pendingLabel)}</text>
 <path d="M1338 619H1680" stroke="#A47430" stroke-width="${3+3*closed}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-ease(frame,e.claim+24*timing.fps/30,34)}"/>
 <g opacity="${claim}" transform="translate(0 ${18*(1-claim)})"><rect x="1340" y="685" width="340" height="63" rx="8" fill="#EAE8DC"/><text x="1510" y="727" text-anchor="middle" font-size="30" fill="#687064">${esc(content.claimLabel)}</text>
 <path d="M1510 684V654" stroke="#A47430" stroke-width="3"/><path d="M1501 663l9-9 9 9" fill="none" stroke="#A47430" stroke-width="3"/>
 <path d="M1479 643h62" stroke="#A47430" stroke-width="6" opacity="${closed}"/></g>
 </g>
 <path d="M1008 727V773H1510V752" fill="none" stroke="#547468" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-pair}" opacity="${1-back}"/>
 <path d="M519 526H555" stroke="#B44730" stroke-width="4" opacity="${damage}"/>
 <g transform="translate(${tokenX} 526)"><circle r="49" fill="#1C493C"/><circle r="41" fill="none" stroke="#688E77" stroke-width="2"/><path d="M-17-11l13 11-13 11m22 2h17" fill="none" stroke="#F6F3E7" stroke-width="5" stroke-linecap="round"/></g>
 </g>
 <text x="128" y="847" font-size="37" fill="#52685D" opacity="${ease(frame,noteStart,10)}">${note}</text>

 </g></svg>`;
}
