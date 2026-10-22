// 체험판: 주소 끝에 ?demo 를 붙여 열면 실제 학급 서버에 연결하지 않고, 이 기기 안의 샘플 학급(5학년 별빛반)으로만 돈다.
// 실제 학급 기록과 섞이지 않게 저장소 이름 ds:… 를 체험판 전용 dsdemo:… 로 바꿔 쓴다.
// (다른 모듈보다 먼저 불려야 한다: main.jsx 첫 줄)
const FLAG = 'ds-demo-mode';

function readFlag() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('demo')) sessionStorage.setItem(FLAG, '1');
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}
export const DEMO = typeof window !== 'undefined' && readFlag();

if (DEMO) {
  const S = Storage.prototype;
  const key = (k) => (typeof k === 'string' && k.startsWith('ds:') ? `dsdemo:${k.slice(3)}` : k);
  const [get, set, remove] = [S.getItem, S.setItem, S.removeItem];
  S.getItem = function (k) {
    return get.call(this, key(k));
  };
  S.setItem = function (k, v) {
    return set.call(this, key(k), v);
  };
  S.removeItem = function (k) {
    return remove.call(this, key(k));
  };
}

/** 체험판 기록을 모두 지우고 처음부터 */
export function resetDemo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('dsdemo:')) localStorage.removeItem(k);
  } catch {
    /* noop */
  }
  location.reload();
}
/** 체험판 끝내기: 보통 화면으로 */
export function exitDemo() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* noop */
  }
  location.href = location.pathname;
}
