// Firebase 연결 (키가 있을 때만). 없으면 아무것도 불러오지 않고 이 기기 저장소로만 동작한다.
//  - Firestore  classCodes/{CODE}               학급 코드 → 학급 (가입 전에 누구나 읽음: 이름·명단만)
//               users/{uid}                      계정 → 역할(teacher|student)·학급·번호
//               classes/{classId}                학급 설정·명단·담임 uid
//               classes/{classId}/seats/{sid}    번호 자리의 주인 계정 (gen: 다시 가입할 때마다 +1)
//               classes/{classId}/members/{uid}  이 학급 학생인지 (보안 규칙이 읽는다)
//               classes/{classId}/students/*     학생 프로필(별·캐릭터·기록)
//               classes/{classId}/hearts/*       받은 하트 수 (1씩만 증가)
//  - Realtime DB presence/{classId}/{sid}      실시간 위치 (연결이 끊기면 자동 삭제)
//               seats/{classId}/{sid}, teachers/{classId}  위치를 쓸 수 있는 사람 (보안 규칙용)
// 원격 데이터는 localStorage에 비춰 두고, 화면 코드는 지금처럼 동기식으로 읽는다.
import { setRoster, makeRoster } from '../data/classroom';

const env = import.meta.env;
const EMULATOR = env.VITE_FIREBASE_EMULATOR === '1';
// 우리 학급 서버 (웹 설정값은 원래 페이지에 공개되는 값이다. 실제 보호는 보안 규칙이 맡는다)
// 배포판에서만 쓰고, 개발 중이나 VITE_FIREBASE_OFF=1 로 만든 미리보기는 샘플 학급으로 돈다
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyCni7Nwmp0M5Vp6f4sZctK-1w_sH-Eo4Rw',
  authDomain: 'learn-cube-281e2.firebaseapp.com',
  databaseURL: 'https://learn-cube-281e2-default-rtdb.firebaseio.com',
  projectId: 'learn-cube-281e2',
  appId: '1:446916411202:web:65ccd65ee6bed9548f12db',
};
const useDefault = env.PROD && env.VITE_FIREBASE_OFF !== '1' && !EMULATOR;
const cfg = (key, envKey) => env[envKey] || (useDefault ? DEFAULT_CONFIG[key] : undefined);
export const cloudEnabled = EMULATOR || !!cfg('projectId', 'VITE_FIREBASE_PROJECT_ID');
// 지금 들어와 있는 학급 (로그인하면 정해진다)
export let CLASS_ID = env.VITE_CLASS_ID || 'star5';

let fb = null; // { db, rtdb, auth, fs, rd, au }
let readyResolve;
export const cloudReady = new Promise((r) => (readyResolve = r));
const status = { connected: false, synced: false, error: null };
const statusListeners = new Set();
export const getCloudStatus = () => ({ ...status });
export function onCloudStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}
const setStatus = (patch) => {
  Object.assign(status, patch);
  statusListeners.forEach((fn) => fn(getCloudStatus()));
};

// ---------- 계정 상태 ----------
// status: loading(확인 중) | signedOut | student | teacher | needsClass(선생님인데 학급이 아직 없음)
const ACCOUNT_KEY = 'ds:account';
let account = { status: cloudEnabled ? 'loading' : 'off' };
const accountListeners = new Set();
export const getAccount = () => account;
export function onAccount(fn) {
  accountListeners.add(fn);
  return () => accountListeners.delete(fn);
}
function setAccount(next) {
  account = next;
  try {
    if (next.uid && (next.status === 'student' || next.status === 'teacher')) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
    else if (next.status === 'signedOut') localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* noop */
  }
  accountListeners.forEach((fn) => fn(account));
}
const cachedAccount = (uid) => {
  try {
    const a = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? 'null');
    return a?.uid === uid ? a : null;
  } catch {
    return null;
  }
};

// 다른 모듈이 원격 변경을 받을 곳 (순환 import 피하려고 등록 방식)
const handlers = { profile: null, hearts: null, settings: null, presence: null, synced: null };
export function onRemote(kind, fn) {
  handlers[kind] = fn;
}

