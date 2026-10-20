import { useEffect, useRef, useState } from 'react';
import * as sound from '../services/sound';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';

const QUALITY_LABEL = { high: '선명하게', low: '가볍게', lite: '가장 가볍게' };
import { useEscape } from './useEscape';
import { cloudEnabled } from '../services/cloud';
import PasswordDialog from './PasswordDialog';

// 오른쪽 위: 문제 정거장·별가루·연속 출석·설정(화질·소리·비밀번호·로그아웃)
export default function TopBar() {
  const { profile, logout, go } = useGame();
  const { quality, setQuality, openSheet } = useUI();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
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
  const notes = (profile.wrongNotes ?? []).filter((n) => !n.cleared).length;
  useEffect(() => sound.onPrefs(setSnd), []);
  return (
    <div className="topbar" ref={root}>
      {/* 문제 정거장(기록·오답·다시 볼 문제)은 메뉴에 숨기지 않고 늘 위에 */}
      <button className="chip chip-btn station-chip" onClick={() => openSheet('station')} aria-label={`문제 정거장${notes ? `, 남은 오답 ${notes}개` : ''}`}>
        🛰<span className="chip-txt"> 정거장</span>
        {notes > 0 && <b className="chip-badge">{notes}</b>}
      </button>
      <span className="chip chip-gold" aria-label="별가루">✦ {profile.stardust}</span>
      <span className="chip" aria-label="연속 출석">🔥 {profile.streak}일</span>
      <button className="btn btn-icon btn-ghost" onClick={() => setOpen((o) => !o)} aria-label="설정">⚙︎</button>
      {open && (
        <div className="menu panel">
          <button className="menu-item" onClick={() => setQuality(quality === 'high' ? 'low' : quality === 'low' ? 'lite' : 'high')}>
            화질: {QUALITY_LABEL[quality] ?? '가볍게'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={() => sound.setPref('sfx', !snd.sfx)}>
            효과음: {snd.sfx ? '켜짐' : '꺼짐'} <small>바꾸기</small>
          </button>
          <button className="menu-item" onClick={() => sound.setPref('music', !snd.music)}>
            배경음악: {snd.music ? '켜짐' : '꺼짐'} <small>바꾸기</small>
          </button>
          {profile.sid === 'teacher' ? (
            <button className="menu-item" onClick={() => (setOpen(false), go('teacher'))}>🧑‍🏫 선생님 화면</button>
          ) : (
            cloudEnabled && <button className="menu-item" onClick={() => (setOpen(false), setPwOpen(true))}>🔑 비밀번호 바꾸기</button>
          )}
          <button className="menu-item" onClick={logout}>로그아웃</button>
        </div>
      )}
      {pwOpen && <PasswordDialog onClose={() => setPwOpen(false)} />}
    </div>
  );
}
