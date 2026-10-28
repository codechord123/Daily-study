// 학습 기록: 문제마다 맞고 틀린 기록, 다시 낼 문제(간격 반복), 헷갈린 문제, '이 문제 이상해요' 신고.
// 별(프로필)과 따로 둔다: 별은 반 친구들도 보지만 학습 기록은 나와 선생님만 본다.
// Firestore classes/{c}/learn/{sid}, 이 기기에는 ds:learn:{sid}
import { uploadLearn, onRemote } from '../services/cloud';
import { isRetired } from '../data/missions/retired';

const KEY = (sid) => `ds:learn:${sid}`;
export const GAPS = [1, 3, 7]; // 틀린(헷갈린) 문제를 다시 낼 간격(일). 3번 이어 맞히면 졸업
const REVIEW_MAX = 60;
const ITEMS_MAX = 600;
const REPORT_MAX = 30;
const RECENT = 20; // 과목별 최근 몇 문제로 난이도를 맞출지

/** 한국 날짜로 오늘이 며칠째인지 (보안 규칙과 같은 계산) */
export const dayNum = (t = Date.now()) => Math.floor((t + 9 * 3600e3) / 864e5);

const hash = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};
/**
 * 문제 이름표: 지문 + 문제 글 + 그림 + 보기(정렬해서, 섞어도 같게)로 만든 짧은 해시.
 * 문제 글이 같아도 그림·지문·보기가 다르면 다른 문제다 (예: '이 도형의 대칭축은 몇 개일까요?')
 */
export function qId(q) {
  const choices = q.kind === 'choice' && Array.isArray(q.choices) ? [...q.choices].sort().join('¦') : '';
  return hash(`${q.passage ?? ''}|${q.prompt}|${q.svg ? hash(q.svg) : ''}|${choices}`);
}
/** 예전 이름표(지문+문제 글만): 전에 저장한 '출제에서 빼기'·'미션에 넣기'를 알아보려고 */
export const legacyId = (q) => hash(`${q.passage ?? ''}|${q.prompt}`);
const LEARN_VER = 2;

const empty = (sid) => ({ sid, v: LEARN_VER, review: [], items: {}, std: {}, recent: {}, reports: [], picks: {} });
const listeners = new Set();

// 이름표를 바꾼 뒤 예전 기록: 다시 볼 문제는 문제 사본이 있어 새 이름표로 고친다
function migrate(d) {
  if (d.review.some((e) => isRetired(e?.q, e?.id))) d.review = d.review.filter((e) => !isRetired(e?.q, e?.id)); // 더 내지 않는 옛 문제
  if ((d.v ?? 1) >= LEARN_VER) return d;
  const seen = new Set();
  d.review = d.review.filter((e) => {
    if (!e?.q) return false;
    e.id = qId(e.q);
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  d.v = LEARN_VER;
  return d;
}

export function getLearn(sid) {
  try {
    const raw = localStorage.getItem(KEY(sid));
    if (raw) {
      const d = JSON.parse(raw);
      return migrate({ ...empty(sid), ...d, v: d.v ?? 1 });
    }
  } catch {
    /* noop */
  }
  return empty(sid);
}

function save(data) {
  data.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY(data.sid), JSON.stringify(data));
  } catch {
    /* noop */
  }
  uploadLearn(data);
  listeners.forEach((fn) => fn(data.sid));
}
const change = (sid, fn) => {
  const d = getLearn(sid);
  if (fn(d) !== false) save(d);
};

export function onLearnChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
onRemote('learn', (d) => {
  if (!d?.sid) return;
  const local = getLearn(d.sid);
  if ((local.updatedAt ?? 0) >= (d.updatedAt ?? 0)) return;
  try {
    localStorage.setItem(KEY(d.sid), JSON.stringify(d));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(d.sid));
});

// 다시 낼 때 쓰는 문제 사본 (화면 표시용 표시는 뺀다)
const plain = (q) => {
  const { id, review, noteSource, ...rest } = q; // eslint-disable-line no-unused-vars
  return rest;
};
const toReview = (d, q, today) => {
  const id = qId(q);
  let e = d.review.find((x) => x.id === id);
  if (!e) {
    e = { id, q: plain(q) };
    d.review.push(e);
    if (d.review.length > REVIEW_MAX) d.review.sort((a, b) => a.due - b.due).splice(0, d.review.length - REVIEW_MAX);
  }
  Object.assign(e, { box: 0, ok: 0, due: today + GAPS[0] });
};

/**
 * 한 문제를 풀었을 때. 돌려주는 값: { graduated } (다시 보기 문제를 3번째 맞혀 졸업했는지)
 */
