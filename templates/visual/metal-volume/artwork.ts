import {angleAtFrame} from './motion';
// Same original material model as artwork.mjs, evaluated on the GPU for playback.
const fragment=`precision highp float;
uniform float yaw;
float gaussian(float x){return exp(-x*x);}
float sq(float x){return x*x;}
void main(){
 vec2 p=vec2(gl_FragCoord.x-.5,1080.-gl_FragCoord.y-.5);
 vec2 d=(p-vec2(1000.,524.))/330.;float rr=dot(d,d);
 float atmosphere=exp(-sq((p.x-860.)/620.)-sq((p.y-370.)/470.));
 float floorShadow=exp(-sq((p.x-1000.)/310.)-sq((p.y-937.)/35.));
 vec3 bg=(vec3(5.,10.,19.)+vec3(8.,16.,24.)*atmosphere)*(1.-.55*floorShadow);
 float pool=exp(-sq((p.x-1000.)/380.)-sq((p.y-923.)/12.));
 bg+=pool*vec3(4.,7.,10.);vec3 color=bg/255.;
 if(rr<1.){
  float z=sqrt(1.-rr);vec3 n=vec3(d,z);
  vec3 material=vec3(cos(yaw)*d.x-sin(yaw)*z,d.y,sin(yaw)*d.x+cos(yaw)*z);
  float latitude=dot(material,normalize(vec3(.32,.85,.41)));
  float longitude=atan(material.z,material.x);
  float grain=sin(latitude*850.+sin(longitude*13.)*.22);
  float micro=sin(dot(material,vec3(713.,911.,419.)));
  float texture=.99+.006*grain+.004*micro;
  float diffuse=max(0.,dot(n,normalize(vec3(-.65,-.7,1.1))));
  vec3 reflection=vec3(2.*z*d,2.*z*z-1.);
  float softbox=exp(-sq(reflection.x+.58)/.13-sq(reflection.y+.62)/.48-sq(reflection.z-.47)/.7);
  float softEdge=exp(-sq(reflection.x+.28)/.055-sq(reflection.y+.72)/.7-sq(reflection.z-.48)/.9);
  float amber=pow(max(0.,dot(reflection,normalize(vec3(.9,.25,.45)))),34.);
  float rightEdge=pow(1.-z,3.)*max(0.,d.x)*.7;
  float groove=max(gaussian((latitude+.55)/.0045),max(gaussian((latitude-.12)/.0045),gaussian((latitude-.57)/.0045)));
  float bevel=gaussian((latitude-.131)/.006)*.045*diffuse;
  float bands=.88+.12*cos(latitude*8.);
  vec3 v=(vec3(.018,.025,.038)+pow(diffuse,1.7)*vec3(.20,.23,.27))*bands*texture;
  v+=softbox*vec3(.67,.72,.78)+softEdge*vec3(.13,.14,.15);
  v+=amber*vec3(.45,.24,.075)+rightEdge*vec3(.08,.12,.17)+vec3(bevel);
  v*=1.-.68*groove;
  color=mix(color,pow(clamp(v,0.,1.),vec3(1./2.2)),clamp((1.-sqrt(rr))*330.,0.,1.));
 }
 gl_FragColor=vec4(color,1.);
}`;
const contexts=new WeakMap<HTMLCanvasElement,{gl:WebGLRenderingContext;yaw:WebGLUniformLocation|null}>();
export function drawMetalFrame(canvas:HTMLCanvasElement,frame:number,fps=30){
 let state=contexts.get(canvas);
 if(!state){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('此预览需要启用 WebGL。');
  const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)!);return s};
  const program=gl.createProgram()!;
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)!);
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  state={gl,yaw:gl.getUniformLocation(program,'yaw')};contexts.set(canvas,state);
 }
 state.gl.viewport(0,0,1920,1080);state.gl.uniform1f(state.yaw,angleAtFrame(frame,fps));state.gl.drawArrays(state.gl.TRIANGLES,0,6);
}
