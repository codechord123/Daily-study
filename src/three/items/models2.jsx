// 추가 소품: 동물(어린왕자 여우·상자 속 양 등), 꽃·나무, 놀이, 신기한 것
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow } from '../materials';
import { PASTEL, NEON } from '../../theme/tokens';

const M = (c) => toon(c);

// 앉아 있는 작은 동물 공통 틀
function Critter({ body, belly, ear = 'pointy', tail = 'bushy', earColor, tailTip }) {
  const tailRef = useRef();
  useFrame(({ clock }) => {
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.25 - 0.4;
  });
  return (
    <group>
      <mesh material={M(body)} position={[0, 0.09, 0]} scale={[1, 1.05, 1.2]}>
        <sphereGeometry args={[0.08, 12, 10]} />
      </mesh>
      <mesh material={M(belly)} position={[0, 0.085, 0.055]} scale={[0.7, 0.85, 0.5]}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </mesh>
      <mesh material={M(body)} position={[0, 0.2, 0.04]}>
        <sphereGeometry args={[0.065, 12, 10]} />
      </mesh>
      {[-1, 1].map((s) =>
        ear === 'pointy' ? (
          <mesh key={s} material={M(earColor ?? body)} position={[s * 0.035, 0.27, 0.03]} rotation={[0, 0, -s * 0.3]}>
            <coneGeometry args={[0.022, 0.06, 4]} />
          </mesh>
        ) : ear === 'long' ? (
          <mesh key={s} material={M(earColor ?? body)} position={[s * 0.025, 0.3, 0.03]} rotation={[0, 0, -s * 0.15]} scale={[0.6, 1, 0.4]}>
            <capsuleGeometry args={[0.02, 0.08, 4, 6]} />
          </mesh>
        ) : (
          <mesh key={s} material={M(earColor ?? body)} position={[s * 0.05, 0.22, 0.02]} rotation={[0, 0, s * 0.8]} scale={[1, 0.5, 0.6]}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        ),
      )}
      {[-0.024, 0.024].map((x) => (
        <mesh key={x} material={M('#2a2346')} position={[x, 0.21, 0.1]}>
          <sphereGeometry args={[0.009, 6, 4]} />
        </mesh>
      ))}
      <mesh material={M('#2a2346')} position={[0, 0.19, 0.105]}>
        <sphereGeometry args={[0.007, 6, 4]} />
      </mesh>
      <group ref={tailRef} position={[0, 0.07, -0.09]}>
        {tail === 'bushy' ? (
          <>
            <mesh material={M(body)} position={[0, 0.06, -0.03]} rotation={[-0.6, 0, 0]} scale={[0.7, 1.4, 0.7]}>
              <sphereGeometry args={[0.04, 8, 6]} />
            </mesh>
            {tailTip && (
              <mesh material={M(tailTip)} position={[0, 0.11, -0.06]}>
                <sphereGeometry args={[0.025, 8, 6]} />
              </mesh>
            )}
          </>
        ) : (
          <mesh material={M(tailTip ?? body)} position={[0, 0.01, -0.01]}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
        )}
      </group>
    </group>
  );
}

const Fox = () => <Critter body="#f0965a" belly="#fff4e6" ear="pointy" tail="bushy" tailTip="#fff4e6" earColor="#d9733d" />;
const Cat = () => <Critter body="#b9b3c9" belly="#f7efe1" ear="pointy" tail="bushy" />;
const Bunny = () => <Critter body="#f7efe1" belly="#ffffff" ear="long" tail="puff" earColor="#f7d6dc" />;

// 상자 속 양: "양을 그려 줘"
function SheepBox() {
  return (
    <group>
      <mesh material={M('#d8b98c')} position={[0, 0.07, 0]}>
        <boxGeometry args={[0.22, 0.14, 0.16]} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} material={M('#2a2346')} position={[x, 0.09, 0.081]}>
          <circleGeometry args={[0.012, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.17, 0]}>
        {[[-0.04, 0, 0], [0.04, 0, 0], [0, 0.03, 0], [0, 0, 0.03], [0, 0, -0.03]].map((p, i) => (
          <mesh key={i} material={M('#ffffff')} position={p}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        ))}
        <mesh material={M('#4c4566')} position={[0.07, 0.01, 0.02]}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

function Sunflower() {
  return (
    <group>
      <mesh material={M('#6fae7a')} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.3, 6]} />
      </mesh>
      <group position={[0, 0.32, 0.02]} rotation={[0.3, 0, 0]}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} material={M('#ffd24a')} position={[Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0]} rotation={[0, 0, a]} scale={[1, 0.45, 0.3]}>
              <sphereGeometry args={[0.035, 6, 4]} />
            </mesh>
          );
        })}
        <mesh material={M('#7a5034')} position={[0, 0, 0.01]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function Tulips() {
  const cols = ['#ef6b8a', '#ffd24a', '#c3b2ec'];
  return (
    <group>
      {cols.map((c, i) => (
        <group key={c} position={[(i - 1) * 0.07, 0, (i % 2) * 0.04]}>
          <mesh material={M('#6fae7a')} position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.007, 0.007, 0.12, 4]} />
          </mesh>
          <mesh material={M(c)} position={[0, 0.13, 0]} scale={[1, 1.3, 1]}>
            <sphereGeometry args={[0.028, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Cherry() {
  return (
    <group>
      <mesh material={M('#8a5f4a')} position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.26, 7]} />
      </mesh>
      {[[0, 0.36, 0, 0.16], [0.1, 0.32, 0.04, 0.1], [-0.09, 0.33, -0.03, 0.11]].map(([x, y, z, r], i) => (
        <mesh key={i} material={M(i ? '#ffc6d9' : '#f7a8c4')} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
        </mesh>
      ))}
    </group>
  );
}

function Cactus() {
  return (
    <group>
      <mesh material={M('#c98b6b')} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.06, 10]} />
      </mesh>
      <mesh material={M('#7fbf8a')} position={[0, 0.16, 0]}>
        <capsuleGeometry args={[0.045, 0.16, 6, 10]} />
      </mesh>
      <mesh material={M('#7fbf8a')} position={[0.07, 0.17, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.022, 0.06, 4, 8]} />
      </mesh>
      <mesh material={M('#ff8fb1')} position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.02, 8, 6]} />
      </mesh>
    </group>
  );
}

