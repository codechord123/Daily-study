// 캐릭터: 종족 × 옷 × 머리 × 소품 × 펫 조합. 모두 기본 도형이라 가볍다.
import { useEffect, useReducer, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { toon, glow } from './materials';
import { normalizeLook, SPECIES_WITH_HAIR } from '../data/character';
import { NEON } from '../theme/tokens';
import Pet from './Pet';

const EMOTE_MS = 2600;
const INK = '#2a2346';

export function Hat({ type, accent }) {
  if (type === 'crown')
    return (
      <group position={[0, 0.5, 0]}>
        <mesh material={glow(NEON.gold, 1.3)}>
          <cylinderGeometry args={[0.07, 0.065, 0.05, 8, 1, true]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} material={glow(NEON.gold, 1.3)} position={[Math.cos(a) * 0.065, 0.04, Math.sin(a) * 0.065]}>
              <coneGeometry args={[0.018, 0.04, 4]} />
            </mesh>
          );
        })}
      </group>
    );
  if (type === 'star')
    return (
      <mesh material={glow(NEON.gold, 1.6)} position={[0.08, 0.47, 0.03]} rotation={[0, 0, 0.4]}>
        <octahedronGeometry args={[0.035, 0]} />
      </mesh>
    );
  if (type === 'beanie')
    return (
      <group position={[0, 0.44, 0]}>
        <mesh material={toon('#ef8f8f')} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={toon('#ffffff')} position={[0, 0.11, 0]}>
          <sphereGeometry args={[0.03, 8, 6]} />
        </mesh>
      </group>
    );
  if (type === 'sprout')
    return (
      <group position={[0, 0.5, 0]}>
        <mesh material={toon('#7fc77a')} position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 4]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={toon('#9ad88f')} position={[s * 0.03, 0.06, 0]} rotation={[0, 0, -s * 0.8]} scale={[1, 0.45, 0.6]}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        ))}
      </group>
    );
  if (type === 'wizard')
    return (
      <group position={[0, 0.47, -0.01]} rotation={[-0.15, 0, 0.12]}>
        <mesh material={toon('#5b4bb0')} position={[0, -0.005, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.012, 20]} />
        </mesh>
        <mesh material={toon('#5b4bb0')} position={[0, 0.11, 0]}>
          <coneGeometry args={[0.1, 0.22, 14]} />
        </mesh>
        <mesh material={glow(NEON.gold, 1.6)} position={[0.03, 0.08, 0.075]}>
          <octahedronGeometry args={[0.02, 0]} />
        </mesh>
      </group>
    );
  if (type === 'ribbon')
    return (
      <group position={[0.07, 0.48, 0.02]} rotation={[0, 0, -0.4]}>
        {[-1, 1].map((s) => (
          <mesh key={s} material={toon('#ff7aa8')} position={[s * 0.035, 0, 0]} rotation={[0, 0, s * Math.PI / 2]} scale={[1, 1.4, 0.5]}>
            <coneGeometry args={[0.025, 0.05, 4]} />
          </mesh>
        ))}
        <mesh material={toon('#ff5c95')}>
          <sphereGeometry args={[0.014, 8, 6]} />
        </mesh>
      </group>
    );
  if (type === 'catEars')
    return (
      <group position={[0, 0.47, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.07, 0, 0]} rotation={[0, 0, -s * 0.35]}>
            <mesh material={toon('#4c4566')}>
              <coneGeometry args={[0.04, 0.07, 4]} />
            </mesh>
            <mesh material={toon('#ffb3c7')} position={[0, -0.005, 0.012]} scale={0.55}>
              <coneGeometry args={[0.04, 0.07, 4]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (type === 'flowers')
    return (
      <group position={[0, 0.45, 0]} rotation={[0.15, 0, 0]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} material={toon(['#ff8fb1', '#ffe08a', '#c3b2ec', '#ffffff'][i % 4])} position={[Math.cos(a) * 0.11, 0, Math.sin(a) * 0.11]}>
              <sphereGeometry args={[0.022, 8, 6]} />
            </mesh>
          );
        })}
      </group>
    );
  if (type === 'helmet')
    return (
      <group position={[0, 0.37, 0]}>
        <mesh>
          <sphereGeometry args={[0.165, 20, 14]} />
          <meshBasicMaterial color="#d8f4ff" transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <mesh material={toon('#e8ecf5')} position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.02, 6, 20]} />
        </mesh>
        <mesh material={toon('#e8ecf5')} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.06, 4]} />
        </mesh>
        <mesh material={glow(NEON.pink, 1.8)} position={[0, 0.205, 0]}>
          <sphereGeometry args={[0.014, 8, 6]} />
        </mesh>
      </group>
    );
  if (type === 'headband')
    return (
      <mesh material={toon(accent)} position={[0, 0.43, 0.0]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.118, 0.014, 6, 24, Math.PI]} />
      </mesh>
    );
  if (type === 'cap')
    return (
      <group position={[0, 0.44, 0]}>
        <mesh material={toon(accent)} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={toon(accent)} position={[0, 0.0, 0.12]} rotation={[0.15, 0, 0]} scale={[1, 0.12, 1]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 14, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      </group>
    );
  if (type === 'pirate')
    return (
      <group position={[0, 0.48, 0]}>
        <mesh material={toon('#2b2338')} scale={[1.3, 0.45, 0.8]}>
          <sphereGeometry args={[0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={toon('#ffffff')} position={[0, 0.03, 0.09]}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      </group>
    );
  if (type === 'santa')
    return (
      <group position={[0, 0.45, 0]} rotation={[0, 0, -0.25]}>
        <mesh material={toon('#ef4b4b')} position={[0, 0.07, 0]}>
          <coneGeometry args={[0.11, 0.18, 14]} />
        </mesh>
        <mesh material={toon('#ffffff')} position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.11, 0.025, 6, 18]} />
        </mesh>
        <mesh material={toon('#ffffff')} position={[0, 0.17, 0]}>
          <sphereGeometry args={[0.03, 8, 6]} />
        </mesh>
      </group>
    );
  if (type === 'bunnyBand')
    return (
      <group position={[0, 0.47, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} material={toon('#ffffff')} position={[s * 0.05, 0.08, 0]} rotation={[0, 0, -s * 0.15]} scale={[0.6, 1, 0.4]}>
            <capsuleGeometry args={[0.025, 0.11, 4, 8]} />
          </mesh>
        ))}
      </group>
    );
  if (type === 'halo')
    return (
      <mesh material={glow(NEON.gold, 1.8)} position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.012, 6, 28]} />
      </mesh>
    );
  if (type === 'unicorn')
    return (
      <mesh material={glow('#ffd1f0', 1.5)} position={[0, 0.52, 0.06]} rotation={[0.35, 0, 0]}>
        <coneGeometry args={[0.025, 0.12, 8]} />
      </mesh>
    );
  return null;
}



