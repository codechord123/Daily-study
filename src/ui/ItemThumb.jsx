import { useEffect, useState } from 'react';
import { getAtlas, THUMB, COLS } from '../three/thumbAtlas';

// 썸네일 한 칸 보여 주기. kind: items | char | deco
export function Thumb({ kind = 'items', k, size = 64, fallback }) {
  const [atlas, setAtlas] = useState(null);
  useEffect(() => {
    let alive = true;
    getAtlas(kind).then((a) => alive && setAtlas(a));
    return () => {
      alive = false;
    };
  }, [kind]);
  const i = atlas?.index[k];
  if (atlas && i === undefined) return <span className="item-thumb thumb-empty" style={{ width: size, height: size }}>{fallback}</span>;
  const s = size / THUMB;
  return (
    <span
      className={`item-thumb ${atlas ? '' : 'thumb-loading'}`}
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundImage: atlas ? `url(${atlas.url})` : 'none',
        backgroundSize: atlas ? `${atlas.width * s}px ${atlas.height * s}px` : undefined,
        backgroundPosition: i !== undefined ? `-${(i % COLS) * size}px -${Math.floor(i / COLS) * size}px` : undefined,
      }}
    />
  );
}

export default function ItemThumb({ itemId, size = 64 }) {
  return <Thumb kind="items" k={itemId} size={size} />;
}
