import { create } from 'zustand';
import { ITEM_BY_ID } from '../data/items';
import { OPTION_SLOTS, COLOR_SLOTS } from '../data/character';
import { PLANET_DECO } from '../theme/tokens';
import { loadProfile, newProfile, saveProfile, onRemoteProfile, onSynced } from './profileStore';

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 직전 등교일(주말 건너뜀)
function prevSchoolDay(d = new Date()) {
  const p = new Date(d);
  do p.setDate(p.getDate() - 1);
  while (p.getDay() === 0 || p.getDay() === 6);
  return todayKey(p);
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
      try {
        const sid = sessionStorage.getItem(SESSION_KEY);
        if (sid) get().login(sid);
      } catch {
        /* noop */
      }
    },

    login(sid) {
      const profile = loadProfile(sid) ?? newProfile(sid);
      saveProfile(profile);
      try {
        sessionStorage.setItem(SESSION_KEY, sid);
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
    },

    go(screen) {
      set({ screen, mode: 'walk', ...(screen !== 'visit' && { visiting: null }) });
    },
    startMission(mode = { type: 'daily' }) {
      set({ missionMode: mode, screen: 'mission', mode: 'walk', visiting: null });
    },

    // 틀린 문제를 오답 노트에 (같은 문제는 한 번만)
    noteWrong(q, source) {
      update((p) => {
        p.wrongNotes ??= [];
        if (p.wrongNotes.some((n) => n.q.prompt === q.prompt && !n.cleared)) return null;
        const { id, ...rest } = q; // eslint-disable-line no-unused-vars
        p.wrongNotes.push({ q: rest, date: todayKey(), source, cleared: false });
        if (p.wrongNotes.length > 80) p.wrongNotes = p.wrongNotes.filter((n) => !n.cleared).slice(-80);
        return p;
      });
    },
    // 오답 노트에서 다시 맞히면 지운다. 아침 미션에서 틀린 문제면 별가루 +3
    clearWrong(prompt) {
      let gain = 0;
      update((p) => {
        const n = p.wrongNotes?.find((x) => x.q.prompt === prompt && !x.cleared);
        if (!n) return null;
        n.cleared = true;
        n.clearedAt = todayKey();
        if (n.source === 'daily') {
          gain = 3;
          p.stardust += gain;
        }
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
    completeMission({ correct, total, subjects }) {
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
        const base = correct * 5;
        const finish = 20;
        const streakBonus = Math.min(p.streak, 5) * 4;
        reward = { base, finish, streakBonus, total: base + finish + streakBonus, streak: p.streak };
        p.stardust += reward.total;
        p.lastMissionDate = today;
        return p;
      });
      return reward;
    },

    buyItem(itemId) {
      const item = ITEM_BY_ID[itemId];
      let ok = false;
      update((p) => {
        if (!item || p.stardust < item.price) return null;
        p.stardust -= item.price;
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
    recolorItem(uid) {
      update((p) => {
        const it = p.planet.items.find((i) => i.uid === uid);
        if (!it) return null;
        it.hue = ((it.hue ?? 0) + 1) % 8;
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
      return !!part && (part.price === 0 || get().profile.ownedParts.includes(`${slot}:${id}`));
    },

    // 별 고리·위성·빛 무리: 산 것은 언제든 바꿔 달 수 있다
    setPlanetPart(slot, id) {
      let ok = false;
      update((p) => {
        const part = PLANET_DECO[slot]?.find((x) => x.id === id);
        if (!part) return null;
        const key = `planet:${slot}:${id}`;
        if (part.price > 0 && !p.ownedParts.includes(key)) {
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
        const owned = part.price === 0 || p.ownedParts.includes(key);
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
