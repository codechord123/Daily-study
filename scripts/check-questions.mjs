// 문제 검사기: docs/문제규칙.md 의 규칙 중 기계로 잡을 수 있는 것을 모든 문항 은행 문제와
// 수학 생성기(단원마다 여러 번 뽑아서)에 적용한다. 오류가 하나라도 있으면 실패(종료 코드 1).
//   npm run check:questions            검사
//   npm run check:questions -- --sheet 그림 문제를 한 페이지에 모은 review/문제그림.html 도 만든다 (눈 검수용)
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const load = (p) => server.ssrLoadModule(p);
const bank = await load('/src/data/missions/bank/index.js');
const { MATH_UNITS } = await load('/src/engine/mathGen.js');
const { isRetired } = await load('/src/data/missions/retired.js');
const { qId } = await load('/src/store/learnStore.js');
const { SCHEDULE } = await load('/src/data/missions/grade5s2.js');
await server.close();

const UNITS = {
  math: MATH_UNITS.map((u) => u.title),
  english: SCHEDULE.english.titles,
  korean: SCHEDULE.korean.titles,
  social: SCHEDULE.social.titles,
  science: SCHEDULE.science.titles,
};
const BANKS = { math: bank.BANK_MATH, english: bank.BANK_ENGLISH, korean: bank.BANK_KOREAN, social: bank.BANK_SOCIAL, science: bank.BANK_SCIENCE };

const problems = []; // { level: 'error' | 'warn', rule, where, msg }
const report = (level, rule, where, msg) => problems.push({ level, rule, where, msg });

const svgTexts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].trim());
// 문제 글에 나오는 도형 이름(변 ㄱㄴ, 선분 ㄱㄷ, 각 ㄱㄴㄷ, 점 ㅇ, 삼각형 ㄱㄴㄷ …)의 자음들
const NAME_RE = /(변|선분|각|점|삼각형|사각형|평행사변형|직사각형|도형)\s*([ㄱ-ㅎ]{1,4})(?![가-힣])/g;
const namesIn = (s) => [...String(s ?? '').matchAll(NAME_RE)].flatMap((m) => [...m[2]]);
// 그림이 있어야 하는 말
const NEEDS_FIG = /(이|다음|아래|위|오른쪽|왼쪽) (그림|도형)|그림에서|그림을 보고|그림과 같이|그림의 도형|분홍 점선|회색 점선|모눈/;

function checkQuestion(q, where, { fromBank }) {
  // R1 형식
  if (!['choice', 'ox', 'number', 'text'].includes(q.kind)) return report('error', 'R1', where, `알 수 없는 문제 종류: ${q.kind}`);
  if (!String(q.prompt ?? '').trim()) report('error', 'R1', where, '문제 글이 비어 있어요');
  if (q.kind === 'choice') {
    if (!Array.isArray(q.choices) || q.choices.length < 2) report('error', 'R1', where, '보기가 2개보다 적어요');
    else {
      if (new Set(q.choices).size !== q.choices.length) report('error', 'R2', where, `보기가 겹쳐요: ${q.choices.join(' / ')}`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) report('error', 'R1', where, `정답 번호가 보기 범위 밖이에요: ${q.answer}`);
      if (q.choices.some((c) => !String(c).trim())) report('error', 'R1', where, '빈 보기가 있어요');
    }
  }
  if (q.kind === 'ox' && typeof q.answer !== 'boolean') report('error', 'R1', where, 'O/X 문제의 정답이 참/거짓이 아니에요');
  if (q.kind === 'number' && (typeof q.answer !== 'number' || !Number.isFinite(q.answer))) report('error', 'R1', where, `수 문제의 정답이 수가 아니에요: ${q.answer}`);
  if (q.kind === 'number' && q.answer < 0) report('error', 'R2', where, `정답이 음수예요: ${q.answer}`);
  if (q.kind === 'text' && !String(q.answer ?? '').trim()) report('error', 'R1', where, '쓰는 문제의 정답이 비어 있어요');

  // R3 풀이 (문항 은행은 반드시)
  if (fromBank && !String(q.explain ?? '').trim()) report('error', 'R3', where, '풀이(explain)가 없어요');

  // R4 힌트가 답을 그대로 알려 주면 안 됨
  if (q.hint && q.kind === 'number' && new RegExp(`(^|[^0-9.])${String(q.answer).replace('.', '\\.')}([^0-9.]|$)`).test(q.hint))
    report('error', 'R4', where, `힌트에 정답(${q.answer})이 들어 있어요: ${q.hint}`);

  // R10 그림: 그림을 말하는데 그림이 없으면 안 됨
  const text = `${q.passage ?? ''} ${q.prompt}`;
  if (NEEDS_FIG.test(text) && !q.svg && !q.image && !q.passage) report('error', 'R10', where, '문제가 그림을 말하는데 그림이 없어요');

  if (q.svg) {
    if (/NaN|undefined|Infinity/.test(q.svg)) report('error', 'R11', where, '그림 좌표가 깨졌어요(NaN 등)');
    const labels = svgTexts(q.svg);
    // R12 문제·보기에 나오는 도형 이름은 그림에 모두 있어야
    const want = new Set([...namesIn(text), ...(q.kind === 'choice' ? q.choices.flatMap(namesIn) : [])]);
    const have = new Set(labels.join(''));
    const missing = [...want].filter((c) => !have.has(c));
    if (missing.length) report('error', 'R12', where, `문제에 나오는 이름 ${missing.join(', ')}이(가) 그림에 없어요`);
    // R13 길이는 치수선(양 끝 눈금이 있는 파란 선)으로: 길이 글자 수만큼 치수선 묶음이 있어야
    const lens = labels.filter((t) => /^\??\d*(\.\d+)?\s*(cm|m|mm)$/.test(t)).length;
    const dims = (q.svg.match(/<g stroke="#2563eb"/g) ?? []).length;
    if (lens > dims) report('error', 'R13', where, `길이 ${lens}개 중 ${lens - dims}개가 치수선 없이 글자만 있어요 (어느 변인지 끝점까지 표시)`);
    // R14 각은 빨간 호와 함께
    const degs = labels.filter((t) => /^\??\d*°$|^\?$/.test(t)).length;
    const arcs = (q.svg.match(/stroke="#dc2626"/g) ?? []).length;
    if (degs > arcs) report('warn', 'R14', where, `각 ${degs}개 중 ${degs - arcs}개에 호 표시가 없어요`);
  }
  // R20 더 내지 않기로 한 옛 생성 문제
  if (isRetired(q, qId(q))) report('error', 'R20', where, '더 내지 않기로 한 옛 문제 모양이에요 (retired.js)');
}

