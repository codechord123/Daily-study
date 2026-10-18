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

const R = PLANET_RADIUS;
const WALK_SPEED = 0.9; // 라디안/초
const MAX_PEERS = 8;
const CHAR_SCALE = 1.3; // 한 별에 정상 표시할 최대 친구 수

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
function Player({ look, name, controlsActive, targetRef, emote }) {
  const group = useRef();
  // 여러 명이 같은 자리에 겹쳐 생기지 않게 카메라 앞쪽 근처에 흩어 놓는다
  const pos = useRef(latLonToVec(45 + Math.random() * 15, (Math.random() - 0.5) * 70));
  const facing = useRef(new THREE.Vector3(0, 0, 1));
  const moving = useRef(false);
  const keys = useRef({});
  const lastSent = useRef(0);
  const { camera } = useThree();

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
    const k = keys.current;
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

    // 걷는 동안 카메라가 부드럽게 따라온다 (직접 돌리는 중엔 멈춤)
    if (moving.current && !controlsActive.current) {
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
      <Character look={look} movingRef={moving} name={name} isMe emote={emote?.e} emoteAt={emote?.at} scale={CHAR_SCALE} />
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

export default function PlanetScene({ ownerId, editable, emote }) {
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
        select(uid);
        showToast('별에 놓았어요');
      }
    } else if (movingUid) {
      moveItem(movingUid, lat, lon);
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
        targetRef={walkTarget}
        emote={emote}
      />
      {peerIds.map((sid, i) => (
        <Peer key={sid} sid={sid} ghost={i >= MAX_PEERS} />
      ))}
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={4.2}
        maxDistance={14}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        onStart={() => (controlsActive.current = true)}
        onEnd={() => (controlsActive.current = false)}
      />
      <CameraIntro controls={controls} />
    </>
  );
}
