// 실시간 "함께 있기" 어댑터.
// 지금: BroadcastChannel(같은 브라우저의 다른 탭) + 데모용 친구 봇.
// 나중: Firebase Realtime DB presence/{classId}/{planetId}/{sid} 로 교체.
// 화면 코드는 join / update / subscribe / onlineMap 만 사용한다.
import { ROSTER } from '../data/classroom';
import { getPlanet } from '../store/profileStore';
import { cloudEnabled, presenceSet, presenceLeave, onRemote } from './cloud';

const CHANNEL = 'ds-presence';
const STALE_MS = 4000;

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
const peers = new Map(); // sid -> state
const subs = new Set();
let me = null;

function emit() {
  subs.forEach((fn) => fn());
}

function receive(msg) {
  if (!msg || msg.sid === me?.sid) return;
  if (msg.type === 'leave') peers.delete(msg.sid);
  else peers.set(msg.sid, { ...msg, seen: Date.now() });
  emit();
}
bc?.addEventListener('message', (e) => receive(e.data));

export function join(sid, planetId, character) {
  me = { type: 'state', sid, planetId, character, pos: null, moving: false, emote: null, emoteAt: 0 };
  broadcast();
}

export function update(patch) {
  if (!me) return;
  Object.assign(me, patch);
  broadcast();
}

export function sendEmote(emote) {
  update({ emote, emoteAt: Date.now() });
}

export function leave() {
  if (!me) return;
  if (!presenceLeave(me.sid)) bc?.postMessage({ type: 'leave', sid: me.sid });
  me = null;
}

function broadcast() {
  if (!me) return;
  if (!presenceSet(me)) bc?.postMessage({ ...me, t: Date.now() });
}

// Firebase 실시간 DB: 반 전체 접속 상태를 통째로 받는다
onRemote('presence', (all) => {
  const now = Date.now();
  for (const sid of [...peers.keys()]) if (!all[sid] && !peers.get(sid).bot) peers.delete(sid);
  for (const [sid, st] of Object.entries(all)) {
    if (sid === me?.sid) continue;
    // 10초 넘게 소식이 없으면 끊긴 것으로 본다
    if (now - (st.t ?? 0) > 10000) continue;
    peers.set(sid, { ...st, seen: now });
  }
  emit();
});

// 1초마다 생존 신호 + 오래된 접속자 정리
setInterval(() => {
  broadcast();
  const now = Date.now();
  let changed = false;
  for (const [sid, p] of peers) {
    if (!p.bot && now - p.seen > STALE_MS) {
      peers.delete(sid);
      changed = true;
    }
  }
  if (changed) emit();
}, 1000);

if (typeof window !== 'undefined') window.addEventListener('beforeunload', leave);

/** 특정 별에 있는 다른 사람들 */
export function peersOn(planetId) {
  return [...peers.values()].filter((p) => p.planetId === planetId);
}

/** 별마다 지금 몇 명이 있는지 */
export function onlineMap() {
  const map = {};
  for (const p of peers.values()) map[p.planetId] = (map[p.planetId] ?? 0) + 1;
  if (me) map[me.planetId] = (map[me.planetId] ?? 0) + 1;
  return map;
}

export function getPeer(sid) {
  return peers.get(sid);
}

export function isOnline(sid) {
  return peers.has(sid);
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/* ---------- 데모용 친구 봇 ----------
   혼자 테스트해도 "함께 있는" 느낌을 볼 수 있게, 몇 명이 접속해 있는 것처럼 움직인다.
   일부는 자기 별에, 일부는 다른 친구 별에 놀러 가 있다. Firebase 연결 후 제거. */
const BOT_PLAN = [
  { idx: 1, on: 1 },
  { idx: 4, on: 4 },
  { idx: 6, on: 1 },
  { idx: 9, on: 9 },
  { idx: 13, on: 4 },
  { idx: 17, on: 17 },
  { idx: 20, on: 9 },
];
const EMOTES = ['👋', '❤️', '⭐', '😄', '🎉'];

function startBots() {
  const bots = BOT_PLAN.map(({ idx, on }) => {
    const s = ROSTER[idx];
    const host = ROSTER[on];
    return {
      sid: s.id,
      planetId: host.id,
      character: getPlanet(s.id).character,
      bot: true,
      lat: (Math.random() - 0.5) * 120,
      lon: Math.random() * 360,
      tLat: 0,
      tLon: 0,
      wait: 0,
      emote: null,
      emoteAt: 0,
    };
  });

  const toVec = (lat, lon) => {
    const p = (lat * Math.PI) / 180;
    const t = (lon * Math.PI) / 180;
    return [Math.cos(p) * Math.sin(t), Math.sin(p), Math.cos(p) * Math.cos(t)];
  };

  setInterval(() => {
    const now = Date.now();
    for (const b of bots) {
      if (b.wait > 0) {
        b.wait -= 1;
        b.moving = false;
        if (b.wait === 0) {
          b.tLat = (Math.random() - 0.5) * 140;
          b.tLon = b.lon + (Math.random() - 0.5) * 120;
        }
      } else {
        const dLat = b.tLat - b.lat;
        const dLon = b.tLon - b.lon;
        const dist = Math.hypot(dLat, dLon);
        if (dist < 3) {
          b.wait = 8 + Math.floor(Math.random() * 20);
          if (Math.random() < 0.35) {
            b.emote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
            b.emoteAt = now;
          }
        } else {
          b.lat += (dLat / dist) * 2.2;
          b.lon += (dLon / dist) * 2.2;
          b.moving = true;
        }
      }
      peers.set(b.sid, {
        type: 'state',
        sid: b.sid,
        planetId: b.planetId,
        character: b.character,
        pos: toVec(b.lat, b.lon),
        moving: b.moving,
        emote: b.emote,
        emoteAt: b.emoteAt,
        bot: true,
        seen: now,
      });
    }
    emit();
  }, 200);
}

// 데모 봇은 Firebase가 없을 때만 (진짜 친구가 있을 땐 필요 없음)
if (!cloudEnabled) startBots();
