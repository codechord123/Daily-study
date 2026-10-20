// 영어 읽어 주기: 브라우저 내장 음성(Web Speech API). 크롬북·안드로이드·iOS 모두 지원.
// 기기마다 음성 목록이 달라서 '자연스러운 목소리'를 골라 쓴다.
// (아이폰은 목록 맨 앞에 Albert·Zarvox 같은 장난 목소리가 있어 그대로 쓰면 이상하게 들린다)
let voices = [];
let chosen = null;
function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() ?? [];
  chosen = null;
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// 장난·효과음 목소리 (iOS·macOS)
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy/i;
// 자연스러운 목소리 우선순위 (앞일수록 먼저)
const PREFERRED = [/natural/i, /premium|enhanced/i, /samantha/i, /google us english/i, /\bava\b/i, /allison|susan|nicky/i, /aria|jenny|guy|zira/i, /google uk english female/i, /daniel|karen|moira|serena/i];

function pickVoice(lang) {
  if (chosen && chosen.lang?.startsWith(lang.slice(0, 2))) return chosen;
  const en = voices.filter((v) => v.lang?.replace('_', '-').startsWith(lang.slice(0, 2)) && !NOVELTY.test(v.name));
  const us = en.filter((v) => v.lang.replace('_', '-') === lang);
  for (const pool of [us, en]) {
    for (const re of PREFERRED) {
      const v = pool.find((x) => re.test(x.name));
      if (v) return (chosen = v);
    }
  }
  return (chosen = us.find((v) => v.localService) ?? us[0] ?? en[0] ?? null);
}

/** 읽기 좋은 영어만 남긴다: 한글·빈칸·말머리(A:)·기호는 빼고, 줄은 쉼으로 */
export function speechText(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) =>
      l
        .replace(/^[^\n:：]{1,12}[:：]\s*/, '') // 'A:' '민지:' 같은 말머리
        .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]+[^A-Za-z]*/g, ' ') // 한글
        .replace(/_{2,}|□|\(\s*\)/g, ', ') // 빈칸은 잠깐 쉼
        .replace(/[①-⑳㉠-㉻ⓐ-ⓩ]/g, '')
        .replace(/[“”]/g, '"')
        .replace(/’/g, "'")
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((l) => /[A-Za-z]/.test(l))
    .map((l) => (/[.?!,]$/.test(l) ? l : `${l}.`))
    .join(' ');
}

export const canSpeak = () => typeof window !== 'undefined' && !!window.speechSynthesis;

export function speak(text, lang = 'en-US', rate = 0.9) {
  if (!canSpeak()) return false;
  const say = speechText(text);
  if (!say) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(say);
  u.lang = lang;
  u.rate = rate; // 아이들이 듣기 좋게 조금 천천히
  u.pitch = 1;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