export async function startCloud() {
  if (!cloudEnabled) return readyResolve(false);
  try {
    const [{ initializeApp }, fs, rd, au] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/database'),
      import('firebase/auth'),
    ]);
    const projectId = cfg('projectId', 'VITE_FIREBASE_PROJECT_ID') || 'demo-dailystudy';
    const app = initializeApp({
      apiKey: cfg('apiKey', 'VITE_FIREBASE_API_KEY') || 'demo-key',
      // 배포판은 로그인 창도 앱 주소에서 연다 (vercel.json 이 /__/auth 를 Firebase로 중계).
      // 다른 주소의 로그인 창은 요즘 브라우저가 정보를 막아 '잠시만요'에서 멈춘다
      authDomain: useDefault && /\.vercel\.app$/.test(location.hostname) ? location.host : cfg('authDomain', 'VITE_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
      projectId,
      databaseURL: cfg('databaseURL', 'VITE_FIREBASE_DATABASE_URL') || `http://127.0.0.1:9000?ns=${projectId}-default-rtdb`,
      appId: cfg('appId', 'VITE_FIREBASE_APP_ID') || 'demo-app',
    });
    const db = fs.getFirestore(app);
    const rtdb = rd.getDatabase(app);
    const auth = au.getAuth(app);
    if (EMULATOR) {
      fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
      rd.connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
      au.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    fb = { db, rtdb, auth, fs, rd, au };
    if (EMULATOR) window.__fb = fb; // 시험용
    rd.onValue(rd.ref(rtdb, '.info/connected'), (s) => setStatus({ connected: !!s.val() }));
    // 페이지를 옮겨 로그인하고 돌아온 경우 실패 이유를 보여 준다 (성공하면 아래 onAuthStateChanged 로 들어간다)
    au.getRedirectResult(auth).catch((e) => setAccount({ ...account, error: authMessage(e) }));
    // 이 기기에 로그인이 남아 있으면 그대로 들어간다 (Firebase가 기기에 로그인을 기억함)
    au.onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (account.status !== 'signedOut') setAccount({ status: 'signedOut' });
        return;
      }
      if (account.uid === user.uid && account.status !== 'loading') return;
      if (signingUp) return; // 가입 중: 자리를 다 잡은 뒤 studentSignUp 이 직접 들어간다
      resolveAccount(user).catch((e) => {
        console.warn('계정 확인 실패', e);
        setAccount({ status: 'signedOut', error: '학급 서버에 연결하지 못했어요' });
      });
    });
  } catch (err) {
    console.warn('Firebase 연결 실패, 이 기기 저장으로 계속합니다', err);
    setStatus({ connected: false, error: String(err?.message ?? err) });
    setAccount({ status: 'signedOut', error: '학급 서버에 연결하지 못했어요' });
    readyResolve(false);
  }
}

// 로그인한 계정이 누구인지(학생/선생님, 어느 학급) 알아낸다
async function resolveAccount(user) {
  const { fs, db } = fb;
  // 와이파이가 없어도 이 기기에서 쓰던 계정이면 바로 들어간다 (연결되면 이어서 동기화)
  const cached = cachedAccount(user.uid);
  if (cached) enterClass(cached);
  const snap = await fs.getDoc(fs.doc(db, 'users', user.uid)).catch((e) => {
    if (cached) return null;
    throw e;
  });
  if (!snap) return;
  const u = snap.exists() ? snap.data() : null;
  if (!u?.classId) {
    // 처음 들어온 Google 계정: 학급 만들기 화면으로
    if (user.providerData.some((p) => p.providerId === 'google.com')) setAccount({ status: 'needsClass', uid: user.uid, email: user.email, name: user.displayName });
    else setAccount({ status: 'signedOut', error: '가입이 끝나지 않은 계정이에요. 다시 가입해 주세요' });
    return;
  }
  const cls = await fs.getDoc(fs.doc(db, 'classes', u.classId));
  const c = cls.exists() ? cls.data() : {};
  const next = { status: u.role, uid: user.uid, classId: u.classId, sid: u.sid ?? null, className: c.name ?? '', code: c.code ?? '' };
  if (!cached || cached.classId !== next.classId || cached.sid !== next.sid) enterClass(next);
  else setAccount(next);
}

// 다른 학급으로 바뀌면 이 기기에 비춰 둔 예전 학급 기록을 지운다
function forgetOtherClass(classId) {
  try {
    if (localStorage.getItem('ds:class') === classId) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('ds:profile:') || k.startsWith('ds:hearts:') || k === 'ds:class-settings' || k.startsWith('ds:progress:'))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('ds:class', classId);
  } catch {
    /* noop */
  }
}

let unsubs = [];
let signingUp = false;
let readyTimer = 0;
let retryTimer = 0;
let retries = 0;
function enterClass(acc) {
  retries = 0;
  forgetOtherClass(acc.classId);
  CLASS_ID = acc.classId;
  setAccount(acc);
  startClassSync();
}

