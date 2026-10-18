// 별 소품 3D 모델. 모두 원점(땅)에서 +Y로 자라며, 높이 약 0.3~0.7.
// 기본 도형만 써서 저사양 크롬북에서도 가볍게 돈다.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow, glass } from '../materials';
import { PASTEL, NEON } from '../../theme/tokens';

const M = (c) => toon(c);

function Rose() {
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.04, 16]} />
      </mesh>
      <mesh material={M('#6fae7a')} position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
      </mesh>
      <mesh material={M('#6fae7a')} position={[0.04, 0.12, 0]} rotation={[0, 0, -0.9]} scale={[1, 0.4, 0.6]}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>
      <mesh material={M('#e8506b')} position={[0, 0.27, 0]}>
        <icosahedronGeometry args={[0.055, 0]} />
      </mesh>
      <mesh material={glass()} position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.12, 0.16, 6, 16]} />
      </mesh>
    </group>
  );
}

function Tree() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.24, 7]} />
      </mesh>
      <mesh material={M(PASTEL.moss)} position={[0, 0.34, 0]}>
        <icosahedronGeometry args={[0.18, 1]} />
      </mesh>
      <mesh material={M('#a9d69a')} position={[0.09, 0.42, 0.05]}>
        <icosahedronGeometry args={[0.1, 1]} />
      </mesh>
    </group>
  );
}

function Pine() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 6]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={M(i % 2 ? '#7fb79a' : '#6aa58c')} position={[0, 0.17 + i * 0.12, 0]}>
          <coneGeometry args={[0.17 - i * 0.04, 0.2, 7]} />
        </mesh>
      ))}
    </group>
  );
}

function Baobab() {
  return (
    <group>
      <mesh material={M('#b98d6c')} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.13, 0.4, 8]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.07, 0.4, Math.sin(a) * 0.07]} rotation={[Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]}>
            <mesh material={M('#b98d6c')} position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.14, 6]} />
            </mesh>
            <mesh material={M('#88b77c')} position={[0, 0.16, 0]} scale={[1, 0.6, 1]}>
              <icosahedronGeometry args={[0.1, 0]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Flowers() {
  const cols = [PASTEL.rose, PASTEL.butter, PASTEL.lavender, '#ffffff', PASTEL.peach];
  return (
    <group>
      {cols.map((c, i) => {
        const a = (i / cols.length) * Math.PI * 2;
        const r = 0.07 + (i % 2) * 0.05;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh material={M('#7fb07a')} position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
            </mesh>
            <mesh material={M(c)} position={[0, 0.09, 0]}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Mushroom() {
  return (
    <group>
      <mesh material={M(PASTEL.cream)} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.14, 8]} />
      </mesh>
      <mesh material={M('#ee7f8f')} position={[0, 0.14, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[[0.05, 0.2, 0.03], [-0.04, 0.19, 0.05], [0, 0.21, -0.05]].map((p, i) => (
        <mesh key={i} material={M('#ffffff')} position={p}>
          <sphereGeometry args={[0.015, 6, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function Rock() {
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.04, 0]} scale={[1.2, 0.7, 1]}>
        <dodecahedronGeometry args={[0.08, 0]} />
      </mesh>
      <mesh material={M('#cfc9dc')} position={[0.09, 0.025, 0.03]} scale={[1, 0.6, 1]}>
        <dodecahedronGeometry args={[0.045, 0]} />
      </mesh>
    </group>
  );
}

function House() {
  return (
    <group>
      <mesh material={M(PASTEL.cream)} position={[0, 0.13, 0]}>
        <boxGeometry args={[0.3, 0.26, 0.26]} />
      </mesh>
      <mesh material={M('#e98a8a')} position={[0, 0.34, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.26, 0.18, 4]} />
      </mesh>
      <mesh material={M(PASTEL.bark)} position={[0, 0.08, 0.131]}>
        <boxGeometry args={[0.07, 0.14, 0.01]} />
      </mesh>
      <mesh material={glow(NEON.gold, 1.6)} position={[0.09, 0.16, 0.131]}>
        <boxGeometry args={[0.06, 0.06, 0.01]} />
      </mesh>
      <mesh material={M(PASTEL.stone)} position={[0.08, 0.4, -0.05]}>
        <boxGeometry args={[0.05, 0.1, 0.05]} />
      </mesh>
    </group>
  );
}

function Bench() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.09, 0]}>
        <boxGeometry args={[0.3, 0.025, 0.1]} />
      </mesh>
      <mesh material={M(PASTEL.bark)} position={[0, 0.15, -0.045]}>
        <boxGeometry args={[0.3, 0.08, 0.02]} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} material={M('#6b5a7e')} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.025, 0.08, 0.09]} />
        </mesh>
      ))}
    </group>
  );
}

