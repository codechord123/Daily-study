// 펫: 캐릭터 옆을 졸졸 따라다닌다. 걸으면 콩콩, 하늘 펫은 둥실둥실.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow } from './materials';
import { NEON } from '../theme/tokens';

const INK = '#2a2346';
const FLYERS = new Set(['owl', 'dragon', 'jellyfish', 'spirit', 'drone', 'cloud', 'whale']);

function EyesPair({ y, z, gap = 0.022, r = 0.008 }) {
  return [-gap, gap].map((x) => (
    <mesh key={x} material={toon(INK)} position={[x, y, z]}>
      <sphereGeometry args={[r, 6, 4]} />
    </mesh>
  ));
}

// 네발 친구 공통 틀: 몸통 + 머리 + 귀 + 꼬리
function Critter({ color, ear, tail, snout, cheek }) {
  const c = toon(color);
  return (
    <group>
      <mesh material={c} position={[0, 0.06, 0]} scale={[0.9, 0.8, 1.15]}>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
      <mesh material={c} position={[0, 0.12, 0.05]}>
        <sphereGeometry args={[0.05, 12, 10]} />
      </mesh>
      {ear === 'pointy' &&
        [-1, 1].map((s) => (
          <mesh key={s} material={c} position={[s * 0.03, 0.17, 0.045]} rotation={[0, 0, -s * 0.3]}>
            <coneGeometry args={[0.016, 0.04, 4]} />
          </mesh>
        ))}
      {ear === 'floppy' &&
        [-1, 1].map((s) => (
          <mesh key={s} material={toon('#7a5034')} position={[s * 0.045, 0.12, 0.04]} scale={[0.4, 1, 0.6]}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        ))}
      {ear === 'long' &&
        [-1, 1].map((s) => (
          <mesh key={s} material={c} position={[s * 0.02, 0.2, 0.04]} scale={[0.5, 1, 0.35]}>
            <capsuleGeometry args={[0.016, 0.06, 4, 6]} />
          </mesh>
        ))}
      {ear === 'round' &&
        [-1, 1].map((s) => (
          <mesh key={s} material={c} position={[s * 0.035, 0.16, 0.04]}>
            <sphereGeometry args={[0.016, 8, 6]} />
          </mesh>
        ))}
      <EyesPair y={0.13} z={0.095} />
      {snout && (
        <mesh material={toon(INK)} position={[0, 0.115, 0.1]}>
          <sphereGeometry args={[0.007, 6, 4]} />
        </mesh>
      )}
      {cheek && (
        <mesh material={toon('#ffb3c7')} position={[0, 0.11, 0.098]} scale={[2.4, 1, 1]}>
          <sphereGeometry args={[0.008, 6, 4]} />
        </mesh>
      )}
      {tail === 'bushy' && (
        <mesh material={c} position={[0, 0.09, -0.08]} rotation={[-0.8, 0, 0]} scale={[0.6, 1.3, 0.6]}>
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
      )}
      {tail === 'puff' && (
        <mesh material={toon('#ffffff')} position={[0, 0.06, -0.07]}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
      )}
    </group>
  );
}

function Chick({ color }) {
  return (
    <group>
      <mesh material={toon(color)} position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
      <mesh material={toon('#ffb84a')} position={[0, 0.07, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.012, 0.025, 6]} />
      </mesh>
      <EyesPair y={0.085} z={0.052} gap={0.02} />
    </group>
  );
}

function Sheep({ color }) {
  return (
    <group>
      {[[-0.03, 0.06, 0], [0.03, 0.06, 0], [0, 0.09, 0], [0, 0.06, 0.03], [0, 0.06, -0.03]].map((p, i) => (
        <mesh key={i} material={toon(color)} position={p}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      ))}
      <mesh material={toon('#4c4566')} position={[0, 0.08, 0.065]}>
        <sphereGeometry args={[0.026, 8, 6]} />
      </mesh>
    </group>
  );
}

function PenguinPet({ color }) {
  return (
    <group>
      <mesh material={toon(color)} position={[0, 0.08, 0]} scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </mesh>
      <mesh material={toon('#ffffff')} position={[0, 0.075, 0.03]} scale={[0.8, 1.15, 0.6]}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
      <mesh material={toon('#ffb84a')} position={[0, 0.1, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.01, 0.022, 6]} />
      </mesh>
      <EyesPair y={0.12} z={0.048} gap={0.018} r={0.007} />
    </group>
  );
}

