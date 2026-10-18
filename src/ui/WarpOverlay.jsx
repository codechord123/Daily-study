import { useEffect, useMemo } from 'react';
import { useUI } from '../store/useUI';
import { useGame } from '../store/useGame';
import { studentById } from '../data/classroom';
import { sfx } from '../services/sound';

const DURATION = 1100;

// 바로 가기 연출: 별빛이 길게 늘어나며 빨려 들어간 뒤 도착
export default function WarpOverlay() {
  const warp = useUI((s) => s.warp);
  const endWarp = useUI((s) => s.endWarp);
  const { profile, visit } = useGame();
  const streaks = useMemo(
    () => Array.from({ length: 36 }, () => ({ a: Math.random() * 360, d: Math.random() * 300, l: 40 + Math.random() * 120 })),
    [warp?.at], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!warp) return;
    sfx('takeoff');
    const t = setTimeout(() => {
      visit(warp.sid);
      endWarp();
      sfx('land');
    }, DURATION);
    return () => clearTimeout(t);
  }, [warp, visit, endWarp]);

  if (!warp) return null;
  const name = warp.sid === profile?.sid ? '내 별' : `${studentById(warp.sid)?.nickname}의 별`;
  return (
    <div className="warp" key={warp.at} aria-live="polite">
      {streaks.map((s, i) => (
        <span key={i} className="warp-streak" style={{ '--a': `${s.a}deg`, '--d': `${s.d}ms`, '--l': `${s.l}px` }} />
      ))}
      <p className="warp-label title">⚡ {name}(으)로 가는 중</p>
    </div>
  );
}
