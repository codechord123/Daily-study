// 미리 만든 영어 소리 파일 틀기 (public/audio/en, scripts/en-audio 로 만든다).
// 기기 음성(Web Speech)은 기기·브라우저마다 목소리가 다르고 아이폰에서 잘 끊겨서, 파일이 있으면 파일을 쓴다.
import LIST from '../data/missions/enClips.json';
import { clipKey } from './enClips';
import { holdMusic, releaseMusic } from './sound';

const have = new Set(LIST);
let audio = null;
const player = () => {
  if (!audio && typeof Audio !== 'undefined') {
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('ended', () => releaseMusic());
    audio.addEventListener('error', () => releaseMusic());
  }
  return audio;
};

// 아이폰: 사용자가 누른 순간에 한 번 틀어 둔 소리 요소만 나중에 저절로 틀 수 있다 → 첫 터치에 무음 파일을 한 번
if (typeof window !== 'undefined') {
  const unlock = () => {
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    const a = player();
    if (!a) return;
    a.src = `${import.meta.env.BASE_URL}audio/silence.mp3`;
    a.play().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

export const hasClip = (raw) => !!raw && have.has(clipKey(raw));

/**
 * 소리 파일이 있으면 틀고 true, 없으면 false (그때는 기기 음성으로 읽는다).
 * 파일을 받지 못하면(인터넷 끊김 등) fallback 으로 기기 음성을 쓴다
 */
let playing = 0;
export function playClip(raw, fallback) {
  if (!hasClip(raw)) return false;
  const a = player();
  if (!a) return false;
  const id = ++playing;
  a.pause();
  a.src = `${import.meta.env.BASE_URL}audio/en/${clipKey(raw)}.mp3`;
  a.onerror = () => id === playing && fallback?.();
  holdMusic();
  a.play().catch((e) => {
    releaseMusic();
    // 자동 재생을 막은 경우(NotAllowedError)는 🔊 버튼으로 들을 수 있으니 그대로 두고, 파일 문제면 기기 음성으로
    if (id === playing && e?.name !== 'NotAllowedError' && e?.name !== 'AbortError') fallback?.();
  });
  return true;
}

export function stopClip() {
  if (audio && !audio.paused) {
    audio.pause();
    releaseMusic();
  }
}