// 머리 모양
function HairStyle({ style, color }) {
  const m = toon(color);
  const cap = (
    <mesh material={m} position={[0, 0.405, -0.015]} scale={[1.06, 0.82, 1.06]}>
      <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
    </mesh>
  );
  if (style === 'none') return null;
  if (style === 'bob')
    return (
      <>
        <mesh material={m} position={[0, 0.39, -0.01]} scale={[1.1, 0.95, 1.08]}>
          <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={m} position={[s * 0.1, 0.33, 0]} scale={[0.5, 1, 0.9]}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
        ))}
      </>
    );
  if (style === 'pigtails')
    return (
      <>
        {cap}
        {[-1, 1].map((s) => (
          <mesh key={s} material={m} position={[s * 0.14, 0.36, -0.03]} rotation={[0, 0, s * 0.5]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
          </mesh>
        ))}
      </>
    );
  if (style === 'curly')
    return (
      <>
        {Array.from({ length: 11 }, (_, i) => {
          const a = (i / 11) * Math.PI * 2;
          return (
            <mesh key={i} material={m} position={[Math.cos(a) * 0.1, 0.44 + Math.sin(i * 1.7) * 0.02, Math.sin(a) * 0.1 - 0.02]}>
              <sphereGeometry args={[0.045, 8, 6]} />
            </mesh>
          );
        })}
        <mesh material={m} position={[0, 0.47, -0.01]}>
          <sphereGeometry args={[0.07, 10, 8]} />
        </mesh>
      </>
    );
  if (style === 'long')
    return (
      <>
        <mesh material={m} position={[0, 0.4, -0.015]} scale={[1.08, 0.88, 1.08]}>
          <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        </mesh>
        <mesh material={m} position={[0, 0.28, -0.07]} scale={[1.15, 1.4, 0.5]}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
      </>
    );
  if (style === 'bun')
    return (
      <>
        {cap}
        <mesh material={m} position={[0, 0.52, -0.03]}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
      </>
    );
  if (style === 'mohawk')
    return (
      <>
        {[-0.06, -0.02, 0.02, 0.06].map((z, i) => (
          <mesh key={z} material={m} position={[0, 0.49 - Math.abs(i - 1.5) * 0.01, z]}>
            <coneGeometry args={[0.025, 0.09, 5]} />
          </mesh>
        ))}
      </>
    );
  return (
    <>
      {cap}
      {[-0.05, 0, 0.05].map((x, i) => (
        <mesh key={x} material={m} position={[x, 0.48 - (i === 1 ? 0 : 0.012), 0.03]} rotation={[0.3, 0, x * -6]}>
          <coneGeometry args={[0.025, 0.07, 5]} />
        </mesh>
      ))}
    </>
  );
}

