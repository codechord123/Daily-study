// 미리 만든 영어 소리 파일 (public/audio/en/{key}.mp3) 이름 짓기와, 문제에서 읽어 줄 영어 고르기.
// scripts/en-audio 가 같은 규칙으로 파일을 만든다 (브라우저·노드 둘 다에서 쓰므로 다른 모듈을 불러오지 않는다)
const hasEn = (t) => /[a-z]/i.test(t ?? '');

/** 소리 파일 이름: 원문(줄바꿈 포함)을 다듬어 만든 짧은 해시 */
export function clipKey(raw) {
  const s = String(raw).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 이 문제에서 읽어 줄 영어 원문: [문제를 낼 때, 답한 뒤] */
export function englishSource(q, after = false) {
  if (after && hasEn(q.choices?.[q.answer])) return q.choices[q.answer];
  if (hasEn(q.passage)) return q.passage;
  if (q.say) return q.say;
  if (hasEn(q.prompt)) return q.prompt;
  return q.choices?.[q.answer];
}
export const englishSources = (q) => [englishSource(q), englishSource(q, true)];
