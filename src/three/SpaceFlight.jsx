// 우주 비행: 추진기를 메고 직접 조종해서 친구 별로 날아간다
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Planet from './Planet';
import Character from './Character';
import { ROSTER, spacePosition, SPACE_BOUNDS, studentById } from '../data/classroom';
import { getPlanet, onPlanetChange } from '../store/profileStore';
import { PLANET_RADIUS, NEON } from '../theme/tokens';
import { glow } from './materials';
import * as input from '../services/flightInput';
import * as presence from '../services/presence';
import { usePeerIds } from './PlanetScene';
import { useUI } from '../store/useUI';

const R = PLANET_RADIUS;
const CHAR_SCALE = 1.3;
const MAX_SPEED = 9;
const BACK_SPEED = 3;
const TURN_RATE = 1.9;
const LIFT_SPEED = 4.5;
const LAND_RANGE = R + 4; // 이 안에 들어오면 "내리기"
const UP = new THREE.Vector3(0, 1, 0);

export const PLANET_POS = Object.fromEntries(ROSTER.map((s, i) => [s.id, new THREE.Vector3(...spacePosition(i))]));

function FlightPlanet({ student, isMine, isTarget, online, playerPos, low }) {
  const [planet, setPlanet] = useState(() => getPlanet(student.id));
  const [near, setNear] = useState(false);
  const [labelOn, setLabelOn] = useState(true);
  useEffect(() => onPlanetChange((sid) => sid === student.id && setPlanet(getPlanet(student.id))), [student.id]);
  const spin = useRef();
  const beacon = useRef();
  const center = PLANET_POS[student.id];
  const lodTimer = useRef(0);

  useFrame((state, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.05;
    if (beacon.current) beacon.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    // 가까운 별만 소품까지 그린다 (0.5초마다 확인)
    lodTimer.current += dt;
    if (lodTimer.current > 0.5) {
      lodTimer.current = 0;
      const d = playerPos.current.distanceTo(center);
      const n = d < (low ? 22 : 45);
      if (n !== near) setNear(n);
      // 바로 옆에선 화면을 가리고, 너무 멀면 어수선하므로 그 사이에서만 이름표를 보인다
      const show = d > R + 7 && d < 75;
      if (show !== labelOn) setLabelOn(show);
    }
  });

  return (
    <group position={center}>
      <group ref={spin}>
        <Planet tint={planet.tint} items={near ? planet.items : null} detail={near ? 64 : 28} highlight={online ? 1 : 0} />
      </group>
      {(isMine || online > 0) && (
        <mesh rotation={[Math.PI / 2, 0, 0]} material={glow(isMine ? NEON.gold : NEON.cyan, 1.2)}>
          <torusGeometry args={[R * 1.5, 0.05, 6, 64]} />
        </mesh>
      )}
      {isTarget && (
        <mesh ref={beacon} position={[0, R + 6, 0]}>
          <cylinderGeometry args={[0.12, 0.5, 12, 12, 1, true]} />
          <meshBasicMaterial color={NEON.gold} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
      {labelOn && <Html position={[0, R + 1.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`map-label ${isMine ? 'is-me' : ''} ${online ? 'is-online' : ''} ${isTarget ? 'is-target' : ''}`}>
          {isMine ? '내 별' : student.nickname}
          {online > 0 && <span className="map-dot">{online}</span>}
        </div>
      </Html>}
    </group>
  );
}

/* 다른 친구도 우주를 날고 있으면 보인다 */
function FlyingPeer({ sid }) {
  const g = useRef();
  const info = presence.getPeer(sid);
  const thrust = useRef(0.5);
  useFrame((_, dt) => {
    const p = presence.getPeer(sid);
    if (!p?.pos || !g.current) return;
    const target = new THREE.Vector3().fromArray(p.pos);
    if (!g.current.visible) g.current.position.copy(target);
    g.current.visible = true;
    g.current.position.lerp(target, 1 - Math.exp(-dt * 8));
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, p.yaw ?? 0, 1 - Math.exp(-dt * 8));
    thrust.current = p.thrust ?? 0.5;
  });
  if (!info) return null;
  return (
    <group ref={g} visible={false}>
      <Character look={info.character} name={studentById(sid)?.nickname} jetpack thrustRef={thrust} scale={CHAR_SCALE} emote={info.emote} emoteAt={info.emoteAt} />
    </group>
  );
}

export default function SpaceFlight({ me, launchFrom, onLand, low }) {
  const { camera } = useThree();
  const target = useUI((s) => s.flightTarget);
  const setNear = useUI((s) => s.setNear);
  const peerIds = usePeerIds('space');
  const [online, setOnline] = useState(presence.onlineMap);

  const body = useRef(); // 위치·방향(yaw)
  const tilt = useRef(); // 기울기(pitch·roll)
  const arrow = useRef();
  const thrust = useRef(0);
  const s = useRef(null);
  if (!s.current) {
    // 출발한 별 위에서, 우주 중심 반대쪽을 보고 시작
    const from = PLANET_POS[launchFrom] ?? PLANET_POS[me.sid];
    const pos = from.clone().add(new THREE.Vector3(0, R + 1.2, 0));
    const away = from.clone().setY(0);
    s.current = {
      pos,
      yaw: away.lengthSq() > 0 ? Math.atan2(away.x, away.z) : 0,
      speed: 0,
      vy: 0,
      lastSent: 0,
      near: null,
      landing: null,
      takeoff: 0,
      ignore: launchFrom, // 막 떠난 별은 한 번 멀어질 때까지 착륙 안내를 띄우지 않는다
    };
  }
  const playerPos = useMemo(() => ({ current: s.current.pos }), []);

  useEffect(() => input.attach(), []);
  useEffect(() => {
    if (import.meta.env.DEV) window.__flight = s.current; // 테스트용
  }, []);
  useEffect(() => {
    presence.join(me.sid, 'space', me.planet.character);
    return () => setNear(null);
  }, [me.sid, me.planet.character, setNear]);
  useEffect(
    () =>
      presence.subscribe(() => {
        const next = presence.onlineMap();
        setOnline((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      }),
    [],
  );

  // 카메라를 처음 위치로
  useEffect(() => {
    const st = s.current;
    const fwd = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw));
    camera.position.copy(st.pos).addScaledVector(fwd, -3).add(new THREE.Vector3(0, 1.2, 0));
    camera.lookAt(st.pos);
  }, [camera]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1); // 느린 기기에서도 실제 시간에 가깝게, 단 순간이동은 막음
    const st = s.current;
    const inp = input.read();
    const fwd = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw));

    if (st.landing) {
      // 착륙 연출: 별 꼭대기로 빨려 들어가듯 내려앉는다
      st.landing.t = Math.min(1, st.landing.t + dt / 1.1);
      const e = st.landing.t * st.landing.t * (3 - 2 * st.landing.t);
      const goal = PLANET_POS[st.landing.sid].clone().add(new THREE.Vector3(0, R + 0.2, 0));
      st.pos.lerpVectors(st.landing.from, goal, e);
      thrust.current = 0.3 * (1 - e);
      if (st.landing.t >= 1 && !st.landing.done) {
        st.landing.done = true;
        onLand(st.landing.sid);
      }
    } else {
      // 이륙 직후 1초는 자동으로 살짝 떠오른다
      st.takeoff = Math.min(1, st.takeoff + dt);
      const autoLift = st.takeoff < 1 ? (1 - st.takeoff) * 1.2 : 0;

      st.yaw -= inp.x * TURN_RATE * dt;
      const want = inp.y >= 0 ? inp.y * MAX_SPEED : inp.y * BACK_SPEED;
      st.speed = THREE.MathUtils.damp(st.speed, want, inp.y ? 2.2 : 1.4, dt);
      st.vy = THREE.MathUtils.damp(st.vy, inp.lift * LIFT_SPEED + autoLift * LIFT_SPEED, 3, dt);
      st.pos.addScaledVector(fwd, st.speed * dt);
      st.pos.y += st.vy * dt;

      // 우주 경계와 별 충돌
      st.pos.y = THREE.MathUtils.clamp(st.pos.y, -25, 25);
      const flat = Math.hypot(st.pos.x, st.pos.z);
      if (flat > SPACE_BOUNDS) {
        st.pos.x *= SPACE_BOUNDS / flat;
        st.pos.z *= SPACE_BOUNDS / flat;
      }
      let nearest = null;
      let nearestD = Infinity;
      for (const sid in PLANET_POS) {
        const c = PLANET_POS[sid];
        const d = st.pos.distanceTo(c);
        if (d < R + 0.7) st.pos.copy(c).add(st.pos.clone().sub(c).setLength(R + 0.7));
        if (sid === st.ignore) {
          if (d > LAND_RANGE + 1) st.ignore = null;
          continue;
        }
        if (d < nearestD) {
          nearestD = d;
          nearest = sid;
        }
      }
      const inRange = nearestD < LAND_RANGE;
      const key = inRange ? nearest : null;
      if (key !== st.near) {
        st.near = key;
        setNear(key);
      }
      if (input.takeLandRequest() && inRange) {
        st.landing = { sid: nearest, from: st.pos.clone(), t: 0 };
        setNear(null);
      }
      thrust.current = Math.min(1, Math.max(Math.abs(st.speed) / MAX_SPEED, Math.abs(st.vy) / LIFT_SPEED, 0.15));
    }

    // 캐릭터 자세: 앞으로 갈수록 숙이고, 돌 때 기울어진다
    body.current.position.copy(st.pos);
    body.current.rotation.y = st.yaw;
    tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, (st.speed / MAX_SPEED) * 0.55, 6, dt);
    tilt.current.rotation.z = THREE.MathUtils.damp(tilt.current.rotation.z, inp.x * 0.45, 6, dt);

    // 목적지 화살표
    if (arrow.current) {
      const goal = target && PLANET_POS[target];
      arrow.current.visible = !!goal && !st.landing && st.pos.distanceTo(goal) > LAND_RANGE;
      if (goal) {
        const aim = goal.clone();
        aim.y = st.pos.y + THREE.MathUtils.clamp(goal.y - st.pos.y, -4, 4);
        arrow.current.lookAt(aim);
      }
    }

    // 뒤에서 따라가는 카메라
    const camGoal = st.pos.clone().addScaledVector(fwd, -5.2).addScaledVector(UP, 2.1);
    if (st.landing) camGoal.copy(PLANET_POS[st.landing.sid]).add(new THREE.Vector3(0, R + 4, 6));
    camera.position.lerp(camGoal, 1 - Math.exp(-dt * (st.landing ? 2 : 3.2)));
    camera.lookAt(st.pos.clone().addScaledVector(UP, 0.6).addScaledVector(fwd, 2));

    // 실시간 위치 전송 (초당 5회)
    if (state.clock.elapsedTime - st.lastSent > 0.2) {
      st.lastSent = state.clock.elapsedTime;
      presence.update({ pos: st.pos.toArray().map((v) => +v.toFixed(2)), yaw: +st.yaw.toFixed(3), thrust: +thrust.current.toFixed(2) });
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} color="#c9c3ff" />
      <directionalLight position={[30, 40, 20]} intensity={1.5} color="#fff1d6" />
      {ROSTER.map((st) => (
        <FlightPlanet
          key={st.id}
          student={st}
          isMine={st.id === me.sid}
          isTarget={st.id === target}
          online={online[st.id] ?? 0}
          playerPos={playerPos}
          low={low}
        />
      ))}
      <group ref={body}>
        <group ref={tilt} position={[0, 0.35, 0]}>
          <group position={[0, -0.35, 0]}>
            <Character look={me.planet.character} jetpack thrustRef={thrust} scale={CHAR_SCALE} name={studentById(me.sid)?.nickname} isMe />
          </group>
        </group>
        <group ref={arrow} position={[0, 1.35, 0]} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]} material={glow(NEON.gold, 1.6)}>
            <coneGeometry args={[0.15, 0.5, 12]} />
          </mesh>
        </group>
      </group>
      {peerIds.map((sid) => (
        <FlyingPeer key={sid} sid={sid} />
      ))}
    </>
  );
}
