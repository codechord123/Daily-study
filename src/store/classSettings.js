// 학급 설정 (교사가 바꿈). 지금은 이 기기에 저장, 나중에 Firestore classes/{id}.settings
import { SEMESTER } from '../data/missions/grade5s2';

const KEY = 'ds:class-settings';
const DEFAULTS = {
  semesterStart: SEMESTER.start,
  override: { math: null, social: null, science: null }, // null = 날짜로 자동
  travelOpen: true,
  teacherPin: '0000',
};
const listeners = new Set();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULTS, ...raw, override: { ...DEFAULTS.override, ...(raw.override ?? {}) } };
  } catch {
    return { ...DEFAULTS };
  }
}

let current = read();

export function getSettings() {
  return current;
}
export function setSettings(patch) {
  current = { ...current, ...patch, override: { ...current.override, ...(patch.override ?? {}) } };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(current));
}
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
