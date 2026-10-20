// 실시간 "함께 있기" 어댑터.
// 지금: BroadcastChannel(같은 브라우저의 다른 탭) + 데모용 친구 봇.
// 나중: Firebase Realtime DB presence/{classId}/{planetId}/{sid} 로 교체.
// 화면 코드는 join / update / subscribe / onlineMap 만 사용한다.
import { ROSTER } from '../data/classroom';
import { getPlanet } from '../store/profileStore';
import { cloudEnabled, presenceSet, presencePatch, presenceLeave, onRemote } from './cloud';

const CHANNEL = 'ds-presence';
// 학급 서버(실시간 DB)는 내려받는 양만큼 요금이 든다(무료: 한 달 10GB). 반 전체가 모두의 상태를 받으므로 아껴 보낸다:
//  - 들어올 때만 전체(캐릭터 모양 포함), 그 뒤엔 바뀐 칸만
//  - 위치는 움직일 때만 0.5초에 한 번, 가만히 있으면 보내지 않는다
//  - 살아 있다는 신호는 5초에 한 번, 화면을 내려 두면 보내지 않는다
const HEARTBEAT_MS = 5000;
const POS_MS = 500;
const STALE_MS = 15000; // 이만큼 소식이 없으면 나간 것으로 본다

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

let sent = {}; // 마지막으로 학급 서버에 보낸 값
let lastSend = 0;
let posTimer = 0;

export function join(sid, planetId, character) {
  me = { type: 'state', sid, planetId, character, pos: null, moving: false, emote: null, emoteAt: 0 };
  sendFull();
}

// 위치·추진 같은 자주 바뀌는 값은 모아서 천천히, 이모트처럼 드문 것은 바로
const FAST = new Set(['pos', 'moving', 'yaw', 'thrust']);
export function update(patch) {
  if (!me) return;
  Object.assign(me, patch);
  if (!cloudEnabled) return bc?.postMessage({ ...me, t: Date.now() });
  const urgent = Object.keys(patch).some((k) => !FAST.has(k));
  if (urgent || Date.now() - lastSend >= POS_MS) sendDiff();
  else if (!posTimer) posTimer = setTimeout(sendDiff, POS_MS - (Date.now() - lastSend));
}

function sendFull() {
  if (!me) return;
  if (!presenceSet(me)) return bc?.postMessage({ ...me, t: Date.now() });
  sent = JSON.parse(JSON.stringify(me));
  lastSend = Date.now();
}

// 지난번에 보낸 것과 달라진 칸만
function sendDiff(heartbeat = false) {
  clearTimeout(posTimer);
  posTimer = 0;
  if (!me) return;
  const diff = {};
  for (const [k, v] of Object.entries(me)) if (JSON.stringify(v) !== JSON.stringify(sent[k])) diff[k] = v;
  if (!Object.keys(diff).length && !heartbeat) return;
  if (!presencePatch(me.sid, diff)) return;
  sent = { ...sent, ...JSON.parse(JSON.stringify(diff)) };
  lastSend = Date.now();
}

export function sendEmote(emote) {
  update({ emote, emoteAt: Date.now() });
}

export function leave() {
  if (!me) return;
  if (!presenceLeave(me.sid)) bc?.postMessage({ type: 'leave', sid: me.sid });
  me = null;
}

function heartbeat() {
  if (!me) return;
  if (!cloudEnabled) return bc?.postMessage({ ...me, t: Date.now() });
  if (typeof document !== 'undefined' && document.hidden) return; // 화면을 내려 두면 쉬고, 돌아오면 다시
  if (Date.now() - lastSend >= HEARTBEAT_MS - 50) sendDiff(true);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => !document.hidden && sendFull());

// Firebase 실시간 DB: 반 전체 접속 상태를 통째로 받는다
onRemote('presence', (all) => {
  const now = Date.now();
  for (const sid of [...peers.keys()]) if (!all[sid] && !peers.get(sid).bot) peers.delete(sid);
  for (const [sid, st] of Object.entries(all)) {
    if (sid === me?.sid) continue;
    // 오래 소식이 없으면 끊긴 것으로 본다 (기기 시계가 조금 달라도 되게 넉넉히)
    if (now - (st.t ?? 0) > STALE_MS + 10000) continue;
    // 그 친구의 신호(t)가 새로 왔을 때만 '방금 봤음'으로 (다른 친구 소식에 덩달아 살아 있는 것으로 보지 않게)
    const prev = peers.get(sid);
    peers.set(sid, { ...st, seen: prev && prev.t === st.t ? prev.seen : now });
  }
  emit();
});

// 살아 있다는 신호 + 오래된 접속자 정리
setInterval(() => {
  heartbeat();
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
