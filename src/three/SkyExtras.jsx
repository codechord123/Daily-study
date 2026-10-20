// 우주 하늘 꾸밈: 가끔 지나가는 별똥별, 내 별에서 멀리 보이는 친구 별들
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STARS, starPosition } from '../data/classroom';
import { getPlanet } from '../store/profileStore';
import { PLANET_TINTS } from '../theme/tokens';
import { planetMaterial, haloMaterial } from './materials';
import { auraColor } from './PlanetDeco';

/* ---------- 별똥별: 5~10초에 한 번, 하늘 먼 곳을 길게 긋고 사라진다 ---------- */
export function ShootingStars() {
  const mesh = useRef();
  const s = useRef({ next: 2 + Math.random() * 4, t: -1, from: new THREE.Vector3(), vel: new THREE.Vector3() });
  const mat = useMemo(() => {
    // 머리는 밝고 꼬리로 갈수록 투명해지는 가는 띠
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 8;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 128, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.85, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grd;
    g.fillRect(0, 2, 128, 4);
    return new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c), color: new THREE.Color('#fff4d8').multiplyScalar(2.2),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
  }, []);
  const _x = useMemo(() => new THREE.Vector3(), []);
  const _y = useMemo(() => new THREE.Vector3(), []);
  const _z = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, dt) => {
    const st = s.current;
    const m = mesh.current;
    if (!m) return;
    if (st.t < 0) {
      st.next -= dt;
      m.visible = false;
      if (st.next > 0) return;
      // 카메라가 보는 쪽 하늘 위쪽 어딘가에서 시작
      const fwd = camera.getWorldDirection(_z).clone();
      st.from.copy(fwd).multiplyScalar(60).add(new THREE.Vector3((Math.random() - 0.5) * 50, 10 + Math.random() * 15, (Math.random() - 0.5) * 50)).add(camera.position);
      st.vel.set(Math.random() - 0.5, -0.35 - Math.random() * 0.3, Math.random() - 0.5).normalize().multiplyScalar(55);
      st.t = 0;
    }
    st.t += dt / 0.9;
    if (st.t >= 1) {
      st.t = -1;
      st.next = 5 + Math.random() * 5;
      return;
    }
    m.visible = true;
    const pos = st.from.clone().addScaledVector(st.vel, st.t * 0.9);
    m.position.copy(pos);
    // 진행 방향으로 눕히고, 넓은 면이 카메라를 보게
    _x.copy(st.vel).normalize();
    _z.copy(camera.position).sub(pos).normalize();
    _y.crossVectors(_z, _x).normalize();
    _z.crossVectors(_x, _y);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(_x, _y, _z));
    const fade = Math.sin(st.t * Math.PI);
    m.scale.set(9 * fade + 1, 0.35, 1);
    mat.opacity = fade;
  });
  return (
    <mesh ref={mesh} material={mat} visible={false} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

/* ---------- 멀리 보이는 친구 별: 우주 지도에서 실제 방향대로, 작게 ---------- */
export function DistantPlanets({ ownerId, count = 9 }) {
  const list = useMemo(() => {
    const known = STARS.some((s) => s.id === ownerId);
    const me = known ? new THREE.Vector3(...starPosition(ownerId)) : new THREE.Vector3();
    return STARS.map((s, i) => ({ s, i, v: new THREE.Vector3(...starPosition(s.id)).sub(me) }))
      .filter((x) => x.s.id !== ownerId && x.v.lengthSq() > 1) // 같은 자리(명단에 없는 별 등)는 빼기
      .sort((a, b) => a.v.length() - b.v.length())
      .slice(0, count)
      .map(({ s, v }, k) => {
        const planet = getPlanet(s.id);
        const t = PLANET_TINTS.find((x) => x.id === planet.tint) ?? PLANET_TINTS[0];
        const dist = 34 + k * 3.5; // 가까운 친구일수록 크게 보이게
        return {
          id: s.id,
          pos: v.normalize().multiplyScalar(dist),
          size: THREE.MathUtils.lerp(1.5, 0.8, k / count),
          mat: planetMaterial(t.base, t.shade),
          halo: haloMaterial(auraColor(planet.aura)),
          ring: planet.ring && planet.ring !== 'none',
        };
      });
  }, [ownerId, count]);
  useEffect(() => () => list.forEach((p) => (p.mat.dispose(), p.halo.dispose())), [list]);
  return (
    <group>
      {list.map((p) => (
        <group key={p.id} position={p.pos} scale={p.size}>
          <mesh material={p.mat}>
            <sphereGeometry args={[1, 24, 12]} />
          </mesh>
          <mesh material={p.halo} scale={1.25}>
            <sphereGeometry args={[1, 16, 8]} />
          </mesh>
          {p.ring && (
            <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
              <ringGeometry args={[1.35, 1.6, 40]} />
              <meshBasicMaterial color="#d7c8ff" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