function Eyes({ type, big = 1, robot }) {
  const ink = toon(INK);
  if (robot)
    return (
      <mesh material={glow(NEON.cyan, 1.6)} position={[0, 0.37, 0.112]}>
        <boxGeometry args={[0.15, 0.035, 0.01]} />
      </mesh>
    );
  return [-0.042, 0.042].map((x, i) => (
    <group key={x} position={[x * big, 0.37, 0.108]} scale={big}>
      {type === 'smile' || (type === 'wink' && i === 1) ? (
        <mesh material={ink} rotation={[0, 0, Math.PI]} position={[0, -0.004, 0]}>
          <torusGeometry args={[0.012, 0.004, 4, 10, Math.PI]} />
        </mesh>
      ) : type === 'sleepy' ? (
        <mesh material={ink} position={[0, 0.002, 0]}>
          <torusGeometry args={[0.012, 0.004, 4, 10, Math.PI]} />
        </mesh>
      ) : type === 'star' ? (
        <mesh material={glow(NEON.gold, 1.5)} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.017, 0]} />
        </mesh>
      ) : (
        <>
          <mesh material={ink} scale={type === 'sparkle' ? 1.3 : 1}>
            <sphereGeometry args={[0.014, 8, 6]} />
          </mesh>
          {(type === 'sparkle' || big > 1) && (
            <mesh position={[0.005, 0.006, 0.014]}>
              <sphereGeometry args={[0.005, 6, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          )}
        </>
      )}
    </group>
  ));
}

