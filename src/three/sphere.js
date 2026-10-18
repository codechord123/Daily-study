import * as THREE from 'three';

const D2R = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);

// 위도·경도(도) → 단위 벡터
export function latLonToVec(lat, lon, out = new THREE.Vector3()) {
  const phi = lat * D2R;
  const th = lon * D2R;
  return out.set(Math.cos(phi) * Math.sin(th), Math.sin(phi), Math.cos(phi) * Math.cos(th));
}

export function vecToLatLon(v) {
  const n = v.clone().normalize();
  return {
    lat: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) / D2R,
    lon: ((Math.atan2(n.x, n.z) / D2R) + 360) % 360,
  };
}

// 표면 법선을 위쪽으로 세우고, 그 축으로 rot(도)만큼 돌린 회전
export function surfaceQuaternion(normal, rotDeg = 0, out = new THREE.Quaternion()) {
  out.setFromUnitVectors(UP, normal.clone().normalize());
  const spin = new THREE.Quaternion().setFromAxisAngle(UP, rotDeg * D2R);
  return out.multiply(spin);
}

// 표면 위에서 진행 방향(접선)을 바라보는 회전
export function lookAlongSurface(normal, forward, out = new THREE.Quaternion()) {
  const n = normal.clone().normalize();
  const f = forward.clone().sub(n.clone().multiplyScalar(forward.dot(n)));
  if (f.lengthSq() < 1e-6) return surfaceQuaternion(n, 0, out);
  f.normalize();
  const x = new THREE.Vector3().crossVectors(n, f);
  const m = new THREE.Matrix4().makeBasis(x, n, f);
  return out.setFromRotationMatrix(m);
}

// 대원(great circle)을 따라 a에서 b로 step(라디안)만큼 이동
export function stepToward(a, b, step) {
  const angle = a.angleTo(b);
  if (angle <= step || angle < 1e-4) return b.clone();
  const axis = new THREE.Vector3().crossVectors(a, b);
  if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0);
  axis.normalize();
  return a.clone().applyAxisAngle(axis, step);
}
