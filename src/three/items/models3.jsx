// 소품 3차: 우리 문화(사회 역사 단원 연계) · 집 · 놀이 · 탈것 · 공부 · 신기한 것
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow } from '../materials';
import { PASTEL, NEON } from '../../theme/tokens';

const M = (c) => toon(c);

// 한옥: 기와지붕 끝이 살짝 들린 집
function Hanok() {
  return (
    <group>
      <mesh material={M('#b9b3c9')} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.24]} />
      </mesh>
      <mesh material={M('#f7efe1')} position={[0, 0.11, 0]}>
        <boxGeometry args={[0.28, 0.14, 0.18]} />
      </mesh>
      {[-0.1, 0, 0.1].map((x) => (
        <mesh key={x} material={M('#a77b5b')} position={[x, 0.11, 0.091]}>
          <boxGeometry args={[0.012, 0.14, 0.004]} />
        </mesh>
      ))}
      <mesh material={M('#4c4f86')} position={[0, 0.22, 0]} scale={[1, 0.35, 0.75]}>
        <cylinderGeometry args={[0.12, 0.26, 0.2, 4, 1, false, Math.PI / 4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#4c4f86')} position={[s * 0.19, 0.22, 0]} rotation={[0, 0, s * -0.5]}>
          <boxGeometry args={[0.06, 0.012, 0.2]} />
        </mesh>
      ))}
    </group>
  );
}

// 석탑: 층층이 쌓은 돌탑 (불국사 석가탑 느낌)
function Pagoda() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0, 0.03 + i * 0.09, 0]}>
          <mesh material={M('#cfc9dc')}>
            <boxGeometry args={[0.13 - i * 0.02, 0.05, 0.13 - i * 0.02]} />
          </mesh>
          <mesh material={M('#b9b3c9')} position={[0, 0.035, 0]}>
            <boxGeometry args={[0.17 - i * 0.025, 0.018, 0.17 - i * 0.025]} />
          </mesh>
        </group>
      ))}
      <mesh material={M('#b9b3c9')} position={[0, 0.42, 0]}>
        <coneGeometry args={[0.02, 0.08, 6]} />
      </mesh>
    </group>
  );
}

// 장독대
function Jangdok() {
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 14]} />
      </mesh>
      {[[0, 0, 1.1], [-0.11, 0.06, 0.8], [0.1, -0.06, 0.9], [0.06, 0.1, 0.7]].map(([x, z, k], i) => (
        <group key={i} position={[x, 0.03, z]} scale={k}>
          <mesh material={M('#7a4e36')} position={[0, 0.06, 0]} scale={[1, 1.1, 1]}>
            <sphereGeometry args={[0.06, 12, 10]} />
          </mesh>
          <mesh material={M('#5a3826')} position={[0, 0.125, 0]}>
            <cylinderGeometry args={[0.035, 0.04, 0.015, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Castle() {
  return (
    <group>
      <mesh material={M('#e8e2f0')} position={[0, 0.1, 0]}>
        <boxGeometry args={[0.24, 0.2, 0.2]} />
      </mesh>
      <mesh material={M('#a77b5b')} position={[0, 0.06, 0.101]}>
        <boxGeometry args={[0.06, 0.1, 0.005]} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * 0.12, 0, z * 0.1]}>
          <mesh material={M('#f7efe1')} position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.04, 0.045, 0.3, 10]} />
          </mesh>
          <mesh material={M('#a98bf0')} position={[0, 0.34, 0]}>
            <coneGeometry args={[0.055, 0.1, 10]} />
          </mesh>
        </group>
      ))}
      <mesh material={glow(NEON.gold, 1.2)} position={[0.12, 0.42, 0.1]}>
        <boxGeometry args={[0.04, 0.025, 0.003]} />
      </mesh>
    </group>
  );
}

