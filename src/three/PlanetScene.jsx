// 한 별 위의 장면: 별 + 소품 + 나 + 같은 별에 있는 친구들
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Planet from './Planet';
import Character from './Character';
import { latLonToVec, vecToLatLon, lookAlongSurface, stepToward } from './sphere';
import { PLANET_RADIUS } from '../theme/tokens';
import * as presence from '../services/presence';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { getPlanet, onPlanetChange } from '../store/profileStore';
import { studentById } from '../data/classroom';
import Sparks from './Sparks';
import MissionOrbit from './MissionOrbit';
import { sfx } from '../services/sound';

const R = PLANET_RADIUS;
const WALK_SPEED = 0.9; // 라디안/초
const MAX_PEERS = 8; // 한 별에 정상 표시할 최대 친구 수
const CHAR_SCALE = 1.3;
const MISSION_DIST = 8; // 가로 화면
const MISSION_DIST_TALL = 13.5;
const LOOK_DIST = 5.2; // 내 모습 꾸미기: 캐릭터를 크게
const BASE_DIST = 8.54; // 기본 카메라 거리
const FOLLOW_ZOOM = 0.8; // 이보다 더 확대하면 캐릭터 뒤를 따라가는 카메라 // 세로 화면: 위쪽 40%에 별 전체가 들어오게

/** 내 별이면 내 프로필에서, 친구 별이면 저장소에서 읽고 변경을 구독 */
export function usePlanetData(ownerId) {
  const profile = useGame((s) => s.profile);
  const isMine = profile?.sid === ownerId;
  const [planet, setPlanet] = useState(() => (isMine ? profile.planet : getPlanet(ownerId)));
  useEffect(() => {
    if (isMine) return setPlanet(profile.planet);
    setPlanet(getPlanet(ownerId));
    return onPlanetChange((sid) => sid === ownerId && setPlanet(getPlanet(ownerId)));
  }, [ownerId, isMine, profile?.planet]);
  return planet;
}

/** 이 별에 있는 친구 sid 목록. 들어오고 나갈 때만 다시 그린다 (위치는 프레임마다 직접 읽음) */
export function usePeerIds(planetId) {
  const [ids, setIds] = useState(() => presence.peersOn(planetId).map((p) => p.sid));
  useEffect(() => {
    const up = () => {
      const next = presence.peersOn(planetId).map((p) => p.sid);
      setIds((prev) => (prev.join() === next.join() ? prev : next));
    };
    up();
    return presence.subscribe(up);
  }, [planetId]);
  return ids;
}

