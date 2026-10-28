// 선생님이 '출제에서 빼기' 한 문제를 어디서든(아침 미션·연습·다시 보기·오답 노트·어린 왕자·이어 풀기) 빼낸다.
//  - 문항 은행 문제: 그 문제 하나 (이름표 qId, 예전 이름표 legacyId)
//  - 자동 생성 문제(성취기준 std 가 없는 문제): 숫자만 바뀌어 다시 나오므로, 숫자를 #으로 바꾼 '문제 틀' 전체를 뺀다
import { getSettings } from '../store/classSettings';
import { qId, legacyId } from '../store/learnStore';

export const isGenerated = (q) => !q?.std;
export const tplKey = (q) => `tpl:${String(q?.prompt ?? '').replace(/\d+(\.\d+)?/g, '#')}`;
/** 빼기 버튼이 적어 두는 이름: 은행 문제는 그 문제, 생성 문제는 그 틀 */
export const blockKey = (q) => (isGenerated(q) ? tplKey(q) : qId(q));

export const blockedSet = () => new Set(getSettings().blocked ?? []);
export function isBlockedQ(q, set = blockedSet()) {
  if (!q || !set.size) return false;
  return set.has(qId(q)) || set.has(legacyId(q)) || set.has(tplKey(q));
}
