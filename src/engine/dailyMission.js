// 오늘의 미션 조립: 수학 5 + 영어 5 + 탐구 3 (국어·사회·과학 순환)
import { seeded, shuffle, randInt } from './rng';
import { makeMathSet } from './mathGen';
import { ENGLISH_WORDS, INQUIRY } from '../data/missions/grade5';

const INQUIRY_ROTATION = [
  ['korean', 'social', 'science'],
  ['science', 'korean', 'social'],
  ['social', 'science', 'korean'],
];

function englishSet(r, count) {
  return shuffle(r, ENGLISH_WORDS)
    .slice(0, count)
    .map(([en, ko]) => {
      const toKo = r() < 0.6;
      const pool = shuffle(r, ENGLISH_WORDS.filter((w) => w[0] !== en)).slice(0, 3);
      const right = toKo ? ko : en;
      const choices = shuffle(r, [right, ...pool.map((w) => (toKo ? w[1] : w[0]))]);
      return {
        subject: 'english',
        kind: 'choice',
        prompt: toKo ? en : ko,
        sub: toKo ? '이 단어의 뜻은?' : '알맞은 영어 단어는?',
        big: true,
        choices,
        answer: choices.indexOf(right),
      };
    });
}

function inquirySet(r, dayIndex) {
  const order = INQUIRY_ROTATION[dayIndex % INQUIRY_ROTATION.length];
  return order.map((subject) => {
    const bank = INQUIRY[subject];
    return { subject, ...bank[randInt(r, 0, bank.length - 1)] };
  });
}

export function buildDailyMission(sid, dateKey) {
  const r = seeded(`${sid}:${dateKey}`);
  const dayIndex = Math.floor(new Date(dateKey).getTime() / 86400000);
  const qs = [...makeMathSet(r, 5), ...englishSet(r, 5), ...inquirySet(r, dayIndex)];
  return qs.map((q, i) => ({ id: i, ...q }));
}

export function isCorrect(q, value) {
  if (q.kind === 'number') {
    const v = Number(String(value).trim());
    return Number.isFinite(v) && Math.abs(v - q.answer) < 1e-9;
  }
  return value === q.answer;
}
