// 학급 설정 (교사가 바꿈). 지금은 이 기기에 저장, 나중에 Firestore classes/{id}.settings
import { SEMESTER } from '../data/missions/grade5s2';
import { uploadSettings, onRemote } from '../services/cloud';

const KEY = 'ds:class-settings';
const DEFAULTS = {
  semesterStart: SEMESTER.start,
  // 선생님이 고른 단원 안에서만 무작위로 낸다 (날짜로 진도를 계산하지 않음). 처음 값은 지금 문항이 있는 단원
  override: { math: [2], english: [0, 1, 2, 3, 4], korean: [2], social: [2], science: [0] },
  travelOpen: true,
  teacherPin: '0000',
  freeDecor: true, // 시험 기간: 꾸미기에 별가루가 들지 않음 (선생님 화면에서 끄기)
};
const listeners = new Set();

// 고른 단원이 비어 있으면(예전 '날짜로 자동' 설정 포함) 처음 값을 쓴다
const units = (o) => {
  const out = { ...DEFAULTS.override };
  for (const [k, v] of Object.entries(o ?? {})) if (Array.isArray(v) ? v.length : v != null) out[k] = Array.isArray(v) ? v : [v];
  return out;
};

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULTS, ...raw, override: units(raw.override) };
  } catch {
    return { ...DEFAULTS };
  }
}

let current = read();

/** 꾸미기 값: 무료 꾸미기가 켜져 있으면 0 */
export const priceOf = (price) => (current.freeDecor ? 0 : price);

export function getSettings() {
  return current;
}
export function setSettings(patch) {
  current = { ...current, ...patch, override: units({ ...current.override, ...(patch.override ?? {}) }) };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* noop */
  }
  uploadSettings(current);
  listeners.forEach((fn) => fn(current));
}
// 선생님이 다른 기기에서 바꾼 설정
onRemote('settings', (s) => {
  current = { ...DEFAULTS, ...s, override: units(s.override) };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(current));
});
export function onSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      current = read();
      listeners.forEach((fn) => fn(current));
    }
  });
}
