// 상점·가방의 소품 썸네일: 실제 3D 모델을 한 번만 그려 스프라이트 한 장으로 만든다.
// (소품마다 WebGL 캔버스를 띄우면 크롬북이 버티지 못한다)
import { createRoot } from '@react-three/fiber';
import { ITEMS } from '../data/items';
import { MODELS } from './items/models';

export const THUMB = 128;
export const COLS = 6;
const ROWS = Math.ceil(ITEMS.length / COLS);

function AtlasScene() {
  return (
    <>
      <ambientLight intensity={1} color="#d9d3ff" />
      <directionalLight position={[3, 5, 4]} intensity={1.8} color="#fff1d6" />
      {ITEMS.map((it, i) => {
        const Model = MODELS[it.model];
        const x = (i % COLS) - (COLS - 1) / 2;
        const y = (ROWS - 1) / 2 - Math.floor(i / COLS);
        return (
          <group key={it.id} position={[x, y - 0.4, 0]} rotation={[0.35, -0.55, 0]} scale={1.9}>
            <Model />
          </group>
        );
      })}
    </>
  );
}

let atlasPromise;
export function getAtlas() {
  if (atlasPromise) return atlasPromise;
  atlasPromise = new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = COLS * THUMB;
    const height = ROWS * THUMB;
    canvas.width = width;
    canvas.height = height;
    const root = createRoot(canvas);
    root
      .configure({
        size: { width, height, top: 0, left: 0 },
        dpr: 1,
        orthographic: true,
        camera: { zoom: THUMB, position: [0, 0, 10], near: 0.1, far: 50 },
        gl: { alpha: true, preserveDrawingBuffer: true, antialias: true },
        events: undefined,
      })
      .then(() => {
        root.render(<AtlasScene />);
        // 몇 프레임 그린 뒤 이미지로 떠내고 정리
        let n = 0;
        const tick = () => {
          if (++n < 6) return requestAnimationFrame(tick);
          const url = canvas.toDataURL('image/png');
          root.unmount();
          resolve({ url, width, height });
        };
        requestAnimationFrame(tick);
      });
  });
  return atlasPromise;
}
