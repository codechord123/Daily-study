// 별 위 카메라 하나: 확대 값에 따라 '별 전체 보기'와 '캐릭터 뒤 따라가기'를 끊김 없이 잇는다.
//  - f = 0 별 중심을 보고 돈다 · f = 1 캐릭터 머리 쪽을 보고 뒤에서 따라간다 (중간은 섞음)
//  - 끌기: 한 손가락/마우스로 돌리고, 손을 떼면 관성으로 조금 더 돈다
//  - 걷는 중엔 캐릭터가 보이게 천천히 따라가고, 오래 안 만지면 캐릭터 쪽으로 돌아온다
import * as THREE from 'three';

const Y = new THREE.Vector3(0, 1, 0);
const _u = new THREE.Vector3();
const _h = new THREE.Vector3();
const _want = new THREE.Vector3();
const _over = new THREE.Vector3();
const _target = new THREE.Vector3();
const _look = new THREE.Vector3();

export const FOLLOW_FULL = 0.62; // 이 확대 값 이하면 완전히 캐릭터 따라가기
export const FOLLOW_START = 1.0; // 이 값부터 조금씩 캐릭터 쪽으로
const MAX_DIST = 26;

export function createRig(camera) {
  return {
    dir: camera.position.clone().normalize(),
    dist: camera.position.length(),
    f: null,
    yaw: 0, // 끌기로 쌓인 회전 (프레임에서 반영)
    pitch: 0,
    vYaw: 0, // 손 뗀 뒤 관성 (rad/s)
    vPitch: 0,
    dragging: false,
    lastInput: -1e9,
  };
}

/** 포인터 이동량(px)을 회전으로 */
export function rigDrag(rig, dx, dy, dtMs, screenH = 800) {
  // 화면 높이만큼 끌면 약 3/4바퀴 (기기 크기와 상관없이 비슷한 느낌)
  const k = (Math.PI * 1.5) / Math.max(screenH, 300);
  const yaw = -dx * k;
  const pitch = dy * k * 0.8;
  rig.yaw += yaw;
  rig.pitch += pitch;
  if (dtMs > 0) {
    const per = 1000 / Math.max(dtMs, 8);
    rig.vYaw = THREE.MathUtils.lerp(rig.vYaw, yaw * per * 0.5, 0.5); // 손 뗀 뒤 살짝만 더 돈다
    rig.vPitch = THREE.MathUtils.lerp(rig.vPitch, pitch * per * 0.5, 0.5);
  }
  rig.lastInput = performance.now();
}

export const followAmount = (zoom) => 1 - THREE.MathUtils.smoothstep(zoom, FOLLOW_FULL, FOLLOW_START);

/**
 * 한 프레임 카메라 갱신
 * @param p 캐릭터 위치(단위 벡터) · facing 캐릭터가 보는 접선 방향 · R 별 반지름 · base 기본 거리(화면 비율 반영)
 */
export function rigUpdate(rig, camera, { dt, p, facing, moving, zoom, R, base, decorating }) {
  const now = performance.now();
  const fGoal = followAmount(zoom);
  rig.f = rig.f === null ? fGoal : THREE.MathUtils.damp(rig.f, fGoal, 4, dt);
  const f = rig.f;

  // 위쪽 축: 멀리선 세계 위, 가까이선 캐릭터가 선 땅의 위
  _u.copy(Y).lerp(p, f);
  if (_u.lengthSq() < 0.04) _u.copy(p);
  _u.normalize();

  // 끌기 · 관성
  let dyaw = rig.yaw;
  let dpitch = rig.pitch;
  rig.yaw = rig.pitch = 0;
  if (!rig.dragging) {
    dyaw += rig.vYaw * dt;
    dpitch += rig.vPitch * dt;
    const decay = Math.exp(-dt * 6);
    rig.vYaw *= decay;
    rig.vPitch *= decay;
  }

  // 방향을 (수평, 높이각)으로 나눠 돌린다
  let el = Math.asin(THREE.MathUtils.clamp(rig.dir.dot(_u), -1, 1));
  _h.copy(rig.dir).addScaledVector(_u, -rig.dir.dot(_u));
  if (_h.lengthSq() < 1e-6) _h.copy(facing).negate();
  _h.normalize();
  if (dyaw) _h.applyAxisAngle(_u, dyaw);
  const elMin = THREE.MathUtils.lerp(-1.2, 0.3, f);
  el = THREE.MathUtils.clamp(el + dpitch, elMin, 1.4);
  // 가까이 볼수록 보기 좋은 높이(캐릭터 뒤 살짝 위)로 천천히 맞춘다 (방금 직접 돌렸으면 그대로)
  if (f > 0.05 && !rig.dragging && performance.now() - rig.lastInput > 1500) el = THREE.MathUtils.damp(el, 0.62, 2.5 * f, dt);
  rig.dir.copy(_h).multiplyScalar(Math.cos(el)).addScaledVector(_u, Math.sin(el)).normalize();

  // 알아서 맞추기 (직접 돌리는 중·관성 중에는 안 함)
  const still = !rig.dragging && Math.abs(rig.vYaw) + Math.abs(rig.vPitch) < 0.08;
  const idle = now - rig.lastInput;
  if (still) {
    _over.copy(p).addScaledVector(Y, 0.35).normalize(); // 멀리서: 캐릭터가 앞쪽 위에 보이게
    let rate = 0;
    if (moving && idle > 1200) rate = 1.4;
    else if (!decorating && idle > 3000 && f < 0.5 && rig.dir.dot(p) < 0.6) rate = 0.8; // 캐릭터가 뒤로 숨었으면 돌아오기
    if (rate) {
      // 가까이선 캐릭터 뒤 살짝 위
      _want.copy(facing).multiplyScalar(-Math.cos(0.62)).addScaledVector(p, Math.sin(0.62)).normalize();
      _want.lerp(_over, 1 - f).normalize();
      rig.dir.lerp(_want, 1 - Math.exp(-dt * rate)).normalize();
    }
  }

  // 거리: 멀리선 별 중심에서, 가까이선 캐릭터 머리에서
  const overD = Math.min(base * zoom, MAX_DIST);
  const followD = THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(zoom, 0.55, FOLLOW_FULL + 0.18), 0.55, FOLLOW_FULL + 0.18, 2.6, 4.6);
  rig.dist = THREE.MathUtils.damp(rig.dist, THREE.MathUtils.lerp(overD, followD, f), 4, dt);

  _target.copy(p).multiplyScalar((R + 0.35) * f);
  camera.position.copy(_target).addScaledVector(rig.dir, rig.dist);
  if (camera.position.length() < R + 0.4) camera.position.setLength(R + 0.4); // 땅속으로 들어가지 않게
  camera.up.lerp(_u, 1 - Math.exp(-dt * 8)).normalize();
  _look.copy(p).multiplyScalar((R - 0.15) * f); // 가까이선 발밑 쪽을 봐서 캐릭터가 화면 위쪽에
  camera.lookAt(_look);
}

/** 미션 등 다른 연출 뒤에 지금 카메라 자리에서 이어받기 */
export function rigAdopt(rig, camera, p, R) {
  const f = rig.f ?? 0;
  _target.copy(p).multiplyScalar((R + 0.35) * f);
  const v = camera.position.clone().sub(_target);
  rig.dist = v.length();
  rig.dir.copy(v.normalize());
  rig.vYaw = rig.vPitch = 0;
}
