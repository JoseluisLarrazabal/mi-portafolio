// GLSL ported from the approved prototype. Every fragment ends with the tonemapping/colorspace
// chunks so the same shaders look right with the composer (no-ops) and without it (quality low).
const OUT = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n'

export const NOISE = /* glsl */ `
float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`

export const nebulaVert = /* glsl */ `varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
export const nebulaFrag =
  NOISE +
  /* glsl */ `varying vec3 vD;void main(){
  vec3 d=normalize(vD);
  float band=exp(-pow(dot(d,normalize(vec3(.3,.8,-.5)))*3.0,2.));
  float n=fbm(d*2.4)*fbm(d*5.0+3.);
  vec3 c=mix(vec3(.02,.04,.12),vec3(.12,.04,.16),fbm(d*1.6+9.));
  c*=band*smoothstep(.12,.55,n)*.38;
  gl_FragColor=vec4(c,1.);
  ${OUT}}`

export const starVert = /* glsl */ `attribute float aSize;attribute vec3 aColor;varying vec3 vC;uniform float uPR;void main(){vC=aColor;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uPR;}`
export const starFrag = /* glsl */ `varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=1.-smoothstep(.05,.5,d);gl_FragColor=vec4(vC,a*a);${OUT}}`

export const atmoVert = /* glsl */ `varying vec3 vNv;varying vec3 vNw;varying vec3 vW;void main(){vNv=normalize(normalMatrix*normal);vNw=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`
export const atmoFrag = /* glsl */ `uniform vec3 uC;uniform float uI;varying vec3 vNv;varying vec3 vNw;varying vec3 vW;void main(){
  float a=-dot(normalize(vNv),vec3(0.,0.,1.));float k=pow(clamp(a/.55,0.,1.),2.2);
  float lit=.18+.82*smoothstep(-.35,.5,dot(normalize(vNw),normalize(-vW)));
  gl_FragColor=vec4(uC*uI,k*lit);
  ${OUT}}`

export const sunVert = /* glsl */ `varying vec3 vObj;varying vec3 vNv;void main(){vObj=position;vNv=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
export const sunFrag =
  NOISE +
  /* glsl */ `uniform float uTime;varying vec3 vObj;varying vec3 vNv;void main(){
  vec3 p=normalize(vObj);float t=uTime*.05;
  float n1=fbm(p*3.+vec3(t,0.,t*.7));float n2=fbm(p*9.-vec3(0.,t*2.,0.)+n1*2.);
  float h=clamp(n1*.7+n2*.55,0.,1.);
  vec3 c=mix(vec3(.85,.16,.02),vec3(1.,.55,.12),smoothstep(.25,.62,h));
  c=mix(c,vec3(1.,.9,.65),smoothstep(.72,.95,h));
  float mu=max(dot(normalize(vNv),vec3(0.,0.,1.)),0.);
  c*=.5+.5*pow(mu,.6);gl_FragColor=vec4(c*1.45,1.);
  ${OUT}}`

export const planetVert = /* glsl */ `varying vec3 vObj;varying vec3 vNw;varying vec3 vW;void main(){vObj=position;vNw=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`
export const planetFrag =
  NOISE +
  /* glsl */ `uniform vec3 uBase,uAccent,uAtmo;uniform float uStyle,uSeed,uGain;varying vec3 vObj;varying vec3 vNw;varying vec3 vW;
void main(){
  vec3 p=normalize(vObj);float n;
  if(uStyle<.5){float w=fbm(p*2.5+uSeed)*.5;float bnd=sin((p.y+w)*16.)*.5+.5;n=mix(bnd,fbm(p*7.+uSeed),.4);}
  else if(uStyle<1.5){float f=fbm(p*3.2+uSeed);n=smoothstep(.35,.7,f);n=mix(n,fbm(p*16.),.25);}
  else{vec3 q=p*2.2;vec3 w=vec3(fbm(q+uSeed),fbm(q+vec3(5.2,1.3,2.8)),fbm(q+vec3(1.7,9.2,3.4)));n=smoothstep(.2,.8,fbm(q+w*2.2));}
  vec3 alb=mix(uBase,uAccent,clamp(n,0.,1.))*uGain;
  vec3 L=normalize(-vW),N=normalize(vNw),V=normalize(cameraPosition-vW);
  float ndl=dot(N,L);float dif=smoothstep(-.05,.9,ndl);
  float fres=pow(1.-max(dot(N,V),0.),3.);float lit=smoothstep(-.25,.55,ndl);
  vec3 c=alb*(.09+1.2*dif)+uAtmo*fres*(.1+1.25*lit);
  gl_FragColor=vec4(c,1.);
  ${OUT}}`

export const ringVert = /* glsl */ `varying vec3 vL;varying vec3 vNw;varying vec3 vW;void main(){vL=position;vNw=normalize(mat3(modelMatrix)*vec3(0.,0.,1.));vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`
export const ringFrag = /* glsl */ `uniform vec3 uC;uniform float uIn,uOut;varying vec3 vL;varying vec3 vNw;varying vec3 vW;void main(){
  float r=(length(vL.xy)-uIn)/(uOut-uIn);
  float d=.5+.5*sin(r*70.+sin(r*17.)*2.);d=mix(.25,1.,d)*smoothstep(0.,.07,r)*smoothstep(1.,.86,r);
  float lit=.35+.65*abs(dot(normalize(vNw),normalize(-vW)));
  gl_FragColor=vec4(uC*lit*1.05,d*.8);
  ${OUT}}`