function Owl({ color }) {
  return (
    <group>
      <mesh material={toon(color)} position={[0, 0, 0]} scale={[1, 1.15, 0.9]}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </mesh>
      {[-0.022, 0.022].map((x) => (
        <group key={x} position={[x, 0.015, 0.045]}>
          <mesh material={toon('#ffffff')}>
            <sphereGeometry args={[0.018, 8, 6]} />
          </mesh>
          <mesh material={toon(INK)} position={[0, 0, 0.012]}>
            <sphereGeometry args={[0.009, 6, 4]} />
          </mesh>
        </group>
      ))}
      <mesh material={toon('#ffb84a')} position={[0, -0.005, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.008, 0.02, 4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={toon(color)} position={[s * 0.06, 0, -0.01]} rotation={[0, 0, s * 0.6]} scale={[0.4, 1, 0.8]} name="wing">
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Dragon({ color }) {
  return (
    <group>
      <mesh material={toon(color)} scale={[0.9, 0.85, 1.2]}>
        <sphereGeometry args={[0.05, 12, 10]} />
      </mesh>
      <mesh material={toon(color)} position={[0, 0.04, 0.05]}>
        <sphereGeometry args={[0.04, 12, 10]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={toon('#ffe08a')} position={[s * 0.02, 0.08, 0.04]} rotation={[0, 0, -s * 0.3]}>
          <coneGeometry args={[0.008, 0.03, 4]} />
        </mesh>
      ))}
      <EyesPair y={0.05} z={0.085} gap={0.016} r={0.007} />
      {[-1, 1].map((s) => (
        <mesh key={s} material={toon('#ffb3c7')} position={[s * 0.06, 0.02, -0.01]} rotation={[0, 0, s * 0.7]} scale={[1, 0.15, 0.7]} name="wing">
          <coneGeometry args={[0.04, 0.06, 3]} />
        </mesh>
      ))}
      <mesh material={toon(color)} position={[0, -0.01, -0.07]} rotation={[-1.2, 0, 0]}>
        <coneGeometry args={[0.018, 0.06, 6]} />
      </mesh>
    </group>
  );
}

function Jellyfish({ color }) {
  const tent = useRef();
  useFrame(({ clock }) => {
    if (tent.current) tent.current.children.forEach((c, i) => (c.rotation.z = Math.sin(clock.elapsedTime * 3 + i) * 0.3));
  });
  return (
    <group>
      <mesh material={glow(color, 1.1)} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.05, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <group ref={tent}>
        {[-0.025, 0, 0.025].map((x) => (
          <mesh key={x} material={glow(color, 0.9)} position={[x, -0.03, 0]}>
            <cylinderGeometry args={[0.004, 0.002, 0.06, 4]} />
          </mesh>
        ))}
      </group>
      <EyesPair y={0.012} z={0.045} gap={0.015} r={0.006} />
    </group>
  );
}

function Spirit({ color }) {
  return (
    <group>
      <mesh material={glow(color, 1.8)}>
        <octahedronGeometry args={[0.04, 0]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={glow(NEON.gold, 1.6)} position={[Math.cos((i * Math.PI) / 2) * 0.06, Math.sin((i * Math.PI) / 2) * 0.06, 0]}>
          <sphereGeometry args={[0.008, 6, 4]} />
        </mesh>
      ))}
      <EyesPair y={0.005} z={0.03} gap={0.012} r={0.006} />
    </group>
  );
}

function Drone({ color }) {
  const props = useRef();
  useFrame((_, dt) => {
    if (props.current) props.current.rotation.y += dt * 25;
  });
  return (
    <group>
      <mesh material={toon(color)}>
        <boxGeometry args={[0.07, 0.04, 0.06]} />
      </mesh>
      <mesh material={glow(NEON.cyan, 1.6)} position={[0, 0, 0.031]}>
        <boxGeometry args={[0.04, 0.012, 0.004]} />
      </mesh>
      <group ref={props} position={[0, 0.03, 0]}>
        <mesh material={toon('#e8ecf5')}>
          <boxGeometry args={[0.12, 0.004, 0.012]} />
        </mesh>
      </group>
    </group>
  );
}

function TurtlePet({ color }) {
  return (
    <group>
      <mesh material={toon(color)} position={[0, 0.035, 0]} scale={[1, 0.6, 1.1]}>
        <sphereGeometry args={[0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={toon('#b8d98a')} position={[0, 0.035, 0.07]}>
        <sphereGeometry args={[0.025, 10, 8]} />
      </mesh>
      <EyesPair y={0.045} z={0.092} gap={0.011} r={0.005} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <mesh key={i} material={toon('#b8d98a')} position={[x * 0.045, 0.01, z * 0.04]}>
          <sphereGeometry args={[0.014, 6, 4]} />
        </mesh>
      ))}
    </group>
  );
}

