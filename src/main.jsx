import { DEMO } from './demo'; // 체험판이면 저장소를 먼저 갈라 둔다 (맨 먼저)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startCloud } from './services/cloud';
import './theme/styles.css';
import './ui/ui.css';

startCloud();
// 체험판: 샘플 학생들의 지난 3주 기록을 채워 둔다 (이미 있으면 그대로)
if (DEMO) import('./ui/TeacherView').then((m) => m.fillDemo());

// 3D 위 이름표(drei Html)가 장면이 바뀔 때 이미 떼어진 요소를 한 번 더 떼려다 오류가 난다.
// 그런 경우는 조용히 넘어가도록 방어한다 (React 공식 이슈 #11538에서 쓰는 우회법).
const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  if (child.parentNode !== this) return child;
  return origRemoveChild.call(this, child);
};

// iOS 사파리는 확대 금지 설정을 무시하므로 두 손가락 확대 동작을 직접 막는다.
// (두 번 톡톡 확대는 CSS touch-action으로 막는다. 터치 끝 이벤트를 막으면 키패드 연타가 씹힌다)
['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 와이파이가 끊겨도 열리게 (배포판에서만, 미리보기 iframe 등 막힌 곳에서는 조용히 넘어감)
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext && window.top === window.self) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// 개발 중 브라우저 콘솔에서 상태를 볼 수 있게
if (import.meta.env.DEV) {
  import('./store/useGame').then((m) => (window.__game = m.useGame));
  import('./store/useUI').then((m) => (window.__ui = m.useUI));
}
