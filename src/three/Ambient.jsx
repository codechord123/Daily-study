// 별 주변 효과: 반딧불·눈·꽃잎·비눗방울·단풍잎이 별 둘레를 천천히 떠다닌다
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { dotTexture } from './Sparks';

export default function Ambient({ type, color, radius }) {
  const pts = useRef();
  const n = type === 'bubbles' ? 26 : 60;
  const { geo, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seeds = Array.from({ length: n }, () => ({
      r: radius * (1.08 + Math.random() * 0.55),
      a: Math.random() * Math.PI * 2,
      b: (Math.random() - 0.5) * Math.PI,
      s: 0.05 + Math.random() * 0.15,
      ph: Math.random() * 10,
    }));
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, seeds };
  }, [n, radius]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = geo.attributes.position.array;
    seeds.forEach((s, i) => {
      // 눈·꽃잎·잎은 위에서 아래로 살랑, 나머지는 둥실둥실 돈다
      const falling = type === 'snow' || type === 'petals' || type === 'leaves';
      const a = s.a + t * s.s * (falling ? 0.4 : 1);
      const b = falling ? ((s.b + Math.PI / 2 - t * s.s * 0.6) % Math.PI + Math.PI) % Math.PI - Math.PI / 2 : s.b + Math.sin(t * 0.7 + s.ph) * 0.2;
      const r = s.r + Math.sin(t * 1.3 + s.ph) * 0.06;
      p[i * 3] = Math.cos(b) * Math.sin(a) * r;
      p[i * 3 + 1] = Math.sin(b) * r;
      p[i * 3 + 2] = Math.cos(b) * Math.cos(a) * r;
    });
    geo.attributes.position.needsUpdate = true;
    if (pts.current && type === 'fireflies') pts.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial
        color={new THREE.Color(color).multiplyScalar(type === 'fireflies' ? 2 : 1.2)}
        size={type === 'bubbles' ? 0.22 : type === 'fireflies' ? 0.13 : 0.1}
        map={dotTexture()}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={type === 'fireflies' || type === 'bubbles' ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}
