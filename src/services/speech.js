// 영어 읽어 주기: 브라우저 내장 음성(Web Speech API). 크롬북·안드로이드·iOS 모두 지원.
let voices = [];
function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() ?? [];
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const canSpeak = () => typeof window !== 'undefined' && !!window.speechSynthesis;

export function speak(text, lang = 'en-US', rate = 0.85) {
  if (!canSpeak()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate; // 아이들이 듣기 좋게 조금 천천히
  const v = voices.find((x) => x.lang === lang) ?? voices.find((x) => x.lang?.startsWith(lang.slice(0, 2)));
  if (v) u.voice = v;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
