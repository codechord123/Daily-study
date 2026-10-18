// 어린왕자 느낌의 꼬마 캐릭터: 큰 머리 + 코트 + 바람에 날리는 목도리
import { useEffect, useReducer, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { toon, glow } from './materials';
import { partColor } from '../data/items';
import { NEON } from '../theme/tokens';

const EMOTE_MS = 2600;

function Hat({ type }) {
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

export default function Character({ look, movingRef, moving, name, emote, emoteAt, isMe, scale = 1, jetpack, thrustRef }) {
  const body = useRef();
  const legL = useRef();
  const legR = useRef();
  const scarf = useRef();

  const skin = partColor('skin', look.skin);
  const hair = partColor('hair', look.hair);
  const coat = partColor('coat', look.coat);
  const scarfC = partColor('scarf', look.scarf);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const isMoving = movingRef ? movingRef.current : moving;
    const sp = isMoving ? 11 : 2;
    if (body.current) body.current.position.y = isMoving ? Math.abs(Math.sin(t * sp)) * 0.035 : Math.sin(t * sp) * 0.006;
    const swing = jetpack ? 0.25 + Math.sin(t * 2.5) * 0.12 : isMoving ? Math.sin(t * sp) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = jetpack ? swing * 0.7 : -swing;
    if (scarf.current) scarf.current.rotation.x = -0.9 - (isMoving ? 0.5 : 0) + Math.sin(t * (isMoving ? 9 : 2.2)) * 0.15;
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
      {/* 다리 */}
      {[[legL, -0.04], [legR, 0.04]].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.09, 0]}>
          <mesh material={toon('#3b3f6e')} position={[0, -0.045, 0]}>
            <capsuleGeometry args={[0.022, 0.05, 4, 6]} />
          </mesh>
        </group>
      ))}
      <group ref={body}>
        {/* 코트 */}
        <mesh material={toon(coat)} position={[0, 0.16, 0]}>
          <coneGeometry args={[0.11, 0.2, 10]} />
        </mesh>
        {/* 목도리 */}
        <mesh material={toon(scarfC)} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.055, 0.022, 6, 14]} />
        </mesh>
        <group ref={scarf} position={[0.03, 0.25, -0.05]}>
          <mesh material={toon(scarfC)} position={[0, -0.07, 0]}>
            <boxGeometry args={[0.04, 0.14, 0.012]} />
          </mesh>
        </group>
        {/* 머리 */}
        <mesh material={toon(skin)} position={[0, 0.37, 0]}>
          <sphereGeometry args={[0.12, 16, 12]} />
        </mesh>
        <mesh material={toon(hair)} position={[0, 0.405, -0.015]} scale={[1.06, 0.82, 1.06]}>
          <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        {/* 삐죽 머리카락 */}
        {[-0.05, 0, 0.05].map((x, i) => (
          <mesh key={x} material={toon(hair)} position={[x, 0.48 - (i === 1 ? 0 : 0.012), 0.03]} rotation={[0.3, 0, x * -6]}>
            <coneGeometry args={[0.025, 0.07, 5]} />
          </mesh>
        ))}
        {/* 눈·볼 */}
        {[-0.042, 0.042].map((x) => (
          <group key={x}>
            <mesh material={toon('#2a2346')} position={[x, 0.37, 0.108]}>
              <sphereGeometry args={[0.014, 8, 6]} />
            </mesh>
            <mesh position={[x * 1.6, 0.335, 0.09]}>
              <circleGeometry args={[0.018, 10]} />
              <meshBasicMaterial color="#ff9fb4" transparent opacity={0.55} />
            </mesh>
          </group>
        ))}
        <Hat type={look.hat} />
        {jetpack && <Jetpack thrustRef={thrustRef} />}
      </group>

      {(name || showEmote) && (
        <Html position={[0, 0.72, 0]} center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="char-tag">
            {showEmote && <div className="emote-bubble" key={emoteAt}>{emote}</div>}
            {name && <div className={`name-tag ${isMe ? 'is-me' : ''}`}>{name}</div>}
          </div>
        </Html>
      )}
    </group>
  );
}