// 종족별 머리 모양 (귀·주둥이·더듬이 등)
function SpeciesHead({ species, skin, accent }) {
  const fur = toon(skin);
  const head =
    species === 'robot' ? (
      <mesh material={toon(skin)} position={[0, 0.37, 0]}>
        <boxGeometry args={[0.22, 0.2, 0.2]} />
      </mesh>
    ) : (
      <mesh material={species === 'ghost' ? undefined : fur} position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        {species === 'ghost' && <meshToonMaterial color={skin} transparent opacity={0.85} />}
      </mesh>
    );
  const ears = {
    cat: [-1, 1].map((s) => (
      <group key={s} position={[s * 0.07, 0.47, 0]} rotation={[0, 0, -s * 0.35]}>
        <mesh material={fur}>
          <coneGeometry args={[0.04, 0.07, 4]} />
        </mesh>
        <mesh material={toon('#ffb3c7')} position={[0, -0.005, 0.012]} scale={0.55}>
          <coneGeometry args={[0.04, 0.07, 4]} />
        </mesh>
      </group>
    )),
    fox: [-1, 1].map((s) => (
      <group key={s} position={[s * 0.075, 0.47, 0]} rotation={[0, 0, -s * 0.3]}>
        <mesh material={fur}>
          <coneGeometry args={[0.045, 0.09, 4]} />
        </mesh>
        <mesh material={toon('#3b2a22')} position={[0, 0.035, 0]} scale={0.4}>
          <coneGeometry args={[0.045, 0.09, 4]} />
        </mesh>
      </group>
    )),
    dog: [-1, 1].map((s) => (
      <mesh key={s} material={toon('#7a5034')} position={[s * 0.115, 0.37, 0]} rotation={[0, 0, s * 0.25]} scale={[0.45, 1, 0.7]}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
    )),
    bunny: [-1, 1].map((s) => (
      <group key={s} position={[s * 0.04, 0.53, -0.01]} rotation={[0, 0, -s * 0.12]}>
        <mesh material={fur} scale={[0.6, 1, 0.4]}>
          <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
        </mesh>
        <mesh material={toon('#ffc6d5')} position={[0, 0, 0.012]} scale={[0.35, 0.8, 0.2]}>
          <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
        </mesh>
      </group>
    )),
    bear: [-1, 1].map((s) => (
      <mesh key={s} material={fur} position={[s * 0.085, 0.47, 0]}>
        <sphereGeometry args={[0.038, 10, 8]} />
      </mesh>
    )),
    alien: [-1, 1].map((s) => (
      <group key={s} position={[s * 0.05, 0.47, 0]} rotation={[0, 0, -s * 0.35]}>
        <mesh material={fur} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
        </mesh>
        <mesh material={glow(accent, 1.4)} position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
      </group>
    )),
    robot: (
      <group position={[0, 0.47, 0]}>
        <mesh material={toon('#6b6386')} position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 4]} />
        </mesh>
        <mesh material={glow(accent, 1.8)} position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      </group>
    ),
  }[species];
  const snout = ['dog', 'bear', 'fox'].includes(species) && (
    <>
      <mesh material={toon(species === 'bear' ? '#e9cfae' : '#fff4e6')} position={[0, 0.33, 0.1]} scale={[1, 0.75, 0.8]}>
        <sphereGeometry args={[0.045, 10, 8]} />
      </mesh>
      <mesh material={toon(INK)} position={[0, 0.345, 0.14]}>
        <sphereGeometry args={[0.013, 8, 6]} />
      </mesh>
    </>
  );
  const small = (species === 'cat' || species === 'bunny') && (
    <mesh material={toon('#ff9fb4')} position={[0, 0.345, 0.118]}>
      <sphereGeometry args={[0.01, 6, 4]} />
    </mesh>
  );
  const penguin = species === 'penguin' && (
    <>
      <mesh material={toon('#ffffff')} position={[0, 0.355, 0.04]} scale={[0.85, 0.8, 0.75]}>
        <sphereGeometry args={[0.11, 14, 10]} />
      </mesh>
      <mesh material={toon('#ffb84a')} position={[0, 0.335, 0.125]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.022, 0.04, 6]} />
      </mesh>
    </>
  );
  return (
    <>
      {head}
      {ears}
      {snout}
      {small}
      {penguin}
    </>
  );
}

