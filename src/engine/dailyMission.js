// 오늘의 미션 조립: 수학 5 + 영어 5 + 탐구 3 (국어·사회·과학 순환)
// 날짜로 2학기 진도(지금 단원)를 계산해, 지금 배우는 단원 위주로 + 지난 단원 복습을 섞는다.
import { seeded, shuffle, randInt } from './rng';
import { makeMathSet, MATH_UNITS } from './mathGen';
import { getSettings } from '../store/classSettings';
import { SCHEDULE, SOCIAL, SCIENCE, KOREAN, ENGLISH_WORDS, ENGLISH_EXPRESSIONS } from '../data/missions/grade5s2';

const INQUIRY_ROTATION = [
  ['korean', 'social', 'science'],
  ['science', 'korean', 'social'],
  ['social', 'science', 'korean'],
];

const WEEK_MS = 7 * 86400000;

// weeks 배열에서 경과 주차가 속한 단원 번호
function unitAt(weeks, week) {
  let acc = 0;
  for (let i = 0; i < weeks.length; i++) {
    acc += weeks[i];
    if (week < acc) return i;
  }
  return weeks.length - 1;
}

/** 날짜 → 2학기 몇 주차, 과목별 지금 단원 */
export function curriculumPosition(dateKey) {
  const { semesterStart, override } = getSettings();
  const week = Math.max(0, Math.floor((new Date(dateKey) - new Date(semesterStart)) / WEEK_MS));
  // 선생님이 단원을 직접 정했으면 그것을 따른다
  const pick = (key, auto) => (override?.[key] ?? null) === null ? auto : override[key];
  return {
    week,
    math: pick('math', unitAt(SCHEDULE.math, week)),
    social: pick('social', unitAt(SCHEDULE.social.weeks, week)),
    science: pick('science', unitAt(SCHEDULE.science.weeks, week)),
  };
}

export function unitTitles(pos) {
  return {
    math: MATH_UNITS[pos.math].title,
    social: SCHEDULE.social.titles[pos.social],
    science: SCHEDULE.science.titles[pos.science],
  };
}

export function englishSet(r, count, week) {
  // 이번 주 묶음까지 배운 단어에서 출제, 이번 주 단어 비중을 높인다
  const upto = Math.min(ENGLISH_WORDS.length, (week + 1) * 8);
  const thisWeek = ENGLISH_WORDS.slice(Math.max(0, upto - 8), upto);
  const learned = ENGLISH_WORDS.slice(0, upto);
  const picks = [...shuffle(r, thisWeek).slice(0, 3)];
  for (const w of shuffle(r, learned)) {
    if (picks.length >= count - 1) break;
    if (!picks.includes(w)) picks.push(w);
  }
  const qs = picks.map(([en, ko]) => {
    const toKo = r() < 0.6;
    const pool = shuffle(r, ENGLISH_WORDS.filter((w) => w[0] !== en)).slice(0, 3);
    const right = toKo ? ko : en;
    const choices = shuffle(r, [right, ...pool.map((w) => (toKo ? w[1] : w[0]))]);
    return { subject: 'english', unit: '단어', kind: 'choice', prompt: toKo ? en : ko, sub: toKo ? '이 단어의 뜻은?' : '알맞은 영어 단어는?', big: true, choices, answer: choices.indexOf(right) };
  });
  // 마지막 한 문제는 생활 표현
  const [en, ko] = ENGLISH_EXPRESSIONS[randInt(r, 0, ENGLISH_EXPRESSIONS.length - 1)];
  const others = shuffle(r, ENGLISH_EXPRESSIONS.filter((e) => e[0] !== en)).slice(0, 3).map((e) => e[1]);
  const choices = shuffle(r, [ko, ...others]);
  qs.push({ subject: 'english', unit: '생활 표현', kind: 'choice', prompt: en, sub: '이 표현의 뜻은?', choices, answer: choices.indexOf(ko) });
  return qs;
}

// 과학 '물체의 운동': 속력 계산 생성
function speedQuestion(r) {
  const t = randInt(r, 2, 5);
  const v = randInt(r, 3, 12) * 10;
  return { subject: 'science', kind: 'number', prompt: `자동차가 ${t}시간 동안 ${v * t}km를 달렸어요. 이 자동차의 속력은 시속 몇 km일까요?`, answer: v, hint: '속력 = 이동 거리 ÷ 걸린 시간' };
}

// 지금 단원 60%, 지난 단원 40%
function fromBank(r, bank, current) {
  const now = bank.filter((q) => q.unit === current);
  const past = bank.filter((q) => q.unit < current);
  const pool = past.length && r() < 0.4 ? past : now.length ? now : bank;
  return pool[randInt(r, 0, pool.length - 1)];
}

function inquiry(r, subject, pos, titles) {
  if (subject === 'korean') return { subject, unit: '국어 기본', ...KOREAN[randInt(r, 0, KOREAN.length - 1)] };
  if (subject === 'social') {
    const q = fromBank(r, SOCIAL, pos.social);
    return { subject, ...q, unit: SCHEDULE.social.titles[q.unit] };
  }
  if (pos.science === 2 && r() < 0.5) return { ...speedQuestion(r), unit: titles.science };
  const q = fromBank(r, SCIENCE, pos.science);
  return { subject, ...q, unit: SCHEDULE.science.titles[q.unit] };
}

export function buildDailyMission(sid, dateKey) {
  const r = seeded(`${sid}:${dateKey}`);
  const pos = curriculumPosition(dateKey);
  const titles = unitTitles(pos);
  const dayIndex = Math.floor(new Date(dateKey).getTime() / 86400000);
  const order = INQUIRY_ROTATION[dayIndex % INQUIRY_ROTATION.length];
  const qs = [...makeMathSet(r, 5, pos.math), ...englishSet(r, 5, pos.week), ...order.map((s) => inquiry(r, s, pos, titles))];
  return qs.map((q, i) => ({ id: i, ...q }));
}

// 과목별 추가 연습 (별가루 없음): 배운 단원까지에서 골고루
export function buildPractice(subject, seedStr, dateKey) {
  const r = seeded(seedStr);
  const pos = curriculumPosition(dateKey);
  const titles = unitTitles(pos);
  let qs = [];
  if (subject === 'math') {
    for (let i = 0; i < 10; i++) qs.push(...makeMathSet(r, 1, randInt(r, 0, pos.math)));
  } else if (subject === 'english') {
    qs = englishSet(r, 10, pos.week);
  } else {
    const seen = new Set();
    for (let tries = 0; qs.length < 8 && tries < 60; tries++) {
      const q = inquiry(r, subject, { ...pos, [subject]: subject === 'korean' ? 0 : randInt(r, 0, pos[subject]) }, titles);
      if (seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      qs.push(q);
    }
  }
  return qs.map((q, i) => ({ id: i, ...q }));
}

export function isCorrect(q, value) {
  if (q.kind === 'number') {
    const v = Number(String(value).trim());
    return Number.isFinite(v) && Math.abs(v - q.answer) < 1e-9;
  }
  return value === q.answer;
}
