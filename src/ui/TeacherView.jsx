import { useEffect, useMemo, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { ROSTER, samplePlanet } from '../data/classroom';
import { loadProfile, saveProfile, newProfile } from '../store/profileStore';
import { getSettings, setSettings, onSettings } from '../store/classSettings';
import { SUBJECT_META } from '../data/missions/grade5';
import { SCHEDULE } from '../data/missions/grade5s2';
import { MATH_UNITS } from '../engine/mathGen';
import { curriculumPosition, unitTitles, buildDailyMission } from '../engine/dailyMission';

const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

function useSettings() {
  const [s, set] = useState(getSettings);
  useEffect(() => onSettings(set), []);
  return s;
}

// 시연용: 기록이 없는 학생에게 지난 3주 가상 기록을 만든다 (demo 표시)
function fillDemo() {
  const today = new Date();
  for (const st of ROSTER) {
    if (loadProfile(st.id)) continue;
    const p = newProfile(st.id);
    p.demo = true;
    p.planet = samplePlanet(st.id);
    p.history = {};
    p.wrongNotes = [];
    const skill = 0.45 + Math.random() * 0.5;
    let streak = 0;
    for (let back = 20; back >= 0; back--) {
      const d = new Date(today);
      d.setDate(today.getDate() - back);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      if (Math.random() > 0.85 && back > 0) {
        streak = 0;
        continue;
      }
      if (back === 0 && Math.random() < 0.35) continue; // 오늘 아직 안 한 학생
      const key = todayKey(d);
      const qs = buildDailyMission(st.id, key);
      const subjects = {};
      let correct = 0;
      qs.forEach((q) => {
        const ok = Math.random() < skill + (q.subject === 'english' ? 0.1 : 0);
        const t = (subjects[q.subject] ??= [0, 0]);
        t[1] += 1;
        if (ok) {
          t[0] += 1;
          correct += 1;
        } else if (back < 6) {
          const { id, ...rest } = q; // eslint-disable-line no-unused-vars
          p.wrongNotes.push({ q: rest, date: key, source: 'daily', cleared: Math.random() < 0.4 });
        }
      });
      p.history[key] = { correct, total: qs.length, subjects };
      p.lastMissionDate = key;
      streak += 1;
    }
    p.streak = streak;
    p.stardust = 40 + Math.floor(Math.random() * 300);
    saveProfile(p);
  }
}
function clearDemo() {
  for (const st of ROSTER) {
    const p = loadProfile(st.id);
    if (p?.demo) localStorage.removeItem(`ds:profile:${st.id}`);
  }
}

function toCSV(rows) {
  const head = ['번호', '별명', '오늘 미션', '오늘 점수', '연속 출석', '미션한 날', '최근 정답률', ...SUBJECTS.map((s) => SUBJECT_META[s].label), '남은 오답', '별가루'];
  const lines = rows.map((r) => [r.number, r.nickname, r.today ? 'O' : 'X', r.todayScore ?? '', r.streak, r.days, r.rate ?? '', ...SUBJECTS.map((s) => r.sub[s] ?? ''), r.notes, r.stardust].join(','));
  return '﻿' + [head.join(','), ...lines].join('\n');
}

export default function TeacherView() {
  const go = useGame((s) => s.go);
  const settings = useSettings();
  const [tick, setTick] = useState(0);
  const today = todayKey();
  const pos = curriculumPosition(today);
  const titles = unitTitles(pos);

  const rows = useMemo(() => {
    return ROSTER.map((st) => {
      const p = loadProfile(st.id);
      const h = p?.history ?? {};
      const days = Object.keys(h).sort().slice(-20);
      let c = 0;
      let t = 0;
      const sub = {};
      for (const d of days) {
        c += h[d].correct;
        t += h[d].total;
        for (const [s, [a, b]] of Object.entries(h[d].subjects ?? {})) {
          sub[s] ??= [0, 0];
          sub[s][0] += a;
          sub[s][1] += b;
        }
      }
      return {
        ...st,
        has: !!p,
        demo: !!p?.demo,
        today: p?.lastMissionDate === today,
        todayScore: h[today] ? `${h[today].correct}/${h[today].total}` : null,
        streak: p?.streak ?? 0,
        days: Object.keys(h).length,
        rate: pct(c, t),
        subRaw: sub,
        sub: Object.fromEntries(Object.entries(sub).map(([k, [a, b]]) => [k, pct(a, b)])),
        notes: (p?.wrongNotes ?? []).filter((n) => !n.cleared).length,
        noteUnits: (p?.wrongNotes ?? []).filter((n) => !n.cleared).map((n) => `${SUBJECT_META[n.q.subject]?.label} · ${n.q.unit ?? '기본'}`),
        stardust: p?.stardust ?? 0,
      };
    });
  }, [today, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => {
    const done = rows.filter((r) => r.today).length;
    const subj = {};
    let c = 0;
    let t = 0;
    const units = {};
    for (const r of rows) {
      for (const [s, [a, b]] of Object.entries(r.subRaw)) {
        subj[s] ??= [0, 0];
        subj[s][0] += a;
        subj[s][1] += b;
        c += a;
        t += b;
      }
      for (const u of r.noteUnits) units[u] = (units[u] ?? 0) + 1;
    }
    const weak = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { done, rate: pct(c, t), subj, weak, active: rows.filter((r) => r.has).length };
  }, [rows]);

  const download = () => {
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `나의작은별_학습기록_${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const unitSelect = (key, list) => (
    <select
      id={`unit-${key}`}
      value={settings.override[key] ?? 'auto'}
      onChange={(e) => setSettings({ override: { [key]: e.target.value === 'auto' ? null : Number(e.target.value) } })}
    >
      <option value="auto">날짜로 자동</option>
      {list.map((t, i) => (
        <option key={t} value={i}>
          {i + 1}. {t}
        </option>
      ))}
    </select>
  );

  return (
    <div className="teacher">
      <header className="teacher-head">
        <div>
          <p className="hud-kicker">선생님 화면 · 5학년 별빛반</p>
          <h1 className="title">오늘의 학급 현황</h1>
        </div>
        <button className="btn" onClick={() => go('login')}>← 학생 화면으로</button>
      </header>

      <section className="t-cards">
        <div className="t-card"><b>{summary.done}<small>/{ROSTER.length}</small></b><span>오늘 미션 완료</span></div>
        <div className="t-card"><b>{summary.rate ?? '–'}{summary.rate !== null && <small>%</small>}</b><span>반 평균 정답률 (최근 20일)</span></div>
        <div className="t-card wide">
          <span className="t-label">과목별 정답률</span>
          <div className="t-subj">
            {SUBJECTS.map((s) => {
              const [a, b] = summary.subj[s] ?? [0, 0];
              const v = pct(a, b);
              return (
                <div key={s} className="t-subj-item">
                  <span>{SUBJECT_META[s].label}</span>
                  <span className="bar-track"><span className="bar-fill" style={{ width: `${v ?? 0}%`, background: SUBJECT_META[s].color }} /></span>
                  <em>{v ?? '–'}{v !== null && '%'}</em>
                </div>
              );
            })}
          </div>
        </div>
        <div className="t-card wide">
          <span className="t-label">많이 틀린 단원 (남은 오답 기준)</span>
          {summary.weak.length ? (
            <ol className="t-weak">
              {summary.weak.map(([u, n]) => (
                <li key={u}>
                  {u} <em>{n}문제</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">아직 기록이 없어요.</p>
          )}
        </div>
      </section>

      <section className="t-panel">
        <div className="t-panel-head">
          <h2>학생별 현황</h2>
          <div className="t-actions">
            <button className="btn btn-sm" onClick={download}>CSV 내보내기</button>
            <button className="btn btn-sm" onClick={() => (fillDemo(), setTick((x) => x + 1))}>샘플 기록 채우기</button>
            <button className="btn btn-sm" onClick={() => (clearDemo(), setTick((x) => x + 1))}>샘플 지우기</button>
          </div>
        </div>
        <div className="t-table-wrap">
          <table className="t-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>별명</th>
                <th>오늘</th>
                <th>연속</th>
                <th>정답률</th>
                {SUBJECTS.map((s) => (
                  <th key={s}>{SUBJECT_META[s].label}</th>
                ))}
                <th>남은 오답</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.has ? '' : 'none'}>
                  <td>{r.number}</td>
                  <td>
                    {r.nickname}
                    {r.demo && <span className="demo-tag">샘플</span>}
                  </td>
                  <td>{r.today ? <span className="ok-pill">{r.todayScore}</span> : r.has ? <span className="no-pill">아직</span> : '–'}</td>
                  <td>{r.has ? `🔥${r.streak}` : '–'}</td>
                  <td className={r.rate !== null && r.rate < 60 ? 'low' : ''}>{r.rate ?? '–'}{r.rate !== null && '%'}</td>
                  {SUBJECTS.map((s) => (
                    <td key={s} className={r.sub[s] !== undefined && r.sub[s] < 50 ? 'low' : ''}>{r.sub[s] ?? '–'}</td>
                  ))}
                  <td>{r.has ? r.notes : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small-note">지금은 이 기기에 저장된 기록만 보여요. Firebase를 연결하면 반 전체 기기의 기록이 모여요.</p>
      </section>

      <section className="t-panel">
        <h2>설정</h2>
        <div className="t-settings">
          <label htmlFor="sem-start">2학기 시작일</label>
          <input id="sem-start" type="date" value={settings.semesterStart} onChange={(e) => e.target.value && setSettings({ semesterStart: e.target.value })} />
          <span className="muted">지금 {pos.week + 1}주차</span>

          <label htmlFor="unit-math">수학 단원</label>
          {unitSelect('math', MATH_UNITS.map((u) => u.title))}
          <span className="muted">지금: {titles.math}</span>

          <label htmlFor="unit-social">사회 단원</label>
          {unitSelect('social', SCHEDULE.social.titles)}
          <span className="muted">지금: {titles.social}</span>

          <label htmlFor="unit-science">과학 단원</label>
          {unitSelect('science', SCHEDULE.science.titles)}
          <span className="muted">지금: {titles.science}</span>

          <label htmlFor="travel">친구 별 여행</label>
          <button id="travel" className={`toggle ${settings.travelOpen ? 'on' : ''}`} onClick={() => setSettings({ travelOpen: !settings.travelOpen })} aria-pressed={settings.travelOpen}>
            <span />
          </button>
          <span className="muted">{settings.travelOpen ? '학생들이 친구 별로 여행할 수 있어요' : '여행·바로 가기가 잠겨 있어요 (수업 시간 등)'}</span>
        </div>
      </section>
    </div>
  );
}
