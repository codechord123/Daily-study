import { useState } from 'react';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';

// 오른쪽 위: 별가루·연속 출석·설정
export default function TopBar() {
  const { profile, logout } = useGame();
  const { quality, setQuality } = useUI();
  const [open, setOpen] = useState(false);
  return (
    <div className="topbar">
      <span className="chip chip-gold" aria-label="별가루">✦ {profile.stardust}</span>
      <span className="chip" aria-label="연속 출석">🔥 {profile.streak}일</span>
      <button className="btn btn-icon btn-ghost" onClick={() => setOpen((o) => !o)} aria-label="설정">⚙︎</button>
      {open && (
        <div className="menu panel">
          <button className="menu-item" onClick={() => setQuality(quality === 'low' ? 'high' : 'low')}>
            화질: {quality === 'low' ? '가볍게' : '선명하게'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={logout}>로그아웃</button>
        </div>
      )}
    </div>
  );
}
