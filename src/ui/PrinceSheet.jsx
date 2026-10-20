// 어린 왕자가 찾아와 부탁하는 대화 (말풍선을 넘기다 '도와줄게!'를 누르면 부탁 문제 3개)
import { useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { princeToday, princeQuestions } from '../engine/princeQuest';
import { PrinceFace } from './MissionView';
import { useEscape } from './useEscape';

export default function PrinceSheet() {
  const { profile, startMission } = useGame();
  const close = () => useUI.getState().openSheet(null);
  useEscape(close);
  const quest = princeToday(profile, todayKey());
  const [i, setI] = useState(0);
  if (!quest) {
    close();
    return null;
  }
  const last = i >= quest.intro.length - 1;
  const help = () => {
    close();
    startMission({ type: 'prince', questId: quest.id, questions: princeQuestions(profile.sid, todayKey()), at: Date.now() });
  };
  return (
    <div className="sheet-backdrop" onClick={close}>
      <section className="records panel rise prince-sheet" onClick={(e) => e.stopPropagation()} aria-label="어린 왕자의 부탁">
        <p className="onboard-kicker">🌹 어린 왕자의 부탁 · {quest.title}</p>
        <span className="prince-face big" aria-hidden><PrinceFace /></span>
        <p className="prince-bubble" key={i}>{quest.intro[i]}</p>
        <div className="onboard-actions">
          <button className="btn btn-ghost" onClick={close}>다음에</button>
          {last ? (
            <button className="btn btn-primary" onClick={help}>도와줄게! ✦</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>응, 무슨 일이야?</button>
          )}
        </div>
        <p className="muted small-note">문제 3개를 풀면 어린 왕자가 선물을 남기고 떠나요</p>
      </section>
    </div>
  );
}
