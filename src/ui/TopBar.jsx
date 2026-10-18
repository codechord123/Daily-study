import { useEffect, useRef, useState } from 'react';
import * as sound from '../services/sound';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { useEscape } from './useEscape';

// 오른쪽 위: 별가루·연속 출석·설정
export default function TopBar() {
  const { profile, logout } = useGame();
  const { quality, setQuality, openSheet } = useUI();
  const [open, setOpen] = useState(false);
  useEscape(() => setOpen(false), open);
  // 메뉴 바깥을 누르면 닫힌다
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => !root.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  const [snd, setSnd] = useState(sound.getPrefs);
  useEffect(() => sound.onPrefs(setSnd), []);
  return (
    <div className="topbar" ref={root}>
      <button className="chip chip-btn" onClick={() => openSheet('records')} aria-label="나의 기록">
        📒<span className="chip-txt"> 기록</span>
      </button>
      <span className="chip chip-gold" aria-label="별가루">✦ {profile.stardust}</span>
      <span className="chip" aria-label="연속 출석">🔥 {profile.streak}일</span>
      <button className="btn btn-icon btn-ghost" onClick={() => setOpen((o) => !o)} aria-label="설정">⚙︎</button>
      {open && (
        <div className="menu panel">
          <button className="menu-item" onClick={() => (setOpen(false), openSheet('records'))}>📒 나의 기록</button>
          <button className="menu-item" onClick={() => setQuality(quality === 'low' ? 'high' : 'low')}>
            화질: {quality === 'low' ? '가볍게' : '선명하게'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={() => sound.setPref('sfx', !snd.sfx)}>
            효과음: {snd.sfx ? '켜짐' : '꺼짐'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={() => sound.setPref('music', !snd.music)}>
            배경음악: {snd.music ? '켜짐' : '꺼짐'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={logout}>로그아웃</button>
        </div>
      )}
    </div>
  );
}
