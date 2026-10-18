import { useMemo } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { SUBJECT_META } from '../data/missions/grade5';
import { curriculumPosition, unitTitles } from '../engine/dailyMission';
import { useEscape } from './useEscape';

const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const DOW = ['월', '화', '수', '목', '금'];

// 최근 5주 등교일(월~금) 달력
function weeks(history) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 28);
  return Array.from({ length: 5 }, (_, w) =>
    Array.from({ length: 5 }, (_, d) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + w * 7 + d);
      const key = todayKey(day);
      const h = history[key];
      return { key, date: day.getDate(), future: day > today, h };
    }),
  );
}

export default function RecordsSheet() {
  const { profile, startMission } = useGame();
  const openSheet = useUI((s) => s.openSheet);
  const history = profile.history ?? {};
  const notes = (profile.wrongNotes ?? []).filter((n) => !n.cleared);
  const cleared = (profile.wrongNotes ?? []).filter((n) => n.cleared).length;
  const titles = unitTitles(curriculumPosition(todayKey()));

  const stats = useMemo(() => {
    const days = Object.keys(history).sort().slice(-20);
    const sub = {};
    let c = 0;
    let t = 0;
    for (const d of days) {
      const h = history[d];
      c += h.correct;
      t += h.total;
      for (const [s, [a, b]] of Object.entries(h.subjects ?? {})) {
        sub[s] ??= [0, 0];
        sub[s][0] += a;
        sub[s][1] += b;
      }
    }
    return { days: Object.keys(history).length, rate: t ? Math.round((c / t) * 100) : null, sub };
  }, [history]);

  const close = () => openSheet(null);
  useEscape(close);
  const go = (mode) => {
    close();
    startMission({ ...mode, at: Date.now() });
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <section className="records panel rise" onClick={(e) => e.stopPropagation()} aria-label="나의 기록">
        <header className="records-head">
          <h2 className="title">📒 나의 기록</h2>
          <button className="btn btn-icon btn-ghost" onClick={close} aria-label="닫기">✕</button>
        </header>

        <div className="stat-row">
          <div className="stat"><b>🔥 {profile.streak}</b><span>연속 출석</span></div>
          <div className="stat"><b>{stats.days}</b><span>미션 한 날</span></div>
          <div className="stat"><b>{stats.rate === null ? '–' : `${stats.rate}%`}</b><span>최근 정답률</span></div>
          <div className="stat"><b>{cleared}</b><span>정복한 오답</span></div>
        </div>

        <div className="records-grid">
          <div className="rec-card">
            <h3>출석 달력</h3>
            <div className="cal">
              {DOW.map((d) => (
                <span key={d} className="cal-dow">{d}</span>
              ))}
              {weeks(history).flat().map((c) => (
                <span
                  key={c.key}
                  className={`cal-day ${c.h ? (c.h.correct === c.h.total ? 'perfect' : 'done') : ''} ${c.future ? 'future' : ''} ${c.key === todayKey() ? 'today' : ''}`}
                  title={c.h ? `${c.h.correct}/${c.h.total}` : ''}
                >
                  {c.date}
                </span>
              ))}
            </div>
            <p className="cal-legend"><i className="lg done" /> 미션 완료 <i className="lg perfect" /> 모두 정답</p>
          </div>

          <div className="rec-card">
            <h3>과목별 정답률 <small>최근 20일</small></h3>
            <div className="bars">
              {SUBJECTS.map((s) => {
                const [a, b] = stats.sub[s] ?? [0, 0];
                const pct = b ? Math.round((a / b) * 100) : 0;
                return (
                  <div key={s} className="bar-row">
                    <span className="bar-label">{SUBJECT_META[s].icon} {SUBJECT_META[s].label}</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%`, background: SUBJECT_META[s].color }} /></span>
                    <span className="bar-num">{b ? `${pct}%` : '–'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rec-card">
          <h3>오답 노트</h3>
          {notes.length ? (
            <div className="note-row">
              <p>다시 풀어 볼 문제가 <b>{notes.length}개</b> 있어요. 아침 미션에서 틀린 문제를 맞히면 별가루 ✦3!</p>
              <button className="btn btn-primary" onClick={() => go({ type: 'review' })}>다시 풀기</button>
            </div>
          ) : (
            <p className="muted">틀린 문제가 없어요. 아침 미션에서 틀린 문제는 여기에 모여요.</p>
          )}
        </div>

        <div className="rec-card">
          <h3>더 연습하기 <small>별가루 없이 마음껏</small></h3>
          <div className="practice-grid">
            {SUBJECTS.map((s) => (
              <button key={s} className="practice-btn" style={{ '--c': SUBJECT_META[s].color }} onClick={() => go({ type: 'practice', subject: s })}>
                <span className="q-icon">{SUBJECT_META[s].icon}</span>
                <b>{SUBJECT_META[s].label}</b>
                <small>{s === 'math' ? titles.math : s === 'social' ? titles.social : s === 'science' ? titles.science : s === 'english' ? '단어·표현' : '맞춤법·말하기'}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
