import * as THREE from 'three';

// 3단 툰 그라데이션: 수채화처럼 면이 뭉개지지 않고 붓 터치처럼 끊어지게
let gradient;
function gradientMap() {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map();

// 툰 재질 다듬기: 가장자리에 하늘빛이 받쳐 배경에서 또렷하게 떠오르고,
// 그늘진 면은 보랏빛으로 물들어 수채화처럼 (계산은 픽셀당 몇 줄이라 크롬북에서도 가볍다)
export function addRim(m) {
  if (m.userData.rim) return m;
  m.userData.rim = true;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      `{
        vec3 nV = normalize(normal);
        float facing = clamp(dot(nV, normalize(vViewPosition)), 0.0, 1.0);
        float rim = pow(1.0 - facing, 2.6);
        float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.86, 0.84, 1.08), smoothstep(0.55, 0.15, lum) * 0.5);
        gl_FragColor.rgb += vec3(0.62, 0.86, 1.0) * rim * 0.38;
      }
      #include <tonemapping_fragment>`,
    );
  };
  m.customProgramCacheKey = () => 'toon-rim';
  return m;
}

// 같은 색은 재질을 공유해서 draw 비용을 줄인다
export function toon(color) {
  const key = `t:${color}`;
  if (!cache.has(key)) cache.set(key, addRim(new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() })));
  return cache.get(key);
}

// 발밑 그림자: 가운데가 진하고 가장자리로 번지는 둥근 얼룩 (모두 같은 재질 하나)
let shadowMat;
export function blobShadow() {
  if (shadowMat) return shadowMat;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  grd.addColorStop(0.65, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  shadowMat = new THREE.MeshBasicMaterial({
    color: '#241a52', alphaMap: tex, transparent: true, opacity: 0.3, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  return shadowMat;
}

// 빛나는 재질: 블룸이 잡도록 톤매핑 제외, 밝기 1 초과
export function glow(color, intensity = 2.2) {
  const key = `g:${color}:${intensity}`;
  if (!cache.has(key)) {
    const c = new THREE.Color(color).multiplyScalar(intensity);
    cache.set(key, new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  }
  return cache.get(key);
}

export function glass() {
  const key = 'glass';
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshBasicMaterial({ color: '#d8f4ff', transparent: true, opacity: 0.22, depthWrite: false }));
  }
  return cache.get(key);
}

/* ---------- 수채화 별 표면 셰이더 ---------- */
const NOISE = /* glsl */ `
  vec3 hash3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453)*2.0-1.0; }
  float noise(vec3 p){
    vec3 i=floor(p); vec3 f=fract(p); vec3 u=f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
  }
  float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
`;

export const PATTERN_ID = { none: 0, dots: 1, stripes: 2, craters: 3, swirl: 4, stars: 5 };

export function planetMaterial(base, shade) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color(base) },
      uShade: { value: new THREE.Color(shade) },
      uLight: { value: new THREE.Vector3(0.6, 0.8, 0.5).normalize() },
      uRim: { value: new THREE.Color('#9fe9ff') },
      uHighlight: { value: 0 },
      uPattern: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView;
      void main(){
        vLocal = position;
        vec4 wp = modelMatrix * vec4(position,1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase; uniform vec3 uShade; uniform vec3 uLight; uniform vec3 uRim; uniform float uHighlight; uniform float uPattern;
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView;
      ${NOISE}
      vec3 rnd3(vec3 p){ return fract(sin(vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))))*43758.5453); }
      // 세포 노이즈: 가장 가까운 점까지 거리
      float cell(vec3 p){
        vec3 i = floor(p); vec3 f = fract(p); float d = 9.0;
        for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
          vec3 g = vec3(float(x),float(y),float(z));
          vec3 o = rnd3(i+g)*0.8+0.1;
          d = min(d, length(g+o-f));
        }
        return d;
      }
      void main(){
        vec3 n = normalize(vN);
        float pig = fbm(vLocal * 1.6);
        float pig2 = fbm(vLocal * 5.0 + 7.0);
        // 빛: 붓 경계가 일렁이도록 노이즈로 흔든 2단 계조
        float ndl = dot(n, uLight) + pig * 0.35;
        float lit = smoothstep(-0.15, 0.1, ndl) * 0.55 + smoothstep(0.45, 0.6, ndl) * 0.45;
        vec3 col = mix(uShade, uBase, lit);
        // 그늘 깊은 곳은 보랏빛, 밝은 쪽은 살짝 따뜻하게
        col = mix(col, col * vec3(0.78, 0.76, 1.0), smoothstep(0.1, -0.5, ndl) * 0.55);
        col *= mix(1.0, 1.06, smoothstep(0.3, 0.9, ndl));
        // 물감이 고인 듯한 얼룩과 테두리
        col *= 0.92 + pig2 * 0.18;
        float pool = smoothstep(0.02, 0.0, abs(fract(pig * 3.0) - 0.5) - 0.47);
        col = mix(col, uShade, pool * 0.25);
        // 무늬
        vec3 dir = normalize(vLocal);
        float lat = asin(clamp(dir.y,-1.0,1.0));
        float lon = atan(dir.x, dir.z);
        if (uPattern > 0.5 && uPattern < 1.5) {          // 물방울
          float d = cell(dir * 5.0);
          col = mix(col, uBase * 1.18 + 0.05, smoothstep(0.28, 0.22, d) * 0.8);
        } else if (uPattern > 1.5 && uPattern < 2.5) {   // 줄무늬
          float b = sin(lat * 14.0 + pig * 2.0);
          col = mix(col, uShade, smoothstep(0.3, 0.6, b) * 0.35);
        } else if (uPattern > 2.5 && uPattern < 3.5) {   // 분화구
          float d = cell(dir * 3.5);
          col = mix(col, uShade, smoothstep(0.3, 0.18, d) * 0.45);
          col = mix(col, uBase * 1.2, smoothstep(0.02, 0.0, abs(d - 0.3)) * 0.5);
        } else if (uPattern > 3.5 && uPattern < 4.5) {   // 소용돌이
          float s = sin(lat * 9.0 + lon * 3.0 + pig * 4.0);
          col = mix(col, mix(uBase, uRim, 0.35), smoothstep(0.5, 0.9, s) * 0.5);
        } else if (uPattern > 4.5) {                      // 반짝 별무늬
          float d = cell(dir * 9.0);
          col += uRim * smoothstep(0.12, 0.0, d) * 1.4;
        }

        // 물기 어린 윤기: 빛이 반사되는 자리에 부드러운 하이라이트 (둥글게 보이게)
        vec3 hv = normalize(uLight + normalize(vView));
        col += vec3(1.0, 0.97, 0.9) * pow(max(dot(n, hv), 0.0), 28.0) * 0.22 * (0.6 + pig2 * 0.8);
        // 대기 가장자리 네온
        float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 3.0);
        col += uRim * rim * (0.55 + uHighlight * 0.6);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

