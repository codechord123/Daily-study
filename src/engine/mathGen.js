// 5학년 2학기 수학 문제 생성기 (2022 개정, 단원별)
// 1 수의 범위와 어림하기 · 2 분수의 곱셈 · 3 합동과 대칭 · 4 소수의 곱셈 · 5 직육면체 · 6 평균과 가능성
import { randInt, shuffle } from './rng';
import { BANK_MATH } from '../data/missions/bank';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (n, d) => {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
const fracStr = ({ n, d }) => {
  if (d === 1) return String(n);
  if (n > d) return `${Math.floor(n / d)}{${n % d}/${d}}`;
  return `{${n}/${d}}`;
};
const dec = (x) => String(Math.round(x * 10000) / 10000);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function choicesFrom(r, answer, wrongs) {
  const set = [...new Set([answer, ...wrongs])].filter((x) => x !== undefined && x !== '').slice(0, 4);
  const choices = shuffle(r, set);
  return { choices, answer: choices.indexOf(answer) };
}

/* ---------- 1. 수의 범위와 어림하기 ---------- */
const RANGE_FORMS = [
  { words: ['이상', '이하'], lo: true, hi: true },
  { words: ['이상', '미만'], lo: true, hi: false },
  { words: ['초과', '이하'], lo: false, hi: true },
  { words: ['초과', '미만'], lo: false, hi: false },
];
const PLACE = [
  { name: '십', unit: 10 },
  { name: '백', unit: 100 },
  { name: '천', unit: 1000 },
];
const ROUND = [
  { name: '올림', f: Math.ceil },
  { name: '버림', f: Math.floor },
  { name: '반올림', f: Math.round },
];

const unit1 = [
  (r) => {
    const a = randInt(r, 20, 70);
    const b = a + randInt(r, 4, 8);
    const form = pick(r, RANGE_FORMS);
    const inside = (x) => (form.lo ? x >= a : x > a) && (form.hi ? x <= b : x < b);
    const right = a + 2;
    const outs = [a - 1, b + 1, a, b, a - 2, b + 2].filter((x) => !inside(x));
    return {
      kind: 'choice',
      prompt: `${a} ${form.words[0]} ${b} ${form.words[1]}인 수는?`,
      ...choicesFrom(r, String(right), shuffle(r, outs).slice(0, 3).map(String)),
      hint: '이상·이하는 그 수를 포함해요',
    };
  },
  (r) => {
    const place = pick(r, PLACE.slice(0, 2));
    const rd = pick(r, ROUND);
    const n = randInt(r, 1001, 9998);
    return { kind: 'number', prompt: `${n}을(를) ${rd.name}하여 ${place.name}의 자리까지 나타내면?`, answer: rd.f(n / place.unit) * place.unit };
  },
  (r) => {
    const k = pick(r, [8, 10, 12, 15]);
    const n = k * randInt(r, 3, 9) + randInt(r, 1, k - 1);
    return { kind: 'number', prompt: `학생 ${n}명이 한 번에 ${k}명씩 탈 수 있는 케이블카를 모두 타려면 적어도 몇 번 운행해야 할까요?`, answer: Math.ceil(n / k), hint: '남는 사람도 타야 하니 올림!' };
  },
  (r) => {
    const n = randInt(r, 123, 989);
    return { kind: 'number', prompt: `사과 ${n}개를 한 상자에 10개씩 담아 팔려고 해요. 팔 수 있는 상자는 최대 몇 상자일까요?`, answer: Math.floor(n / 10), hint: '모자란 상자는 팔 수 없으니 버림!' };
  },
];

/* ---------- 2. 분수의 곱셈 ---------- */
const unit2 = [
  (r) => {
    const d = randInt(r, 3, 9), n = randInt(r, 1, d - 1), k = randInt(r, 2, 6);
    const ans = frac(n * k, d);
    return { kind: 'choice', prompt: `{${n}/${d}} × ${k} = ?`, ...choicesFrom(r, fracStr(ans), [fracStr(frac(n, d * k)), fracStr(frac(n + k, d)), fracStr(frac(n * k + 1, d))]) };
  },
  (r) => {
    const d = randInt(r, 3, 9), n = randInt(r, 1, d - 1), k = randInt(r, 2, 8);
    const ans = frac(k * n, d);
    return { kind: 'choice', prompt: `${k} × {${n}/${d}} = ?`, ...choicesFrom(r, fracStr(ans), [fracStr(frac(k + n, d)), fracStr(frac(n, k * d)), fracStr(frac(k * n, d + 1))]) };
  },
  (r) => {
    const a = randInt(r, 2, 6);
    let b = randInt(r, 2, 7);
    if (a === b) b += 1;
    return { kind: 'choice', prompt: `{1/${a}} × {1/${b}} = ?`, ...choicesFrom(r, `{1/${a * b}}`, [`{2/${a + b}}`, `{1/${a + b}}`, `{${a}/${b}}`]), hint: '단위분수끼리 곱하면 분모끼리 곱해요' };
  },
  (r) => {
    const d1 = randInt(r, 2, 6), n1 = randInt(r, 1, d1 - 1), d2 = randInt(r, 2, 7), n2 = randInt(r, 1, d2 - 1);
    const ans = frac(n1 * n2, d1 * d2);
    return { kind: 'choice', prompt: `{${n1}/${d1}} × {${n2}/${d2}} = ?`, ...choicesFrom(r, fracStr(ans), [fracStr(frac(n1 + n2, d1 + d2)), fracStr(frac(n1 * d2, d1 * n2)), fracStr(frac(n1 * n2 + 1, d1 * d2))]) };
  },
  (r) => {
    const w = randInt(r, 1, 3), d = randInt(r, 2, 5), n = randInt(r, 1, d - 1), k = randInt(r, 2, 4);
    const ans = frac((w * d + n) * k, d);
    return { kind: 'choice', prompt: `${w}{${n}/${d}} × ${k} = ?`, ...choicesFrom(r, fracStr(ans), [fracStr(frac(w * k * d + n, d)), fracStr(frac((w * d + n) * k + 1, d)), fracStr(frac(w * d + n * k, d))]), hint: '대분수를 가분수로 바꿔요' };
  },
];

/* ---------- 3. 합동과 대칭 ---------- */
const AXES = [
  ['정삼각형', '3'], ['정사각형', '4'], ['직사각형', '2'], ['정오각형', '5'], ['정육각형', '6'], ['원', '셀 수 없이 많아요'],
];
const POINT_SYM = [
  ['정사각형', true], ['평행사변형', true], ['정육각형', true], ['원', true], ['마름모', true],
  ['정삼각형', false], ['이등변삼각형', false], ['정오각형', false],
];
const unit3 = [
  (r) => {
    const [shape, ans] = pick(r, AXES);
    return { kind: 'choice', prompt: `${shape}의 대칭축은 몇 개일까요?`, ...choicesFrom(r, ans, shuffle(r, ['1', '2', '3', '4', '5', '6', '셀 수 없이 많아요'].filter((x) => x !== ans)).slice(0, 3)) };
  },
  (r) => {
    const [shape, ans] = pick(r, POINT_SYM);
    return { kind: 'ox', prompt: `${shape}은(는) 점대칭도형이다.`, answer: ans, explain: ans ? '한 점을 중심으로 180° 돌리면 겹쳐요.' : '180° 돌리면 처음 모양과 겹치지 않아요.' };
  },
  (r) => {
    const a = randInt(r, 4, 9), b = randInt(r, 5, 10), c = randInt(r, 6, 12);
    return { kind: 'number', prompt: `두 삼각형이 서로 합동이에요. 한 삼각형의 세 변이 ${a}cm, ${b}cm, ${c}cm일 때, 다른 삼각형의 둘레는? (cm)`, answer: a + b + c, hint: '합동이면 대응변의 길이가 같아요' };
  },
  (r) => {
    const L = randInt(r, 3, 12) * 2;
    return { kind: 'number', prompt: `선대칭도형에서 두 대응점을 이은 선분의 길이가 ${L}cm예요. 한 대응점에서 대칭축까지의 거리는? (cm)`, answer: L / 2, hint: '대칭축은 대응점을 이은 선분을 똑같이 둘로 나눠요' };
  },
  (r) => {
    const deg = randInt(r, 4, 14) * 5;
    return { kind: 'number', prompt: `두 사각형이 서로 합동이에요. 한 사각형의 한 각이 ${deg}°일 때, 그 대응각의 크기는? (°)`, answer: deg };
  },
  (r) => {
    const d = randInt(r, 2, 9);
    return { kind: 'number', prompt: `점대칭도형에서 대칭의 중심부터 한 점까지의 거리가 ${d}cm예요. 그 점과 대응점을 이은 선분의 길이는? (cm)`, answer: d * 2, hint: '대칭의 중심은 대응점을 이은 선분을 똑같이 둘로 나눠요' };
  },
  (r) => {
    const a = randInt(r, 4, 12), b = randInt(r, 3, 9);
    return { kind: 'number', prompt: `점대칭도형인 평행사변형의 두 변이 ${a}cm, ${b}cm예요. 둘레는? (cm)`, answer: 2 * (a + b), hint: '대응변의 길이가 서로 같아요' };
  },
  (r) => {
    const q = pick(r, [
      ['모양과 크기가 같아 포개었을 때 완전히 겹치는 두 도형은 서로 합동이다.', true, '맞아요, 그게 합동의 뜻이에요.'],
      ['모양이 같으면 크기가 달라도 서로 합동이다.', false, '크기까지 같아야 합동이에요.'],
      ['선대칭도형에서 대응각의 크기는 서로 같다.', true, '대칭축으로 접으면 겹치니까요.'],
      ['선대칭도형의 대칭축은 언제나 1개뿐이다.', false, '정사각형은 4개, 원은 셀 수 없이 많아요.'],
      ['점대칭도형은 대칭의 중심을 중심으로 180° 돌렸을 때 처음 도형과 완전히 겹친다.', true, '맞아요.'],
      ['점대칭도형에서 대칭의 중심은 1개뿐이다.', true, '대칭의 중심은 항상 하나예요.'],
    ]);
    return { kind: 'ox', prompt: q[0], answer: q[1], explain: q[2] };
  },
];

/* ---------- 4. 소수의 곱셈 ---------- */
const unit4 = [
  (r) => {
    const a = randInt(r, 1, 9) / 10, k = randInt(r, 2, 9);
    return { kind: 'number', prompt: `${dec(a)} × ${k} = ?`, answer: Number(dec(a * k)) };
  },
  (r) => {
    const k = randInt(r, 2, 9), a = randInt(r, 11, 95) / 100;
    return { kind: 'number', prompt: `${k} × ${dec(a)} = ?`, answer: Number(dec(a * k)) };
  },
  (r) => {
    const a = randInt(r, 11, 49) / 10, b = randInt(r, 2, 9) / 10;
    return { kind: 'number', prompt: `${dec(a)} × ${dec(b)} = ?`, answer: Number(dec(a * b)) };
  },
  (r) => {
    const x = randInt(r, 2, 9), y = randInt(r, 2, 9);
    const ans = dec((x / 10) * (y / 100));
    return {
      kind: 'choice',
      prompt: `${dec(x / 10)} × ${dec(y / 100)} = ?`,
      ...choicesFrom(r, ans, [dec((x * y) / 100), dec((x * y) / 10), dec((x * y) / 10000)]),
      hint: '곱하는 두 수의 소수점 아래 자리 수를 더해 봐요',
    };
  },
  (r) => {
    const n = randInt(r, 12, 98);
    const k = pick(r, [10, 100, 1000]);
    return { kind: 'number', prompt: `${dec(n / 100)} × ${k} = ?`, answer: Number(dec((n / 100) * k)), hint: '10, 100, 1000을 곱하면 소수점이 오른쪽으로 옮겨가요' };
  },
  (r) => {
    const km = randInt(r, 105, 245), weeks = randInt(r, 1, 3);
    return { kind: 'number', prompt: `매일 ${dec(km / 100)}km씩 달리기를 해요. ${weeks}주 동안 달린 거리는? (km)`, answer: Number(dec((km * 7 * weeks) / 100)), hint: `${weeks}주는 ${7 * weeks}일이에요` };
  },
  (r) => {
    const bag = randInt(r, 3, 9), book = randInt(r, 11, 25), n = randInt(r, 2, 4);
    return { kind: 'number', prompt: `${dec(bag / 10)}kg인 가방에 ${dec(book / 10)}kg짜리 책 ${n}권을 넣었어요. 책을 넣은 가방의 무게는? (kg)`, answer: Number(dec((bag + book * n) / 10)) };
  },
  (r) => {
    const k = randInt(r, 3, 9), t = randInt(r, 2, 9);
    const big = pick(r, [true, false]);
    const m = big ? 10 + t : t;
    return { kind: 'ox', prompt: `${k} × ${dec(m / 10)}의 곱은 ${k}보다 크다.`, answer: big, explain: big ? '1보다 큰 수를 곱하면 처음 수보다 커져요.' : '1보다 작은 수를 곱하면 처음 수보다 작아져요.' };
  },
  (r) => {
    const a = randInt(r, 2, 9), k = randInt(r, 2, 9);
    return {
      kind: 'choice',
      prompt: `${dec(a / 10)} × ${k}을(를) 분수의 곱셈으로 바르게 나타낸 것은?`,
      ...choicesFrom(r, `{${a}/10} × ${k}`, [`{${a}/100} × ${k}`, `{${a}/10} × {${k}/10}`, `{${a * k}/100}`]),
      hint: '0.1은 {1/10}이에요',
    };
  },
];

/* ---------- 5. 직육면체 ---------- */
const CUBOID_FACTS = [
  ['직육면체의 면은 모두 몇 개일까요?', 6],
  ['직육면체의 모서리는 모두 몇 개일까요?', 12],
  ['직육면체의 꼭짓점은 모두 몇 개일까요?', 8],
  ['직육면체에서 한 꼭짓점에서 만나는 면은 몇 개일까요?', 3],
  ['직육면체의 겨냥도에서 보이지 않는 모서리는 몇 개일까요?', 3],
  ['직육면체의 겨냥도에서 보이지 않는 꼭짓점은 몇 개일까요?', 1],
  ['직육면체에서 서로 평행한 면은 모두 몇 쌍일까요?', 3],
  ['직육면체에서 한 면과 수직인 면은 몇 개일까요?', 4],
];
const unit5 = [
  (r) => {
    const [q, a] = pick(r, CUBOID_FACTS);
    return { kind: 'number', prompt: q, answer: a };
  },
  (r) => {
    const a = randInt(r, 3, 12);
    return { kind: 'number', prompt: `한 모서리가 ${a}cm인 정육면체의 모든 모서리 길이의 합은? (cm)`, answer: a * 12, hint: '정육면체의 모서리는 12개, 길이가 모두 같아요' };
  },
  (r) => {
    const a = randInt(r, 3, 10), b = randInt(r, 2, 8), c = randInt(r, 2, 6);
    return { kind: 'number', prompt: `가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 모든 모서리 길이의 합은? (cm)`, answer: 4 * (a + b + c), hint: '같은 길이의 모서리가 4개씩 있어요' };
  },
  (r) => {
    const q = pick(r, [
      ['정육면체는 직육면체라고 할 수 있다.', true, '정육면체도 직사각형 6개로 둘러싸인 도형이에요.'],
      ['직육면체는 정육면체라고 할 수 있다.', false, '직육면체의 면이 모두 정사각형인 것은 아니에요.'],
      ['직육면체의 겨냥도에서 보이는 모서리는 실선으로 그린다.', true],
      ['직육면체의 전개도를 접으면 마주 보는 면끼리 크기가 같다.', true],
    ]);
    return { kind: 'ox', prompt: q[0], answer: q[1], explain: q[2] };
  },
];

/* ---------- 6. 평균과 가능성 ---------- */
const LIKELY = ['불가능하다', '~아닐 것 같다', '반반이다', '~일 것 같다', '확실하다'];
const EVENTS = [
  ['주사위를 굴렸을 때 7이 나올 가능성', 0],
  ['동전을 던졌을 때 그림 면이 나올 가능성', 2],
  ['주사위를 굴렸을 때 1부터 6 중 한 눈이 나올 가능성', 4],
  ['빨간 공 9개, 파란 공 1개가 든 주머니에서 빨간 공을 꺼낼 가능성', 3],
  ['빨간 공 1개, 파란 공 9개가 든 주머니에서 빨간 공을 꺼낼 가능성', 1],
  ['12월 다음에 1월이 올 가능성', 4],
  ['주사위를 굴렸을 때 짝수 눈이 나올 가능성', 2],
];
const unit6 = [
  (r) => {
    const n = randInt(r, 4, 5), m = randInt(r, 60, 80);
    const devs = Array.from({ length: n - 1 }, () => randInt(r, -5, 5));
    devs.push(-devs.reduce((a, b) => a + b, 0));
    const xs = devs.map((d) => m + d);
    return { kind: 'number', prompt: `${xs.join('점, ')}점의 평균은? (점)`, answer: m, hint: '모두 더한 뒤 개수로 나눠요' };
  },
  (r) => {
    const m = randInt(r, 20, 40);
    const xs = [m + randInt(r, -6, 6), m + randInt(r, -6, 6), m + randInt(r, -6, 6)];
    const missing = 4 * m - xs.reduce((a, b) => a + b, 0);
    return { kind: 'number', prompt: `4일 동안 읽은 쪽수의 평균이 ${m}쪽이에요. 3일 동안 ${xs.join('쪽, ')}쪽을 읽었다면 넷째 날은 몇 쪽을 읽었을까요?`, answer: missing, hint: '평균 × 날수 = 전체 쪽수' };
  },
  (r) => {
    const [ev, ans] = pick(r, EVENTS);
    return { kind: 'choice', prompt: `${ev}은?`, ...choicesFrom(r, LIKELY[ans], shuffle(r, LIKELY.filter((_, i) => i !== ans)).slice(0, 3)) };
  },
  (r) => {
    const [ev, ans] = pick(r, EVENTS.filter((e) => e[1] === 0 || e[1] === 2 || e[1] === 4));
    const num = ans === 0 ? '0' : ans === 2 ? '{1/2}' : '1';
    return { kind: 'choice', prompt: `${ev}을 수로 나타내면?`, ...choicesFrom(r, num, ['0', '{1/2}', '1', '{1/4}'].filter((x) => x !== num)) };
  },
];

export const MATH_UNITS = [
  { title: '수의 범위와 어림하기', gens: unit1 },
  { title: '분수의 곱셈', gens: unit2 },
  { title: '합동과 대칭', gens: unit3 },
  { title: '소수의 곱셈', gens: unit4 },
  { title: '직육면체', gens: unit5 },
  { title: '평균과 가능성', gens: unit6 },
];

/** current: 지금 단원 번호. 지금 단원에서 3문제 + 지난 단원 복습 2문제 */
export function makeMathSet(r, count, current) {
  const out = [];
  const used = new Set();
  const draw = (u) => {
    // 새로 만든 생각하는 문제가 있는 단원은 대부분 거기서 낸다 (나머지는 계산 연습 생성)
    const bank = BANK_MATH.filter((q) => q.unit === u && !used.has(q.prompt));
    if (bank.length && r() < 0.85) {
      const q = bank[Math.floor(r() * bank.length)];
      used.add(q.prompt);
      const order = q.kind === 'choice' ? shuffle(r, q.choices.map((_, i) => i)) : null;
      const shuffled = order ? { choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) } : {};
      out.push({ subject: 'math', ...q, ...shuffled, unit: MATH_UNITS[u].title });
      return;
    }
    const gens = MATH_UNITS[u].gens;
    let g;
    for (let tries = 0; tries < 8; tries++) {
      g = gens[Math.floor(r() * gens.length)];
      if (!used.has(g)) break;
    }
    used.add(g);
    out.push({ subject: 'math', unit: MATH_UNITS[u].title, ...g(r) });
  };
  const fresh = current === 0 ? count : Math.min(3, count);
  for (let i = 0; i < fresh; i++) draw(current);
  for (let i = fresh; i < count; i++) draw(randInt(r, 0, current - 1));
  return out;
}
