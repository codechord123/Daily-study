import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startCloud } from './services/cloud';
import './theme/styles.css';
import './ui/ui.css';

startCloud();

// iOS 사파리는 확대 금지 설정을 무시하므로 두 손가락 확대 동작을 직접 막는다.
// (두 번 톡톡 확대는 CSS touch-action으로 막는다. 터치 끝 이벤트를 막으면 키패드 연타가 씹힌다)
['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 개발 중 브라우저 콘솔에서 상태를 볼 수 있게
if (import.meta.env.DEV) {
  import('./store/useGame').then((m) => (window.__game = m.useGame));
  import('./store/useUI').then((m) => (window.__ui = m.useUI));
}