// ---- 문항 은행 ----
let bankCount = 0;
for (const [subject, list] of Object.entries(BANKS)) {
  const seen = new Map();
  list.forEach((q, i) => {
    const where = `${subject} #${i}`;
    bankCount++;
    checkQuestion(q, where, { fromBank: true });
    if (!Number.isInteger(q.unit) || q.unit < 0 || q.unit >= UNITS[subject].length) report('error', 'R30', where, `단원 번호가 없거나 범위 밖이에요: ${q.unit}`);
    if (!q.std) report('warn', 'R31', where, '성취기준(std)이 없어요');
    const id = qId(q);
    if (seen.has(id)) report('error', 'R32', where, `${seen.get(id)}과 같은 문제예요`);
    seen.set(id, where);
  });
}

// ---- 수학 생성기: 생성기마다 300번 뽑아 본다 ----
let genCount = 0;
const genSamples = [];
MATH_UNITS.forEach((u, ui) =>
  u.gens.forEach((g, gi) => {
    const fails = new Map();
    for (let s = 1; s <= 300; s++) {
      let x = s * 48271;
      const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
      const q = g(r);
      genCount++;
      const before = problems.length;
      checkQuestion(q, `수학 생성기 ${ui + 1}단원 #${gi}`, { fromBank: false });
      if (q.kind === 'number' && Math.abs(q.answer * 100 - Math.round(q.answer * 100)) > 1e-9) report('error', 'R2', `수학 생성기 ${ui + 1}단원 #${gi}`, `정답이 깔끔하지 않아요: ${q.answer}`);
      // 같은 규칙 위반은 생성기마다 한 번만 보여 준다
      for (const p of problems.splice(before)) if (!fails.has(p.rule + p.msg.slice(0, 20))) fails.set(p.rule + p.msg.slice(0, 20), { ...p, msg: `${p.msg} — 예: ${q.prompt.slice(0, 50)}` });
      if (s <= 2 && q.svg) genSamples.push({ where: `수학 생성기 ${ui + 1}단원 #${gi}`, q });
    }
    problems.push(...fails.values());
  }),
);

// ---- 결과 ----
const errors = problems.filter((p) => p.level === 'error');
const warns = problems.filter((p) => p.level === 'warn');
const byRule = (ps) => Object.entries(Object.groupBy(ps, (p) => p.rule)).sort();
for (const [label, ps] of [['오류', errors], ['주의', warns]]) {
  if (!ps.length) continue;
  console.log(`\n■ ${label} ${ps.length}개`);
  for (const [rule, list] of byRule(ps)) {
    console.log(`  [${rule}] ${list.length}개`);
    for (const p of list.slice(0, process.argv.includes("--all") ? 999 : 12)) console.log(`    - ${p.where}: ${p.msg}`);
    if (list.length > 12) console.log(`    … 외 ${list.length - 12}개`);
  }
}
console.log(`\n문항 은행 ${bankCount}문제, 생성 문제 ${genCount}개를 검사했어요. 오류 ${errors.length}, 주의 ${warns.length}`);

if (process.argv.includes('--sheet')) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const all = [
    ...Object.entries(BANKS).flatMap(([subject, list]) => list.map((q, i) => ({ where: `${subject} #${i}`, q })).filter((x) => x.q.svg)),
    ...genSamples,
  ];
  const flagged = new Map(problems.map((p) => [p.where, p]));
  const cards = all.map(({ where, q }) => {
    const p = flagged.get(where);
    const ans = q.kind === 'choice' ? `${q.answer + 1}번 ${esc(q.choices[q.answer])}` : esc(String(q.answer));
    return `<div class="c${p ? ' bad' : ''}"><b>${esc(where)}</b> ${esc(q.prompt)}<br><small>답: ${ans} · ${esc(q.explain ?? '')}</small>${p ? `<p class="p">[${p.rule}] ${esc(p.msg)}</p>` : ''}${q.svg}</div>`;
  });
  mkdirSync('review', { recursive: true });
  writeFileSync(
    'review/문제그림.html',
    `<!doctype html><meta charset="utf-8"><title>문제 그림 검수</title><style>body{margin:0;padding:12px;display:flex;flex-wrap:wrap;gap:10px;background:#e5e7eb;font:14px sans-serif}.c{background:#fff;padding:8px;width:380px;border-radius:8px}.c svg{max-width:100%;height:auto}.bad{outline:3px solid #dc2626}.p{color:#dc2626;margin:4px 0}</style>${cards.join('')}`,
  );
  console.log(`그림 검수 페이지: review/문제그림.html (${all.length}문제)`);
}
process.exit(errors.length ? 1 : 0);
