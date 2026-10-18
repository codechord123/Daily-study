// Firebase 연결 (키가 있을 때만). 없으면 아무것도 불러오지 않고 이 기기 저장소로만 동작한다.
//  - Firestore  classes/{classId}            학급 설정
//               classes/{classId}/students/* 학생 프로필(별·캐릭터·기록)
//               classes/{classId}/hearts/*   받은 하트 수 (1씩만 증가)
//  - Realtime DB presence/{classId}/{sid}    실시간 위치 (연결이 끊기면 자동 삭제)
// 원격 데이터는 localStorage에 비춰 두고, 화면 코드는 지금처럼 동기식으로 읽는다.
const env = import.meta.env;
export const CLASS_ID = env.VITE_CLASS_ID || 'star5';
const EMULATOR = env.VITE_FIREBASE_EMULATOR === '1';
export const cloudEnabled = EMULATOR || !!env.VITE_FIREBASE_PROJECT_ID;

let fb = null; // { db, rtdb, fs, rd }
let readyResolve;
export const cloudReady = new Promise((r) => (readyResolve = r));
const status = { connected: false, error: null };
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

// 다른 모듈이 원격 변경을 받을 곳 (순환 import 피하려고 등록 방식)
const handlers = { profile: null, hearts: null, settings: null, presence: null };
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
    const projectId = env.VITE_FIREBASE_PROJECT_ID || 'demo-dailystudy';
    const app = initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      databaseURL: env.VITE_FIREBASE_DATABASE_URL || `http://127.0.0.1:9000?ns=${projectId}-default-rtdb`,
      appId: env.VITE_FIREBASE_APP_ID || 'demo-app',
    });
    const db = fs.getFirestore(app);
    const rtdb = rd.getDatabase(app);
    const auth = au.getAuth(app);
    if (EMULATOR) {
      fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
      rd.connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
      au.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    await au.signInAnonymously(auth);
    fb = { db, rtdb, fs, rd };

    // 학생 프로필 전체 구독 (첫 응답이 오면 준비 완료)
    let first = true;
    fs.onSnapshot(fs.collection(db, 'classes', CLASS_ID, 'students'), (snap) => {
      snap.docChanges().forEach((ch) => ch.type !== 'removed' && handlers.profile?.(ch.doc.data()));
      if (first) {
        first = false;
        setStatus({ connected: true, error: null });
        readyResolve(true);
      }
    });
    fs.onSnapshot(fs.collection(db, 'classes', CLASS_ID, 'hearts'), (snap) =>
      snap.docChanges().forEach((ch) => handlers.hearts?.(ch.doc.id, ch.doc.data().count ?? 0)),
    );
    fs.onSnapshot(fs.doc(db, 'classes', CLASS_ID), (d) => d.exists() && d.data().settings && handlers.settings?.(d.data().settings));
    rd.onValue(rd.ref(rtdb, `presence/${CLASS_ID}`), (s) => handlers.presence?.(s.val() ?? {}));
    rd.onValue(rd.ref(rtdb, '.info/connected'), (s) => setStatus({ connected: !!s.val() }));
  } catch (err) {
    console.warn('Firebase 연결 실패, 이 기기 저장으로 계속합니다', err);
    setStatus({ connected: false, error: String(err?.message ?? err) });
    readyResolve(false);
  }
}

// ---------- 쓰기 ----------
const pending = new Map();
export function uploadProfile(profile) {
  if (!fb) return;
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
  if (!fb) return;
  fb.fs.setDoc(fb.fs.doc(fb.db, 'classes', CLASS_ID), { settings }, { merge: true }).catch((e) => console.warn('설정 저장 실패', e));
}

let presenceRef = null;
export function presenceSet(state) {
  if (!fb) return false;
  const ref = fb.rd.ref(fb.rtdb, `presence/${CLASS_ID}/${state.sid}`);
  if (!presenceRef || presenceRef.key !== state.sid) {
    presenceRef = ref;
    fb.rd.onDisconnect(ref).remove();
  }
  fb.rd.set(ref, JSON.parse(JSON.stringify({ ...state, t: Date.now() })));
  return true;
}
export function presenceLeave(sid) {
  if (!fb) return false;
  fb.rd.remove(fb.rd.ref(fb.rtdb, `presence/${CLASS_ID}/${sid}`));
  return true;
}
