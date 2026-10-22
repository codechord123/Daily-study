import { create } from 'zustand';
import { ITEM_BY_ID } from '../data/items';
import { OPTION_SLOTS, COLOR_SLOTS } from '../data/character';
import { PLANET_DECO } from '../theme/tokens';
import { priceOf } from './classSettings';
import { loadProfile, newProfile, saveProfile, onRemoteProfile, onSynced } from './profileStore';
import { cloudEnabled, cloudSignOut, setUploadDelay } from '../services/cloud';
import { qId } from './learnStore';
import { isRetired } from '../data/missions/retired';

// 새 기능 안내 판 (ui/Onboarding.jsx NEWS_VERSION 과 같게)
const NEWS_VERSION = 1;

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 직전 등교일(주말 건너뜀)
function prevSchoolDay(d = new Date()) {
  const p = new Date(d);
  do p.setDate(p.getDate() - 1);
  while (p.getDay() === 0 || p.getDay() === 6);
  return todayKey(p);
}

// 별가루 받기: 오늘 받은 양을 함께 적는다. 학급 서버의 보안 규칙이 이 기록으로
// '하루에 받을 수 있는 양'을 넘는 별가루(손으로 고친 값)를 막는다. 상한은 firestore.rules 와 같게
export const DAILY_EARN_MAX = 250;
const kstDay = () => Math.floor((Date.now() + 9 * 3600e3) / 864e5);
function earn(p, amount) {
  const day = kstDay();
  const e = p.earn?.day === day ? p.earn : { day, amount: 0 };
  const gain = Math.max(0, Math.min(Math.round(amount), DAILY_EARN_MAX - e.amount));
  p.earn = { day, amount: e.amount + gain };
  p.stardust += gain;
  return gain;
}
// 이번 주 월요일 (주 5일 개근 보너스)
function weekKey(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return todayKey(m);
}

const SESSION_KEY = 'ds:session';
let uidSeq = 0;
const newUid = () => `${Date.now().toString(36)}${(uidSeq++).toString(36)}`;

