// 읽어 주기: 브라우저 내장 음성(Web Speech API). 크롬북·안드로이드·iOS 모두 지원.
// 영어 문제는 영어만, 국어·사회·과학은 한국어 문장을 읽는다.
// 기기마다 음성 목록이 달라서 '자연스러운 목소리'를 골라 쓴다.
// (아이폰은 목록 맨 앞에 Albert·Zarvox 같은 장난 목소리가 있어 그대로 쓰면 이상하게 들린다)
import { holdMusic, releaseMusic } from './sound';
let voices = [];
let chosen = {}; // 언어별로 고른 목소리
function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() ?? [];
  chosen = {};
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
  // 아이폰은 사용자가 화면을 누른 그 순간에 한 번 말해 봐야 그 뒤로 읽어 줄 수 있다.
  // 첫 터치 때 소리 없는 한 마디로 음성을 깨워 둔다 (문제가 바뀔 때 자동으로 읽어 주려면 필요)
  const wake = () => {
    window.removeEventListener('pointerdown', wake, true);
    window.removeEventListener('keydown', wake, true);
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
}

// 장난·효과음 목소리 (iOS·macOS)
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy/i;
// 자연스러운 목소리 우선순위 (앞일수록 먼저)
const PREFERRED_KO = [/natural/i, /yuna|유나/i, /google 한국/i, /sunhi|injoon|heami/i];
const PREFERRED = [/samantha/i, /natural/i, /google us english/i, /\bava\b/i, /allison|susan|nicky/i, /aria|jenny|guy|zira/i, /google uk english female/i, /daniel|karen|moira|serena/i];

function pickVoice(lang) {
  if (chosen[lang] !== undefined) return chosen[lang];
  return (chosen[lang] = findVoice(lang));
}
function findVoice(lang) {
  const prefs = lang.startsWith('ko') ? PREFERRED_KO : PREFERRED;
  const en = voices.filter((v) => v.lang?.replace('_', '-').startsWith(lang.slice(0, 2)) && !NOVELTY.test(v.name));
  const us = en.filter((v) => v.lang.replace('_', '-') === lang);
  for (const pool of [us, en]) {
    for (const re of prefs) {
      const v = pool.find((x) => re.test(x.name));
      if (v) return v;
    }
  }
  return us.find((v) => v.localService) ?? us[0] ?? en[0] ?? null;
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

/** 읽기 좋은 한국어: 빈칸·기호·문제 번호는 빼고, 줄은 쉼으로 */
export function speechTextKo(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) =>
      l
        .replace(/^\s*<?보\s*기>?\s*[:：]?\s*/, '')
        .replace(/_{2,}|□|\(\s*\)/g, ' 빈칸 ')
        .replace(/[①-⑳]/g, (c) => ` ${c.charCodeAt(0) - 0x245f}번 `)
        .replace(/[㉠-㉻]/g, (c) => ` ${'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'[(c.charCodeAt(0) - 0x3260) % 14]} `)
        .replace(/[『』「」“”"<>《》【】\[\]*~^]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((l) => /[가-힣A-Za-z0-9]/.test(l))
    .map((l) => (/[.?!,]$/.test(l) ? l : `${l}.`))
    .join(' ');
}

export const canSpeak = () => typeof window !== 'undefined' && !!window.speechSynthesis;

let speakId = 0;
let releaseTimer = 0;
const finish = (id) => {
  if (id !== speakId) return; // 더 새로 읽기 시작했으면 그쪽이 음악을 돌려 놓는다
  clearTimeout(releaseTimer);
  releaseTimer = setTimeout(releaseMusic, 400);
};

export function speak(text, lang = 'en-US', rate = 0.9) {
  if (!canSpeak()) return false;
  const ko = lang.startsWith('ko');
  const say = ko ? speechTextKo(text) : speechText(text);
  if (!say) return false;
  const synth = window.speechSynthesis;
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  try {
    synth.resume(); // 크롬: 멈춤 상태로 남아 아무 소리도 안 나는 일이 있다
  } catch {
    /* noop */
  }
  const id = ++speakId;
  clearTimeout(releaseTimer);
  holdMusic(); // 음악과 겹치면 아이폰에서 음성이 끊긴다
  // 문장마다 하나씩, 앞 문장이 끝나면 다음 문장 (아이폰은 한꺼번에 줄 세우면 일부를 건너뛴다)
  const parts = say.match(/[^.?!]+[.?!]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [say];
  const next = (i, plain = false) => {
    if (id !== speakId) return;
    if (i >= parts.length) return finish(id);
    const u = new SpeechSynthesisUtterance(parts[i]);
    u.lang = lang;
    u.rate = ko ? Math.max(rate, 1) : rate; // 영어는 아이들이 듣기 좋게 조금 천천히
    u.pitch = 1;
    const v = plain ? null : pickVoice(lang);
    if (v) u.voice = v;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      next(i + 1, plain);
    };
    u.onend = go;
    // 고른 목소리가 이 기기에서 안 나오면(받지 않은 고급 음성, 학교 망이 막은 온라인 음성 등) 기본 목소리로 다시
    u.onerror = (e) => {
      if (v && !done && !/interrupted|canceled/.test(e?.error ?? '')) {
        done = true;
        clearTimeout(guard);
        chosen[lang] = null;
        return next(i, true);
      }
      go();
    };
    // 끝 알림이 오지 않는 기기를 위한 안전장치 (문장 길이만큼 기다린 뒤 다음으로)
    const guard = setTimeout(go, 1500 + parts[i].length * 120);
    synth.speak(u);
  };
  // 아이폰은 누른 그 순간(같은 동작 안)에 말해야 소리가 난다. 그래서 곧바로 읽는다.
  // 다만 읽던 것을 멈춘 직후엔 첫 문장을 버리는 일이 있어 그때만 잠깐 쉬었다가
  if (busy) setTimeout(() => next(0), 120);
  else next(0);
  return true;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
  speakId++;
  clearTimeout(releaseTimer);
  releaseMusic();
}
