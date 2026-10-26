import {baseSvg} from './scene';
export const metadata={id:'OperationFeedbackStudy',width:1920,height:1080,fps:30,durationInFrames:234};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const phase=(t:number,a:number,b:number)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x)};
const mix=(a:number,b:number,x:number)=>a+(b-a)*x;
const text=(x:number,y:number,s:string,size=23,fill='#c4d5e3',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
export function stateAtFrame(frame:number,fps=30){
 const t=frame/fps,stopped=t>=1.7,changed=t>=2.5,applied=t>=3.4;
 const allocation=Array.from({length:4},(_,i)=>applied&&t>=3.94+i*.07);
 const active=stopped?(applied?allocation.filter(Boolean).length:0):2;
 return {t,entry:phase(t,0,.55),stopped,changed,applied,active,waiting:8-active,
  configured:changed?4:2,workers:applied?4:2,
  rowExpansion:phase(t,3.4,3.85),allocation};
}
const replaceText=(svg:string,id:string,value:string|number)=>svg.replace(new RegExp(`(<text[^>]*id="${id}"[^>]*>)[^<]*(</text>)`),(_,a,b)=>`${a}${value}${b}`);
export function renderSvg(frame:number,fps=30){
 const s=stateAtFrame(frame,fps),t=s.t;
 let svg=baseSvg;
 const initial=!s.stopped;
 const rect=(x:number,y:number,w:number,h:number,rx:number,fill:string,stroke='#2a3a4c')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
 const rowYs=s.applied?[338,443,mix(443,548,s.rowExpansion),mix(443,653,s.rowExpansion)]:[338,443];
 let rows='';
 for(let i=0;i<s.workers;i++){
  const y=rowYs[i],on=initial?i<2:s.allocation[i];
  const p=initial?Math.min(.58,.08+Math.max(0,t-.4)*[.34,.24][i]):on?Math.min(.84,.05+Math.max(0,t-(4.16+i*.07))*[.31,.25,.35,.22][i]):0;
  const opacity=i>=2?s.rowExpansion:1;
  const arrival=on&&!initial?phase(t,3.94+i*.07,4.16+i*.07):1;
  rows+=`<g opacity="${opacity}">${text(800,y+5,`W${i+1}`,23,'#7c98ac','font-family="monospace"')}<circle cx="852" cy="${y-3}" r="4" fill="${on?'#7ce0ce':'#425c72'}"/>${rect(881,y-33,632,62,9,'#102332','#214456')}
   ${on?`<g transform="translate(0 ${mix(35,0,arrival)})" opacity="${arrival}">${rect(882,y-32,632*p,60,8,'url(#active)','#357568')}<path d="M${882+632*p} ${y-28}V${y+23}" stroke="#8ee5d5" stroke-width="2"/>${text(905,y+5,`task-0${i+1}`,23,'#d2ebe9','font-family="monospace"')}${text(1488,y+5,'运行中',20,'#93cfca','text-anchor="end"')}</g>`:text(905,y+5,'等待分配',21,'#4e697f')}
  </g>`;
 }
 svg=svg.replace(/<g id="tasks">[\s\S]*?<\/g>\s*<path d="M773 736H1680"/,`<g id="tasks">${rows}</g><path d="M773 736H1680"`);
 // All waiting jobs are visible; compact arrangement accommodates 8 without clipping.
 const queueStart=initial?3:s.applied?s.active+1:1;
 let queue='';
 for(let i=queueStart;i<=8;i++){
  const index=i-queueStart,x=880+(index%4)*164,y=initial||!s.applied?784+Math.floor(index/4)*55:812;
  queue+=rect(x,y,147,47,7,'#152334')+text(x+73.5,y+30,`task-0${i}`,19,'#798fa5','text-anchor="middle" font-family="monospace"');
 }
 // During allocation, eight waiting items reduce to four over only four short steps.
 // Keep two rows until the fourth assignment to retain readable geometry.
 if(s.applied&&s.active<4){
  queue='';for(let i=s.active+1;i<=8;i++){const n=i-s.active-1,x=880+n%4*164,y=784+Math.floor(n/4)*55;queue+=rect(x,y,147,47,7,'#152334')+text(x+73.5,y+30,`task-0${i}`,19,'#798fa5','text-anchor="middle" font-family="monospace"')}
 }
 svg=svg.replace(/<g id="queue">[\s\S]*?<\/g>/,`<g id="queue">${queue}</g>`);
 svg=replaceText(svg,'configValue',s.configured);
 svg=replaceText(svg,'buttonLabel',initial?'停止任务':'运行任务');
 if(initial)svg=svg.replace('id="buttonIcon" d="M317 674L317 695L334 684Z"','id="buttonIcon" d="M317 674H336V693H317Z"');
 svg=replaceText(svg,'appliedLabel',s.changed&&!s.applied?'配置已修改 · 待运行':s.stopped&&!s.applied?'已停止 · 可修改配置':'已应用配置');
 svg=replaceText(svg,'appliedValue',`并发上限  ${s.applied?4:2}`);
 svg=replaceText(svg,'counts',`${s.active} 运行   ／   ${s.waiting} 等待`);
 svg=replaceText(svg,'workerCount',`8 TASKS  ·  ${s.workers} WORKERS`);
 svg=replaceText(svg,'status',s.active?'运行中':s.applied?'正在分配':'已停止');
 const editFocus=phase(t,1.9,2.14)*(1-phase(t,2.65,2.84));
 const pulse=(center:number,width:number)=>Math.max(0,1-Math.abs(t-center)/width);
 const buttonPulse=Math.max(pulse(1.58,.12),pulse(3.23,.13));
 let overlay=`<rect x="488" y="478" width="42" height="44" rx="5" fill="none" stroke="#ffe0a0" stroke-width="2" opacity="${editFocus}"/><path d="M525 484V514" stroke="#ffeac4" stroke-width="2" opacity="${editFocus}"/>`;
 overlay+=`<rect x="273" y="654" width="344" height="61" rx="9" fill="#c0ffed" opacity="${buttonPulse*.25}"/>`;
 let cursor;
 if(t<1.7)cursor={x:448,y:680,a:phase(t,1.05,1.32)};
 else if(t<2.75){const p=phase(t,1.78,2.08);cursor={x:mix(448,515,p),y:mix(680,500,p),a:1}}
 else{const p=phase(t,2.75,3.12);cursor={x:mix(515,448,p),y:mix(500,680,p),a:1-phase(t,3.55,3.8)}}
 overlay+=`<path d="M0 0L0 25L7 19L13 31L18 28L12 17L22 17Z" fill="#e7f4ff" stroke="#102132" stroke-width="2" transform="translate(${cursor.x} ${cursor.y})" opacity="${cursor.a}"/>`;
 svg=svg.replace('</g></svg>',`${overlay}</g></svg>`);
 // Establish from below, then retain the complete window through the final frame.
 svg=svg.replace('<g font-family="-apple-system',`<g transform="translate(0 ${mix(65,0,s.entry)})"><g font-family="-apple-system`);
 svg=svg.replace('</g></svg>','</g></g></svg>');
 svg=svg.replace('<rect x="201" y="147" width="1520" height="817"',`<rect x="201" y="${147+mix(65,0,s.entry)}" width="1520" height="817"`);
 return svg;
}
export async function drawFrame(canvas:HTMLCanvasElement,frame:number,fps=30){
 const url=URL.createObjectURL(new Blob([renderSvg(frame,fps)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<Event>((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('操作反馈画面解码失败'));img.src=url});const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');ctx.clearRect(0,0,1920,1080);ctx.drawImage(img,0,0,1920,1080)}finally{URL.revokeObjectURL(url)}
}