export const useGame = create((set, get) => {
  // 프로필을 바꾸는 모든 동작은 이 함수를 거쳐 저장된다
  const update = (fn) => {
    const prev = get().profile;
    if (!prev) return;
    const next = fn(structuredClone(prev));
    if (!next) return;
    saveProfile(next);
    set({ profile: next });
  };

  return {
    profile: null,
    missionMode: { type: 'daily' }, // daily | review(오답 노트) | practice(과목 연습)
    screen: 'login', // login | home | mission | space | visit
    visiting: null, // 방문 중인 친구 sid
    launchFrom: null, // 우주로 이륙한 별 sid
    mode: 'walk', // walk | decorate

    restoreSession() {
      if (cloudEnabled) return; // 학급 서버 로그인은 기기에 남은 Firebase 로그인으로 이어진다 (App)
      try {
        const sid = sessionStorage.getItem(SESSION_KEY);
        if (sid) get().login(sid);
      } catch {
        /* noop */
      }
    },

    login(sid) {
      const profile = loadProfile(sid) ?? newProfile(sid);
      // 더 내지 않는 옛 문제는 남은 오답에서 뺀다
      if (profile.wrongNotes?.some((n) => !n.cleared && isRetired(n.q))) profile.wrongNotes = profile.wrongNotes.filter((n) => n.cleared || !isRetired(n.q));
      saveProfile(profile);
      try {
        sessionStorage.setItem(SESSION_KEY, sid);
        localStorage.setItem('ds:last-sid', sid); // 다음 아침에 한 번에 들어오기
      } catch {
        /* noop */
      }
      set({ profile, screen: 'home', visiting: null, mode: 'walk' });
    },

    logout() {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* noop */
      }
      set({ profile: null, screen: 'login', visiting: null });
      if (cloudEnabled) cloudSignOut();
    },

    go(screen) {
      set({ screen, mode: 'walk', ...(screen !== 'visit' && { visiting: null }) });
    },
    startMission(mode = { type: 'daily' }) {
      set({ missionMode: mode, screen: 'mission', mode: 'walk', visiting: null });
    },

    // 틀린 문제를 오답 노트에 (같은 문제는 한 번만). 문제 글이 같아도 그림·지문·보기가 다르면 다른 문제
    noteWrong(q, source) {
      update((p) => {
        p.wrongNotes ??= [];
        const id = qId(q);
        if (p.wrongNotes.some((n) => !n.cleared && qId(n.q) === id)) return null;
        const { id: _i, review: _r, assigned: _a, noteSource: _n, ...rest } = q; // eslint-disable-line no-unused-vars
        p.wrongNotes.push({ q: rest, date: todayKey(), source, cleared: false });
        // 남은 오답은 80개까지, 정복한 오답은 최근 60개만 남긴다 (선생님이 해결한 문제도 볼 수 있게) (별 저장이 너무 커지지 않게)
        if (p.wrongNotes.length > 140) {
          const open = p.wrongNotes.filter((n) => !n.cleared).slice(-80);
          const done = p.wrongNotes.filter((n) => n.cleared).slice(-60);
          p.wrongNotes = p.wrongNotes.filter((n) => open.includes(n) || done.includes(n));
        }
        return p;
      });
    },
    // 오답 노트에서 다시 맞히면 정복. 아침 미션에서 틀린 문제면 별가루 +3
    clearWrong(q, { reward = true } = {}) {
      let gain = 0;
      const id = qId(q);
      update((p) => {
        const n = p.wrongNotes?.find((x) => !x.cleared && qId(x.q) === id);
        if (!n) return null;
        n.cleared = true;
        n.clearedAt = todayKey();
        if (reward && n.source === 'daily') gain = earn(p, 3);
        return p;
      });
      return gain;
    },

    setHeartsSeen(n) {
      update((p) => {
        if (p.heartsSeen === n) return null;
        p.heartsSeen = n;
        return p;
      });
    },

    finishOnboarding() {
      update((p) => {
        p.onboarded = true;
        p.newsSeen = NEWS_VERSION; // 처음 안내에 새 기능도 들어 있다
        return p;
      });
    },
    seeNews(v) {
      update((p) => {
        if ((p.newsSeen ?? 0) >= v) return null;
        p.newsSeen = v;
        return p;
      });
    },

    // 지금 있는 별에서 추진기를 메고 이륙
    launch() {
      const { visiting, profile } = get();
      set({ screen: 'space', launchFrom: visiting ?? profile.sid, visiting: null, mode: 'walk' });
    },
    visit(sid) {
      if (sid === get().profile?.sid) return set({ screen: 'home', visiting: null });
      set({ screen: 'visit', visiting: sid, mode: 'walk' });
    },
    setMode(mode) {
      set({ mode });
    },

    missionDoneToday() {
      return get().profile?.lastMissionDate === todayKey();
    },

    // 미션 보상: 하루 1회만 지급, 연속 출석은 등교일 기준
    // 맞힌 수만이 아니라 끝까지 푼 것·꾸준함·틀렸던 문제를 다시 맞힌 것도 별가루가 된다
    completeMission({ correct, total, subjects, fixed = 0 }) {
      let reward = null;
      update((p) => {
        const today = todayKey();
        if (p.lastMissionDate === today) return null;
        // 학습 기록 (최근 120일)
        p.history ??= {};
        p.history[today] = { correct, total, subjects };
        const days = Object.keys(p.history).sort();
        if (days.length > 120) for (const d of days.slice(0, days.length - 120)) delete p.history[d];
        // 직전 등교일 이후(주말 포함)에 했으면 이어진다
        p.streak = p.lastMissionDate && p.lastMissionDate >= prevSchoolDay() ? p.streak + 1 : 1;
        const base = correct * 4;
        const effort = total; // 끝까지 푼 문제마다 1
        const finish = 20;
        const streakBonus = Math.min(p.streak, 5) * 4;
        const fixBonus = fixed * 3; // 예전에 틀렸던 문제를 다시 맞힘
        // 이번 주 5일 모두 했으면 한 번
        const wk = weekKey();
        const weekDays = Object.keys(p.history).filter((d) => d >= wk).length;
        const weekBonus = weekDays >= 5 && p.weekBonus !== wk ? 30 : 0;
        if (weekBonus) p.weekBonus = wk;
        const want = base + effort + finish + streakBonus + fixBonus + weekBonus;
        const got = earn(p, want);
        reward = { base, effort, finish, streakBonus, fixBonus, weekBonus, fixed, total: got, capped: got < want, streak: p.streak };
        p.lastMissionDate = today;
        return p;
      });
      return reward;
    },

    // 어린 왕자의 부탁을 들어줌: 한정 선물 + 별가루 조금 (하루 한 번)
    completePrince(questId, giftId, stardust) {
      let gain = 0;
      update((p) => {
        const today = todayKey();
        p.prince ??= { done: [] };
        if (p.prince.last === today) return null;
        p.prince.last = today;
        if (!p.prince.done.includes(questId)) p.prince.done.push(questId);
        p.inventory[giftId] = (p.inventory[giftId] ?? 0) + 1;
        p.gifts ??= [];
        if (!p.gifts.includes(giftId)) p.gifts.push(giftId);
        gain = earn(p, stardust);
        return p;
      });
      return gain;
    },

    buyItem(itemId) {
      const item = ITEM_BY_ID[itemId];
      let ok = false;
      update((p) => {
        if (!item || item.limited || p.stardust < priceOf(item.price)) return null;
        p.stardust -= priceOf(item.price);
        p.inventory[itemId] = (p.inventory[itemId] ?? 0) + 1;
        ok = true;
        return p;
      });
      return ok;
    },

    placeItem(itemId, lat, lon) {
      let uid = null;
      update((p) => {
        if (!p.inventory[itemId]) return null;
        p.inventory[itemId] -= 1;
        if (!p.inventory[itemId]) delete p.inventory[itemId];
        uid = newUid();
        p.planet.items.push({ uid, itemId, lat, lon, rot: Math.random() * 360 });
        return p;
      });
      return uid;
    },

    moveItem(uid, lat, lon) {
      update((p) => {
        const it = p.planet.items.find((i) => i.uid === uid);
        if (!it) return null;
        Object.assign(it, { lat, lon });
        return p;
      });
    },

    rotateItem(uid, delta = 45) {
      update((p) => {
        const it = p.planet.items.find((i) => i.uid === uid);
        if (!it) return null;
        it.rot = (it.rot + delta) % 360;
        return p;
      });
    },

    // 소품 색 바꾸기 (8단계를 돌아가며)
    // 소품 색: hue를 주면 그 단계로, 없으면 다음 단계로
    recolorItem(uid, hue) {
      update((p) => {
        const it = p.planet.items.find((i) => i.uid === uid);
        if (!it) return null;
        it.hue = hue ?? ((it.hue ?? 0) + 1) % 8;
        return p;
      });
    },
    // 소품 크기: 작게 → 보통 → 크게
    resizeItem(uid) {
      update((p) => {
        const it = p.planet.items.find((i) => i.uid === uid);
        if (!it) return null;
        it.size = ((it.size ?? 1) + 1) % 3;
        return p;
      });
    },

    // 별에서 치우면 가방으로 돌아간다 (별가루 손해 없음)
    storeItem(uid) {
      update((p) => {
        const idx = p.planet.items.findIndex((i) => i.uid === uid);
        if (idx < 0) return null;
        const [it] = p.planet.items.splice(idx, 1);
        p.inventory[it.itemId] = (p.inventory[it.itemId] ?? 0) + 1;
        return p;
      });
    },

    setTint(tint) {
      update((p) => {
        p.planet.tint = tint;
        return p;
      });
    },

    // 색은 무료: 팔레트에서 마음대로
    setLookColor(slot, hex) {
      update((p) => {
        if (!COLOR_SLOTS[slot]) return null;
        p.planet.character = { ...p.planet.character, [slot]: hex };
        return p;
      });
    },
    // 한 번에 여러 부위 바꾸기 (랜덤 꾸미기: 이미 가진 것·무료만)
    setLook(patch) {
      update((p) => {
        p.planet.character = { ...p.planet.character, ...patch };
        return p;
      });
    },
    ownsPart(slot, id) {
      const part = OPTION_SLOTS[slot]?.options.find((x) => x.id === id);
      return !!part && (priceOf(part.price) === 0 || get().profile.ownedParts.includes(`${slot}:${id}`));
    },

    // 별 고리·위성·빛 무리: 산 것은 언제든 바꿔 달 수 있다
    setPlanetPart(slot, id) {
      let ok = false;
      update((p) => {
        const part = PLANET_DECO[slot]?.find((x) => x.id === id);
        if (!part) return null;
        const key = `planet:${slot}:${id}`;
        if (priceOf(part.price) > 0 && !p.ownedParts.includes(key)) {
          if (p.stardust < part.price) return null;
          p.stardust -= part.price;
          p.ownedParts.push(key);
        }
        p.planet[slot] = id;
        ok = true;
        return p;
      });
      return ok;
    },

    // 캐릭터 부위: 무료거나 이미 산 것만 착용, 아니면 구매 후 착용
    wearPart(slot, id) {
      let ok = false;
      update((p) => {
        const part = OPTION_SLOTS[slot]?.options.find((x) => x.id === id);
        if (!part) return null;
        const key = `${slot}:${id}`;
        const owned = priceOf(part.price) === 0 || p.ownedParts.includes(key);
        if (!owned) {
          if (p.stardust < part.price) return null;
          p.stardust -= part.price;
          p.ownedParts.push(key);
        }
        p.planet.character[slot] = id;
        ok = true;
        return p;
      });
      return ok;
    },

    // 친구 별에 하트: 하루에 별마다 한 번
    canGiveHeart(sid) {
      const hg = get().profile?.heartsGiven;
      return !(hg?.date === todayKey() && hg.to.includes(sid));
    },
    markHeartGiven(sid) {
      update((p) => {
        const today = todayKey();
        if (p.heartsGiven.date !== today) p.heartsGiven = { date: today, to: [] };
        if (p.heartsGiven.to.includes(sid)) return null;
        p.heartsGiven.to.push(sid);
        return p;
      });
    },
  };
});

