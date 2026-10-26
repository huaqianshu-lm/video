export const cycleSeconds=24;
export function angleAtFrame(frame:number,fps=30){
 const period=cycleSeconds*fps;
 return ((frame%period)+period)%period/period*Math.PI*2;
}
