// 미션 중 별 둘레에 떠 있는 "별 조각 고리". 맞힌 문제마다 빛나는 조각이 채워진다.
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useUI } from '../store/useUI';
import { glow } from './materials';
import Sparks from './Sparks';
import { PLANET_RADIUS, NEON } from '../theme/tokens';

const RING_R = PLANET_RADIUS * 1.45;

function Slot({ index, total, result, active }) {
  const g = useRef();
  const born = useRef(null);
  const a = (index / total) * Math.PI * 2;

  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    if (result !== undefined && born.current === null) born.current = t;
    // 새로 채워진 조각: 0.5초 동안 크게 튀어나왔다 자리 잡음
    const age = born.current === null ? 99 : t - born.current;
    const pop = age < 0.5 ? 1 + Math.sin((age / 0.5) * Math.PI) * 1.2 : 1;
    const base = result === true ? 1 : result === false ? 0.55 : active ? 0.75 + Math.sin(t * 5) * 0.15 : 0.4;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, base * pop, 10, dt));
    g.current.rotation.y += dt * (result ? 2 : 0.6);
  });

  const mat = result === true ? glow(NEON.gold, 2) : result === false ? glow('#8b7fb8', 0.9) : active ? glow('#ffffff', 1.4) : glow('#9aa3d6', 0.7);
  return (
    <group position={[Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R]}>
      <mesh ref={g} material={mat} scale={0.4}>
        {result === true ? <octahedronGeometry args={[0.14, 0]} /> : <sphereGeometry args={[0.07, 10, 8]} />}
      </mesh>
    </group>
  );
}

export default function MissionOrbit() {
  const { results, total, fx } = useUI((s) => s.mission);
  const ring = useRef();
  const spin = useRef();
  const done = fx?.kind === 'complete';

  useFrame((_, dt) => {
    if (!ring.current) return;
    spin.current.rotation.y += dt * (done ? 3 : 0.12);
    // 다 풀면 고리가 별 안으로 빨려 들어간다
    const target = done ? 0.0001 : 1;
    ring.current.scale.setScalar(THREE.MathUtils.damp(ring.current.scale.x, target, done ? 2.2 : 4, dt));
  });

  if (!total) return null;
  return (
    <group>
      <group ref={ring} rotation={[0.28, 0, -0.12]}>
        <group ref={spin}>
          {/* 고리 궤도선 */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[RING_R, 0.008, 4, 96]} />
            <meshBasicMaterial color="#c9d6ff" transparent opacity={0.25} toneMapped={false} />
          </mesh>
          {Array.from({ length: total }, (_, i) => (
            <Slot key={i} index={i} total={total} result={results[i]} active={i === results.length && !done} />
          ))}
        </group>
      </group>
      {/* 완료 순간 별 전체에서 터지는 빛 */}
      <Sparks trigger={done ? fx.at : 0} power={3} size={0.16} life={1.8} />
    </group>
  );
}
