// 학생들의 오답 노트·다시 보기에는 틀릴 때의 문제 사본이 저장돼 있다.
// 그사이 문항 은행 문제를 고쳤으면 사본 대신 지금 문제를 쓴다 (예전에 잘못 만든 보기·풀이가 남지 않게),
// 고치다가 문제 글까지 바뀐 예전 문제와 더 내지 않는 생성 문제 틀은 빼낸다 (retired.js).
import { BANK_SOCIAL, BANK_KOREAN, BANK_SCIENCE, BANK_ENGLISH, BANK_MATH } from '../data/missions/bank';
import { ID_ALIASES } from '../data/missions/aliases';
import { isRetired } from '../data/missions/retired';
import { qId, legacyId } from '../store/learnStore';
import { seeded, shuffle } from './rng';

// 문제 내용 칸 (과목·단원 이름 같은 표시 칸은 사본 것을 그대로 둔다)
const CONTENT = ['kind', 'prompt', 'passage', 'sub', 'say', 'big', 'choices', 'answer', 'explain', 'svg', 'image', 'hint', 'std', 'level'];

let byId = null;
let byLegacy = null; // 지문+문제 글이 같은 문제가 하나뿐일 때만 (그림만 다른 문제는 헷갈리므로 null)
function build() {
  byId = new Map();
  byLegacy = new Map();
  for (const bank of [BANK_SOCIAL, BANK_KOREAN, BANK_SCIENCE, BANK_ENGLISH, BANK_MATH])
    for (const q of bank) {
      byId.set(qId(q), q);
      const lid = legacyId(q);
      byLegacy.set(lid, byLegacy.has(lid) ? null : q);
    }
}

/** 사본에 해당하는 지금 은행 문제 (없으면 null): 같은 문제 → 보기만 고친 문제 → 지문·문제 글이 같은 하나뿐인 문제 */
export function bankVersion(q) {
  if (!q?.std) return null; // 자동 생성 문제는 은행에 없다
  if (!byId) build();
  const id = qId(q);
  return byId.get(id) ?? byId.get(ID_ALIASES[id]) ?? byLegacy.get(legacyId(q)) ?? null;
}

/** 사본을 지금 문제로 바꾼 것. 바뀐 것이 없으면 그대로, 더 내지 않는 문제면 null */
export function currentVersion(q) {
  const cur = bankVersion(q);
  if (!cur) return isRetired(q, q && qId(q)) ? null : q;
  if (qId(cur) === qId(q) && cur.explain === q.explain) return q;
  const out = { ...q };
  for (const k of CONTENT) {
    if (k in cur) out[k] = cur[k];
    else delete out[k];
  }
  // 은행은 정답이 앞에 있으므로, 문제마다 늘 같은 순서로 섞어 둔다
  if (out.kind === 'choice') {
    const order = shuffle(seeded(qId(cur)), cur.choices.map((_, i) => i));
    out.choices = order.map((i) => cur.choices[i]);
    out.answer = order.indexOf(cur.answer);
  }
  return out;
}

/** 오답 노트 정리: 사본을 지금 문제로, 더 내지 않는 문제는 (아직 못 푼 것만) 빼고, 같은 문제가 둘이면 하나만 */
export function refreshNotes(notes) {
  if (!Array.isArray(notes)) return { notes, changed: false };
  let changed = false;
  const open = new Set();
  const out = [];
  for (const n of notes) {
    if (!n?.q) continue;
    const q = currentVersion(n.q);
    if (!q) {
      changed = true;
      if (n.cleared) out.push(n); // 해결한 기록은 남긴다 (선생님 화면 통계)
      continue;
    }
    if (q !== n.q) changed = true;
    if (!n.cleared) {
      const id = qId(q);
      if (open.has(id)) {
        changed = true;
        continue;
      }
      open.add(id);
    }
    out.push(q === n.q ? n : { ...n, q });
  }
  return { notes: changed ? out : notes, changed };
}
