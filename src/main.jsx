import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme/styles.css';
import './ui/ui.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 개발 중 브라우저 콘솔에서 상태를 볼 수 있게
if (import.meta.env.DEV) import('./store/useGame').then((m) => (window.__game = m.useGame));
