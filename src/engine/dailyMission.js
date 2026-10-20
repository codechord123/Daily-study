// 오늘의 미션 조립: 20문제 = 수학 6 · 영어 5 · 국어 3 · 사회 3 · 과학 3
// - 선생님이 단원을 정해 두면: 그 단원(들)에서만 출제
// - 정하지 않으면: 날짜로 지금 단원을 계산해 지금 단원 위주 + 지난 단원 복습
import { seeded, shuffle, randInt } from './rng';
import { makeMathSet, MATH_UNITS } from './mathGen';
import { getSettings } from '../store/classSettings';
import { SCHEDULE, ENGLISH_WORDS } from '../data/missions/grade5s2';
import { BANK_SOCIAL, BANK_KOREAN, BANK_SCIENCE, BANK_ENGLISH, BANK_MATH } from '../data/missions/bank';
import { qId, dueReviews, recentAccuracy } from '../store/learnStore';

// 난이도 맞추기: 최근 정답률이 높으면 어려운 문제(level 3)를, 낮으면 쉬운 문제(level 1)를 더 자주
export function levelWeights(acc) {
  if (acc == null) return null;
  if (acc >= 0.85) return { 1: 1, 2: 2, 3: 3 };
  if (acc < 0.6) return { 1: 3, 2: 2, 3: 0.5 };
  return { 1: 1.5, 2: 2, 3: 1 };
}
/** 무게를 두고 하나 고르기 (무게가 없으면 고르게) */
export function pickWeighted(r, pool, weights) {
  if (!weights) return pool[randInt(r, 0, pool.length - 1)];
  const w = pool.map((q) => weights[q.level] ?? 1);
  let x = r() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((x -= w[i]) < 0) return pool[i];
  return pool[pool.length - 1];
}
// 문제 이름표 → 문항 은행 문제 (선생님이 골라 넣은 문제를 찾을 때)
let BY_ID = null;
export function bankQuestion(id) {
  if (!BY_ID) {
    BY_ID = new Map();
    const all = { korean: BANK_KOREAN, social: BANK_SOCIAL, science: BANK_SCIENCE, english: BANK_ENGLISH, math: BANK_MATH };
    for (const [subject, bank] of Object.entries(all)) for (const q of bank) BY_ID.set(qId(q), { subject, ...q, unit: UNIT_TITLES[subject][q.unit] });
  }
  return BY_ID.get(id);
}
export const ASSIGN_MAX = 5;

// 선생님이 '출제에서 빼기' 한 문제
const blockedSet = () => new Set(getSettings().blocked ?? []);

export const MISSION_COUNTS = { math: 6, english: 5, korean: 3, social: 3, science: 3 };
export const MISSION_TOTAL = Object.values(MISSION_COUNTS).reduce((a, b) => a + b, 0);

const WEEK_MS = 7 * 86400000;
const WORDS_PER_UNIT = 8;

// 과목별 단원 이름 (선생님 화면·카드 표시용)
export const UNIT_TITLES = {
  math: MATH_UNITS.map((u) => u.title),
  english: SCHEDULE.english.titles,
  korean: SCHEDULE.korean.titles,
  social: SCHEDULE.social.titles,
  science: SCHEDULE.science.titles,
};
const UNIT_WEEKS = {
  math: SCHEDULE.math,
  english: SCHEDULE.english.weeks,
  korean: SCHEDULE.korean.weeks,
  social: SCHEDULE.social.weeks,
  science: SCHEDULE.science.weeks,
};

function unitAt(weeks, week) {
  let acc = 0;
  for (let i = 0; i < weeks.length; i++) {
    acc += weeks[i];
    if (week < acc) return i;
  }
  return weeks.length - 1;
}