/* ---------- 나 (조작 가능한 캐릭터) ---------- */
function Player({ look, name, controlsActive, controls, targetRef, emote, inMission, lookFocus }) {
  const group = useRef();
  const react = useRef(); // 미션 반응(점프·갸웃) 전용
  const fx = useUI((s) => s.mission.fx);
  // 여러 명이 같은 자리에 겹쳐 생기지 않게 카메라 앞쪽 근처에 흩어 놓는다
  const pos = useRef(latLonToVec(45 + Math.random() * 15, (Math.random() - 0.5) * 70));
  const facing = useRef(new THREE.Vector3(0, 0, 1));
  const moving = useRef(false);
  const keys = useRef({});
  const lastSent = useRef(0);
  const { camera, size } = useThree();
  const missionDist = size.width / size.height > 1.1 ? MISSION_DIST : MISSION_DIST_TALL;

  useEffect(() => {
    const down = (e) => {
      if (e.target.tagName === 'INPUT') return;
      keys.current[e.key] = true;
    };
    const up = (e) => (keys.current[e.key] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, dt) => {
    const posing = inMission || lookFocus;
    const k = posing ? {} : keys.current;
    if (posing) {
      // 어린왕자 그림처럼: 카메라에서 봤을 때 별 꼭대기로 걸어가 선다
      const camDir = camera.position.clone().normalize();
      const top = new THREE.Vector3(0, 1, 0).sub(camDir.clone().multiplyScalar(camDir.y)).normalize();
      const goal = top.add(camDir.multiplyScalar(0.3)).normalize();
      targetRef.current = pos.current.angleTo(goal) > 0.03 ? goal : null;
    }
    const n = pos.current;
    // 키보드(크롬북): ↑↓ 앞뒤, ←→ 방향 돌리기
    const turn = (k.ArrowLeft || k.a ? 1 : 0) - (k.ArrowRight || k.d ? 1 : 0);
    const fwd = (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
    if (turn) facing.current.applyAxisAngle(n, turn * 2.4 * dt);
    if (fwd) {
      targetRef.current = null;
      const axis = new THREE.Vector3().crossVectors(n, facing.current).normalize();
      pos.current = n.clone().applyAxisAngle(axis, fwd * WALK_SPEED * 0.8 * dt).normalize();
    } else if (targetRef.current) {
      const t = targetRef.current;
      const dir = t.clone().sub(n);
      if (dir.lengthSq() > 1e-6) facing.current.copy(dir);
      pos.current = stepToward(n, t, WALK_SPEED * dt);
      if (pos.current.angleTo(t) < 0.01) targetRef.current = null;
    }
    moving.current = !!fwd || !!targetRef.current;
    // 접선 방향으로 정리 (극점 근처에서 뒤집히지 않게)
    const p = pos.current;
    facing.current.sub(p.clone().multiplyScalar(facing.current.dot(p))).normalize();

    group.current.position.copy(p).multiplyScalar(R);
    group.current.quaternion.slerp(lookAlongSurface(p, facing.current), 1 - Math.exp(-dt * 12));

    if (posing) {
      // 카메라는 거의 옆에서(살짝 위) 별을 본다
      if (!controlsActive.current) {
        const cur = camera.position.clone().normalize();
        const flat = new THREE.Vector3(cur.x, 0, cur.z);
        if (flat.lengthSq() < 1e-4) flat.set(0, 0, 1);
        flat.normalize();
        const want = flat.multiplyScalar(Math.cos(0.22)).add(new THREE.Vector3(0, Math.sin(0.22), 0));
        cur.lerp(want, 1 - Math.exp(-dt * 2)).normalize();
        const dist = THREE.MathUtils.damp(camera.position.length(), lookFocus ? LOOK_DIST : missionDist, 2, dt);
        camera.position.copy(cur.multiplyScalar(dist));
      }
      // 도착하면 카메라 쪽을 바라본다
      if (!targetRef.current) {
        const toCam = camera.position.clone().normalize();
        facing.current.lerp(toCam.sub(p.clone().multiplyScalar(toCam.dot(p))), 1 - Math.exp(-dt * 4));
      }
    }

    // 미션 반응 연출
    const r = react.current;
    const f = useUI.getState().mission.fx;
    const age = f ? (performance.now() - f.at) / 1000 : 99;
    let hop = 0;
    let spinY = 0;
    let tiltZ = 0;
    if (f?.kind === 'correct' && age < 0.7) {
      const u = age / 0.7;
      hop = Math.sin(u * Math.PI) * 0.45;
      spinY = (1 - Math.pow(1 - u, 3)) * Math.PI * 2;
    } else if (f?.kind === 'wrong' && age < 0.9) {
      tiltZ = Math.sin(age * 9) * 0.28 * (1 - age / 0.9); // 고개 갸웃
    } else if (f?.kind === 'complete' && age < 2.4) {
      hop = Math.abs(Math.sin(age * Math.PI * 2.5)) * 0.35; // 신나서 콩콩
    }
    r.position.y = hop;
    r.rotation.y = spinY;
    r.rotation.z = tiltZ;

    // 많이 확대하면: 별 중심이 아니라 캐릭터 뒤에서 따라가는 카메라
    const z = useUI.getState().zoom;
    const follow = z < FOLLOW_ZOOM && !posing;
    if (controls.current) controls.current.enabled = !follow;
    if (follow) {
      // 캐릭터 뒤 위쪽에서, 캐릭터 조금 앞을 바라본다 (가는 길이 보이게)
      const back = THREE.MathUtils.mapLinear(z, 0.55, FOLLOW_ZOOM, 2.4, 4.4);
      const look = p.clone().multiplyScalar(R + 0.15).addScaledVector(facing.current, 0.2);
      const want = p
        .clone()
        .multiplyScalar(R + 0.6 + back * 0.5)
        .addScaledVector(facing.current, -back);
      camera.position.lerp(want, 1 - Math.exp(-dt * 4));
      camera.lookAt(look);
    }

    // 걷는 동안 카메라가 부드럽게 따라온다 (직접 돌리는 중엔 멈춤)
    if (moving.current && !controlsActive.current && !posing && !follow) {
      const dist = camera.position.length();
      const want = p.clone().add(new THREE.Vector3(0, 0.35, 0)).normalize();
      const cur = camera.position.clone().normalize();
      cur.lerp(want, 1 - Math.exp(-dt * 1.4)).normalize();
      camera.position.copy(cur.multiplyScalar(dist));
    }

    // 실시간 위치 전송: 초당 5회
    const now = state.clock.elapsedTime;
    if (now - lastSent.current > 0.2) {
      lastSent.current = now;
      presence.update({ pos: p.toArray().map((v) => +v.toFixed(3)), moving: moving.current });
    }
  });

  return (
    <group ref={group}>
      <group ref={react}>
        <Character look={look} movingRef={moving} name={name} isMe emote={emote?.e} emoteAt={emote?.at} scale={CHAR_SCALE} />
      </group>
      <Sparks trigger={fx && fx.kind !== 'wrong' ? fx.at : 0} position={[0, 0.55, 0]} power={fx?.kind === 'complete' ? 1.6 : 1} />
    </group>
  );
}

/* ---------- 친구 (실시간 위치를 부드럽게 따라감) ---------- */
function Peer({ sid, ghost }) {
  const group = useRef();
  const cur = useRef(null);
  const facing = useRef(new THREE.Vector3(0, 0, 1));
  const moving = useRef(false);
  const [info, setInfo] = useState(() => presence.getPeer(sid));
  const nick = studentById(sid)?.nickname;

  // 이모트·옷차림이 바뀔 때만 다시 그림
  useEffect(
    () =>
      presence.subscribe(() => {
        const p = presence.getPeer(sid);
        if (!p) return;
        setInfo((prev) => (prev && prev.emoteAt === p.emoteAt && JSON.stringify(prev.character) === JSON.stringify(p.character) ? prev : p));
      }),
    [sid],
  );

  useFrame((_, dt) => {
    const p = presence.getPeer(sid);
    if (!p?.pos || !group.current) return;
    const target = new THREE.Vector3().fromArray(p.pos).normalize();
    if (!cur.current) cur.current = target.clone();
    const prev = cur.current.clone();
    cur.current = stepToward(cur.current, target, Math.max(WALK_SPEED * dt, cur.current.angleTo(target) * dt * 6));
    const d = cur.current.clone().sub(prev);
    moving.current = d.lengthSq() > 1e-8;
    if (moving.current) facing.current.copy(d);
    const n = cur.current;
    facing.current.sub(n.clone().multiplyScalar(facing.current.dot(n))).normalize();
    group.current.visible = true;
    group.current.position.copy(n).multiplyScalar(R);
    group.current.quaternion.slerp(lookAlongSurface(n, facing.current), 1 - Math.exp(-dt * 10));
  });

  if (!info) return null;
  return (
    <group ref={group} visible={false}>
      {ghost ? (
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshBasicMaterial color="#cfe9ff" transparent opacity={0.35} />
        </mesh>
      ) : (
        <Character scale={CHAR_SCALE} look={info.character} movingRef={moving} name={nick} emote={info.emote} emoteAt={info.emoteAt} />
      )}
    </group>
  );
}

/* ---------- 미션 중엔 별을 카드 옆(가로)·위(세로)로 비켜 그린다 ---------- */
function MissionViewOffset({ active, look, decor }) {
  const { camera, size } = useThree();
  const k = useRef(0);
  useFrame((_, dt) => {
    const { width: vw, height: vh } = size;
    const side = vw >= 900 && vw / vh > 1.1;
    const goal = active || look || (decor && side) ? 1 : 0;
    if (Math.abs(k.current - goal) < 0.001 && goal === 0) {
      if (camera.view?.enabled) {
        camera.clearViewOffset();
        k.current = 0;
      }
      return;
    }
    k.current = THREE.MathUtils.damp(k.current, goal, 4, dt);
    const { width: w, height: h } = size;
    const wide = w / h > 1.1;
    // 확대 없이 화면만 비켜 그린다. 가로: 별을 왼쪽으로 / 세로: 별을 위로
    // 내 모습 꾸미기: 아래 꾸미기 창 위쪽에 캐릭터가 오도록 장면을 내린다
    // 넓은 화면은 꾸미기 창이 오른쪽에 있으니 왼쪽으로, 좁은 화면은 아래 창 위로
    const sideDecor = w >= 900 && wide;
    const ox = look || decor ? (sideDecor ? w * 0.2 * k.current : 0) : wide ? w * 0.21 * k.current : 0;
    const oy = look ? (sideDecor ? 0 : -h * 0.3 * k.current) : wide ? 0 : h * 0.2 * k.current;
    camera.setViewOffset(w, h, ox, oy, w, h);
  });
  useEffect(() => () => camera.clearViewOffset(), [camera]);
  return null;
}

/* ---------- ＋/－ 버튼·휠 확대: 카메라 거리를 부드럽게 바꾼다 ---------- */
function ZoomSync({ controls, posing }) {
  const { camera, size } = useThree();
  const zoom = useUI((s) => s.zoom);
  const last = useRef(zoom);
  const goal = useRef(null);
  useEffect(() => {
    if (zoom === last.current) return;
    last.current = zoom;
    if (zoom < FOLLOW_ZOOM) {
      goal.current = null; // 가까이: 캐릭터 따라가기 카메라가 맡는다
      return;
    }
    const aspect = size.width / size.height;
    const fit = aspect < 1 ? Math.min(1.7, 0.75 / aspect) : 1;
    goal.current = THREE.MathUtils.clamp(BASE_DIST * fit * zoom, 4.2, 16);
  }, [zoom, size]);
  useFrame((_, dt) => {
    if (goal.current === null || posing) return;
    const d = THREE.MathUtils.damp(camera.position.length(), goal.current, 6, dt);
    camera.position.setLength(d);
    controls.current?.update();
    if (Math.abs(d - goal.current) < 0.01) goal.current = null;
  });
  return null;
}

/* ---------- 카메라: 멀리서 날아 들어오는 연출 ---------- */
function CameraIntro({ controls }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const fit = aspect < 1 ? Math.min(1.7, 0.75 / aspect) : 1;
  const t = useRef(0);
  useEffect(() => {
    camera.position.set(0, 6, 22);
    t.current = 0;
  }, [camera]);
  useFrame((_, dt) => {
    if (t.current >= 1) return;
    t.current = Math.min(1, t.current + dt / 1.4);
    const e = 1 - Math.pow(1 - t.current, 3);
    const from = new THREE.Vector3(0, 6, 22);
    const to = new THREE.Vector3(0, 4.6, 7.2).multiplyScalar(fit);
    camera.position.lerpVectors(from, to, e);
    controls.current?.update();
  });
  return null;
}

export default function PlanetScene({ ownerId, editable, emote, inMission }) {
  const profile = useGame((s) => s.profile);
  const mode = useGame((s) => s.mode);
  const placeItem = useGame((s) => s.placeItem);
  const moveItem = useGame((s) => s.moveItem);
  const { heldItem, selectedUid, movingUid, select, clearDecor, showToast } = useUI();
  const planet = usePlanetData(ownerId);
  const peerIds = usePeerIds(ownerId);
  const controls = useRef();
  const controlsActive = useRef(false);
  const walkTarget = useRef(null);
  const decorating = editable && mode === 'decorate';
  const lookFocus = useUI((s) => s.lookFocus) && decorating;

  // 이 별에 들어왔다고 알림
  useEffect(() => {
    presence.join(profile.sid, ownerId, profile.planet.character);
  }, [ownerId, profile.sid, profile.planet.character]);

  const onSurfaceTap = (n) => {
    if (!decorating) {
      walkTarget.current = n;
      return;
    }
    const { lat, lon } = vecToLatLon(n);
    if (heldItem) {
      const uid = placeItem(heldItem, lat, lon);
      if (uid) {
        sfx('place');
        select(uid);
        showToast('별에 놓았어요');
      }
    } else if (movingUid) {
      moveItem(movingUid, lat, lon);
      sfx('place');
      select(movingUid);
    } else clearDecor();
  };


  return (
    <>
      <ambientLight intensity={0.85} color="#c9c3ff" />
      <directionalLight position={[6, 8, 5]} intensity={1.6} color="#fff1d6" />
      <directionalLight position={[-6, -3, -4]} intensity={0.35} color="#7fb6ff" />
      <Planet
        tint={planet.tint}
        ring={planet.ring}
        moon={planet.moon}
        aura={planet.aura}
        pattern={planet.pattern}
        ambient={planet.ambient}
        items={planet.items}
        selectedUid={decorating ? selectedUid : null}
        onItemTap={decorating ? select : undefined}
        onSurfaceTap={onSurfaceTap}
        highlight={decorating && (heldItem || movingUid) ? 1 : 0}
      />
      <Player
        look={profile.planet.character}
        name={studentById(profile.sid)?.nickname}
        controlsActive={controlsActive}
        controls={controls}
        targetRef={walkTarget}
        emote={emote}
        inMission={inMission}
        lookFocus={lookFocus}
      />
      {inMission && <MissionOrbit />}
      <MissionViewOffset active={!!inMission} look={lookFocus} decor={decorating} />
      {peerIds.map((sid, i) => (
        <Peer key={sid} sid={sid} ghost={i >= MAX_PEERS} />
      ))}
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom={false}
        minDistance={4.2}
        maxDistance={inMission ? 16 : 14}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        onStart={() => (controlsActive.current = true)}
        onEnd={() => (controlsActive.current = false)}
      />
      <CameraIntro controls={controls} />
      <ZoomSync controls={controls} posing={inMission || lookFocus} />
    </>
  );
}