// 별을 감싸는 은은한 빛 무리
export function haloMaterial(color = '#7fdcff') {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vView;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower;
      varying vec3 vN; varying vec3 vView;
      void main(){
        float f = pow(max(dot(normalize(vN), normalize(vView)), 0.0), 2.5);
        gl_FragColor = vec4(uColor, f * 0.45 * uPower);
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// 우주 배경: 수채화 번짐 같은 성운
export function nebulaMaterial(colors) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDeep: { value: new THREE.Color(colors.deep) },
      uMid: { value: new THREE.Color(colors.mid) },
      uA: { value: new THREE.Color(colors.nebulaA) },
      uB: { value: new THREE.Color(colors.nebulaB) },
      uC: { value: new THREE.Color(colors.nebulaC) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep, uMid, uA, uB, uC; uniform float uTime;
      varying vec3 vDir;
      ${NOISE}
      void main(){
        vec3 d = normalize(vDir);
        float t = uTime * 0.01;
        float n1 = fbm(d * 1.8 + vec3(t, 0.0, 0.0));
        float n2 = fbm(d * 2.6 + vec3(3.1, t, 1.7));
        float n3 = fbm(d * 3.4 - vec3(1.3, 2.2, t));
        vec3 col = mix(uDeep, uMid, smoothstep(-0.4, 0.6, d.y * 0.5 + n1));
        col = mix(col, uA, smoothstep(0.08, 0.5, n2) * 0.38);
        col = mix(col, uB, smoothstep(0.12, 0.55, n3) * 0.32);
        col = mix(col, uC, smoothstep(0.25, 0.6, n1 * n2 * 4.0) * 0.22);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
}