function Cottage() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={M(i % 2 ? '#b98d6c' : '#a77b5b')} position={[0, 0.025 + i * 0.045, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.28, 8]} />
        </mesh>
      ))}
      <mesh material={M('#7fbf8a')} position={[0, 0.24, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.24, 0.14, 4]} />
      </mesh>
      <mesh material={glow(NEON.gold, 1.4)} position={[0.07, 0.1, 0.1]}>
        <boxGeometry args={[0.05, 0.05, 0.01]} />
      </mesh>
    </group>
  );
}

function MushroomHouse() {
  return (
    <group>
      <mesh material={M(PASTEL.cream)} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.2, 14]} />
      </mesh>
      <mesh material={M('#ef6b6b')} position={[0, 0.2, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[[0.1, 0.27, 0.06], [-0.08, 0.28, 0.08], [0, 0.31, -0.08], [-0.1, 0.25, -0.05]].map((p, i) => (
        <mesh key={i} material={M('#ffffff')} position={p}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      ))}
      <mesh material={M('#a77b5b')} position={[0, 0.06, 0.1]}>
        <boxGeometry args={[0.05, 0.09, 0.01]} />
      </mesh>
      <mesh material={glow(NEON.gold, 1.4)} position={[0.06, 0.13, 0.09]}>
        <circleGeometry args={[0.018, 10]} />
      </mesh>
    </group>
  );
}

function Hydrangea() {
  const cols = ['#a9b8ff', '#c3a8ff', '#9fd0ff'];
  return (
    <group>
      <mesh material={M('#6fae7a')} position={[0, 0.06, 0]} scale={[1.4, 0.7, 1.4]}>
        <icosahedronGeometry args={[0.08, 0]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} material={M(cols[i % 3])} position={[Math.cos(a) * 0.07, 0.12 + (i % 2) * 0.03, Math.sin(a) * 0.07]}>
            <icosahedronGeometry args={[0.045, 1]} />
          </mesh>
        );
      })}
    </group>
  );
}

