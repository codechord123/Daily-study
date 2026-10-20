// 선생님 화면 · 학생 한 명 자세히: 성취기준별 정답률(반 평균과 비교), 최근 기록, 오답·다시 볼 문제, 자주 틀린 문제
import { useMemo } from 'react';
import { ROSTER } from '../data/classroom';
import { loadProfile } from '../store/profileStore';
import { getLearn } from '../store/learnStore';
import { SUBJECT_META } from '../data/missions/grade5';
import { STANDARDS, stdSubject } from '../data/missions/standards';
import RichText from './RichText';
import { useEscape } from './useEscape';

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];

export default function StudentDetail({ sid, questionOf, onClose }) {
  useEscape(onClose);
  const st = ROSTER.find((s) => s.id === sid);
  const p = loadProfile(sid);
  const l = getLearn(sid);

  const classStd = useMemo(() => {
    const out = {};
    for (const s of ROSTER) {
      for (const [code, [c, t]] of Object.entries(getLearn(s.id).std)) {
        const e = (out[code] ??= [0, 0]);
        e[0] += c;
        e[1] += t;
      }
    }
    return out;
  }, []);

  const history = Object.entries(p?.history ?? {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10);
  const notes = (p?.wrongNotes ?? []).filter((n) => !n.cleared);
  const noteBy = SUBJECTS.map((s) => [s, notes.filter((n) => n.q.subject === s).length]).filter(([, n]) => n);
  const missed = Object.entries(l.items)
    .filter(([, [w]]) => w > 0)
    .sort((a, b) => b[1][0] - a[1][0] || b[1][2] - a[1][2])
    .slice(0, 8)
    .map(([id, [w, t]]) => ({ id, w, t, q: questionOf(id), pick: Object.entries(l.picks?.[id] ?? {}).sort((a, b) => b[1] - a[1])[0] }));
  const stds = Object.entries(l.std).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="sheet-backdrop" style={{ position: 'fixed' }} onClick={onClose}>
      <section className="records panel rise sd" onClick={(e) => e.stopPropagation()} aria-label={`${st?.nickname} 학습 기록`}>
        <header className="records-head">
          <h2 className="title">{st?.number}번 {st?.nickname}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="닫기">✕</button>
        </header>
        {!p ? (
          <p className="muted">아직 기록이 없어요.</p>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat"><b>🔥 {p.streak ?? 0}</b><span>연속 출석</span></div>
              <div className="stat"><b>{Object.keys(p.history ?? {}).length}</b><span>미션 한 날</span></div>
              <div className="stat"><b>{notes.length}</b><span>남은 오답</span></div>
              <div className="stat"><b>{l.review.length}</b><span>다시 볼 문제</span></div>
            </div>

            <div className="rec-card">
              <h3>성취기준별 정답률 <small>막대: 이 학생 · 선: 반 평균</small></h3>
              {stds.length ? (
                <div className="sd-std">
                  {stds.map(([code, [c, t]]) => {
                    const me = pct(c, t);
                    const avg = pct(...(classStd[code] ?? [0, 0]));
                    const color = SUBJECT_META[stdSubject(code)]?.color;
                    return (
                      <div key={code} className="sd-std-row" title={STANDARDS[code]}>
                        <span className="sd-code" style={{ color }}>{code}</span>
                        <span className="bar-track sd-track">
                          <span className="bar-fill" style={{ width: `${me}%`, background: color }} />
                          {avg != null && <i className="sd-avg" style={{ left: `${avg}%` }} />}
                        </span>
                        <em className={me < 60 ? 'low' : ''}>{me}%</em>
                        <small className="muted">{t}문제 · 반 {avg}%</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">아직 기록이 없어요.</p>
              )}
            </div>

            <div className="records-grid">
              <div className="rec-card">
                <h3>최근 아침 미션</h3>
                <ul className="sd-hist">
                  {history.map(([d, h]) => (
                    <li key={d}>
                      <span>{d.slice(5).replace('-', '/')}</span>
                      <span className="bar-track"><span className="bar-fill" style={{ width: `${pct(h.correct, h.total)}%` }} /></span>
                      <b>{h.correct}/{h.total}</b>
                    </li>
                  ))}
                  {!history.length && <li className="muted">아직 없어요</li>}
                </ul>
              </div>
              <div className="rec-card">
                <h3>남은 오답 (과목별)</h3>
                {noteBy.length ? (
                  <ul className="sd-hist">
                    {noteBy.map(([s, n]) => (
                      <li key={s}>
                        <span>{SUBJECT_META[s].icon} {SUBJECT_META[s].label}</span>
                        <b>{n}문제</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">남은 오답이 없어요 ✨</p>
                )}
              </div>
            </div>

            <div className="rec-card">
              <h3>자주 틀린 문제</h3>
              {missed.length ? (
                <ul className="st-list">
                  {missed.map((m) => (
                    <li key={m.id} style={{ '--c': SUBJECT_META[m.q?.subject]?.color }}>
                      <span className="st-dot" />
                      <span className="st-main">
                        {m.q ? <RichText text={m.q.prompt} /> : '(문항 은행 밖 문제)'}
                        <small className="muted">
                          {m.w}/{m.t}번 틀림{m.pick ? ` · 고른 답: ${m.pick[0]}` : ''}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">틀린 문제가 없어요.</p>
              )}
            </div>
            {l.reports.length > 0 && (
              <div className="rec-card">
                <h3>이 학생이 알려 준 문제</h3>
                <ul className="st-list">
                  {l.reports.map((r, i) => (
                    <li key={i}>
                      <span className="st-main">
                        <b>{r.reason}</b>
                        <small className="muted">{r.prompt}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
