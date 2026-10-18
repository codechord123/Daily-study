// 비행 조종 입력: 키보드와 화면 조이스틱을 하나로 합친다.
// 매 프레임 read()로 읽고, 화면 요소는 setJoy/setLift로 쓴다.
const keys = {};
const joy = { active: false, x: 0, y: 0 };
let lift = 0;
let landRequest = false;
let leaveRequest = false;
let autoToggle = false;

const onDown = (e) => {
  if (e.target?.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'Enter' || e.code === 'KeyE') landRequest = true;
  if (e.code === 'KeyF') autoToggle = true;
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
};
const onUp = (e) => {
  keys[e.code] = false;
};
const clearKeys = () => Object.keys(keys).forEach((k) => (keys[k] = false));

export function attach() {
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', clearKeys);
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', clearKeys);
    clearKeys();
    Object.assign(joy, { active: false, x: 0, y: 0 });
    lift = 0;
    landRequest = false;
  };
}

export function setJoy(active, x = 0, y = 0) {
  Object.assign(joy, { active, x, y });
}
export function setLift(v) {
  lift = v;
}

// 착륙 요청은 한 번 읽으면 사라진다
export function takeLandRequest() {
  const r = landRequest;
  landRequest = false;
  return r;
}
export function requestLand() {
  landRequest = true;
}
// F 키: 자동 비행 켜고 끄기 (한 번 읽으면 사라짐)
export function takeAutoToggle() {
  const r = autoToggle;
  autoToggle = false;
  return r;
}
// 착륙하지 않고 별에서 멀어지기
export function requestLeave() {
  leaveRequest = true;
}
export function takeLeaveRequest() {
  const r = leaveRequest;
  leaveRequest = false;
  return r;
}

const k = (...codes) => (codes.some((c) => keys[c]) ? 1 : 0);

/** x: 오른쪽 +, y: 앞으로 +, lift: 위로 + (모두 -1~1) */
export function read() {
  const kx = k('ArrowRight', 'KeyD') - k('ArrowLeft', 'KeyA');
  const ky = k('ArrowUp', 'KeyW') - k('ArrowDown', 'KeyS');
  const kl = k('Space') - k('ShiftLeft', 'ShiftRight');
  return {
    x: joy.active ? joy.x : kx,
    y: joy.active ? joy.y : ky,
    lift: lift || kl,
  };
}