// 학급 데이터 구독 (명단·설정·학생 별·하트·실시간 위치)
function startClassSync() {
  const { fs, db, rd, rtdb } = fb;
  // 막 가입한 직후처럼 권한이 아직 퍼지지 않았으면 잠시 뒤 다시 구독한다
  const retry = (e) => {
    console.warn('학급 구독 다시 시도', e?.code);
    clearTimeout(retryTimer);
    if (account.classId === CLASS_ID && retries++ < 5) retryTimer = setTimeout(startClassSync, 3000);
  };
  unsubs.forEach((u) => u());
  unsubs = [];
  setStatus({ synced: false });
  // 와이파이가 끊겨 첫 응답이 안 와도 10초 뒤엔 이 기기 기록으로 들어갈 수 있게 (연결되면 이어서 동기화)
  clearTimeout(readyTimer);
  readyTimer = setTimeout(() => readyResolve(false), 10000);
  unsubs.push(
    fs.onSnapshot(fs.doc(db, 'classes', CLASS_ID), (d) => {
      if (!d.exists()) return;
      const data = d.data();
      if (data.roster?.length) setRoster(data.roster);
      if (data.settings) handlers.settings?.(data.settings);
      if (account.className !== data.name || account.code !== data.code) setAccount({ ...account, className: data.name, code: data.code });
    }, retry),
  );
  // 학생 프로필 전체 구독. 기기 캐시가 아니라 서버가 확인해 준 첫 응답이 오면 준비 완료
  // (캐시만 보고 들어가면 새 기기에서 빈 별로 시작해 진짜 기록을 덮어쓸 수 있다)
  let synced = false;
  unsubs.push(
    fs.onSnapshot(fs.collection(db, 'classes', CLASS_ID, 'students'), { includeMetadataChanges: true }, (snap) => {
      snap.docChanges().forEach((ch) => ch.type !== 'removed' && handlers.profile?.(ch.doc.data()));
      if (!synced && !snap.metadata.fromCache) {
        synced = true;
        setStatus({ connected: true, synced: true, error: null });
        handlers.synced?.(new Set(snap.docs.map((d) => d.id)));
        readyResolve(true);
      }
    }, retry),
  );
  unsubs.push(fs.onSnapshot(fs.collection(db, 'classes', CLASS_ID, 'hearts'), (snap) => snap.docChanges().forEach((ch) => handlers.hearts?.(ch.doc.id, ch.doc.data().count ?? 0)), retry));
  const off = rd.onValue(rd.ref(rtdb, `presence/${CLASS_ID}`), (s) => handlers.presence?.(s.val() ?? {}), retry);
  unsubs.push(off);
}

// ---------- 로그인·가입 ----------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0·O·1·I 빼고
const randomFrom = (chars, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => chars[x % chars.length]).join('');
// 학생 계정은 이메일 대신 학급·번호로 만든 주소를 쓴다 (아이들은 이메일이 없어도 된다)
const studentEmail = (classId, sid, gen) => `${classId}.${sid}.${gen}@students.daily-study.app`;

const AUTH_MSG = {
  'auth/wrong-password': '비밀번호가 맞지 않아요',
  'auth/invalid-credential': '비밀번호가 맞지 않아요',
  'auth/invalid-login-credentials': '비밀번호가 맞지 않아요',
  'auth/too-many-requests': '너무 여러 번 틀렸어요. 잠시 뒤에 다시 해 주세요',
  'auth/weak-password': '비밀번호는 6글자 이상이어야 해요',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요',
  'auth/popup-closed-by-user': '로그인 창이 닫혔어요',
  'auth/popup-blocked': '팝업이 막혔어요. 주소창 옆에서 팝업을 허용해 주세요',
  'auth/unauthorized-domain': '이 주소가 Firebase 승인된 도메인에 없어요',
  'auth/operation-not-allowed': 'Firebase에서 이 로그인 방법이 꺼져 있어요',
  'auth/cancelled-popup-request': '로그인 창이 이미 열려 있어요',
};
export const authMessage = (e) => AUTH_MSG[e?.code] ?? `잠시 뒤에 다시 해 주세요 (${e?.code ?? '알 수 없는 오류'})`;
const need = () => {
  if (!fb) throw Object.assign(new Error('offline'), { code: 'auth/network-request-failed' });
  return fb;
};

