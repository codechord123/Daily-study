// 🛰 문제 정거장: 내 공부를 한곳에서 (기록 · 과목별 연습 · 오답 노트 · 다시 볼 문제)
import { useEffect, useMemo, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { SUBJECT_META } from '../data/missions/grade5';
import { curriculumPosition, unitTitles } from '../engine/dailyMission';
import { getLearn, onLearnChange, dayNum, recentAccuracy } from '../store/learnStore';
import RichText from './RichText';
import { RecordsBody } from './RecordsBody';
import { useEscape } from './useEscape';

const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const TABS = [
  ['records', '📒 기록'],
  ['subjects', '📚 과목별'],
  ['wrong', '📕 오답'],
  ['queue', '🔁 다시 보기'],
];
const short = (t, n = 60) => {
  const s = String(t ?? '').replace(/\s+/g, ' ');
  return s.length > n ? `${s.slice(0, n)}…` : s;
};
const dueLabel = (due, today) => (due <= today ? '오늘' : due === today + 1 ? '내일' : `${due - today}일 뒤`);

export default function StationSheet({ initialTab = 'subjects' }) {
  const { profile, startMission } = useGame();
  const openSheet = useUI((s) => s.openSheet);
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState(null); // 오답·다시 보기 과목 고르기
  const [learn, setLearn] = useState(() => getLearn(profile.sid));
  useEffect(() => onLearnChange((sid) => sid === profile.sid && setLearn(getLearn(profile.sid))), [profile.sid]);
  const close = () => openSheet(null);
  useEscape(close);
  const go = (mode) => {
    close();
    startMission({ ...mode, at: Date.now() });
  };
  const today = dayNum();
  const titles = unitTitles(curriculumPosition(todayKey()));
  const notes = (profile.wrongNotes ?? []).filter((n) => !n.cleared);

  const per = useMemo(() => {
    const out = {};
    for (const s of SUBJECTS) {
      const acc = recentAccuracy(profile.sid, s);
      out[s] = {
        acc: acc == null ? null : Math.round(acc * 100),
        wrong: notes.filter((n) => n.q.subject === s).length,
        queue: learn.review.filter((e) => e.q.subject === s).length,
        due: learn.review.filter((e) => e.q.subject === s && e.due <= today).length,
      };
    }
    return out;
  }, [learn, profile.wrongNotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const wrongList = notes.filter((n) => !filter || n.q.subject === filter).slice().reverse();
  const queueList = learn.review.filter((e) => !filter || e.q.subject === filter).slice().sort((a, b) => a.due - b.due);
  const dueCount = queueList.filter((e) => e.due <= today).length;

  const Chips = () => (
    <div className="st-chips">
      <button className={`chip chip-btn ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)}>전체</button>
      {SUBJECTS.map((s) => (
        <button key={s} className={`chip chip-btn ${filter === s ? 'on' : ''}`} style={{ '--c': SUBJECT_META[s].color }} onClick={() => setFilter(s)}>
          {SUBJECT_META[s].icon} {SUBJECT_META[s].label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sheet-backdrop" onClick={close}>
      <section className="records station panel rise" onClick={(e) => e.stopPropagation()} aria-label="문제 정거장">
        <header className="records-head">
          <h2 className="title">🛰 문제 정거장</h2>
          <button className="btn btn-icon btn-ghost" onClick={close} aria-label="닫기">✕</button>
        </header>
        <nav className="st-tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`st-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              <span className="st-tab-label">{label}</span>
              {id === 'wrong' && notes.length > 0 && <b>{notes.length}</b>}
              {id === 'queue' && learn.review.length > 0 && <b>{learn.review.length}</b>}
            </button>
          ))}
        </nav>

        {tab === 'records' && <RecordsBody profile={profile} />}

        {tab === 'subjects' && (
          <div className="st-subjects">
            {SUBJECTS.map((s) => {
              const p = per[s];
              return (
                <div key={s} className="st-subj" style={{ '--c': SUBJECT_META[s].color }}>
                  <div className="st-subj-head">
                    <span className="q-icon">{SUBJECT_META[s].icon}</span>
                    <b>{SUBJECT_META[s].label}</b>
                    <small className="muted">{titles[s]}</small>
                  </div>
                  <div className="st-subj-stats">
                    <span><b>{p.acc ?? '–'}{p.acc != null && '%'}</b> 최근 정답률</span>
                    <span><b>{p.wrong}</b> 오답</span>
                    <span><b>{p.queue}</b> 다시 볼 문제</span>
                  </div>
                  <div className="st-subj-actions">
                    <button className="btn btn-sm" onClick={() => go({ type: 'practice', subject: s })}>✏️ 연습</button>
                    <button className="btn btn-sm" disabled={!p.wrong} onClick={() => go({ type: 'review', subject: s })}>📒 오답 풀기</button>
                    <button className="btn btn-sm" disabled={!p.due} onClick={() => go({ type: 'review', source: 'queue', subject: s })}>🔁 오늘 다시 보기 {p.due || ''}</button>
                  </div>
                </div>
              );
            })}
            <p className="muted small-note">연습은 별가루 없이 마음껏. 아침 미션에서 틀린 문제를 오답 노트에서 맞히면 별가루 ✦3!</p>
          </div>
        )}

        {tab === 'wrong' && (
          <>
            <Chips />
            {wrongList.length ? (
              <>
                <button className="btn btn-primary" onClick={() => go({ type: 'review', subject: filter })}>
                  {filter ? `${SUBJECT_META[filter].label} ` : ''}오답 {Math.min(wrongList.length, 10)}문제 다시 풀기
                </button>
                <ul className="st-list">
                  {wrongList.map((n, i) => (
                    <li key={i} style={{ '--c': SUBJECT_META[n.q.subject]?.color }}>
                      <span className="st-dot" />
                      <span className="st-main">
                        <RichText text={short(n.q.prompt)} />
                        <small className="muted">{SUBJECT_META[n.q.subject]?.label} · {n.q.unit} · {n.date?.slice(5).replace('-', '/')} {n.source === 'daily' ? '아침 미션' : '연습'}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">{filter ? '이 과목은 남은 오답이 없어요 ✨' : '남은 오답이 없어요 ✨ 틀린 문제는 여기에 모여요.'}</p>
            )}
          </>
        )}

        {tab === 'queue' && (
          <>
            <p className="muted">틀렸거나 '🤔 헷갈렸어요'를 누른 문제는 <b>1일 → 3일 → 7일</b> 뒤 아침 미션에 다시 나와요. 세 번 이어 맞히면 졸업!</p>
            <Chips />
            {queueList.length ? (
              <>
                {dueCount > 0 && (
                  <button className="btn btn-primary" onClick={() => go({ type: 'review', source: 'queue', subject: filter })}>
                    오늘 볼 문제 {Math.min(dueCount, 10)}개 지금 풀기
                  </button>
                )}
                <ul className="st-list">
                  {queueList.map((e) => (
                    <li key={e.id} style={{ '--c': SUBJECT_META[e.q.subject]?.color }}>
                      <span className="st-dot" />
                      <span className="st-main">
                        <RichText text={short(e.q.prompt)} />
                        <small className="muted">{SUBJECT_META[e.q.subject]?.label} · {e.q.unit}</small>
                      </span>
                      <span className="st-due">
                        <b className={e.due <= today ? 'now' : ''}>{dueLabel(e.due, today)}</b>
                        <small>{'●'.repeat(e.ok)}{'○'.repeat(3 - e.ok)}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">다시 볼 문제가 없어요.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
