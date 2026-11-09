// 선생님이 '출제에서 빼기' 한 문제를 어디서든(아침 미션·연습·다시 보기·오답 노트·어린 왕자·이어 풀기) 빼낸다.
//  - 문항 은행 문제: 그 문제 하나 (이름표 qId, 예전 이름표 legacyId)
//  - 자동 생성 문제(성취기준 std 가 없는 문제): 숫자만 바뀌어 다시 나오므로, 숫자를 #으로 바꾼 '문제 틀' 전체를 뺀다
import { getSettings } from '../store/classSettings';
import { qId, legacyId } from '../store/learnStore';
import { isRetired } from '../data/missions/retired';
import { ID_ALIASES } from '../data/missions/aliases';

export const isGenerated = (q) => !q?.std;
export const tplKey = (q) => `tpl:${String(q?.prompt ?? '').replace(/\d+(\.\d+)?/g, '#')}`;
/** 빼기 버튼이 적어 두는 이름: 은행 문제는 그 문제, 생성 문제는 그 틀 */
export const blockKey = (q) => (isGenerated(q) ? tplKey(q) : qId(q));

// 예전 이름표로 빼 둔 문제도 지금 이름표로 알아본다
export const blockedSet = () => new Set((getSettings().blocked ?? []).flatMap((id) => (ID_ALIASES[id] ? [id, ID_ALIASES[id]] : [id])));
export function isBlockedQ(q, set = blockedSet()) {
  if (!q || !set.size) return false;
  return set.has(qId(q)) || set.has(legacyId(q)) || set.has(tplKey(q));
}

/**
 * 아직 풀 오답: 해결하지 않았고, 더 내지 않는 옛 문제도 아니고, 선생님이 뺀 문제도 아닌 것.
 * 화면에 보이는 '오답 몇 개'와 실제로 푸는 오답 노트가 같은 기준으로 세어지게 모든 곳에서 이것을 쓴다.
 */
export function openNotes(notes, set = blockedSet()) {
  return (notes ?? []).filter((n) => n?.q && !n.cleared && !isRetired(n.q, qId(n.q)) && !isBlockedQ(n.q, set));
}
/** 다시 볼 문제 중 선생님이 빼지 않은 것 */
export const activeReviews = (list, set = blockedSet()) => (list ?? []).filter((e) => e?.q && !isBlockedQ(e.q, set));