/** 학급 코드 → { classId, name, roster, seats: { sid: { taken, gen } } } (없으면 null) */
export async function lookupClass(code) {
  const { fs, db } = need();
  const c = await fs.getDoc(fs.doc(db, 'classCodes', code.trim().toUpperCase()));
  if (!c.exists()) return null;
  const info = c.data();
  const seats = {};
  (await fs.getDocs(fs.collection(db, 'classes', info.classId, 'seats'))).forEach((d) => {
    seats[d.id] = { taken: !!d.data().uid, gen: d.data().gen ?? 0 };
  });
  return { ...info, code: code.trim().toUpperCase(), seats };
}

/** 학생 가입: 번호 자리를 내 계정으로 잡는다 */
export async function studentSignUp(cls, sid, password) {
  const { fs, db, au, auth, rd, rtdb } = need();
  const gen = cls.seats[sid]?.gen ?? 0;
  const email = studentEmail(cls.classId, sid, gen);
  signingUp = true;
  try {
    let cred;
    try {
      cred = await au.createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      // 지난번 가입이 중간에 끊겨 계정만 만들어진 경우: 같은 비밀번호면 이어서 가입
      if (e.code !== 'auth/email-already-in-use') throw e;
      cred = await au.signInWithEmailAndPassword(auth, email, password);
    }
    const uid = cred.user.uid;
    const batch = fs.writeBatch(db);
    batch.set(fs.doc(db, 'classes', cls.classId, 'seats', sid), { uid, gen });
    batch.set(fs.doc(db, 'classes', cls.classId, 'members', uid), { sid });
    batch.set(fs.doc(db, 'users', uid), { role: 'student', classId: cls.classId, sid });
    try {
      await batch.commit();
    } catch (e) {
      // 그 사이 다른 사람이 이 번호로 가입함
      await au.signOut(auth);
      throw Object.assign(new Error('이미 가입한 번호예요. 번호를 다시 확인해 주세요'), { code: undefined });
    }
    await rd.set(rd.ref(rtdb, `seats/${cls.classId}/${sid}`), uid);
    enterClass({ status: 'student', uid, classId: cls.classId, sid, className: cls.name, code: cls.code });
  } finally {
    signingUp = false;
  }
}

/** 학생 로그인 */
export async function studentSignIn(cls, sid, password) {
  const { au, auth } = need();
  await au.signInWithEmailAndPassword(auth, studentEmail(cls.classId, sid, cls.seats[sid]?.gen ?? 0), password);
  // 나머지는 onAuthStateChanged → resolveAccount 가 이어서 한다
}

/** 선생님 Google 로그인 */
export async function teacherSignIn() {
  const { au, auth } = need();
  const provider = new au.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (EMULATOR && window.__testGoogle) {
    // 시험용: 에뮬레이터는 서명 없는 Google 토큰을 받아 준다
    return au.signInWithCredential(auth, au.GoogleAuthProvider.credential(JSON.stringify(window.__testGoogle)));
  }
  try {
    return await au.signInWithPopup(auth, provider);
  } catch (e) {
    // 팝업을 못 여는 기기(일부 태블릿·앱 화면)는 페이지를 옮겨 로그인하고 돌아온다
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-environment') return au.signInWithRedirect(auth, provider);
    throw e;
  }
}

/** 선생님이 학급을 만든다 → 학급 코드 */
export async function createClass(name, count) {
  const { fs, db, auth, rd, rtdb } = need();
  const uid = auth.currentUser.uid;
  const classId = `c${randomFrom('abcdefghijkmnpqrstuvwxyz23456789', 11)}`;
  const roster = makeRoster(count);
  // 학급 코드가 겹치면 다시 뽑는다 (규칙이 이미 있는 코드는 못 만들게 막는다)
  let code;
  for (let i = 0; i < 6 && !code; i++) {
    const c = randomFrom(CODE_CHARS, 6);
    try {
      await fs.runTransaction(db, async (tx) => {
        const ref = fs.doc(db, 'classCodes', c);
        if ((await tx.get(ref)).exists()) throw new Error('taken');
        tx.set(ref, { classId, name, roster, teacherUid: uid });
      });
      code = c;
    } catch (e) {
      if (e.message !== 'taken') throw e;
    }
  }
  if (!code) throw new Error('학급 코드를 만들지 못했어요');
  const batch = fs.writeBatch(db);
  batch.set(fs.doc(db, 'classes', classId), { name, code, roster, teacherUid: uid, createdAt: Date.now() });
  batch.set(fs.doc(db, 'users', uid), { role: 'teacher', classId });
  await batch.commit();
  await rd.set(rd.ref(rtdb, `teachers/${classId}`), uid);
  enterClass({ status: 'teacher', uid, classId, sid: null, className: name, code });
  return code;
}

