import { useMemo, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { MODELS } from './items/models';
import { ITEM_BY_ID } from '../data/items';
import { planetMaterial, haloMaterial, glow, PATTERN_ID } from './materials';
import Ambient from './Ambient';
import { PLANET_DECO } from '../theme/tokens';
import { latLonToVec, surfaceQuaternion } from './sphere';
import { Ring, Moon, auraColor } from './PlanetDeco';
import { PLANET_TINTS, PLANET_RADIUS, NEON } from '../theme/tokens';

export const ITEM_SCALE = 1.15;
export const ITEM_SIZES = [0.7, 1, 1.45]; // 작게 · 보통 · 크게
export const HUE_STEPS = 8; // 색 바꾸기 단계

// 색 바꾼 재질은 (원래 재질, 단계)마다 하나만 만들어 함께 쓴다
const hueCache = new Map();
function hueMaterial(base, step) {
  const key = `${base.uuid}:${step}`;
  if (!hueCache.has(key)) {
    const m = base.clone();
    m.color.offsetHSL(step / HUE_STEPS, 0.05, 0);
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
      <group ref={body} scale={ITEM_SCALE * ITEM_SIZES[item.size ?? 1]}>
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

