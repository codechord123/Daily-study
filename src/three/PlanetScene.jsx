// 한 별 위의 장면: 별 + 소품 + 나 + 같은 별에 있는 친구들
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import Planet, { cameraLightDir, ITEM_SCALE } from './Planet';
import { blobShadow, glow } from './materials';
import { DistantPlanets } from './SkyExtras';
import { MODELS } from './items/models';
import { ITEM_BY_ID } from '../data/items';
import { priceOf } from '../store/classSettings';

import Character from './Character';
import { latLonToVec, vecToLatLon, lookAlongSurface, stepToward, surfaceQuaternion } from './sphere';
import { PLANET_RADIUS, NEON } from '../theme/tokens';
import { createRig, rigDrag, rigUpdate, rigAdopt } from './cameraRig';
import * as presence from '../services/presence';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { getPlanet, onPlanetChange } from '../store/profileStore';
import { studentById } from '../data/classroom';
import Sparks from './Sparks';
import MissionOrbit from './MissionOrbit';
import StudyStation from './StudyStation';
import { dueReviews } from '../store/learnStore';
import { sfx } from '../services/sound';

const R = PLANET_RADIUS;
const WALK_SPEED = 0.9; // 라디안/초
const MAX_PEERS = 8; // 한 별에 정상 표시할 최대 친구 수
const CHAR_SCALE = 1.3;
const MISSION_DIST = 8; // 가로 화면
const MISSION_DIST_TALL = 13.5;
const LOOK_DIST = 5.2; // 내 모습 꾸미기: 캐릭터를 크게
const BASE_DIST = 8.54; // 기본 카메라 거리
let hinted = false; // 확대 카메라 안내는 한 번만
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3();
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
function Player({ look, name, targetRef, emote, inMission, lookFocus }) {
  const group = useRef();
  const react = useRef(); // 미션 반응(점프·갸웃) 전용
  const fx = useUI((s) => s.mission.fx);
  // 가까이 따라갈 때는 내 이름표가 머리를 가리므로 숨긴다
  const close = (useUI((s) => s.zoom < FOLLOW_ZOOM) && !inMission) || lookFocus; // 내 모습 꾸미기도 가까이 본다
  // 여러 명이 같은 자리에 겹쳐 생기지 않게 카메라 앞쪽 근처에 흩어 놓는다
  const pos = useRef(latLonToVec(45 + Math.random() * 15, (Math.random() - 0.5) * 70));
  const facing = useRef(new THREE.Vector3(0, 0, 1));
  const moving = useRef(false);
  const keys = useRef({});
  const lastSent = useRef(0);
  const { camera, size, gl } = useThree();
  // 별 위 카메라 (멀리 보기 ↔ 따라가기를 하나로). 처음엔 멀리서 날아 들어온다
  const rig = useRef(null);
  if (!rig.current) {
    camera.position.set(0, 4.6, 7.2).setLength(22);
    camera.up.set(0, 1, 0);
    rig.current = createRig(camera);
  }
  const wasPosing = useRef(false);
  const lookAim = useRef(new THREE.Vector3());
  if (import.meta.env.DEV) window.__planetCam = { camera, rig: rig.current, pos }; // 테스트용
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

  // 카메라 끌기: 한 손가락/마우스로 돌리고, 두 손가락은 비틀어 돌리기 + 함께 밀어 돌리기 (벌리기·오므리기는 확대)
  useEffect(() => {
    const el = gl.domElement;
    const pts = new Map();
    const down = (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
      rig.current.dragging = pts.size > 0;
      rig.current.vYaw = rig.current.vPitch = 0;
    };
    const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
    const move = (e) => {
      const last = pts.get(e.pointerId);
      if (!last) return;
      const now = performance.now();
      const before = pts.size === 2 ? [...pts.values()].map((v) => ({ ...v })) : null;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: now });
      if (useUI.getState().draggingItem) return;
      if (pts.size === 1) return rigDrag(rig.current, dx, dy, now - last.t, el.clientHeight);
      if (pts.size === 2 && before) {
        const after = [...pts.values()];
        // 비틀기: 두 손가락 사이 각도가 바뀐 만큼 별을 돌린다 (돌린 방향 그대로 따라 돈다)
        let da = angle(after[0], after[1]) - angle(before[0], before[1]);
        da = Math.atan2(Math.sin(da), Math.cos(da));
        rig.current.twist += da;
        rig.current.lastInput = now;
        // 두 손가락을 함께 밀면 한 손가락처럼 돌린다 (가운데 점의 움직임, 손가락 하나 몫이라 절반)
        rigDrag(rig.current, dx / 2, dy / 2, 0, el.clientHeight);
      }
    };
    const up = (e) => {
      pts.delete(e.pointerId);
      rig.current.dragging = pts.size > 0;
      if (pts.size) rig.current.vYaw = rig.current.vPitch = 0;
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [gl]);

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
      // 카메라는 거의 옆에서(살짝 위) 별을 본다. 좌우로 끌면 돌려 볼 수 있다
      {
        const rg = rig.current;
        if (rg.yaw + rg.twist) camera.position.applyAxisAngle(WORLD_UP, rg.yaw + rg.twist);
        rg.yaw = rg.pitch = rg.twist = 0;
        const cur = camera.position.clone().normalize();
        const flat = new THREE.Vector3(cur.x, 0, cur.z);
        if (flat.lengthSq() < 1e-4) flat.set(0, 0, 1);
        flat.normalize();
        const want = flat.multiplyScalar(Math.cos(0.22)).add(new THREE.Vector3(0, Math.sin(0.22), 0));
        cur.lerp(want, 1 - Math.exp(-dt * 2)).normalize();
        const dist = THREE.MathUtils.damp(camera.position.length(), lookFocus ? LOOK_DIST : missionDist, 2, dt);
        camera.position.copy(cur.multiplyScalar(dist));
        camera.up.lerp(WORLD_UP, 1 - Math.exp(-dt * 8)).normalize();
        // 내 모습: 캐릭터 얼굴 쪽을 보아 화면 밖으로 잘리지 않게 / 미션: 별 전체
        const lt = lookAim.current;
        lt.lerp(lookFocus ? p.clone().multiplyScalar(R + 0.45) : ORIGIN, 1 - Math.exp(-dt * 4));
        camera.lookAt(lt);
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

    // 별 위 카메라: 확대 값 하나로 멀리 보기 ↔ 캐릭터 따라가기를 이어서 움직인다
    if (wasPosing.current && !posing) rigAdopt(rig.current, camera, p, R); // 미션·내 모습 뒤 지금 자리에서 이어받기
    wasPosing.current = posing;
    if (!posing) {
      const aspect = size.width / size.height;
      const fit = aspect < 1 ? Math.min(1.7, 0.75 / aspect) : 1;
      rigUpdate(rig.current, camera, {
        dt,
        p,
        facing: facing.current,
        moving: moving.current,
        zoom: useUI.getState().zoom,
        R,
        base: BASE_DIST * fit,
        decorating: useGame.getState().mode === 'decorate',
      });
      if (!hinted && rig.current.f > 0.5) {
        hinted = true;
        useUI.getState().showToast('끌어서 둘러보기 · 탭해서 걷기');
      }
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} material={blobShadow()} scale={0.46} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={react}>
        <Character look={look} movingRef={moving} name={close ? null : name} isMe emote={emote?.e} emoteAt={emote?.at} scale={CHAR_SCALE} />
      </group>
      <Sparks trigger={fx && fx.kind !== 'wrong' ? fx.at : 0} position={[0, 0.55, 0]} power={fx?.kind === 'complete' ? 1.6 : 1} />
    </group>
  );
}

