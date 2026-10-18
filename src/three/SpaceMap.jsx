// 우주 지도: 반 친구들의 별이 떠 있고, 탭하면 그 별로 날아간다
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import Planet, { TAP_SLOP } from './Planet';
import { ROSTER, mapPosition } from '../data/classroom';
import { getPlanet, onPlanetChange } from '../store/profileStore';
import * as presence from '../services/presence';
import { glow } from './materials';
import { NEON } from '../theme/tokens';

const MAP_R = 0.9;

function useOnlineMap() {
  const [map, setMap] = useState(presence.onlineMap);
  useEffect(
    () =>
      presence.subscribe(() => {
        const next = presence.onlineMap();
        setMap((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      }),
    [],
  );
  return map;
}

function MapPlanet({ student, index, mine, online, onPick, low }) {
  const [planet, setPlanet] = useState(() => getPlanet(student.id));
  useEffect(() => onPlanetChange((sid) => sid === student.id && setPlanet(getPlanet(student.id))), [student.id]);
  const spin = useRef();
  const pos = useMemo(() => mapPosition(index), [index]);
  const speed = useMemo(() => 0.08 + (index % 5) * 0.03, [index]);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * speed;
  });

  return (
    <group position={pos}>
      <group
        ref={spin}
        onClick={(e) => {
          if (e.delta > TAP_SLOP) return;
          e.stopPropagation();
          onPick(student.id, pos);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* 지도에서는 소품을 빼서 24개 별도 가볍게 (저사양이면 더 거칠게) */}
        <Planet tint={planet.tint} items={low ? null : planet.items} radius={MAP_R} detail={low ? 24 : 40} highlight={online ? 1 : 0} />
      </group>
      {(mine || online > 0) && (
        <mesh rotation={[Math.PI / 2, 0, 0]} material={glow(mine ? NEON.gold : NEON.cyan, 1.2)}>
          <torusGeometry args={[MAP_R * 1.45, 0.025, 6, 48]} />
        </mesh>
      )}
      <Html position={[0, MAP_R + 0.55, 0]} center distanceFactor={26} style={{ pointerEvents: 'none' }}>
        <div className={`map-label ${mine ? 'is-me' : ''} ${online ? 'is-online' : ''}`}>
          {mine ? '내 별' : student.nickname}
          {online > 0 && <span className="map-dot">{online}</span>}
        </div>
      </Html>
    </group>
  );
}

// 고른 별로 카메라가 날아간 뒤 onArrive 호출
function FlyTo({ target, onArrive, controls }) {
  const { camera } = useThree();
  const t = useRef(0);
  const from = useRef(null);
  const arrived = useRef(false);
  useEffect(() => {
    t.current = 0;
    arrived.current = false;
    from.current = { pos: camera.position.clone(), look: controls.current?.target.clone() ?? new THREE.Vector3() };
  }, [target, camera, controls]);
  useFrame((_, dt) => {
    if (!target || !from.current) return;
    t.current = Math.min(1, t.current + dt / 1.1);
    const e = t.current * t.current * (3 - 2 * t.current);
    const goal = new THREE.Vector3(...target);
    const camGoal = goal.clone().add(new THREE.Vector3(0, 0.6, 2.2));
    camera.position.lerpVectors(from.current.pos, camGoal, e);
    controls.current?.target.lerpVectors(from.current.look, goal, e);
    if (t.current >= 1 && !arrived.current) {
      arrived.current = true;
      onArrive();
    }
  });
  return null;
}

export default function SpaceMap({ meId, onVisit, low }) {
  const online = useOnlineMap();
  const controls = useRef();
  const [flight, setFlight] = useState(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 16, 24);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.9} color="#c9c3ff" />
      <directionalLight position={[10, 14, 8]} intensity={1.5} color="#fff1d6" />
      {ROSTER.map((s, i) => (
        <MapPlanet
          key={s.id}
          student={s}
          index={i}
          mine={s.id === meId}
          online={online[s.id] ?? 0}
          low={low}
          onPick={(sid, pos) => !flight && setFlight({ sid, pos })}
        />
      ))}
      <OrbitControls ref={controls} enablePan={false} enabled={!flight} minDistance={8} maxDistance={60} enableDamping rotateSpeed={0.5} autoRotate={!flight} autoRotateSpeed={0.25} />
      {flight && <FlyTo target={flight.pos} controls={controls} onArrive={() => onVisit(flight.sid)} />}
    </>
  );
}