function Palm() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={M(i % 2 ? '#b98d6c' : '#a77b5b')} position={[i * 0.012, 0.05 + i * 0.09, 0]} rotation={[0, 0, -0.08]}>
          <cylinderGeometry args={[0.025, 0.03, 0.1, 6]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} material={M('#6fbf8a')} position={[0.05 + Math.cos(a) * 0.08, 0.4, Math.sin(a) * 0.08]} rotation={[Math.sin(a) * 0.9, -a, Math.cos(a) * 0.9]} scale={[1.6, 0.15, 0.5]}>
            <sphereGeometry args={[0.06, 6, 4]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Windmill() {
  const blades = useRef();
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 1.5;
  });
  return (
    <group>
      <mesh material={M(PASTEL.cream)} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.34, 8]} />
      </mesh>
      <mesh material={M('#7fa9e6')} position={[0, 0.38, 0]}>
        <coneGeometry args={[0.08, 0.1, 8]} />
      </mesh>
      <group ref={blades} position={[0, 0.3, 0.08]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={M('#f7efe1')} rotation={[0, 0, (i * Math.PI) / 2]} position={[Math.cos((i * Math.PI) / 2) * 0.09, Math.sin((i * Math.PI) / 2) * 0.09, 0]}>
            <boxGeometry args={[0.16, 0.035, 0.008]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Campfire() {
  const f = useRef();
  useFrame(({ clock }) => {
    if (f.current) f.current.scale.y = 1 + Math.sin(clock.elapsedTime * 14) * 0.15;
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={M('#8a5f4a')} position={[0, 0.02, 0]} rotation={[0, (i * Math.PI) / 3, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.16, 5]} />
        </mesh>
      ))}
      <group ref={f}>
        <mesh material={glow('#ff9a4a', 2)} position={[0, 0.08, 0]}>
          <coneGeometry args={[0.05, 0.13, 6]} />
        </mesh>
        <mesh material={glow('#ffe08a', 2.4)} position={[0, 0.07, 0]}>
          <coneGeometry args={[0.025, 0.08, 6]} />
        </mesh>
      </group>
      <pointLight position={[0, 0.12, 0]} color="#ffb35c" intensity={0.5} distance={1} />
    </group>
  );
}

function Tent() {
  return (
    <group>
      <mesh material={M('#ffb36b')} position={[0, 0.11, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.17, 0.22, 4]} />
      </mesh>
      <mesh material={M('#7a4a2a')} position={[0, 0.06, 0.1]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.045, 0.12, 3]} />
      </mesh>
    </group>
  );
}

function Snowman() {
  return (
    <group>
      <mesh material={M('#ffffff')} position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.08, 12, 10]} />
      </mesh>
      <mesh material={M('#ffffff')} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </mesh>
      <mesh material={M('#ff9a4a')} position={[0, 0.18, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.01, 0.05, 6]} />
      </mesh>
      <mesh material={M('#ef6b6b')} position={[0, 0.135, 0]}>
        <torusGeometry args={[0.045, 0.012, 6, 14]} />
      </mesh>
      <mesh material={M('#3b437e')} position={[0, 0.245, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.05, 10]} />
      </mesh>
    </group>
  );
}