/* ---------- 끌어 놓기 받는 곳: 손가락 아래 별 표면에 미리 보기, 놓으면 설치 ---------- */
function DropTarget({ onDrop }) {
  const { camera, gl } = useThree();
  const itemId = useUI((s) => s.drag?.itemId);
  const ghost = useRef();
  const hitN = useRef(null);
  const tools = useMemo(() => ({ ray: new THREE.Raycaster(), sphere: new THREE.Sphere(new THREE.Vector3(), R), hit: new THREE.Vector3() }), []);
  const Model = itemId ? MODELS[ITEM_BY_ID[itemId]?.model] : null;
  useFrame(({ clock }) => {
    const d = useUI.getState().drag;
    const g = ghost.current;
    if (!d) {
      if (g) g.visible = false;
      return;
    }
    // 꾸미기 창 위에서는 놓지 않는다 (별 그림 위일 때만)
    const over = document.elementFromPoint(d.x, d.y) === gl.domElement;
    const r = gl.domElement.getBoundingClientRect();
    tools.ray.setFromCamera({ x: ((d.x - r.left) / r.width) * 2 - 1, y: -((d.y - r.top) / r.height) * 2 + 1 }, camera);
    const n = over && tools.ray.ray.intersectSphere(tools.sphere, tools.hit) ? tools.hit.clone().normalize() : null;
    hitN.current = n;
    if (g) {
      g.visible = !!n;
      if (n) {
        g.position.copy(n).multiplyScalar(R * 0.995);
        g.quaternion.copy(surfaceQuaternion(n, 0));
        g.scale.setScalar(1 + Math.sin(clock.elapsedTime * 8) * 0.04);
      }
    }
    if (d.drop) {
      useUI.setState({ drag: null });
      if (n) onDrop(d, vecToLatLon(n));
      else useUI.getState().showToast('별 위에 놓아 주세요');
    }
  });
  if (!Model) return null;
  return (
    <group ref={ghost} visible={false}>
      <group scale={ITEM_SCALE}>
        <Model />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={glow(NEON.cyan, 1.6)}>
        <ringGeometry args={[0.24, 0.29, 32]} />
      </mesh>
    </group>
  );
}

