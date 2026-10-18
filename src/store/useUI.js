import { create } from 'zustand';

// 저사양(크롬북) 자동 감지: 코어 4개 이하 또는 메모리 4GB 이하면 가볍게
function detectQuality() {
  try {
    const saved = localStorage.getItem('ds:quality');
    if (saved) return saved;
  } catch {
    /* noop */
  }
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = navigator.deviceMemory ?? 4;
  return cores <= 4 || mem <= 4 ? 'low' : 'high';
}

// 화면 전용 임시 상태 (저장하지 않음)
export const useUI = create((set) => ({
  quality: detectQuality(),
  setQuality(q) {
    try {
      localStorage.setItem('ds:quality', q);
    } catch {
      /* noop */
    }
    set({ quality: q });
  },

  // 꾸미기
  heldItem: null, // 가방에서 집은 itemId (별을 탭하면 놓임)
  selectedUid: null, // 별 위에서 고른 소품
  movingUid: null, // 옮기는 중인 소품
  hold: (itemId) => set({ heldItem: itemId, selectedUid: null, movingUid: null }),
  select: (uid) => set({ selectedUid: uid, heldItem: null, movingUid: null }),
  startMove: (uid) => set({ movingUid: uid }),
  clearDecor: () => set({ heldItem: null, selectedUid: null, movingUid: null }),

  // 우주 비행
  flightTarget: null, // 목적지 별 sid (화살표 안내)
  setFlightTarget: (sid) => set({ flightTarget: sid }),
  flightPick: null, // 비행 중 3D에서 누른 별
  setFlightPick: (sid) => set({ flightPick: sid }),
  near: null, // 착륙 가능한 거리에 있는 별 sid
  setNear: (sid) => set({ near: sid }),

  // 미션 진행 상태: 3D 장면(별 조각 고리·캐릭터 반응)이 이것을 보고 연출한다
  // fx.kind: 'correct' | 'wrong' | 'complete', fx.at: 발생 시각(ms)
  mission: { results: [], total: 0, fx: null },
  setMission: (patch) => set((s) => ({ mission: { ...s.mission, ...patch } })),
  missionFx: (kind) => set((s) => ({ mission: { ...s.mission, fx: { kind, at: performance.now() } } })),

  // 바로 가기(순간이동): 연출이 끝나면 App이 그 별로 보낸다
  warp: null, // { sid, at }
  startWarp: (sid) => set({ warp: { sid, at: Date.now() } }),
  endWarp: () => set({ warp: null }),

  // 확대·축소: 1이 기본, 작을수록 가까이(크게)
  zoom: 1,
  zoomBy: (k) => set((s) => ({ zoom: Math.min(2.2, Math.max(0.55, s.zoom * k)) })),
  resetZoom: () => set({ zoom: 1 }),

  lookFocus: false, // '내 모습' 꾸미기 중: 카메라가 캐릭터 정면으로
  setLookFocus: (v) => set({ lookFocus: v }),

  sheet: null, // 'shop' | 'bag' | 'style' | null
  openSheet: (sheet) => set({ sheet }),

  toast: null,
  showToast(text) {
    const id = Date.now();
    set({ toast: { text, id } });
    setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 2200);
  },
}));
