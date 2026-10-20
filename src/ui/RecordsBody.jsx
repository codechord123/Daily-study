import { useMemo, useState } from 'react';
import { todayKey } from '../store/useGame';
import { SUBJECT_META } from '../data/missions/grade5';

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

// 문제 정거장의 '기록' 탭: 연속 출석·정답률·출석 달력(최근 2주, 펼치면 5주)·과목별 정답률
export function RecordsBody({ profile }) {
  const [allWeeks, setAllWeeks] = useState(false);
  const history = profile.history ?? {};
  const cleared = (profile.wrongNotes ?? []).filter((n) => n.cleared).length;

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
  const cal = weeks(history);

  return (
    <>
      <div className="stat-row compact">
        <div className="stat"><b>🔥{profile.streak}</b><span>연속 출석</span></div>
        <div className="stat"><b>{stats.days}</b><span>미션 한 날</span></div>
        <div className="stat"><b>{stats.rate === null ? '–' : `${stats.rate}%`}</b><span>최근 정답률</span></div>
        <div className="stat"><b>{cleared}</b><span>정복한 오답</span></div>
      </div>

      <div className="records-grid">
        <div className="rec-card">
          <h3>
            출석 달력
            <button className="btn btn-sm btn-ghost cal-more" onClick={() => setAllWeeks((v) => !v)}>{allWeeks ? '2주만 보기' : '5주 보기'}</button>
          </h3>
          <div className="cal">
            {DOW.map((d) => (
              <span key={d} className="cal-dow">{d}</span>
            ))}
            {(allWeeks ? cal : cal.slice(-2)).flat().map((c) => (
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
    </>
  );
}
