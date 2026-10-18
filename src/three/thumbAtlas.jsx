// 썸네일 스프라이트: 실제 3D 모델을 한 번만 그려 그림 한 장으로 만든다.
// (선택지마다 WebGL 캔버스를 띄우면 크롬북이 버티지 못한다)
import { createRoot } from '@react-three/fiber';
import { ITEMS } from '../data/items';
import { MODELS } from './items/models';
import Character from './Character';
import Pet from './Pet';
import Planet from './Planet';
import { OPTION_SLOTS, DEFAULT_CHARACTER } from '../data/character';
import { PLANET_DECO } from '../theme/tokens';

export const THUMB = 112; // 칸 하나 크기(px)
const COLS = 10;

// 칸 목록 → 그림 한 장. cells: [{ key, node }]
function render(cells) {
  return new Promise((resolve) => {
    const rows = Math.ceil(cells.length / COLS);
    const width = COLS * THUMB;
    const height = rows * THUMB;
    const canvas = document.createElement('canvas');
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
        root.render(
          <>
            <ambientLight intensity={1} color="#d9d3ff" />
            <directionalLight position={[3, 5, 4]} intensity={1.8} color="#fff1d6" />
            {cells.map((c, i) => (
              <group key={c.key} position={[(i % COLS) - (COLS - 1) / 2, (rows - 1) / 2 - Math.floor(i / COLS), 0]}>
                {c.node}
              </group>
            ))}
          </>,
        );
        let n = 0;
        const tick = () => {
          if (++n < 8) return requestAnimationFrame(tick);
          const url = canvas.toDataURL('image/png');
          // 렌더 중에 정리하지 않도록 다음 틈에 정리
          setTimeout(() => {
            try {
              root.unmount();
            } catch {
              /* 이미 정리됨 */
            }
          }, 0);
          resolve({ url, width, height, index: Object.fromEntries(cells.map((c, i) => [c.key, i])) });
        };
        requestAnimationFrame(tick);
      });
  });
}

// ---------- 그릴 내용 ----------
const HEAD_SLOTS = new Set(['hat', 'eyes', 'hairStyle']);

function charCell(slot, id) {
  if (slot === 'pet')
    return id === 'none' ? null : (
      <group position={[-0.3 * 2.6, -0.32, 0]} rotation={[0.25, -0.5, 0]} scale={2.6}>
        <Pet type={id} />
      </group>
    );
  const look = { ...DEFAULT_CHARACTER, [slot]: id };
  if (slot === 'hat' || slot === 'eyes') look.hairStyle = 'bob';
  if (slot === 'acc' && id.endsWith('Wings')) look.acc = id;
  const back = slot === 'cape' || (slot === 'acc' && id.endsWith('Wings')) || id === 'backpack';
  const head = HEAD_SLOTS.has(slot);
  return (
    <group position={head ? [0, -0.37 * 2.3 - 0.06, 0] : [0, -0.48, 0]} rotation={[0.15, back ? Math.PI * 0.8 : -0.35, 0]} scale={head ? 2.3 : 1.45}>
      <Character look={look} noPet />
    </group>
  );
}

function decoCell(slot, id) {
  const props = { tint: 'mint', ring: 'none', moon: 'none', aura: 'cyan', pattern: 'none', [slot]: id };
  return (
    <group rotation={[0.35, 0.3, 0]}>
      <Planet {...props} radius={slot === 'ring' || slot === 'moon' ? 0.25 : 0.4} detail={32} />
    </group>
  );
}

const cache = {};
let queue = Promise.resolve();
// 그래픽 부담을 줄이려고 한 번에 한 장씩 차례로 만든다
export function getAtlas(kind = 'items') {
  if (cache[kind]) return cache[kind];
  let cells;
  if (kind === 'items') {
    cells = ITEMS.map((it) => {
      const Model = MODELS[it.model];
      return { key: it.id, node: <group position={[0, -0.4, 0]} rotation={[0.35, -0.55, 0]} scale={1.9}><Model /></group> };
    });
  } else if (kind === 'char') {
    cells = Object.entries(OPTION_SLOTS).flatMap(([slot, def]) =>
      def.options.map((o) => ({ key: `${slot}:${o.id}`, node: charCell(slot, o.id) })).filter((c) => c.node),
    );
  } else {
    cells = Object.entries(PLANET_DECO).flatMap(([slot, list]) => list.map((o) => ({ key: `${slot}:${o.id}`, node: decoCell(slot, o.id) })));
  }
  cache[kind] = queue = queue.then(() => render(cells));
  return cache[kind];
}

// 로그인 뒤 한가할 때 미리 만들어 두기
export function prewarmAtlases() {
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
  idle(() => ['items', 'char', 'deco'].forEach((k) => getAtlas(k)));
}
export { COLS };