function LotusPond() {
  return (
    <group>
      <mesh material={glow('#7fd8ff', 0.9)} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 24]} />
      </mesh>
      <mesh material={M(PASTEL.stone)} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.02, 6, 24]} />
      </mesh>
      {[[0.06, 0.04], [-0.08, -0.03], [0.02, -0.1]].map(([x, z], i) => (
        <group key={i} position={[x, 0.012, z]}>
          <mesh material={M('#6fbf8a')} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.045, 12, 0.3, Math.PI * 1.8]} />
          </mesh>
          {i === 0 && (
            <mesh material={M('#ffb3d0')} position={[0, 0.025, 0]}>
              <coneGeometry args={[0.025, 0.05, 6]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function StoneStack() {
  return (
    <group>
      {[0.07, 0.055, 0.045, 0.035, 0.025].map((r, i, arr) => (
        <mesh key={i} material={M(i % 2 ? '#cfc9dc' : '#b9b3c9')} position={[Math.sin(i) * 0.01, arr.slice(0, i).reduce((a, b) => a + b * 1.1, 0) + r * 0.6, 0]} scale={[1, 0.6, 1]}>
          <dodecahedronGeometry args={[r, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function CrystalCluster() {
  const cols = ['#c3a8ff', '#9fe9ff', '#ff9fd8'];
  return (
    <group>
      {[[0, 0, 0, 1.2], [0.06, 0, 0.03, 0.8], [-0.05, 0, -0.03, 0.9], [0.02, 0, -0.06, 0.6]].map(([x, , z, k], i) => (
        <mesh key={i} material={glow(cols[i % 3], 1.3)} position={[x, 0.08 * k, z]} rotation={[0, i, (i - 1.5) * 0.25]} scale={[0.6 * k, 1.5 * k, 0.6 * k]}>
          <octahedronGeometry args={[0.06, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function Seesaw() {
  const b = useRef();
  useFrame(({ clock }) => {
    if (b.current) b.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.25;
  });
  return (
    <group>
      <mesh material={M('#4c4f86')} position={[0, 0.04, 0]}>
        <coneGeometry args={[0.04, 0.08, 3]} />
      </mesh>
      <group ref={b} position={[0, 0.08, 0]}>
        <mesh material={M('#ffb84a')}>
          <boxGeometry args={[0.36, 0.015, 0.05]} />
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <mesh key={x} material={M('#ef6b6b')} position={[x, 0.03, 0]}>
            <boxGeometry args={[0.012, 0.05, 0.04]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Slide() {
  return (
    <group>
      <mesh material={M('#7fa9ff')} position={[-0.08, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.24, 0.08]} />
      </mesh>
      <mesh material={M('#ffd24a')} position={[0.04, 0.12, 0]} rotation={[0, 0, -0.75]}>
        <boxGeometry args={[0.3, 0.015, 0.08]} />
      </mesh>
      {[0.05, 0.11, 0.17].map((y) => (
        <mesh key={y} material={M('#ffffff')} position={[-0.115, y, 0]}>
          <boxGeometry args={[0.005, 0.012, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

function Train() {
  return (
    <group>
      <mesh material={M('#ef6b6b')} position={[0, 0.07, 0.04]}>
        <boxGeometry args={[0.12, 0.1, 0.16]} />
      </mesh>
      <mesh material={M('#3b437e')} position={[0, 0.15, -0.02]}>
        <boxGeometry args={[0.13, 0.08, 0.06]} />
      </mesh>
      <mesh material={M('#2b2338')} position={[0, 0.15, 0.09]}>
        <cylinderGeometry args={[0.018, 0.022, 0.06, 8]} />
      </mesh>
      {[[-1, -0.03], [1, -0.03], [-1, 0.08], [1, 0.08]].map(([s, z], i) => (
        <mesh key={i} material={M('#2b2338')} position={[s * 0.065, 0.025, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.012, 10]} />
        </mesh>
      ))}
      <mesh material={glow(NEON.gold, 1.6)} position={[0, 0.08, 0.121]}>
        <circleGeometry args={[0.018, 10]} />
      </mesh>
    </group>
  );
}

function Car() {
  return (
    <group>
      <mesh material={M('#7fcbb1')} position={[0, 0.05, 0]}>
        <boxGeometry args={[0.12, 0.05, 0.22]} />
      </mesh>
      <mesh material={M('#7fcbb1')} position={[0, 0.095, -0.01]}>
        <boxGeometry args={[0.1, 0.05, 0.11]} />
      </mesh>
      <mesh material={glow('#c8f6ff', 1)} position={[0, 0.095, 0.046]}>
        <boxGeometry args={[0.09, 0.035, 0.003]} />
      </mesh>
      {[[-1, -0.07], [1, -0.07], [-1, 0.07], [1, 0.07]].map(([s, z], i) => (
        <mesh key={i} material={M('#2b2338')} position={[s * 0.062, 0.025, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.015, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function Ufo() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = 0.2 + Math.sin(clock.elapsedTime * 1.5) * 0.03;
    g.current.rotation.y = clock.elapsedTime * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.1, 0.2, 16, 1, true]} />
        <meshBasicMaterial color={NEON.cyan} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={g}>
        <mesh material={M('#b9b3c9')} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[0.15, 18, 10]} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.06, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#c8f6ff" transparent opacity={0.55} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} material={glow(i % 2 ? NEON.pink : NEON.gold, 1.8)} position={[Math.cos(a) * 0.12, -0.01, Math.sin(a) * 0.12]}>
              <sphereGeometry args={[0.012, 6, 4]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Dino() {
  return (
    <group>
      <mesh material={M('#8fd18a')} position={[0, 0.09, 0]} scale={[0.9, 0.9, 1.3]}>
        <sphereGeometry args={[0.08, 12, 10]} />
      </mesh>
      <mesh material={M('#8fd18a')} position={[0, 0.2, 0.08]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
      </mesh>
      <mesh material={M('#8fd18a')} position={[0, 0.26, 0.12]}>
        <sphereGeometry args={[0.045, 10, 8]} />
      </mesh>
      {[-0.02, 0.02].map((x) => (
        <mesh key={x} material={M('#2a2346')} position={[x, 0.275, 0.16]}>
          <sphereGeometry args={[0.007, 6, 4]} />
        </mesh>
      ))}
      <mesh material={M('#8fd18a')} position={[0, 0.07, -0.13]} rotation={[-1.2, 0, 0]}>
        <coneGeometry args={[0.035, 0.12, 8]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={M('#ffb84a')} position={[0, 0.17 - i * 0.015, 0.02 - i * 0.05]}>
          <coneGeometry args={[0.015, 0.035, 4]} />
        </mesh>
      ))}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <mesh key={i} material={M('#7fbf7a')} position={[x * 0.045, 0.025, z * 0.05]}>
          <cylinderGeometry args={[0.018, 0.02, 0.05, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function ShootingStar() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.02;
  });
  return (
    <group>
      <mesh material={M('#4c4f86')} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.24, 4]} />
      </mesh>
      <group ref={g} rotation={[0, 0, -0.5]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} material={glow(NEON.gold, 2)} position={[Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <coneGeometry args={[0.02, 0.05, 4]} />
            </mesh>
          );
        })}
        <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.03, 0.2, 8, 1, true]} />
          <meshBasicMaterial color={NEON.gold} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Gift() {
  return (
    <group>
      <mesh material={M('#ff8fb1')} position={[0, 0.06, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
      <mesh material={M('#ffd76a')} position={[0, 0.06, 0]}>
        <boxGeometry args={[0.125, 0.125, 0.025]} />
      </mesh>
      <mesh material={M('#ffd76a')} position={[0, 0.06, 0]}>
        <boxGeometry args={[0.025, 0.125, 0.125]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#ffd76a')} position={[s * 0.025, 0.135, 0]} rotation={[0, 0, s * 0.6]}>
          <torusGeometry args={[0.022, 0.008, 4, 10]} />
        </mesh>
      ))}
    </group>
  );
}

// 공부 모퉁이: 책 더미
function Books() {
  const cols = ['#ef6b6b', '#7fa9ff', '#ffd76a', '#7fcbb1'];
  return (
    <group>
      {cols.map((c, i) => (
        <mesh key={c} material={M(c)} position={[Math.sin(i * 2) * 0.01, 0.015 + i * 0.03, 0]} rotation={[0, i * 0.3, 0]}>
          <boxGeometry args={[0.14 - i * 0.01, 0.028, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

function Globe() {
  const g = useRef();
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.6;
  });
  return (
    <group>
      <mesh material={M('#a77b5b')} position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 12]} />
      </mesh>
      <mesh material={M('#a77b5b')} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
      </mesh>
      <group ref={g} position={[0, 0.17, 0]} rotation={[0, 0, 0.4]}>
        <mesh material={M('#7fa9ff')}>
          <sphereGeometry args={[0.07, 16, 12]} />
        </mesh>
        {[[0.03, 0.03, 0.05], [-0.04, -0.01, 0.05], [0.02, -0.04, -0.05]].map((p, i) => (
          <mesh key={i} material={M('#8fd18a')} position={p} scale={[1, 0.7, 0.5]}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Signpost() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.3, 5]} />
      </mesh>
      {[[0.24, 0.05, 0.3], [0.19, -0.06, -0.4]].map(([y, x, r], i) => (
        <mesh key={i} material={M(i ? '#ffd76a' : '#7fcbb1')} position={[x, y, 0]} rotation={[0, r, 0]}>
          <boxGeometry args={[0.14, 0.04, 0.01]} />
        </mesh>
      ))}
    </group>
  );
}

export const MODELS3 = {
  hanok: Hanok,
  pagoda: Pagoda,
  jangdok: Jangdok,
  castle: Castle,
  cottage: Cottage,
  mushroomHouse: MushroomHouse,
  hydrangea: Hydrangea,
  lotusPond: LotusPond,
  stoneStack: StoneStack,
  crystalCluster: CrystalCluster,
  seesaw: Seesaw,
  slide: Slide,
  train: Train,
  car: Car,
  ufo: Ufo,
  dino: Dino,
  shootingStar: ShootingStar,
  gift: Gift,
  books: Books,
  globe: Globe,
  signpost: Signpost,
};
