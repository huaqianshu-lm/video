import {readFileSync,writeFileSync} from 'node:fs';
const glyphs=JSON.parse(readFileSync(new URL('./glyphs.json',import.meta.url),'utf8'));
// Match the supplied title's proportions and placement; no added cuts or background ornaments.
const scale=2.4,left=(1920-492*scale)/2,top=330;
const referenceBoxes=[{x:72,y:62,w:41,h:47},{x:132,y:40,w:96,h:94},{x:233,y:44,w:77,h:91},{x:328,y:62,w:41,h:47},{x:384,y:40,w:101,h:93},{x:480,y:42,w:84,h:91}];
const beamY=top+137*scale,flareX=left+(301-72)*scale;
const letters=glyphs.map((g,i)=>{
 const box=referenceBoxes[i],sx=box.w*scale/g.width,sy=box.h*scale/g.height;
 const x=left+(box.x-72)*scale-g.minX*sx,y=top+(box.y+box.h)*scale+g.minY*sy;
 const face=i<4?'url(#whiteFace)':'url(#greenFace)',side=i<4?'#476578':'#286b62';
 return `<g id="char${i}" aria-label="${g.char}" transform="translate(${x} ${y}) scale(${sx} ${-sy})">
 <path d="${g.d}" transform="translate(1.5 -2)" fill="${side}"/>
 <path d="${g.d}" fill="${face}" stroke="${i<4?'#edfaff':'#c8fff0'}" stroke-opacity=".15" stroke-width=".5"/>
 </g>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
<defs>
<radialGradient id="env" cx="52%" cy="50%" r="75%"><stop stop-color="#082030"/><stop offset=".5" stop-color="#051522"/><stop offset="1" stop-color="#020c16"/></radialGradient>
<linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="140" x2="1780" y1="${beamY}" y2="${beamY}"><stop stop-color="#50d9e7" stop-opacity="0"/><stop offset=".17" stop-color="#79f6f5" stop-opacity=".65"/><stop offset=".47" stop-color="#b7ffff" stop-opacity="1"/><stop offset=".7" stop-color="#65ece6" stop-opacity=".85"/><stop offset=".88" stop-color="#53d6d3" stop-opacity=".45"/><stop offset="1" stop-color="#50d9e7" stop-opacity="0"/></linearGradient>
<radialGradient id="flare"><stop stop-color="#e7ffff" stop-opacity="1"/><stop offset=".16" stop-color="#a9ffff" stop-opacity=".9"/><stop offset=".4" stop-color="#42e4f6" stop-opacity=".4"/><stop offset="1" stop-color="#37cfe9" stop-opacity="0"/></radialGradient>
<linearGradient id="whiteFace" x1="0" y1="1" x2=".2" y2="0"><stop stop-color="#faffff"/><stop offset=".29" stop-color="#eef9ff"/><stop offset=".33" stop-color="#bcd8eb"/><stop offset=".53" stop-color="#e6f5ff"/><stop offset=".58" stop-color="#b2d4ee"/><stop offset="1" stop-color="#aacfe9"/></linearGradient>
<linearGradient id="greenFace" x1="0" y1="1" x2=".12" y2="0"><stop stop-color="#c2ffec"/><stop offset=".33" stop-color="#98efda"/><stop offset=".37" stop-color="#7bd9c5"/><stop offset=".65" stop-color="#a7f5e1"/><stop offset="1" stop-color="#78d8c5"/></linearGradient>
</defs>
<rect width="1920" height="1080" fill="url(#env)"/>
<g id="title">${letters}</g>
<g id="baseline"><path d="M140 ${beamY}H1780" stroke="url(#beam)" stroke-width="12" opacity=".05"/>
<path d="M140 ${beamY}H1780" stroke="url(#beam)" stroke-width="5" opacity=".15"/>
<path d="M140 ${beamY}H1780" stroke="url(#beam)" stroke-width="2"/>
<ellipse cx="${flareX}" cy="${beamY}" rx="225" ry="9" fill="url(#flare)" opacity=".9"/>
<ellipse cx="${flareX}" cy="${beamY}" rx="62" ry="26" fill="url(#flare)" opacity=".75"/>
<ellipse cx="${flareX}" cy="${beamY}" rx="25" ry="9" fill="url(#flare)"/>
<ellipse cx="${flareX}" cy="${beamY}" rx="3" ry="12" fill="url(#flare)"/>
</g>
</svg>`;
writeFileSync(new URL('./scene.ts',import.meta.url),`export const artwork=${JSON.stringify(svg)};\nexport const layout=${JSON.stringify({beamY,flareX,centers:referenceBoxes.map(b=>({x:left+(b.x-72+b.w/2)*scale,y:top+(b.y+b.h/2)*scale})),boxes:referenceBoxes.map(b=>({x:left+(b.x-72)*scale,y:top+b.y*scale,width:b.w*scale,height:b.h*scale}))})};\n`);