/* ---------- 빛: 보는 쪽 왼쪽 위에서 따뜻한 빛, 반대편 아래에서 푸른 보조광 ---------- */
function CameraLights() {
  const key = useRef();
  const fill = useRef();
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    cameraLightDir(camera, dir);
    key.current?.position.copy(dir).multiplyScalar(12);
    fill.current?.position.copy(dir).multiplyScalar(-10).add(camera.up.clone().multiplyScalar(-3));
  });
  return (
    <>
      <hemisphereLight args={['#d9d2ff', '#4a3f7a', 0.55]} />
      <ambientLight intensity={0.45} color="#c9c3ff" />
      <directionalLight ref={key} intensity={1.7} color="#fff1d6" />
      <directionalLight ref={fill} intensity={0.4} color="#7fb6ff" />
    </>
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
      {!ghost && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} material={blobShadow()} scale={0.46} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      )}
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
    const oy = look ? (sideDecor ? 0 : h * 0.2 * k.current) : wide ? 0 : h * 0.2 * k.current; // 내 모습: 캐릭터를 아래 창 위쪽에
    camera.setViewOffset(w, h, ox, oy, w, h);
  });
  useEffect(() => () => camera.clearViewOffset(), [camera]);
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
  const walkTarget = useRef(null);
  const decorating = editable && mode === 'decorate';
  const lookFocus = useUI((s) => s.lookFocus) && decorating;

  // 이 별에 들어왔다고 알림
  useEffect(() => {
    presence.join(profile.sid, ownerId, profile.planet.character);
  }, [ownerId, profile.sid, profile.planet.character]);

  // 고른 소품 끌어 옮기기: 손가락 아래 별 표면 위치로 계속 옮긴다
  const { camera: cam, gl } = useThree();
  const startItemDrag = (uid, ev) => {
    if (!decorating) return;
    useUI.getState().setDraggingItem(true);
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const sphere = new THREE.Sphere(new THREE.Vector3(), R);
    const hit = new THREE.Vector3();
    let moved = false;
    const move = (e) => {
      if (e.pointerId !== ev.pointerId) return;
      const r = el.getBoundingClientRect();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, cam);
      if (!ray.ray.intersectSphere(sphere, hit)) return;
      const { lat, lon } = vecToLatLon(hit.normalize());
      moveItem(uid, lat, lon);
      moved = true;
    };
    const end = (e) => {
      if (e.pointerId !== ev.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      useUI.getState().setDraggingItem(false);
      if (moved) sfx('place');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  // 가방·상점 카드를 끌어 놓았을 때: 상점이면 사서 바로 놓는다
  const dropItem = (d, { lat, lon }) => {
    const g = useGame.getState();
    if (d.from === 'shop') {
      const price = priceOf(ITEM_BY_ID[d.itemId]?.price ?? 0);
      if (g.profile.stardust < price) return showToast(`별가루가 ${price - g.profile.stardust}개 더 필요해요`);
      if (!g.buyItem(d.itemId)) return;
      sfx('buy');
    }
    const uid = useGame.getState().placeItem(d.itemId, lat, lon);
    if (!uid) return;
    useUI.setState({ popUid: uid, heldItem: null });
    sfx('place');
    select(uid);
    showToast('별에 놓았어요');
  };

  const onSurfaceTap = (n) => {
    if (!decorating) {
      walkTarget.current = n;
      return;
    }
    const { lat, lon } = vecToLatLon(n);
    if (heldItem) {
      const uid = placeItem(heldItem, lat, lon);
      if (uid) {
        useUI.setState({ popUid: uid });
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
      <CameraLights />
      {decorating && <DropTarget onDrop={dropItem} />}
      <DistantPlanets ownerId={ownerId} count={useUI.getState().quality === 'low' ? 5 : 9} />
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
        onItemDrag={decorating ? startItemDrag : undefined}
        onSurfaceTap={onSurfaceTap}
        highlight={decorating && (heldItem || movingUid) ? 1 : 0}
      />
      <Player
        look={profile.planet.character}
        name={studentById(profile.sid)?.nickname}
        targetRef={walkTarget}
        emote={emote}
        inMission={inMission}
        lookFocus={lookFocus}
      />
      {inMission && <MissionOrbit />}
      {/* 내 별에서만: 궤도를 도는 문제 정거장 (오답·다시 볼 문제 수 표시) */}
      {!inMission && !decorating && profile.sid === ownerId && (
        <StudyStation badge={(profile.wrongNotes ?? []).filter((n) => !n.cleared).length || dueReviews(profile.sid, 99).length} />
      )}
      <MissionViewOffset active={!!inMission} look={lookFocus} decor={decorating} />
      {/* 내 모습을 꾸밀 때는 친구가 앞을 가리지 않게 잠깐 숨긴다 */}
      {!lookFocus && peerIds.map((sid, i) => (
        <Peer key={sid} sid={sid} ghost={i >= MAX_PEERS} />
      ))}

    </>
  );
}