// 꾸미는 동안엔 저장을 모아 20초마다 한 번, 꾸미기를 마치면(다른 화면으로 가도) 바로 올린다
// (내 별을 저장할 때마다 반 친구 모두가 읽어서 학급 서버 읽기 요금이 든다)
useGame.subscribe((s, prev) => {
  if (s.mode !== prev.mode) setUploadDelay(s.mode === 'decorate' ? 20000 : 600);
});

// 같은 학생이 다른 기기에서 바꾼 내용이 더 새것이면 반영
onRemoteProfile((p) => {
  const cur = useGame.getState().profile;
  if (cur?.sid === p.sid && (cur.provisional || (p.updatedAt ?? 0) > (cur.updatedAt ?? 0))) useGame.setState({ profile: p });
});
// 서버와 처음 맞춰진 순간: 끊긴 동안 바꾼 내 별을 올리고, 서버에 없던 학생의 임시 별은 진짜 별이 된다
// (서버에 더 새 기록이 있었다면 이미 그것으로 바뀌어 있다)
onSynced((serverSids) => {
  const cur = useGame.getState().profile;
  if (!cur || (cur.provisional && serverSids.has(cur.sid))) return;
  const { provisional, ...profile } = cur; // eslint-disable-line no-unused-vars
  saveProfile(profile);
  useGame.setState({ profile });
});