function Fence() {
  return (
    <group>
      {[-0.12, 0, 0.12].map((x) => (
        <mesh key={x} material={M(PASTEL.cream)} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.03, 0.16, 0.03]} />
        </mesh>
      ))}
      {[0.06, 0.12].map((y) => (
        <mesh key={y} material={M(PASTEL.cream)} position={[0, y, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.015]} />
        </mesh>
      ))}
    </group>
  );
}

function Mailbox() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
      </mesh>
      <mesh material={M('#ef7d7d')} position={[0, 0.23, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.14]} />
      </mesh>
      <mesh material={M(NEON.gold)} position={[0.055, 0.26, 0.03]}>
        <boxGeometry args={[0.01, 0.06, 0.02]} />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group>
      <mesh material={M('#4c4f86')} position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.015, 0.025, 0.44, 6]} />
      </mesh>
      <mesh material={glow(NEON.gold)} position={[0, 0.47, 0]}>
        <octahedronGeometry args={[0.055, 0]} />
      </mesh>
      <pointLight position={[0, 0.47, 0]} color={NEON.gold} intensity={0.6} distance={1.2} />
    </group>
  );
}

function Lantern() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.12;
  });
  return (
    <group>
      <mesh material={M('#4c4f86')} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 5]} />
      </mesh>
      <mesh material={M('#4c4f86')} position={[0.06, 0.31, 0]}>
        <boxGeometry args={[0.12, 0.012, 0.012]} />
      </mesh>
      <group ref={ref} position={[0.11, 0.3, 0]}>
        <mesh material={glow(NEON.pink, 1.8)} position={[0, -0.06, 0]} scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Crystal() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.28 + Math.sin(clock.elapsedTime * 1.3) * 0.03;
  });
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.03, 0]} scale={[1, 0.5, 1]}>
        <dodecahedronGeometry args={[0.09, 0]} />
      </mesh>
      <mesh ref={ref} material={glow(NEON.cyan, 1.7)} scale={[0.7, 1.6, 0.7]}>
        <octahedronGeometry args={[0.09, 0]} />
      </mesh>
    </group>
  );
}

function Volcano() {
  const smoke = useRef();
  useFrame(({ clock }) => {
    if (!smoke.current) return;
    const t = (clock.elapsedTime * 0.4) % 1;
    smoke.current.position.y = 0.32 + t * 0.25;
    smoke.current.scale.setScalar(0.5 + t);
    smoke.current.material.opacity = 0.6 * (1 - t);
  });
  return (
    <group>
      <mesh material={M('#9a7f8f')} position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.06, 0.2, 0.26, 9]} />
      </mesh>
      <mesh material={glow('#ff8a5c', 1.6)} position={[0, 0.262, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 9]} />
      </mesh>
      <mesh ref={smoke}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshBasicMaterial color="#e8e2f0" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Telescope() {
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={M(PASTEL.bark)} position={[Math.cos(a) * 0.05, 0.1, Math.sin(a) * 0.05]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}>
            <cylinderGeometry args={[0.008, 0.008, 0.21, 4]} />
          </mesh>
        );
      })}
      <group position={[0, 0.22, 0]} rotation={[0, 0, 0.7]}>
        <mesh material={M('#7fa9e6')}>
          <cylinderGeometry args={[0.035, 0.045, 0.28, 10]} />
        </mesh>
        <mesh material={glow(NEON.cyan, 1.4)} position={[0, 0.141, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.005, 10]} />
        </mesh>
      </group>
    </group>
  );
}

function Rocket() {
  const flame = useRef();
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.y = 0.8 + Math.sin(clock.elapsedTime * 18) * 0.25;
  });
  return (
    <group position={[0, 0.06, 0]}>
      <mesh material={M(PASTEL.cream)} position={[0, 0.22, 0]}>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
      </mesh>
      <mesh material={M('#ef7d7d')} position={[0, 0.42, 0]}>
        <coneGeometry args={[0.07, 0.1, 12]} />
      </mesh>
      <mesh material={glow(NEON.cyan, 1.5)} position={[0, 0.27, 0.066]}>
        <circleGeometry args={[0.03, 12]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={M('#ef7d7d')} position={[Math.cos(a) * 0.07, 0.1, Math.sin(a) * 0.07]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.06, 0.1, 0.01]} />
          </mesh>
        );
      })}
      <mesh ref={flame} material={glow('#ffb35c', 1.8)} position={[0, 0.0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
      </mesh>
    </group>
  );
}

export const MODELS = {
  rose: Rose,
  tree: Tree,
  pine: Pine,
  baobab: Baobab,
  flowers: Flowers,
  mushroom: Mushroom,
  rock: Rock,
  house: House,
  bench: Bench,
  fence: Fence,
  mailbox: Mailbox,
  lamp: Lamp,
  lantern: Lantern,
  crystal: Crystal,
  volcano: Volcano,
  telescope: Telescope,
  rocket: Rocket,
};
