// 오늘의 미션 조립: 20문제 = 수학 6 · 영어 5 · 국어 3 · 사회 3 · 과학 3
// - 선생님이 단원을 정해 두면: 그 단원(들)에서만 출제
// - 정하지 않으면: 날짜로 지금 단원을 계산해 지금 단원 위주 + 지난 단원 복습
import { seeded, shuffle, randInt } from './rng';
import { makeMathSet, MATH_UNITS } from './mathGen';
import { getSettings } from '../store/classSettings';
import { SCHEDULE, SOCIAL, SCIENCE, KOREAN, ENGLISH_WORDS, ENGLISH_EXPRESSIONS, ENGLISH_DIALOGS } from '../data/missions/grade5s2';

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

export function englishSet(r, count, pos) {
  const units = Array.from({ length: count - 2 }, (_, i) => (i < 3 ? pickUnit(r, pos, 'english', 0) : pickUnit(r, pos, 'english', 0.6)));
  const used = new Set();
  const qs = units.map((u) => {
    const group = ENGLISH_WORDS.slice(u * WORDS_PER_UNIT, (u + 1) * WORDS_PER_UNIT).filter((w) => !used.has(w[0]));
    const [en, ko] = group[randInt(r, 0, group.length - 1)] ?? ENGLISH_WORDS[0];
    used.add(en);
    const toKo = r() < 0.6;
    const pool = shuffle(r, ENGLISH_WORDS.filter((w) => w[0] !== en)).slice(0, 3);
    const right = toKo ? ko : en;
    const choices = shuffle(r, [right, ...pool.map((w) => (toKo ? w[1] : w[0]))]);
    return { subject: 'english', unit: UNIT_TITLES.english[u], kind: 'choice', prompt: toKo ? en : ko, sub: toKo ? '이 단어의 뜻은?' : '알맞은 영어 단어는?', big: true, choices, answer: choices.indexOf(right) };
  });
  // 대화에 알맞은 대답 고르기
  const du = pickUnit(r, pos, 'english', 0.4);
  const dlg = ENGLISH_DIALOGS.filter((d) => d[2] === du);
  const [ask, reply] = dlg[randInt(r, 0, dlg.length - 1)] ?? ENGLISH_DIALOGS[0];
  const wrong = shuffle(r, ENGLISH_DIALOGS.filter((d) => d[2] !== du)).slice(0, 3).map((d) => d[1]);
  const dChoices = shuffle(r, [reply, ...wrong]);
  qs.push({ subject: 'english', unit: UNIT_TITLES.english[du], kind: 'choice', prompt: ask, sub: '알맞은 대답은?', choices: dChoices, answer: dChoices.indexOf(reply) });
  // 마지막 한 문제는 생활 표현 (고른 단원에서)
  const eu = pickUnit(r, pos, 'english', 0.5);
  const exprs = ENGLISH_EXPRESSIONS.filter((e) => e[2] === eu && e[0] !== ask);
  const [en, ko] = (exprs.length ? exprs : ENGLISH_EXPRESSIONS)[randInt(r, 0, (exprs.length || ENGLISH_EXPRESSIONS.length) - 1)];
  const others = shuffle(r, ENGLISH_EXPRESSIONS.filter((e) => e[0] !== en)).slice(0, 3).map((e) => e[1]);
  const choices = shuffle(r, [ko, ...others]);
  qs.push({ subject: 'english', unit: '생활 표현', kind: 'choice', prompt: en, sub: '이 표현의 뜻은?', choices, answer: choices.indexOf(ko) });
  return qs;
}

// 과학 '물체의 운동': 속력 계산 생성
const BANKS = { korean: KOREAN, social: SOCIAL, science: SCIENCE };

// 은행 과목(국어·사회·과학) count문제, 같은 문제 겹치지 않게
/** 정답이 늘 같은 자리에 오지 않게 보기 순서를 섞는다 */
function shuffleChoices(r, q) {
  if (q.kind !== 'choice') return q;
  const order = shuffle(r, q.choices.map((_, i) => i));
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}

function bankSet(r, subject, count, pos, reviewRate = 0.4) {
  const bank = BANKS[subject];
  const out = [];
  const seen = new Set();
  for (let tries = 0; out.length < count && tries < 80; tries++) {
    const u = pickUnit(r, pos, subject, reviewRate);
    const pool = bank.filter((q) => q.unit === u && !seen.has(q.prompt));
    if (!pool.length) continue;
    const q = pool[randInt(r, 0, pool.length - 1)];
    seen.add(q.prompt);
    out.push({ subject, ...shuffleChoices(r, q), unit: UNIT_TITLES[subject][q.unit] });
  }
  return out;
}

function mathSet(r, count, pos, reviewRate) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    // 자동이면 앞의 4문제는 지금 단원, 나머지는 복습
    const auto = () => (i < count - 2 ? pos.math : pickUnit(r, pos, 'math', 1));
    let q;
    for (let tries = 0; tries < 12; tries++) {
      const u = pos.mathFixed || reviewRate !== undefined ? pickUnit(r, pos, 'math', reviewRate ?? 0.4) : auto();
      q = makeMathSet(r, 1, u)[0];
      if (!seen.has(q.prompt)) break;
    }
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

export function buildDailyMission(sid, dateKey) {
  const r = seeded(`${sid}:${dateKey}`);
  const pos = curriculumPosition(dateKey);
  const c = MISSION_COUNTS;
  // 탐구 과목은 국어·사회·과학이 번갈아 나오게 섞는다
  const ko = bankSet(r, 'korean', c.korean, pos);
  const so = bankSet(r, 'social', c.social, pos);
  const sc = bankSet(r, 'science', c.science, pos);
  const inquiry = [];
  for (let i = 0; i < Math.max(ko.length, so.length, sc.length); i++) inquiry.push(...[ko[i], so[i], sc[i]].filter(Boolean));
  const qs = [...mathSet(r, c.math, pos), ...englishSet(r, c.english, pos), ...inquiry];
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

export function isCorrect(q, value) {
  if (q.kind === 'number') {
    const v = Number(String(value).trim());
    return Number.isFinite(v) && Math.abs(v - q.answer) < 1e-9;
  }
  return value === q.answer;
}
