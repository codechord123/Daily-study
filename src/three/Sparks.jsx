// 반짝이 폭발: trigger 값이 바뀔 때마다 한 번 터진다
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const COUNT = 48;

// 부드러운 원형 점 텍스처 (한 번만 생성)
let dotTex;
function dotTexture() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

export default function Sparks({ trigger, colors = ['#ffd76a', '#ff7ad9', '#6ff3ff', '#ffffff'], power = 1, size = 0.12, life = 1.1, ...props }) {
  const points = useRef();
  const state = useRef({ t: Infinity, vel: new Float32Array(COUNT * 3) });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    const col = new Float32Array(COUNT * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      tmp.set(colors[i % colors.length]);
      col.set([tmp.r * 2, tmp.g * 2, tmp.b * 2], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [colors]);

  useEffect(() => {
    if (!trigger) return;
    const s = state.current;
    s.t = 0;
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      // 위쪽으로 치우친 구 방향으로 흩어진다
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * 0.9 + 0.1;
      const sp = (1.2 + Math.random() * 1.8) * power;
      s.vel[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * sp;
      s.vel[i * 3 + 1] = v * sp * 1.2;
      s.vel[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * sp;
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
    }
    geo.attributes.position.needsUpdate = true;
  }, [trigger, geo, power]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!points.current) return;
    if (s.t > life) {
      points.current.visible = false;
      return;
    }
    points.current.visible = true;
    s.t += dt;
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      s.vel[i * 3 + 1] -= 2.2 * dt * power; // 살짝 떨어진다
      s.vel[i * 3] *= 0.97;
      s.vel[i * 3 + 2] *= 0.97;
      pos[i * 3] += s.vel[i * 3] * dt;
      pos[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
    }
    geo.attributes.position.needsUpdate = true;
    points.current.material.opacity = Math.max(0, 1 - s.t / life);
  });

  return (
    <points ref={points} geometry={geo} visible={false} {...props}>
      <pointsMaterial
        size={size * power}
        map={dotTexture()}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}
