// 학생 한 명의 저장 데이터. 지금은 localStorage, 나중에 Firestore로 교체.
import { DEFAULT_CHARACTER } from '../data/items';
import { samplePlanet } from '../data/classroom';
import { uploadProfile, cloudAddHeart, onRemote, cloudEnabled, getCloudStatus } from '../services/cloud';

const KEY = (sid) => `ds:profile:${sid}`;
const listeners = new Set();

// 학급 서버가 켜져 있는데 아직 서버 기록을 못 받은 채(와이파이 끊김) 만든 별은 임시 별.
// 서버 기록이 오면 그것으로 바꾸고, 서버에도 없던 학생이면 그때부터 진짜 별로 올린다.
export function newProfile(sid) {
  return {
    sid,
    ...(cloudEnabled && !getCloudStatus().synced ? { provisional: true } : {}),
    stardust: 60, // 첫날 환영 선물
    streak: 0,
    lastMissionDate: null,
    inventory: { tree: 1, flowers: 2 },
    ownedParts: [],
    heartsGiven: { date: null, to: [] },
    planet: {
      tint: 'mint',
      items: [
        { uid: 'start-rose', itemId: 'rose', lat: 62, lon: 20, rot: 0 },
      ],
      character: { ...DEFAULT_CHARACTER },
      hearts: 0,
    },
  };
}

export function loadProfile(sid) {
  try {
    const raw = localStorage.getItem(KEY(sid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* 저장소를 못 쓰는 환경이면 새 프로필 */
  }
  return null;
}

export function saveProfile(profile) {
  profile.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY(profile.sid), JSON.stringify(profile));
  } catch {
    /* 저장 실패는 조용히 무시 (메모리 상태는 유지) */
  }
  uploadProfile(profile); // Firebase가 있으면 올린다
  listeners.forEach((fn) => fn(profile.sid));
}

// 다른 기기에서 바뀐 프로필: 더 새것일 때만 반영 (내가 올린 것이 되돌아온 경우는 무시)
const ownListeners = new Set();
export function onRemoteProfile(fn) {
  ownListeners.add(fn);
  return () => ownListeners.delete(fn);
}
onRemote('profile', (p) => {
  if (!p?.sid) return;
  const local = loadProfile(p.sid);
  if (local && !local.provisional && (local.updatedAt ?? 0) >= (p.updatedAt ?? 0)) return;
  try {
    localStorage.setItem(KEY(p.sid), JSON.stringify(p));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(p.sid));
  ownListeners.forEach((fn) => fn(p));
});

const syncedListeners = new Set();
export function onSynced(fn) {
  syncedListeners.add(fn);
  return () => syncedListeners.delete(fn);
}
onRemote('synced', (serverSids) => syncedListeners.forEach((fn) => fn(serverSids)));

// 친구 별 읽기: 저장된 별이 있으면 그것, 없으면 샘플 별
export function getPlanet(sid) {
  return loadProfile(sid)?.planet ?? samplePlanet(sid);
}

// 다른 탭에서 별을 바꿨을 때도 알림
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('ds:profile:')) listeners.forEach((fn) => fn(e.key.slice(11)));
  });
}

export function onPlanetChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 하트는 별 주인 데이터와 분리된 카운터 (Firestore에서는 increment 필드)
const HEART_KEY = (sid) => `ds:hearts:${sid}`;
export function getHearts(sid) {
  let extra = 0;
  try {
    extra = Number(localStorage.getItem(HEART_KEY(sid)) ?? 0);
  } catch {
    /* noop */
  }
  return (loadProfile(sid) ? 0 : getPlanet(sid).hearts) + extra;
}
onRemote('hearts', (sid, count) => {
  try {
    localStorage.setItem(HEART_KEY(sid), String(count));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(sid));
});

export function addHeart(sid) {
  if (cloudAddHeart(sid)) return; // 학급 서버의 카운터를 올리면 구독으로 돌아온다
  try {
    const n = Number(localStorage.getItem(HEART_KEY(sid)) ?? 0) + 1;
    localStorage.setItem(HEART_KEY(sid), String(n));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(sid));
}
