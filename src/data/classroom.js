import { ITEMS } from './items';
import { DEFAULT_CHARACTER, OPTION_SLOTS, COLOR_SLOTS, PALETTE } from './character';
import { PLANET_TINTS, PLANET_DECO } from '../theme/tokens';

// 샘플 학급 (5학년 별빛반). 실명 대신 교사가 정한 별명을 쓴다.
export const SAMPLE_CLASS = {
  id: 'star5',
  code: 'STAR5',
  name: '5학년 별빛반',
  grade: 5,
};

const NICKS = [
  '새벽여우', '구름고래', '달토끼', '모래별', '솜사탕', '바람개비',
  '은하수', '작은곰', '꼬마혜성', '푸른달', '반딧불', '눈송이',
  '종이배', '오로라', '민들레', '햇살', '별사탕', '무지개',
  '파도소리', '도토리', '물방울', '아기별', '연둣잎', '노을',
];

// 별명 기본값 (선생님이 학급을 만들 때 번호마다 하나씩 붙고, 나중에 바꿀 수 있다)
export const DEFAULT_NICKS = NICKS;
export const makeRoster = (count, nicks = NICKS) =>
  Array.from({ length: count }, (_, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    number: i + 1,
    nickname: nicks[i] ?? `${i + 1}번`,
  }));

// 지금 학급 명단. 학급 서버에 연결되면 그 학급 명단으로 바뀐다 (배열은 그대로 두고 내용만 바꾼다)
export const ROSTER = makeRoster(NICKS.length);
const rosterListeners = new Set();
export function setRoster(list) {
  ROSTER.splice(0, ROSTER.length, ...list);
  rosterListeners.forEach((fn) => fn(ROSTER));
}
export function onRoster(fn) {
  rosterListeners.add(fn);
  return () => rosterListeners.delete(fn);
}

export const studentById = (id) => ROSTER.find((s) => s.id === id);

// 결정적 난수: 같은 학생은 항상 같은 샘플 별을 갖는다
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// 친구가 아직 저장한 별이 없을 때 보여줄 샘플 별
export function samplePlanet(studentId) {
  const r = rng(parseInt(studentId.slice(1), 10) * 9973);
  const count = 3 + Math.floor(r() * 6);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      uid: `${studentId}-${i}`,
      itemId: pick(r, ITEMS).id,
      lat: (r() - 0.5) * 150,
      lon: r() * 360,
      rot: r() * 360,
    });
  }
  const character = { ...DEFAULT_CHARACTER };
  for (const [slot, def] of Object.entries(OPTION_SLOTS)) character[slot] = pick(r, def.options).id;
  for (const slot of Object.keys(COLOR_SLOTS)) character[slot] = pick(r, PALETTE);
  if (r() < 0.5) character.species = 'human';
  if (r() < 0.4) character.pet = 'none';
  return {
    tint: pick(r, PLANET_TINTS).id,
    ring: r() < 0.35 ? pick(r, PLANET_DECO.ring).id : 'none',
    moon: r() < 0.35 ? pick(r, PLANET_DECO.moon).id : 'none',
    aura: pick(r, PLANET_DECO.aura).id,
    pattern: r() < 0.4 ? pick(r, PLANET_DECO.pattern).id : 'none',
    items,
    character,
    hearts: Math.floor(r() * 12),
  };
}

// 우주에서 별이 놓이는 위치 (황금각 나선으로 고르게 퍼뜨림)
// 이웃 별까지 약 15칸: 추진기로 3~4초 거리
export function spacePosition(index) {
  const a = index * 2.399963;
  const rad = 16 + Math.sqrt(index) * 15;
  return [Math.cos(a) * rad, Math.sin(index * 1.7) * 8, Math.sin(a) * rad];
}

export const SPACE_BOUNDS = 110; // 이 반경 밖으로는 못 나가게