/** 선생님: 명단(번호·별명) 바꾸기 */
export async function saveRoster(roster) {
  const { fs, db } = need();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, 'classes', CLASS_ID), { roster });
  batch.update(fs.doc(db, 'classCodes', account.code), { roster });
  await batch.commit();
}

/** 선생님: 이 학급의 번호 자리 상태 { sid: { uid, gen } } */
export async function loadSeats() {
  const { fs, db } = need();
  const seats = {};
  (await fs.getDocs(fs.collection(db, 'classes', CLASS_ID, 'seats'))).forEach((d) => (seats[d.id] = d.data()));
  return seats;
}

/** 선생님: 비밀번호를 잊은 학생이 새로 가입할 수 있게 (별과 기록은 그대로) */
export async function allowRejoin(sid) {
  const { fs, db, rd, rtdb } = need();
  const ref = fs.doc(db, 'classes', CLASS_ID, 'seats', sid);
  const seat = (await fs.getDoc(ref)).data();
  if (!seat?.uid) return;
  const batch = fs.writeBatch(db);
  batch.set(ref, { uid: null, gen: (seat.gen ?? 0) + 1 });
  batch.delete(fs.doc(db, 'classes', CLASS_ID, 'members', seat.uid));
  await batch.commit();
  await rd.remove(rd.ref(rtdb, `seats/${CLASS_ID}/${sid}`));
}

export async function cloudSignOut() {
  if (!fb) return;
  clearTimeout(retryTimer);
  unsubs.forEach((u) => u());
  unsubs = [];
  // 내 위치 지우기는 기다리지 않는다 (로그아웃이 먼저 끝나야 새로고침해도 로그인 화면)
  if (account.sid) fb.rd.remove(fb.rd.ref(fb.rtdb, `presence/${CLASS_ID}/${account.sid}`)).catch(() => {});
  setAccount({ status: 'signedOut' });
  await fb.au.signOut(fb.auth);
}

// ---------- 쓰기 ----------
const pending = new Map();
export function uploadProfile(profile) {
  if (!fb || profile.provisional) return; // 서버 확인 전 새 기기에서 만든 임시 별은 올리지 않는다
  if (account.status !== 'student' || account.sid !== profile.sid) return; // 내 별만 올린다
  // 빠르게 여러 번 바뀌면 마지막 것만 0.6초 뒤에 올린다
  clearTimeout(pending.get(profile.sid));
  pending.set(
    profile.sid,
    setTimeout(() => {
      pending.delete(profile.sid);
      fb.fs.setDoc(fb.fs.doc(fb.db, 'classes', CLASS_ID, 'students', profile.sid), JSON.parse(JSON.stringify(profile))).catch((e) => console.warn('저장 실패', e));
    }, 600),
  );
}

export function cloudAddHeart(sid) {
  if (!fb) return false;
  fb.fs.setDoc(fb.fs.doc(fb.db, 'classes', CLASS_ID, 'hearts', sid), { count: fb.fs.increment(1) }, { merge: true }).catch((e) => console.warn('하트 실패', e));
  return true;
}

export function uploadSettings(settings) {
  if (!fb || account.status !== 'teacher') return;
  const { teacherPin, ...rest } = settings; // eslint-disable-line no-unused-vars
  fb.fs.setDoc(fb.fs.doc(fb.db, 'classes', CLASS_ID), { settings: rest }, { merge: true }).catch((e) => console.warn('설정 저장 실패', e));
}

let presenceRef = null;
export function presenceSet(state) {
  if (!fb || account.status !== 'student') return !!fb;
  const ref = fb.rd.ref(fb.rtdb, `presence/${CLASS_ID}/${state.sid}`);
  if (!presenceRef || presenceRef.toString() !== ref.toString()) {
    presenceRef = ref;
    fb.rd.onDisconnect(ref).remove();
  }
  fb.rd.set(ref, JSON.parse(JSON.stringify({ ...state, t: Date.now() }))).catch(() => {});
  return true;
}
export function presenceLeave(sid) {
  if (!fb) return false;
  if (account.status === 'student') fb.rd.remove(fb.rd.ref(fb.rtdb, `presence/${CLASS_ID}/${sid}`)).catch(() => {});
  return true;
}
