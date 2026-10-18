// 5학년 연산 문제 자동 생성기. 각 생성기는 문제 하나를 돌려준다.
import { randInt, shuffle } from './rng';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const frac = (n, d) => {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
const fracStr = ({ n, d }) => {
  if (d === 1) return String(n);
  if (n > d) return `${Math.floor(n / d)}{${n % d}/${d}}`;
  return `{${n}/${d}}`;
};
// 소수 오차 없이 표시
const dec = (x) => String(Math.round(x * 1000) / 1000);

function choicesFrom(r, answer, wrongs) {
  const set = [...new Set([answer, ...wrongs])].filter(Boolean).slice(0, 4);
  const choices = shuffle(r, set);
  return { choices, answer: choices.indexOf(answer) };
}

const GENERATORS = [
  // 자연수의 혼합 계산
  (r) => {
    const a = randInt(r, 10, 40), b = randInt(r, 2, 9), c = randInt(r, 2, 9), d = randInt(r, 1, 15);
    return { kind: 'number', prompt: `${a} + ${b} × ${c} − ${d} = ?`, answer: a + b * c - d, hint: '곱셈을 먼저 해요' };
  },
  (r) => {
    const b = randInt(r, 2, 6), q = randInt(r, 3, 9), a = randInt(r, 1, b * q - 1);
    return { kind: 'number', prompt: `(${a} + ${b * q - a}) ÷ ${b} × 3 = ?`, answer: q * 3, hint: '괄호 안을 먼저 계산해요' };
  },
  // 약수와 배수
  (r) => {
    const g = randInt(r, 2, 8), x = randInt(r, 2, 5);
    let y = randInt(r, 2, 6);
    if (gcd(x, y) !== 1) y = x + 1;
    return { kind: 'number', prompt: `${g * x}와 ${g * y}의 최대공약수는?`, answer: g };
  },
  (r) => {
    const a = randInt(r, 3, 9);
    let b = randInt(r, 4, 12);
    if (a === b) b += 1;
    return { kind: 'number', prompt: `${a}와 ${b}의 최소공배수는?`, answer: lcm(a, b) };
  },
  // 분모가 다른 분수의 덧셈
  (r) => {
    const d1 = randInt(r, 2, 6);
    let d2 = randInt(r, 3, 8);
    if (d1 === d2) d2 += 1;
    const n1 = randInt(r, 1, d1 - 1), n2 = randInt(r, 1, d2 - 1);
    const ans = frac(n1 * d2 + n2 * d1, d1 * d2);
    const wrong1 = frac(n1 + n2, d1 + d2);
    const wrong2 = frac(n1 + n2, d1 * d2);
    const wrong3 = frac(ans.n + 1, ans.d);
    return {
      kind: 'choice',
      prompt: `{${n1}/${d1}} + {${n2}/${d2}} = ?`,
      ...choicesFrom(r, fracStr(ans), [fracStr(wrong1), fracStr(wrong2), fracStr(wrong3)]),
      hint: '통분해서 더해요',
    };
  },
  // (분수) × (자연수)
  (r) => {
    const d = randInt(r, 3, 9), n = randInt(r, 1, d - 1), k = randInt(r, 2, 6);
    const ans = frac(n * k, d);
    return {
      kind: 'choice',
      prompt: `{${n}/${d}} × ${k} = ?`,
      ...choicesFrom(r, fracStr(ans), [fracStr(frac(n, d * k)), fracStr(frac(n + k, d)), fracStr(frac(n * k + 1, d))]),
    };
  },
  // 소수의 곱셈
  (r) => {
    const a = randInt(r, 1, 9) / 10, k = randInt(r, 2, 9);
    return { kind: 'number', prompt: `${dec(a)} × ${k} = ?`, answer: Number(dec(a * k)), decimal: true };
  },
  (r) => {
    const a = randInt(r, 11, 49) / 10, b = randInt(r, 2, 9) / 10;
    return { kind: 'number', prompt: `${dec(a)} × ${dec(b)} = ?`, answer: Number(dec(a * b)), decimal: true };
  },
  // 넓이
  (r) => {
    const b = randInt(r, 2, 12) * 2, h = randInt(r, 3, 12);
    return { kind: 'number', prompt: `밑변 ${b}cm, 높이 ${h}cm인 삼각형의 넓이는? (cm²)`, answer: (b * h) / 2 };
  },
  (r) => {
    const a = randInt(r, 4, 15), b = randInt(r, 3, 12);
    return { kind: 'number', prompt: `가로 ${a}cm, 세로 ${b}cm인 직사각형의 둘레는? (cm)`, answer: 2 * (a + b) };
  },
];

export function makeMathSet(r, count) {
  return shuffle(r, GENERATORS)
    .slice(0, count)
    .map((gen) => ({ subject: 'math', ...gen(r) }));
}
