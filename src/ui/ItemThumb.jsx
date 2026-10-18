import { useEffect, useState } from 'react';
import { getAtlas, THUMB, COLS } from '../three/thumbAtlas';
import { ITEMS } from '../data/items';

export default function ItemThumb({ itemId, size = 64 }) {
  const [atlas, setAtlas] = useState(null);
  useEffect(() => {
    let alive = true;
    getAtlas().then((a) => alive && setAtlas(a));
    return () => {
      alive = false;
    };
  }, []);
  const i = ITEMS.findIndex((it) => it.id === itemId);
  const k = size / THUMB;
  return (
    <span
      className="item-thumb"
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundImage: atlas ? `url(${atlas.url})` : 'none',
        backgroundSize: atlas ? `${atlas.width * k}px ${atlas.height * k}px` : undefined,
        backgroundPosition: `-${(i % COLS) * size}px -${Math.floor(i / COLS) * size}px`,
      }}
    />
  );
}