/** 틀렸을 때 고른 답을 글자로 (보기 순서는 학생마다 섞이므로 보기 글자로 모은다) */
export function pickLabel(q, value) {
  if (q.kind === 'choice') return String(q.choices?.[value] ?? '');
  if (q.kind === 'ox') return value ? 'O' : 'X';
  return String(value ?? '').trim();
}

export function recordAnswer(sid, q, ok, picked) {
  let graduated = false;
  change(sid, (d) => {
    graduated = apply(d, q, ok, dayNum(), picked);
  });
  return { graduated };
}
/** 여러 문제를 한 번에 (선생님 화면 샘플 기록) */
export function recordMany(sid, list, reports = []) {
  change(sid, (d) => {
    for (const [q, ok, day, picked] of list) apply(d, q, ok, day, picked);
    d.reports.push(...reports);
    d.demo = true;
  });
}
export function clearLearn(sid) {
  try {
    localStorage.removeItem(KEY(sid));
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(sid));
}

function apply(d, q, ok, today, picked) {
  let graduated = false;
  const id = qId(q);
  const s = q.subject;
  d.recent[s] = `${d.recent[s] ?? ''}${ok ? 1 : 0}`.slice(-RECENT);
  if (q.std) {
    const t = (d.std[q.std] ??= [0, 0]);
    t[1] += 1;
    if (ok) t[0] += 1;
    const it = (d.items[id] ??= [0, 0, today, s]);
    it[1] += 1;
    if (!ok) it[0] += 1;
    it[2] = today;
    // 어떤 오답을 골랐는지 (선생님이 '가장 많이 고른 오답'으로 오개념을 짚을 수 있게)
    if (!ok && picked !== undefined) {
      const label = pickLabel(q, picked).slice(0, 60);
      if (label) {
        d.picks ??= {};
        const m = (d.picks[id] ??= {});
        m[label] = (m[label] ?? 0) + 1;
      }
    }
    const keys = Object.keys(d.items);
    if (keys.length > ITEMS_MAX)
      keys
        .sort((a, b) => d.items[a][2] - d.items[b][2])
        .slice(0, keys.length - ITEMS_MAX)
        .forEach((k) => {
          delete d.items[k];
          delete d.picks?.[k];
        });
  }
  const e = d.review.find((x) => x.id === id);
  if (!ok) toReview(d, q, today);
  else if (e) {
    e.ok += 1;
    if (e.ok >= GAPS.length) {
      d.review = d.review.filter((x) => x !== e);
      graduated = true;
    } else {
      e.box = Math.min(e.box + 1, GAPS.length - 1);
      e.due = today + GAPS[e.box];
    }
  }
  return graduated;
}

/** 맞혔지만 '헷갈렸어요': 내일 다시 낸다 */
export function markConfused(sid, q) {
  change(sid, (d) => toReview(d, q, dayNum()));
}
/** 오늘 다시 낼 문제 (오래 기다린 것부터) */
export function dueReviews(sid, n, today = dayNum()) {
  return getLearn(sid)
    .review.filter((e) => e.due <= today)
    .sort((a, b) => a.due - b.due)
    .slice(0, n);
}

/** 과목별 최근 정답률 (기록이 적으면 null) */
export function recentAccuracy(sid, subject) {
  const r = getLearn(sid).recent[subject] ?? '';
  if (r.length < 6) return null;
  return [...r].filter((c) => c === '1').length / r.length;
}

export const REPORT_REASONS = ['정답이 이상해요', '문제가 잘 안 보여요', '무슨 뜻인지 모르겠어요', '그림·소리가 이상해요'];
export function reportQuestion(sid, q, reason) {
  change(sid, (d) => {
    const id = qId(q);
    if (d.reports.some((x) => x.id === id && x.reason === reason)) return false;
    // 문제 전체도 함께 (계산 연습처럼 문항 은행에 없는 문제도 선생님이 그대로 볼 수 있게)
    const { kind, prompt, passage, sub, choices, answer, explain, svg, image, unit } = q;
    const full = JSON.parse(JSON.stringify({ kind, prompt, passage, sub, choices, answer, explain, svg, image, unit }));
    d.reports.push({ id, subject: q.subject, unit: q.unit ?? '', prompt: String(q.prompt).slice(0, 160), passage: q.passage ? String(q.passage).slice(0, 160) : '', reason, at: Date.now(), q: full });
    d.reports = d.reports.slice(-REPORT_MAX);
  });
}

// 다른 탭에서 바뀐 기록
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('ds:learn:')) listeners.forEach((fn) => fn(e.key.slice(9)));
  });
}