// 동물 종족의 꼬리
function Tail({ species, skin }) {
  const fur = toon(skin);
  if (species === 'fox')
    return (
      <mesh material={fur} position={[0, 0.12, -0.13]} rotation={[-0.9, 0, 0]} scale={[0.7, 1.6, 0.7]}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
    );
  if (species === 'cat')
    return (
      <mesh material={fur} position={[0, 0.14, -0.12]} rotation={[-0.5, 0, 0]}>
        <capsuleGeometry args={[0.012, 0.14, 4, 6]} />
      </mesh>
    );
  if (species === 'bunny' || species === 'bear' || species === 'dog')
    return (
      <mesh material={fur} position={[0, 0.1, -0.1]}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>
    );
  return null;
}

// 옷
function Outfit({ type, coat, accent, species }) {
  const c = toon(coat);
  const a = toon(accent);
  if (species === 'ghost')
    return (
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.26, 12]} />
        <meshToonMaterial color={coat} transparent opacity={0.85} />
      </mesh>
    );
  if (type === 'overalls')
    return (
      <>
        <mesh material={a} position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.075, 0.085, 0.12, 12]} />
        </mesh>
        <mesh material={c} position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.088, 0.095, 0.1, 12]} />
        </mesh>
        <mesh material={c} position={[0, 0.2, 0.075]}>
          <boxGeometry args={[0.09, 0.08, 0.01]} />
        </mesh>
        {[-0.035, 0.035].map((x) => (
          <mesh key={x} material={c} position={[x, 0.235, 0.0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.078, 0.008, 4, 12, Math.PI]} />
          </mesh>
        ))}
      </>
    );
  if (type === 'dress')
    return (
      <>
        <mesh material={c} position={[0, 0.15, 0]}>
          <coneGeometry args={[0.14, 0.22, 14]} />
        </mesh>
        <mesh material={a} position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.012, 4, 20]} />
        </mesh>
      </>
    );
  if (type === 'hoodie')
    return (
      <>
        <mesh material={c} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.07, 0.095, 0.18, 12]} />
        </mesh>
        <mesh material={a} position={[0, 0.13, 0.085]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
        </mesh>
        <mesh material={c} position={[0, 0.3, -0.08]} rotation={[0.4, 0, 0]} scale={[1, 0.8, 0.6]}>
          <sphereGeometry args={[0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </>
    );
  if (type === 'hanbok')
    return (
      <>
        <mesh material={c} position={[0, 0.13, 0]}>
          <coneGeometry args={[0.13, 0.2, 14]} />
        </mesh>
        <mesh material={a} position={[0, 0.215, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.07, 12]} />
        </mesh>
        <mesh material={toon('#ef4b6b')} position={[0.02, 0.2, 0.08]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.015, 0.07, 0.006]} />
        </mesh>
      </>
    );
  if (type === 'tuxedo')
    return (
      <>
        <mesh material={c} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.18, 12]} />
        </mesh>
        <mesh material={toon('#ffffff')} position={[0, 0.19, 0.068]}>
          <boxGeometry args={[0.04, 0.12, 0.01]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={a} position={[s * 0.016, 0.245, 0.075]} rotation={[0, 0, (s * Math.PI) / 2]}>
            <coneGeometry args={[0.014, 0.03, 3]} />
          </mesh>
        ))}
      </>
    );
  if (type === 'spacesuit')
    return (
      <>
        <mesh material={c} position={[0, 0.17, 0]}>
          <capsuleGeometry args={[0.085, 0.08, 6, 12]} />
        </mesh>
        <mesh material={glow(accent, 1.4)} position={[0, 0.19, 0.083]}>
          <boxGeometry args={[0.05, 0.03, 0.01]} />
        </mesh>
      </>
    );
  return (
    <mesh material={c} position={[0, 0.16, 0]}>
      <coneGeometry args={[0.11, 0.2, 10]} />
    </mesh>
  );
}