function Swing() {
  const seat = useRef();
  useFrame(({ clock }) => {
    if (seat.current) seat.current.rotation.x = Math.sin(clock.elapsedTime * 1.8) * 0.4;
  });
  return (
    <group>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} material={M(PASTEL.bark)} position={[x, 0.15, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.3, 5]} />
        </mesh>
      ))}
      <mesh material={M(PASTEL.bark)} position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 5]} />
      </mesh>
      <group ref={seat} position={[0, 0.3, 0]}>
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} material={M('#e8e2f0')} position={[x, -0.11, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.22, 3]} />
          </mesh>
        ))}
        <mesh material={M('#ef7d7d')} position={[0, -0.22, 0]}>
          <boxGeometry args={[0.12, 0.012, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

function Fountain() {
  const w = useRef();
  useFrame(({ clock }) => {
    if (w.current) w.current.scale.y = 1 + Math.sin(clock.elapsedTime * 6) * 0.12;
  });
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.15, 0.16, 0.06, 16]} />
      </mesh>
      <mesh material={glow('#9fe9ff', 1.2)} position={[0, 0.061, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.005, 16]} />
      </mesh>
      <mesh material={M(PASTEL.stone)} position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.12, 8]} />
      </mesh>
      <mesh ref={w} material={glow('#c8f6ff', 1.4)} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
      </mesh>
    </group>
  );
}

function Rainbow() {
  const cols = ['#ff8f8f', '#ffc46a', '#fff08a', '#9fe0a0', '#8fc8ff', '#c3a8ff'];
  return (
    <group position={[0, 0, 0]}>
      {cols.map((c, i) => (
        <mesh key={c} material={glow(c, 1.1)} position={[0, 0, 0]}>
          <torusGeometry args={[0.24 - i * 0.022, 0.011, 6, 32, Math.PI]} />
        </mesh>
      ))}
      {[-0.24, 0.24].map((x) => (
        <mesh key={x} material={M('#ffffff')} position={[x * 0.9, 0.02, 0]} scale={[1.4, 0.8, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Lighthouse() {
  const beam = useRef();
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += dt * 1.2;
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={M(i % 2 ? '#ef7d7d' : '#ffffff')} position={[0, 0.07 + i * 0.12, 0]}>
          <cylinderGeometry args={[0.07 - i * 0.012, 0.08 - i * 0.012, 0.12, 12]} />
        </mesh>
      ))}
      <mesh material={glow(NEON.gold, 2)} position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 10]} />
      </mesh>
      <mesh material={M('#3b437e')} position={[0, 0.49, 0]}>
        <coneGeometry args={[0.055, 0.06, 10]} />
      </mesh>
      <group ref={beam} position={[0, 0.43, 0]}>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.4, 10, 1, true]} />
          <meshBasicMaterial color={NEON.gold} transparent opacity={0.25} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Balloon() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = 0.36 + Math.sin(clock.elapsedTime * 1.2) * 0.03;
  });
  return (
    <group>
      <mesh material={M('#a77b5b')} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.03, 0.025, 0.05, 8]} />
      </mesh>
      <group ref={g}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} material={M(i % 2 ? '#ff8fb1' : '#ffe08a')} rotation={[0, (i * Math.PI) / 3, 0]} scale={[0.5, 1.15, 1]}>
            <sphereGeometry args={[0.12, 8, 10, 0, Math.PI / 3]} />
          </mesh>
        ))}
      </group>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh key={i} material={M('#e8e2f0')} position={[x * 0.025, 0.15, z * 0.025]}>
          <cylinderGeometry args={[0.002, 0.002, 0.2, 3]} />
        </mesh>
      ))}
    </group>
  );
}

function Flag() {
  const f = useRef();
  useFrame(({ clock }) => {
    if (f.current) f.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.25;
  });
  return (
    <group>
      <mesh material={M('#e8e2f0')} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 5]} />
      </mesh>
      <group ref={f} position={[0, 0.34, 0]}>
        <mesh material={glow(NEON.gold, 1.1)} position={[0.07, 0, 0]}>
          <boxGeometry args={[0.14, 0.09, 0.004]} />
        </mesh>
      </group>
    </group>
  );
}

function StarLamp() {
  const s = useRef();
  useFrame((_, dt) => {
    if (s.current) s.current.rotation.y += dt;
  });
  return (
    <group>
      <mesh material={M('#4c4f86')} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.01, 0.02, 0.24, 6]} />
      </mesh>
      <group ref={s} position={[0, 0.3, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} material={glow(NEON.gold, 2)} position={[Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <coneGeometry args={[0.025, 0.06, 4]} />
            </mesh>
          );
        })}
        <mesh material={glow(NEON.gold, 2)}>
          <sphereGeometry args={[0.03, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export const MODELS2 = {
  fox: Fox,
  cat: Cat,
  bunny: Bunny,
  sheepbox: SheepBox,
  sunflower: Sunflower,
  tulips: Tulips,
  cherry: Cherry,
  cactus: Cactus,
  palm: Palm,
  windmill: Windmill,
  campfire: Campfire,
  tent: Tent,
  snowman: Snowman,
  swing: Swing,
  fountain: Fountain,
  rainbow: Rainbow,
  lighthouse: Lighthouse,
  balloon: Balloon,
  flag: Flag,
  starlamp: StarLamp,
};