// 예전 설정(숫자 하나)도 배열로 읽는다
const asList = (v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** 날짜 → 몇 주차, 과목별 { current, fixed(선생님이 고른 단원 목록 | null) } */
export function curriculumPosition(dateKey) {
  const { semesterStart, override } = getSettings();
  const week = Math.max(0, Math.floor((new Date(dateKey) - new Date(semesterStart)) / WEEK_MS));
  const pos = { week };
  for (const s of Object.keys(UNIT_TITLES)) {
    const fixed = asList(override?.[s]).filter((i) => i >= 0 && i < UNIT_TITLES[s].length);
    pos[s] = fixed.length ? Math.max(...fixed) : unitAt(UNIT_WEEKS[s], week);
    pos[`${s}Fixed`] = fixed.length ? fixed : null;
  }
  return pos;
}

export function unitTitles(pos) {
  return Object.fromEntries(
    Object.keys(UNIT_TITLES).map((s) => [s, (pos[`${s}Fixed`] ?? [pos[s]]).map((i) => UNIT_TITLES[s][i]).join(', ')]),
  );
}

// 이번에 낼 단원 고르기: 정해진 단원이 있으면 그중에서, 없으면 지금 단원(복습 확률 reviewRate)
function pickUnit(r, pos, subject, reviewRate = 0.4) {
  const fixed = pos[`${subject}Fixed`];
  if (fixed) return fixed[randInt(r, 0, fixed.length - 1)];
  const cur = pos[subject];
  return cur > 0 && r() < reviewRate ? randInt(r, 0, cur - 1) : cur;
}

export function englishSet(r, count, pos, weights = null) {
  // 새 문항 은행 위주 + 단어 뜻 1문제(5문제마다)
  const nWords = Math.max(1, Math.round(count / 5));
  const units = Array.from({ length: nWords }, () => pickUnit(r, pos, 'english', 0.3));
  const used = new Set();
  const qs = units.map((u) => {
    const group = ENGLISH_WORDS.slice(u * WORDS_PER_UNIT, (u + 1) * WORDS_PER_UNIT).filter((w) => !used.has(w[0]));
    const [en, ko] = group[randInt(r, 0, group.length - 1)] ?? ENGLISH_WORDS[0];
    used.add(en);
    const toKo = r() < 0.6;
    const pool = shuffle(r, ENGLISH_WORDS.filter((w) => w[0] !== en)).slice(0, 3);
    const right = toKo ? ko : en;
    const choices = shuffle(r, [right, ...pool.map((w) => (toKo ? w[1] : w[0]))]);
    return { subject: 'english', unit: UNIT_TITLES.english[u], kind: 'choice', prompt: toKo ? en : ko, say: en, sub: toKo ? '이 단어의 뜻은?' : '알맞은 영어 단어는?', big: true, choices, answer: choices.indexOf(right) };
  });
  qs.push(...bankSet(r, 'english', count - nWords, pos, 0.25, weights));
  return qs;
}

// 과학 '물체의 운동': 속력 계산 생성
// 2022 개정 교육과정을 바탕으로 새로 만든 문항만 낸다 (학습지 옮긴 문항·예전 임시 문항은 쓰지 않음)
const BANKS = { korean: BANK_KOREAN, social: BANK_SOCIAL, science: BANK_SCIENCE, english: BANK_ENGLISH };
const qKey = (q) => `${q.passage ?? ''}|${q.prompt}`;

// 은행 과목(국어·사회·과학) count문제, 같은 문제 겹치지 않게
/** 정답이 늘 같은 자리에 오지 않게 보기 순서를 섞는다 */
function shuffleChoices(r, q) {
  if (q.kind !== 'choice') return q;
  const order = shuffle(r, q.choices.map((_, i) => i));
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}

function bankSet(r, subject, count, pos, reviewRate = 0.4, weights = null) {
  const blocked = blockedSet();
  const bank = BANKS[subject].filter((q) => !blocked.has(qId(q)));
  const out = [];
  const seen = new Set();
  for (let tries = 0; out.length < count && tries < 80; tries++) {
    const u = pickUnit(r, pos, subject, reviewRate);
    const pool = bank.filter((q) => q.unit === u && !seen.has(qKey(q)));
    if (!pool.length) continue;
    const q = pickWeighted(r, pool, weights);
    seen.add(qKey(q));
    out.push({ subject, ...shuffleChoices(r, q), unit: UNIT_TITLES[subject][q.unit] });
  }
  // 고른 단원에 아직 문항이 없으면(새 문항을 만드는 중인 단원) 문항이 있는 단원에서 채운다
  const rest = shuffle(r, bank.filter((q) => !seen.has(qKey(q))));
  while (out.length < count && rest.length) {
    const q = rest.pop();
    seen.add(qKey(q));
    out.push({ subject, ...shuffleChoices(r, q), unit: UNIT_TITLES[subject][q.unit] });
  }
  return out;
}

function mathSet(r, count, pos, reviewRate, weights = null) {
  const blocked = blockedSet();
  const out = [];
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    // 자동이면 앞의 4문제는 지금 단원, 나머지는 복습
    const auto = () => (i < count - 2 ? pos.math : pickUnit(r, pos, 'math', 1));
    let q;
    for (let tries = 0; tries < 12; tries++) {
      const u = pos.mathFixed || reviewRate !== undefined ? pickUnit(r, pos, 'math', reviewRate ?? 0.4) : auto();
      q = makeMathSet(r, 1, u, { weights, blocked, qId, pickWeighted })[0];
      if (!seen.has(q.prompt)) break;
    }
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

export const REVIEW_PER_DAY = 3; // 아침 미션에 섞어 낼 '다시 보기' 문제 수

/**
 * 오늘의 미션. adaptive 를 주면 그 학생의 학습 기록으로
 *  - 과목별 최근 정답률에 맞춰 난이도를 고르고
 *  - 1·3·7일 뒤 다시 볼 문제(틀렸거나 헷갈린 문제)를 같은 과목 자리에 섞는다
 */
export function buildDailyMission(sid, dateKey, { adaptive = false } = {}) {
  const r = seeded(`${sid}:${dateKey}`);
  const pos = curriculumPosition(dateKey);
  const c = MISSION_COUNTS;
  const w = (s) => (adaptive ? levelWeights(recentAccuracy(sid, s)) : null);
  // 탐구 과목은 국어·사회·과학이 번갈아 나오게 섞는다
  const ko = bankSet(r, 'korean', c.korean, pos, 0.25, w('korean'));
  const so = bankSet(r, 'social', c.social, pos, 0.25, w('social'));
  const sc = bankSet(r, 'science', c.science, pos, 0.4, w('science'));
  const inquiry = [];
  for (let i = 0; i < Math.max(ko.length, so.length, sc.length); i++) inquiry.push(...[ko[i], so[i], sc[i]].filter(Boolean));
  const qs = [...mathSet(r, c.math, pos, undefined, w('math')), ...englishSet(r, c.english, pos, w('english')), ...inquiry];
  if (adaptive) {
    const blocked = blockedSet();
    const ids = new Set(qs.map(qId));
    // 선생님이 이날 미션에 넣은 문제 (반 모두에게): 같은 과목의 뒤쪽 문제와 바꾼다
    const asg = getSettings().assigned;
    if (asg?.date === dateKey) {
      for (const id of (asg.ids ?? []).slice(0, ASSIGN_MAX)) {
        const q = bankQuestion(id);
        if (!q || ids.has(id)) continue;
        const at = qs.findLastIndex((x) => x.subject === q.subject && !x.assigned);
        if (at < 0) continue;
        qs[at] = { ...shuffleChoices(r, q), assigned: true };
        ids.add(id);
      }
    }
    // 다시 보기: 같은 과목의 뒤쪽 문제와 바꾼다 (과목별 문제 수는 그대로)
    for (const e of dueReviews(sid, REVIEW_PER_DAY * 2)) {
      if (qs.filter((q) => q.review).length >= REVIEW_PER_DAY) break;
      if (ids.has(e.id) || blocked.has(e.id) || !MISSION_COUNTS[e.q.subject]) continue;
      const at = qs.findLastIndex((q) => q.subject === e.q.subject && !q.review && !q.assigned);
      if (at < 0) continue;
      qs[at] = { ...shuffleChoices(r, e.q), review: true };
      ids.add(e.id);
    }
  }
  return qs.map((q, i) => ({ id: i, ...q }));
}

// 과목별 추가 연습 (별가루 없음): 배운 단원까지(또는 정해진 단원)에서 골고루
export function buildPractice(subject, seedStr, dateKey) {
  const r = seeded(seedStr);
  const pos = curriculumPosition(dateKey);
  let qs;
  if (subject === 'math') qs = mathSet(r, 10, pos, 0.6);
  else if (subject === 'english') qs = englishSet(r, 10, pos);
  else qs = bankSet(r, subject, 8, pos, 0.6);
  return qs.map((q, i) => ({ id: i, ...q }));
}

// 낱말 쓰기: 띄어쓰기·문장 부호는 따지지 않는다
const norm = (s) => String(s ?? '').replace(/[\s.,!?'"~·]/g, '').toLowerCase();
export function isCorrect(q, value) {
  if (q.kind === 'text') return [q.answer, ...(q.accept ?? [])].some((a) => norm(a) === norm(value)) && norm(value) !== '';
  if (q.kind === 'number') {
    const v = Number(String(value).trim());
    return Number.isFinite(v) && Math.abs(v - q.answer) < 1e-9;
  }
  return value === q.answer;
}
