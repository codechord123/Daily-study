// 소리: 효과음은 Web Audio로 직접 합성(파일 없음), 배경음악은 public/audio/ 파일을 재생.
// 브라우저 자동재생 정책 때문에 첫 터치/클릭 뒤에 소리가 켜진다.

const PREF_KEY = 'ds:sound';
const prefs = (() => {
  try {
    return { sfx: true, music: true, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') };
  } catch {
    return { sfx: true, music: true };
  }
})();
const listeners = new Set();

export function getPrefs() {
  return { ...prefs };
}
export function setPref(key, value) {
  prefs[key] = value;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
  if (key === 'music') value ? playMusic(currentScene, true) : stopMusic();
  listeners.forEach((fn) => fn(getPrefs()));
}
export function onPrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------- 오디오 그래프 ---------- */
let ctx = null;
let sfxBus = null;

function ensure() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.5; // 교실용: 작게 시작
  // 살짝 울리는 공간감 (짧은 딜레이 피드백)
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.13;
  const fb = ctx.createGain();
  fb.gain.value = 0.22;
  const wet = ctx.createGain();
  wet.gain.value = 0.25;
  sfxBus.connect(ctx.destination);
  sfxBus.connect(delay);
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(ctx.destination);
  return ctx;
}

// 첫 사용자 입력에서 오디오 잠금 해제 + 배경음악 시작
if (typeof window !== 'undefined') {
  const unlock = () => {
    ensure();
    if (prefs.music && currentScene) playMusic(currentScene, true);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

/* ---------- 합성 도구 ---------- */
function tone(freq, { at = 0, dur = 0.25, type = 'sine', gain = 0.3, attack = 0.005, glideTo = null } = {}) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(sfxBus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// 종소리: 기음 + 비정수배 배음으로 맑게
function bell(freq, at = 0, gain = 0.22, dur = 0.9) {
  tone(freq, { at, dur, gain, attack: 0.003 });
  tone(freq * 2.76, { at, dur: dur * 0.45, gain: gain * 0.35, attack: 0.002 });
  tone(freq * 5.4, { at, dur: dur * 0.2, gain: gain * 0.15, attack: 0.001 });
}

let noiseBuf = null;
function noise({ at = 0, dur = 0.3, gain = 0.2, freq = 1200, q = 0.8, type = 'bandpass', sweepTo = null } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.04, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// 펜타토닉(도레미솔라): 어떤 조합으로 울려도 어울린다
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760, 2093];

const SFX = {
  tap: () => tone(880, { dur: 0.08, type: 'triangle', gain: 0.08, glideTo: 1200 }),
  key: () => tone(1320, { dur: 0.05, type: 'sine', gain: 0.07 }),
  page: () => noise({ dur: 0.28, gain: 0.07, freq: 2500, sweepTo: 6000, type: 'highpass', q: 0.5 }),
  // 정답: 연속일수록 한 음씩 올라가는 아르페지오
  correct: (combo = 1) => {
    const base = Math.min(combo - 1, 4);
    [0, 2, 4].forEach((s, i) => bell(PENTA[base + s], i * 0.07, 0.2));
    tone(PENTA[base + 6], { at: 0.22, dur: 0.5, gain: 0.06, type: 'sine' });
  },
  // 오답: 낮고 부드러운 두 음 (혼나는 느낌 없게)
  wrong: () => {
    tone(392, { dur: 0.22, type: 'triangle', gain: 0.12 });
    tone(330, { at: 0.16, dur: 0.32, type: 'triangle', gain: 0.1 });
  },
  complete: () => {
    [0, 2, 4, 5, 7, 9].forEach((s, i) => bell(PENTA[s], i * 0.09, 0.18, 1.2));
    noise({ at: 0.5, dur: 1.4, gain: 0.05, freq: 6000, type: 'highpass' }); // 반짝임
    bell(PENTA[10], 0.62, 0.15, 1.6);
  },
  coin: () => {
    tone(1568, { dur: 0.07, type: 'square', gain: 0.03 });
    tone(2093, { at: 0.06, dur: 0.12, type: 'square', gain: 0.03 });
  },
  star: () => bell(PENTA[6 + Math.floor(Math.random() * 4)], 0, 0.12, 0.5),
  buy: () => {
    SFX.coin();
    bell(1318.5, 0.1, 0.12, 0.6);
  },
  place: () => {
    tone(220, { dur: 0.18, type: 'sine', gain: 0.25, glideTo: 110 });
    noise({ dur: 0.12, gain: 0.06, freq: 500, q: 1 });
    bell(1046.5, 0.05, 0.06, 0.4);
  },
  rotate: () => tone(660, { dur: 0.1, type: 'triangle', gain: 0.08, glideTo: 880 }),
  store: () => tone(660, { dur: 0.18, type: 'triangle', gain: 0.1, glideTo: 330 }),
  emote: () => {
    tone(600, { dur: 0.12, type: 'sine', gain: 0.15, glideTo: 1100 });
  },
  heart: () => {
    bell(784, 0, 0.14, 0.5);
    bell(1046.5, 0.12, 0.14, 0.7);
  },
  takeoff: () => {
    noise({ dur: 1.2, gain: 0.18, freq: 300, sweepTo: 2400, q: 0.7 });
    tone(110, { dur: 1, type: 'sawtooth', gain: 0.04, glideTo: 330 });
  },
  land: () => {
    noise({ dur: 0.6, gain: 0.12, freq: 2000, sweepTo: 300, q: 0.7 });
    bell(523.25, 0.45, 0.14, 0.8);
    bell(783.99, 0.55, 0.12, 0.9);
  },
  near: () => bell(1174.66, 0, 0.1, 0.6),
};

export function sfx(name, ...args) {
  if (!prefs.sfx || !ensure()) return;
  try {
    SFX[name]?.(...args);
  } catch {
    /* 소리 실패는 무시 */
  }
}

/* ---------- 추진기 소리 (계속 나는 소리, 세기 조절) ---------- */
let jet = null;
export function jetStart() {
  if (!prefs.sfx || !ensure() || jet) return;
  if (!noiseBuf) noise({ gain: 0.0001, dur: 0.01 });
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(f).connect(g).connect(sfxBus);
  src.start();
  jet = { src, f, g };
}
export function jetSet(thrust) {
  if (!jet) return;
  const t = ctx.currentTime;
  jet.g.gain.setTargetAtTime(0.02 + thrust * 0.12, t, 0.1);
  jet.f.frequency.setTargetAtTime(300 + thrust * 1400, t, 0.1);
}
export function jetStop() {
  if (!jet) return;
  const j = jet;
  jet = null;
  j.g.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  setTimeout(() => j.src.stop(), 600);
}

/* ---------- 배경음악 ----------
   public/audio/ 에 아래 이름으로 파일을 넣으면 화면에 맞춰 재생된다.
   장면 파일이 없으면 bgm-home 으로, 그것도 없으면 조용히 넘어간다. */
const MUSIC_VOLUME = 0.35;
const TRACKS = {
  home: ['bgm-home'],
  mission: ['bgm-mission', 'bgm-home'],
  space: ['bgm-space', 'bgm-home'],
  login: ['bgm-home'],
};
const EXTS = ['mp3', 'ogg', 'wav', 'm4a'];
const AUDIO_VER = 2; // 곡을 바꾸면 올린다 (예전 곡이 브라우저 보관본으로 나오지 않게)
const missing = new Set();
let currentScene = null;
let current = null; // { name, audio }

function findTrack(scene) {
  return (TRACKS[scene] ?? TRACKS.home).find((n) => !missing.has(n));
}

function fade(audio, to, ms, done) {
  const from = audio.volume;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / ms);
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}

function loadTrack(name, extIndex = 0) {
  return new Promise((resolve) => {
    if (extIndex >= EXTS.length) {
      missing.add(name);
      return resolve(null);
    }
    const a = new Audio(`${import.meta.env.BASE_URL}audio/${name}.${EXTS[extIndex]}?v=${AUDIO_VER}`);
    a.loop = true;
    a.volume = 0;
    a.preload = 'auto';
    const ok = () => {
      cleanup();
      resolve(a);
    };
    const fail = () => {
      cleanup();
      loadTrack(name, extIndex + 1).then(resolve);
    };
    const cleanup = () => {
      a.removeEventListener('canplay', ok);
      a.removeEventListener('error', fail);
    };
    a.addEventListener('canplay', ok, { once: true });
    a.addEventListener('error', fail, { once: true });
    a.load();
  });
}

export async function playMusic(scene, force = false) {
  currentScene = scene;
  if (!prefs.music || !ctx) return; // 첫 입력 전에는 장면만 기억
  let name = findTrack(scene);
  if (!name) return;
  if (!force && current?.name === name) return;
  let audio = await loadTrack(name);
  while (!audio) {
    name = findTrack(scene);
    if (!name) return;
    audio = await loadTrack(name);
  }
  if (currentScene !== scene) return; // 불러오는 사이 화면이 바뀜
  if (current?.name === name && !force) return;
  const prev = current;
  current = { name, audio };
  if (prev) fade(prev.audio, 0, 800, () => prev.audio.pause());
  audio.play().then(() => fade(audio, MUSIC_VOLUME, 1200)).catch(() => {});
}

export function stopMusic() {
  if (!current) return;
  const prev = current;
  current = null;
  fade(prev.audio, 0, 500, () => prev.audio.pause());
}