// 뭉게구름: 가끔 작은 빗방울이 똑 (날씨 단원)
function CloudPet({ color }) {
  const drop = useRef();
  useFrame(({ clock }) => {
    if (!drop.current) return;
    const t = (clock.elapsedTime * 0.8) % 1;
    drop.current.position.y = -0.04 - t * 0.14;
    drop.current.scale.setScalar(1 - t);
  });
  return (
    <group>
      {[[0, 0, 0, 0.045], [0.04, -0.005, 0, 0.035], [-0.04, -0.008, 0, 0.033], [0.015, 0.025, 0, 0.033]].map(([x, y, z, r], i) => (
        <mesh key={i} material={toon(color)} position={[x, y, z]}>
          <sphereGeometry args={[r, 10, 8]} />
        </mesh>
      ))}
      <EyesPair y={0.0} z={0.042} gap={0.014} r={0.005} />
      <mesh ref={drop} material={glow('#8ec9ff', 1.2)}>
        <sphereGeometry args={[0.008, 6, 4]} />
      </mesh>
    </group>
  );
}

function Whale({ color }) {
  const tail = useRef();
  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.x = Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return (
    <group>
      <mesh material={toon(color)} scale={[0.85, 0.75, 1.3]}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </mesh>
      <mesh material={toon('#f7efe1')} position={[0, -0.02, 0.01]} scale={[0.7, 0.4, 1.1]}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
      <EyesPair y={0.01} z={0.06} gap={0.03} r={0.006} />
      <group ref={tail} position={[0, 0.01, -0.07]}>
        {[-1, 1].map((s) => (
          <mesh key={s} material={toon(color)} position={[s * 0.02, 0, -0.01]} rotation={[0, s * 0.6, 0]} scale={[1, 0.25, 0.6]}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
        ))}
      </group>
      <mesh material={glow('#bff6ff', 1.3)} position={[0, 0.06, 0.02]}>
        <sphereGeometry args={[0.008, 6, 4]} />
      </mesh>
    </group>
  );
}

const BODIES = {
  puppy: (c) => <Critter color={c} ear="floppy" tail="puff" snout />,
  kitty: (c) => <Critter color={c} ear="pointy" tail="bushy" cheek />,
  bunny: (c) => <Critter color={c} ear="long" tail="puff" cheek />,
  hamster: (c) => <Critter color={c} ear="round" cheek />,
  fox: (c) => <Critter color={c} ear="pointy" tail="bushy" snout />,
  chick: (c) => <Chick color={c} />,
  sheep: (c) => <Sheep color={c} />,
  penguin: (c) => <PenguinPet color={c} />,
  owl: (c) => <Owl color={c} />,
  dragon: (c) => <Dragon color={c} />,
  jellyfish: (c) => <Jellyfish color={c} />,
  spirit: (c) => <Spirit color={c} />,
  drone: (c) => <Drone color={c} />,
  turtle: (c) => <TurtlePet color={c} />,
  cloud: (c) => <CloudPet color={c} />,
  whale: (c) => <Whale color={c} />,
};

// 펫 기본 색 (펫 색을 안 바꿨을 때 어울리는 색)
const NATURAL = { puppy: '#e9c39b', kitty: '#f0a35a', bunny: '#ffffff', hamster: '#f2c08a', fox: '#f0965a', chick: '#ffe066', sheep: '#ffffff', penguin: '#3b437e', owl: '#a77b5b', dragon: '#8fd18a', jellyfish: '#c3b2ec', spirit: '#bff6ff', drone: '#e8ecf5', turtle: '#6d9a5a', cloud: '#ffffff', whale: '#7fa9e6' };

// still: 썸네일처럼 멈춘 그림 — 나는 펫도 띄우지 않아야 칸 안에 들어온다
export default function Pet({ type, color, movingRef, moving, flying, still }) {
  const g = useRef();
  const air = FLYERS.has(type) || flying;
  const tint = color && color !== '#f7efe1' ? color : NATURAL[type];
  useFrame(({ clock }) => {
    if (!g.current || still) return;
    const t = clock.elapsedTime;
    const isMoving = movingRef ? movingRef.current : moving;
    if (air) {
      g.current.position.y = 0.38 + Math.sin(t * 2.4) * 0.04;
      g.current.rotation.z = Math.sin(t * 1.3) * 0.1;
    } else {
      g.current.position.y = isMoving ? Math.abs(Math.sin(t * 12)) * 0.05 : 0;
      g.current.rotation.z = 0;
    }
    g.current.traverse((o) => {
      if (o.name === 'wing') o.scale.y = 1 + Math.sin(t * 16) * 0.35;
    });
  });
  const make = BODIES[type];
  if (!make) return null;
  // 주인 오른쪽 뒤에서 따라온다
  return (
    <group position={[0.26, 0, -0.14]}>
      <group ref={g} scale={1.2}>
        {make(tint)}
      </group>
    </group>
  );
}
