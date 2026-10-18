import { useMemo, useEffect, memo } from 'react';
import { MODELS } from './items/models';
import { ITEM_BY_ID } from '../data/items';
import { planetMaterial, haloMaterial, glow } from './materials';
import { latLonToVec, surfaceQuaternion } from './sphere';
import { PLANET_TINTS, PLANET_RADIUS, NEON } from '../theme/tokens';

export const ITEM_SCALE = 1.15;
// 손가락이 조금 움직여도 "탭"으로 인정하는 거리(px). 그 이상이면 화면 돌리기로 본다.
export const TAP_SLOP = 8;

const PlacedItem = memo(function PlacedItem({ item, radius, selected, onTap }) {
  const Model = MODELS[ITEM_BY_ID[item.itemId]?.model];
  const { position, quaternion } = useMemo(() => {
    const n = latLonToVec(item.lat, item.lon);
    return { position: n.clone().multiplyScalar(radius * 0.995), quaternion: surfaceQuaternion(n, item.rot) };
  }, [item.lat, item.lon, item.rot, radius]);
  if (!Model) return null;
  return (
    <group
      position={position}
      quaternion={quaternion}
      onClick={
        onTap &&
        ((e) => {
          if (e.delta > TAP_SLOP) return;
          e.stopPropagation();
          onTap(item.uid);
        })
      }
    >
      <group scale={ITEM_SCALE}>
        <Model />
      </group>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={glow(NEON.cyan, 1.4)}>
          <ringGeometry args={[0.24, 0.28, 32]} />
        </mesh>
      )}
    </group>
  );
});

export default function Planet({ tint, items, radius = PLANET_RADIUS, selectedUid, onItemTap, onSurfaceTap, highlight = 0, detail = 64 }) {
  const t = PLANET_TINTS.find((x) => x.id === tint) ?? PLANET_TINTS[0];
  const mat = useMemo(() => planetMaterial(t.base, t.shade), [t.base, t.shade]);
  const halo = useMemo(() => haloMaterial(), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    mat.uniforms.uHighlight.value = highlight;
  }, [mat, highlight]);

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
      {items?.map((it) => (
        <PlacedItem key={it.uid} item={it} radius={radius} selected={it.uid === selectedUid} onTap={onItemTap} />
      ))}
    </group>
  );
}

