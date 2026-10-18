// 별 둘레 꾸미기: 고리, 위성, 빛 무리 색
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow } from './materials';
import { PLANET_DECO } from '../theme/tokens';

const RAINBOW = ['#ff8f8f', '#ffc46a', '#fff08a', '#9fe0a0', '#8fc8ff', '#c3a8ff'];
const find = (slot, id) => PLANET_DECO[slot].find((x) => x.id === id);

export function Ring({ type, radius }) {
  const r = useRef();
  useFrame((_, dt) => {
    if (r.current) r.current.rotation.z += dt * 0.15;
  });
  const part = find('ring', type);
  if (!part?.color) return null;
  return (
    <group rotation={[Math.PI / 2 - 0.35, 0.2, 0]}>
      <group ref={r}>
        {part.color === 'rainbow'
          ? RAINBOW.map((c, i) => (
              <mesh key={c} material={glow(c, 1)}>
                <torusGeometry args={[radius * (1.45 + i * 0.045), radius * 0.012, 4, 96]} />
              </mesh>
            ))
          : (type === 'double' ? [1.45, 1.7] : [1.5]).map((k) => (
              <mesh key={k} material={glow(part.color, 1.1)} scale={[1, 1, 0.15]}>
                <torusGeometry args={[radius * k, radius * 0.05, 4, 96]} />
              </mesh>
            ))}
      </group>
    </group>
  );
}

export function Moon({ type, radius }) {
  const orbit = useRef();
  useFrame((_, dt) => {
    if (orbit.current) orbit.current.rotation.y += dt * 0.35;
  });
  const part = find('moon', type);
  if (!part?.color) return null;
  const moons = type === 'twins' ? [0, Math.PI] : [0];
  return (
    <group rotation={[0.3, 0, 0.2]}>
      <group ref={orbit}>
        {moons.map((a) => (
          <group key={a} position={[Math.cos(a) * radius * 1.9, 0, Math.sin(a) * radius * 1.9]}>
            {type === 'heart' ? (
              <group scale={radius * 0.09}>
                {[-0.5, 0.5].map((x) => (
                  <mesh key={x} material={toon(part.color)} position={[x, 0.3, 0]}>
                    <sphereGeometry args={[0.62, 12, 10]} />
                  </mesh>
                ))}
                <mesh material={toon(part.color)} position={[0, -0.25, 0]} rotation={[0, 0, Math.PI]}>
                  <coneGeometry args={[1.05, 1.3, 16]} />
                </mesh>
              </group>
            ) : (
              <mesh material={toon(part.color)}>
                {type === 'rocky' ? <dodecahedronGeometry args={[radius * 0.13, 0]} /> : <sphereGeometry args={[radius * 0.12, 16, 12]} />}
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}

export function auraColor(id) {
  return find('aura', id)?.color ?? PLANET_DECO.aura[0].color;
}
