import { useMemo, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODELS } from './items/models';
import { ITEM_BY_ID } from '../data/items';
import { planetMaterial, haloMaterial, glow, PATTERN_ID, addRim, blobShadow } from './materials';
import { useUI } from '../store/useUI';
import Ambient from './Ambient';
import { PLANET_DECO } from '../theme/tokens';
import { latLonToVec, surfaceQuaternion } from './sphere';
import { Ring, Moon, auraColor } from './PlanetDeco';
import { PLANET_TINTS, PLANET_RADIUS, NEON } from '../theme/tokens';

export const ITEM_SCALE = 1.15;

// 빛은 늘 보는 사람 어깨 너머(왼쪽 위 앞)에서: 별을 어느 쪽으로 돌려도 밝은 면이 보인다
const _m = new THREE.Vector3();
export function cameraLightDir(camera, out) {
  const e = camera.matrixWorld.elements;
  // 카메라 오른쪽(x), 위(y), 뒤(z) 축
  out.set(0, 0, 0);
  out.addScaledVector(_m.set(e[0], e[1], e[2]), -0.62);
  out.addScaledVector(_m.set(e[4], e[5], e[6]), 0.72);
  out.addScaledVector(_m.set(e[8], e[9], e[10]), 0.3);
  return out.normalize();
}
export const ITEM_SIZES = [0.7, 1, 1.45]; // 작게 · 보통 · 크게
export const HUE_STEPS = 8; // 색 바꾸기 단계

// 색 바꾼 재질은 (원래 재질, 단계)마다 하나만 만들어 함께 쓴다
const hueCache = new Map();
function hueMaterial(base, step) {
  const key = `${base.uuid}:${step}`;
  if (!hueCache.has(key)) {
    const m = base.clone();
    m.color.offsetHSL(step / HUE_STEPS, 0.05, 0);
    if (base.userData.rim) addRim(Object.assign(m, { userData: { ...m.userData, rim: false } }));
    hueCache.set(key, m);
  }
  return hueCache.get(key);
}
// 손가락이 조금 움직여도 "탭"으로 인정하는 거리(px). 그 이상이면 화면 돌리기로 본다.
export const TAP_SLOP = 8;

const PlacedItem = memo(function PlacedItem({ item, radius, selected, onTap, onDrag }) {
  const Model = MODELS[ITEM_BY_ID[item.itemId]?.model];
  const body = useRef();
  const hue = item.hue ?? 0;
  // 색 바꾸기: 모델 안의 모든 재질을 색상환에서 돌린다 (모델 코드는 그대로)
  useLayoutEffect(() => {
    body.current?.traverse((o) => {
      if (!o.isMesh || !o.material?.color) return;
      if (!o.userData.baseMat) o.userData.baseMat = o.material;
      o.material = hue ? hueMaterial(o.userData.baseMat, hue) : o.userData.baseMat;
    });
  }, [hue, Model]);
  const { position, quaternion } = useMemo(() => {
    const n = latLonToVec(item.lat, item.lon);
    return { position: n.clone().multiplyScalar(radius * 0.995), quaternion: surfaceQuaternion(n, item.rot) };
  }, [item.lat, item.lon, item.rot, radius]);
  const ring = 0.26 * ITEM_SIZES[item.size ?? 1];
  const scale = ITEM_SCALE * ITEM_SIZES[item.size ?? 1];
  // 방금 놓은 소품은 쏙 튀어나오고, 풀·나무는 바람에 살랑인다
  const sway = ITEM_BY_ID[item.itemId]?.category === 'nature';
  const pop = useRef(useUI.getState().popUid === item.uid ? 0 : 1);
  const seed = useMemo(() => (item.uid.charCodeAt(0) % 17) * 0.37, [item.uid]);
  useFrame((state, dt) => {
    const g = body.current;
    if (!g) return;
    if (pop.current < 1) {
      pop.current = Math.min(1, pop.current + dt / 0.42);
      const t = pop.current;
      const k = 1 + Math.sin(t * Math.PI) * 0.28 * (1 - t) - Math.pow(1 - t, 3); // 0 → 살짝 넘쳤다가 1
      g.scale.setScalar(scale * Math.max(0.01, k));
    } else if (g.scale.x !== scale) g.scale.setScalar(scale);
    if (sway) {
      const t = state.clock.elapsedTime + seed;
      g.rotation.x = Math.sin(t * 1.3) * 0.045;
      g.rotation.z = Math.sin(t * 1.05 + 1.7) * 0.04;
    }
  });
  if (!Model) return null;
  return (
    <group
      position={position}
      quaternion={quaternion}
      // 고른 소품은 눌러서 바로 끌어 옮길 수 있다
      onPointerDown={
        selected && onDrag
          ? (e) => {
              e.stopPropagation();
              onDrag(item.uid, e.nativeEvent);
            }
          : undefined
      }
      onClick={
        onTap &&
        ((e) => {
          if (e.delta > TAP_SLOP) return;
          e.stopPropagation();
          onTap(item.uid);
        })
      }
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={blobShadow()} scale={ring * 1.5} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={body} scale={scale}>
        <Model />
      </group>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={glow(NEON.cyan, 1.4)}>
          <ringGeometry args={[ring, ring + 0.04, 32]} />
        </mesh>
      )}
    </group>
  );
});

export default function Planet({ tint, ring, moon, aura, pattern, ambient, items, radius = PLANET_RADIUS, selectedUid, onItemTap, onItemDrag, onSurfaceTap, highlight = 0, detail = 64 }) {
  const t = PLANET_TINTS.find((x) => x.id === tint) ?? PLANET_TINTS[0];
  const mat = useMemo(() => planetMaterial(t.base, t.shade), [t.base, t.shade]);
  const halo = useMemo(() => haloMaterial(auraColor(aura)), [aura]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    mat.uniforms.uHighlight.value = highlight;
    mat.uniforms.uRim.value.set(auraColor(aura));
    mat.uniforms.uPattern.value = PATTERN_ID[pattern] ?? 0;
  }, [mat, highlight, aura, pattern]);
  const amb = ambient && PLANET_DECO.ambient.find((a) => a.id === ambient && a.color);
  useFrame(({ camera }) => cameraLightDir(camera, mat.uniforms.uLight.value));

  return (
    <group>
      <mesh
        material={mat}
        onClick={
          onSurfaceTap &&
          ((e) => {
            if (e.delta > TAP_SLOP) return;
            e.stopPropagation();
            onSurfaceTap(e.point.clone().normalize());
          })
        }
      >
        <sphereGeometry args={[radius, detail, detail / 2]} />
      </mesh>
      <mesh material={halo} scale={1.22}>
        <sphereGeometry args={[radius, 32, 16]} />
      </mesh>
      <Ring type={ring} radius={radius} />
      {amb && <Ambient type={amb.id} color={amb.color} radius={radius} />}
      <Moon type={moon} radius={radius} />
      {items?.map((it) => (
        <PlacedItem key={it.uid} item={it} radius={radius} selected={it.uid === selectedUid} onTap={onItemTap} onDrag={onItemDrag} />
      ))}
    </group>
  );
}

