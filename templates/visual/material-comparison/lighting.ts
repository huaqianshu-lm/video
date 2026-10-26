// Original screen-space lighting study, shared by static and moving composition.
export const lightingDefs=`
<filter id="haloSoft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="24"/></filter>
<filter id="haloBand" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="haloEdge" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`;
export function haloSvg(x:number,y:number,r:number,color:string,opacity=1){
 return `<g opacity="${opacity}" fill="none">
 <circle cx="${x}" cy="${y}" r="${r+12}" stroke="${color}" stroke-width="40" opacity=".34" filter="url(#haloSoft)"/>
 <circle cx="${x}" cy="${y}" r="${r+5}" stroke="${color}" stroke-width="16" opacity=".42" filter="url(#haloBand)"/>
 <circle cx="${x}" cy="${y}" r="${r+1}" stroke="${color}" stroke-width="3.5" opacity=".7" filter="url(#haloEdge)"/>
 </g>`;
}
export function metalShadowSvg(x:number,y:number,r:number){
 return `<defs><radialGradient id="metalShade" gradientUnits="userSpaceOnUse" cx="${x-r*.5}" cy="${y-r*.5}" r="${r*1.72}">
 <stop offset="0" stop-color="#020812" stop-opacity="0"/><stop offset=".35" stop-color="#020812" stop-opacity="0"/>
 <stop offset=".7" stop-color="#020812" stop-opacity=".18"/><stop offset="1" stop-color="#020812" stop-opacity=".65"/>
 </radialGradient></defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#metalShade)"/>`;
}
export function drawMetalShadow(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
 const shade=ctx.createRadialGradient(x-r*.5,y-r*.5,0,x-r*.5,y-r*.5,r*1.72);
 shade.addColorStop(0,'rgba(2,8,18,0)');shade.addColorStop(.35,'rgba(2,8,18,0)');
 shade.addColorStop(.7,'rgba(2,8,18,.18)');shade.addColorStop(1,'rgba(2,8,18,.65)');
 ctx.fillStyle=shade;ctx.fillRect(x-r,y-r,r*2,r*2);
}
