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
  near: null, // 착륙 가능한 거리에 있는 별 sid
  setNear: (sid) => set({ near: sid }),

  sheet: null, // 'shop' | 'bag' | 'style' | null
  openSheet: (sheet) => set({ sheet }),

  toast: null,
  showToast(text) {
    const id = Date.now();
    set({ toast: { text, id } });
    setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 2200);
  },
}));