// 망토
function Cape({ type, color, capeRef }) {
  if (type === 'none') return null;
  return (
    <group ref={capeRef} position={[0, 0.25, -0.06]}>
      <mesh material={toon(color)} position={[0, -0.1, -0.02]} rotation={[0.15, 0, 0]}>
        <coneGeometry args={[0.13, 0.22, 10, 1, true, Math.PI * 0.6, Math.PI * 0.8]} />
      </mesh>
      {type === 'stars' &&
        [[-0.05, -0.12], [0.04, -0.07], [0.02, -0.17]].map(([x, y], i) => (
          <mesh key={i} material={glow(NEON.gold, 1.5)} position={[x, y, -0.1]}>
            <octahedronGeometry args={[0.012, 0]} />
          </mesh>
        ))}
    </group>
  );
}

// 소품 (얼굴·등·손)
function Accessory({ type, accent, wingRef }) {
  const a = toon(accent);
  if (type === 'glasses' || type === 'sunglasses')
    return (
      <group position={[0, 0.37, 0.115]}>
        {[-0.042, 0.042].map((x) =>
          type === 'glasses' ? (
            <mesh key={x} material={toon(INK)} position={[x, 0, 0]}>
              <torusGeometry args={[0.024, 0.004, 4, 16]} />
            </mesh>
          ) : (
            <mesh key={x} material={toon('#1d1830')} position={[x, 0, 0.004]}>
              <boxGeometry args={[0.05, 0.03, 0.008]} />
            </mesh>
          ),
        )}
        <mesh material={toon(INK)}>
          <boxGeometry args={[0.03, 0.005, 0.005]} />
        </mesh>
      </group>
    );
  if (type === 'heartGlasses')
    return (
      <group position={[0, 0.37, 0.12]}>
        {[-0.042, 0.042].map((x) => (
          <group key={x} position={[x, 0, 0]} scale={0.026}>
            {[-0.5, 0.5].map((hx) => (
              <mesh key={hx} material={glow('#ff6fa8', 1.2)} position={[hx, 0.3, 0]}>
                <sphereGeometry args={[0.62, 8, 6]} />
              </mesh>
            ))}
            <mesh material={glow('#ff6fa8', 1.2)} position={[0, -0.25, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[1.05, 1.3, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (type === 'backpack')
    return (
      <mesh material={a} position={[0, 0.2, -0.1]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
      </mesh>
    );
  if (type === 'wand')
    return (
      <group position={[0.11, 0.16, 0.06]} rotation={[0.3, 0, -0.4]}>
        <mesh material={toon('#7a5034')}>
          <cylinderGeometry args={[0.006, 0.006, 0.14, 4]} />
        </mesh>
        <mesh material={glow(NEON.gold, 2)} position={[0, 0.08, 0]}>
          <octahedronGeometry args={[0.025, 0]} />
        </mesh>
      </group>
    );
  if (type === 'bouquet')
    return (
      <group position={[0.09, 0.15, 0.08]}>
        {['#ff8fb1', '#ffe08a', '#c3b2ec'].map((col, i) => (
          <mesh key={col} material={toon(col)} position={[(i - 1) * 0.02, 0.04, 0]}>
            <sphereGeometry args={[0.02, 8, 6]} />
          </mesh>
        ))}
        <mesh material={toon('#6fae7a')}>
          <coneGeometry args={[0.025, 0.06, 6]} />
        </mesh>
      </group>
    );
  if (type === 'balloon')
    return (
      <group position={[0.11, 0.15, 0]}>
        <mesh material={toon('#e8e2f0')} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.002, 0.002, 0.34, 3]} />
        </mesh>
        <mesh material={toon(accent)} position={[0, 0.38, 0]} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
      </group>
    );
  if (type === 'angelWings' || type === 'butterflyWings' || type === 'fairyWings') {
    const mat =
      type === 'angelWings' ? toon('#ffffff') : type === 'fairyWings' ? glow('#bff6ff', 1.1) : toon(accent);
    return (
      <group ref={wingRef} position={[0, 0.25, -0.08]}>
        {[-1, 1].map((s) => (
          <group key={s} rotation={[0, s * 0.5, 0]}>
            <mesh material={mat} position={[s * 0.1, 0.03, 0]} rotation={[0, 0, s * 0.5]} scale={[1, type === 'angelWings' ? 0.6 : 1, 0.15]}>
              <sphereGeometry args={[0.09, 10, 8]} />
            </mesh>
            {type !== 'angelWings' && (
              <mesh material={mat} position={[s * 0.07, -0.06, 0]} rotation={[0, 0, -s * 0.4]} scale={[0.7, 0.6, 0.15]}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    );
  }
  return null;
}

// 등에 메는 로켓 추진기. thrustRef(0~1)에 따라 불꽃 크기가 변한다
function Jetpack({ thrustRef }) {
  const flames = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = thrustRef?.current ?? 0;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const len = 0.35 + p * 1.1 + Math.sin(t * 30 + i * 2) * 0.12;
      f.scale.set(1, len, 1);
    });
  });
  return (
    <group position={[0, 0.2, -0.12]}>
      {/* 어깨끈 */}
      <mesh material={toon('#4c4f86')} position={[0, 0.03, 0.06]}>
        <boxGeometry args={[0.2, 0.025, 0.02]} />
      </mesh>
      {[-0.055, 0.055].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh material={toon('#f7efe1')}>
            <capsuleGeometry args={[0.045, 0.12, 4, 10]} />
          </mesh>
          <mesh material={toon('#ef7d7d')} position={[0, 0.1, 0]}>
            <coneGeometry args={[0.045, 0.06, 10]} />
          </mesh>
          <mesh material={toon('#4c4f86')} position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.03, 8]} />
          </mesh>
          {/* 불꽃: 원점이 위쪽 끝이 되도록 아래로 뻗는다 */}
          <group ref={(el) => (flames.current[i] = el)} position={[0, -0.115, 0]}>
            <mesh material={glow('#ffb35c', 2)} position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.03, 0.1, 8]} />
            </mesh>
            <mesh material={glow('#fff3c4', 2.4)} position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.015, 0.06, 6]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}


const _tagPos = new THREE.Vector3();

export default function Character({ look: rawLook, movingRef, moving, name, emote, emoteAt, isMe, scale = 1, jetpack, thrustRef, noPet }) {
  const body = useRef();
  const legL = useRef();
  const legR = useRef();
  const scarf = useRef();
  const cape = useRef();
  const wings = useRef();
  const look = normalizeLook(rawLook);
  const { species } = look;
  const hasLegs = species !== 'ghost';
  const showHair = SPECIES_WITH_HAIR.has(species);

  // 이름표·말풍선: 멀면 작아지고, 가까워도 원래 크기 이상 커지지 않게 (확대·내 모습에서 화면을 가리지 않게)
  const tagAnchor = useRef();
  const tagEl = useRef();
  useFrame(({ clock, camera }) => {
    if (tagAnchor.current && tagEl.current) {
      const d = tagAnchor.current.getWorldPosition(_tagPos).distanceTo(camera.position);
      const k = Math.min(1, Math.max(0.3, 6 / (2 * Math.tan((camera.fov * Math.PI) / 360) * d)));
      tagEl.current.style.transform = `scale(${k.toFixed(3)})`;
    }
    const t = clock.elapsedTime;
    const isMoving = movingRef ? movingRef.current : moving;
    const sp = isMoving ? 11 : 2;
    if (body.current) {
      body.current.position.y =
        species === 'ghost' ? 0.05 + Math.sin(t * 2) * 0.02 : isMoving ? Math.abs(Math.sin(t * sp)) * 0.035 : Math.sin(t * sp) * 0.006;
      // 숨 쉬듯 살짝 부풀고, 걸을 땐 발 디딜 때마다 통통 눌린다
      const sq = isMoving ? 1 - Math.max(0, Math.cos(t * sp * 2)) * 0.05 : 1 + Math.sin(t * 2.1) * 0.018;
      body.current.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
    }
    const swing = jetpack ? 0.25 + Math.sin(t * 2.5) * 0.12 : isMoving ? Math.sin(t * sp) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = jetpack ? swing * 0.7 : -swing;
    if (cape.current) cape.current.rotation.x = -(isMoving || jetpack ? 0.35 : 0.05) - Math.sin(t * (isMoving ? 8 : 1.8)) * 0.06;
    if (scarf.current) scarf.current.rotation.x = -0.9 - (isMoving ? 0.5 : 0) + Math.sin(t * (isMoving ? 9 : 2.2)) * 0.15;
    if (wings.current) wings.current.scale.x = 1 + Math.sin(t * (isMoving || jetpack ? 14 : 4)) * 0.12;
  });

  // 말풍선은 잠깐만 보이고 사라진다
  const [, rerender] = useReducer((x) => x + 1, 0);
  const left = EMOTE_MS - (Date.now() - (emoteAt ?? 0));
  useEffect(() => {
    if (!emoteAt || left <= 0) return;
    const t = setTimeout(rerender, left + 20);
    return () => clearTimeout(t);
  }, [emoteAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const showEmote = emote && left > 0;

  return (
    <group scale={scale}>
      {/* 발밑 그림자 */}
      <mesh visible={!jetpack} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.11, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {hasLegs &&
        [[legL, -0.04], [legR, 0.04]].map(([ref, x]) => (
          <group key={x} ref={ref} position={[x, 0.09, 0]}>
            <mesh material={toon(species === 'penguin' ? '#ffb84a' : '#3b3f6e')} position={[0, -0.045, 0]}>
              <capsuleGeometry args={[0.022, 0.05, 4, 6]} />
            </mesh>
          </group>
        ))}
      <group ref={body}>
        <Outfit type={look.outfit} coat={species === 'ghost' ? look.skin : look.coat} accent={look.accent} species={species} />
        {species !== 'ghost' && species !== 'robot' && (
          <>
            <mesh material={toon(look.scarf)} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.055, 0.022, 6, 14]} />
            </mesh>
            <group ref={scarf} position={[0.03, 0.25, -0.05]}>
              <mesh material={toon(look.scarf)} position={[0, -0.07, 0]}>
                <boxGeometry args={[0.04, 0.14, 0.012]} />
              </mesh>
            </group>
          </>
        )}
        <SpeciesHead species={species} skin={look.skin} accent={look.accent} />
        {showHair && <HairStyle style={look.hairStyle} color={look.hair} />}
        <Eyes type={look.eyes} big={species === 'alien' ? 1.6 : 1} robot={species === 'robot'} />
        {species !== 'robot' &&
          [-0.042, 0.042].map((x) => (
            <mesh key={x} position={[x * 1.6, 0.335, 0.09]}>
              <circleGeometry args={[0.018, 10]} />
              <meshBasicMaterial color="#ff9fb4" transparent opacity={0.55} />
            </mesh>
          ))}
        <Tail species={species} skin={look.skin} />
        <Cape type={look.cape} color={look.capeColor} capeRef={cape} />
        <Accessory type={look.acc} accent={look.accent} wingRef={wings} />
        <Hat type={look.hat} accent={look.accent} />
        {jetpack && <Jetpack thrustRef={thrustRef} />}
      </group>
      {!noPet && look.pet !== 'none' && <Pet type={look.pet} color={look.petColor} movingRef={movingRef} moving={moving} flying={jetpack} />}

      {(name || emote) && (
        <group ref={tagAnchor} position={[0, 0.72, 0]}>
          <Html center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="char-tag" ref={tagEl}>
            <div className="emote-bubble" key={emoteAt} style={{ display: showEmote ? undefined : 'none' }}>{emote}</div>
            {name && <div className={`name-tag ${isMe ? 'is-me' : ''}`}>{name}</div>}
          </div>
          </Html>
        </group>
      )}
    </group>
  );
}
