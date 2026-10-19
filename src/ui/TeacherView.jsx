import { useEffect, useMemo, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { ROSTER, samplePlanet } from '../data/classroom';
import { loadProfile, saveProfile, newProfile } from '../store/profileStore';
import { getSettings, setSettings, onSettings } from '../store/classSettings';
import { cloudEnabled, onCloudStatus, getCloudStatus } from '../services/cloud';
import ClassPanel from './ClassPanel';
import { useAccount } from './CloudLogin';
import { onPlanetChange } from '../store/profileStore';
import { SUBJECT_META } from '../data/missions/grade5';
import { curriculumPosition, unitTitles, buildDailyMission, UNIT_TITLES, MISSION_COUNTS } from '../engine/dailyMission';

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
  const logout = useGame((s) => s.logout);
  const account = useAccount();
  const settings = useSettings();
  const [tick, setTick] = useState(0);
  const [csv, setCsv] = useState(null);
  const [cloud, setCloud] = useState(getCloudStatus);
  useEffect(() => onCloudStatus(setCloud), []);
  // 다른 기기에서 기록이 들어오면 표를 다시 계산
  useEffect(() => onPlanetChange(() => setTick((x) => x + 1)), []);
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
    const text = toCSV(rows);
    setCsv(text.replace('\ufeff', '')); // 파일 저장이 막힌 곳(미리보기 등)을 위해 복사 창도 띄운다
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `나의작은별_학습기록_${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // 과목별 단원 고르기: 아무것도 안 고르면 날짜로 자동, 고르면 그 단원(들)에서만 출제
  const toggleUnit = (subject, i) => {
    const cur = Array.isArray(settings.override[subject]) ? settings.override[subject] : settings.override[subject] == null ? [] : [settings.override[subject]];
    const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b);
    setSettings({ override: { [subject]: next.length ? next : null } });
  };
  const chosen = (subject) => {
    const v = settings.override[subject];
    return v == null ? [] : Array.isArray(v) ? v : [v];
  };

  return (
    <div className="teacher">
      <header className="teacher-head">
        <div>
          <p className="hud-kicker">선생님 화면 · {cloudEnabled ? account.className : '5학년 별빛반'}</p>
          <h1 className="title">오늘의 학급 현황</h1>
        </div>
        {cloudEnabled ? (
          <button className="btn" onClick={logout}>로그아웃</button>
        ) : (
          <button className="btn" onClick={() => go('login')}>← 학생 화면으로</button>
        )}
      </header>
      {/* 아래쪽 자주 쓰는 곳으로 바로 이동 */}
      <nav className="t-jump" aria-label="바로 가기">
        {[
          ...(cloudEnabled ? [['t-class', '🏫 우리 반']] : []),
          ['t-students', '👩‍🎓 학생별 현황'],
          ['t-units', '📚 출제 단원'],
          ['t-settings', '⚙︎ 설정'],
        ].map(([id, label]) => (
          <button key={id} className="chip chip-btn" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {label}
          </button>
        ))}
      </nav>

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

      <section className="t-panel" id="t-students">
        <div className="t-panel-head">
          <h2>학생별 현황</h2>
          <div className="t-actions">
            <button className="btn btn-sm" onClick={download}>CSV 내보내기</button>
            {!cloudEnabled && (
              <>
                <button className="btn btn-sm" onClick={() => (fillDemo(), setTick((x) => x + 1))}>샘플 기록 채우기</button>
                <button className="btn btn-sm" onClick={() => (clearDemo(), setTick((x) => x + 1))}>샘플 지우기</button>
              </>
            )}
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
        <p className="muted small-note">
          {cloudEnabled
            ? cloud.connected
              ? '☁︎ 학급 서버에 연결되어 반 전체 기기의 기록이 실시간으로 모이고 있어요.'
              : '☁︎ 학급 서버에 연결하는 중이에요…'
            : '지금은 이 기기에 저장된 기록만 보여요. Firebase를 연결하면 반 전체 기기의 기록이 모여요.'}
        </p>
      </section>

      {csv && (
        <div className="sheet-backdrop" style={{ position: 'fixed' }} onClick={() => setCsv(null)}>
          <section className="records panel" onClick={(e) => e.stopPropagation()} aria-label="학습 기록 CSV">
            <header className="records-head">
              <h2 className="title">학습 기록 (CSV)</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setCsv(null)} aria-label="닫기">✕</button>
            </header>
            <p className="muted">파일이 저장되지 않았다면 아래 내용을 복사해 엑셀이나 구글 시트에 붙여 넣으세요.</p>
            <textarea id="csv-text" className="csv-box" readOnly value={csv} onFocus={(e) => e.target.select()} />
            <button
              className="btn btn-primary"
              onClick={(e) => {
                const ta = document.getElementById('csv-text');
                navigator.clipboard?.writeText(csv).then(
                  () => (e.target.textContent = '복사했어요 ✓'),
                  () => ta.select(),
                ) ?? ta.select();
              }}
            >
              전체 복사
            </button>
          </section>
        </div>
      )}

      <section className="t-panel" id="t-units">
        <div className="t-panel-head">
          <h2>출제 단원</h2>
          <span className="muted">매일 {Object.values(MISSION_COUNTS).reduce((a, b) => a + b, 0)}문제 = {SUBJECTS.map((s) => `${SUBJECT_META[s].label} ${MISSION_COUNTS[s]}`).join(' · ')}</span>
        </div>
        <p className="muted">단원을 고르면 <b>고른 단원에서만</b> 문제가 나와요(여러 개 가능). 아무것도 고르지 않으면 학기 시작일로 진도를 계산해 지금 단원 위주로 내고 지난 단원을 복습시켜요.</p>
        <div className="unit-picker">
          {SUBJECTS.map((s) => (
            <div key={s} className="unit-row">
              <span className="unit-subj" style={{ '--c': SUBJECT_META[s].color }}>{SUBJECT_META[s].icon} {SUBJECT_META[s].label}</span>
              <div className="unit-chips">
                <button className={`unit-chip auto ${chosen(s).length ? '' : 'on'}`} onClick={() => setSettings({ override: { [s]: null } })}>
                  날짜로 자동
                </button>
                {UNIT_TITLES[s].map((t, i) => (
                  <button key={t} className={`unit-chip ${chosen(s).includes(i) ? 'on' : ''}`} onClick={() => toggleUnit(s, i)} aria-pressed={chosen(s).includes(i)}>
                    {i + 1}. {t}
                  </button>
                ))}
              </div>
              <span className="unit-now">{chosen(s).length ? '고른 단원만' : `지금: ${titles[s]}`}</span>
            </div>
          ))}
        </div>
      </section>

      {cloudEnabled && <ClassPanel />}

      <section className="t-panel" id="t-settings">
        <h2>설정</h2>
        <div className="t-settings">
          <label htmlFor="sem-start">2학기 시작일</label>
          <input id="sem-start" type="date" value={settings.semesterStart} onChange={(e) => e.target.value && setSettings({ semesterStart: e.target.value })} />
          <span className="muted">지금 {pos.week + 1}주차</span>

          <label htmlFor="travel">친구 별 여행</label>
          <button id="travel" className={`toggle ${settings.travelOpen ? 'on' : ''}`} onClick={() => setSettings({ travelOpen: !settings.travelOpen })} aria-pressed={settings.travelOpen}>
            <span />
          </button>
          <span className="muted">{settings.travelOpen ? '학생들이 친구 별로 여행할 수 있어요' : '여행·바로 가기가 잠겨 있어요 (수업 시간 등)'}</span>

          <label htmlFor="free-decor">무료 꾸미기 (시험용)</label>
          <button id="free-decor" className={`toggle ${settings.freeDecor ? 'on' : ''}`} onClick={() => setSettings({ freeDecor: !settings.freeDecor })} aria-pressed={settings.freeDecor}>
            <span />
          </button>
          <span className="muted">{settings.freeDecor ? '꾸미기에 별가루가 들지 않아요 (실제 수업 전에 꺼 주세요)' : '소품·옷·별 장식을 별가루로 사요'}</span>

          {!cloudEnabled && <PinSetting pin={settings.teacherPin} />}
        </div>
      </section>
    </div>
  );
}

/* 선생님 비밀번호 바꾸기: 샘플 0000 그대로면 경고 (로그인 화면에 힌트가 보여 학생도 들어올 수 있음) */
function PinSetting({ pin }) {
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const sample = pin === '0000';
  const save = (e) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(next)) return setMsg('숫자 4~8자리로 정해 주세요');
    setSettings({ teacherPin: next });
    setNext('');
    setMsg('바꿨어요. 다음부터 새 비밀번호로 들어와요');
  };
  return (
    <>
      <label htmlFor="pin-new">선생님 비밀번호</label>
      <form className="pin-form" onSubmit={save}>
        <input id="pin-new" type="password" inputMode="numeric" autoComplete="new-password" placeholder="새 비밀번호" value={next} maxLength={8} onChange={(e) => (setNext(e.target.value.replace(/\D/g, '')), setMsg(''))} />
        <button className="btn btn-sm" type="submit" disabled={!next}>바꾸기</button>
      </form>
      <span className={sample && !msg ? 'warn' : 'muted'}>{msg || (sample ? '⚠︎ 아직 샘플 비밀번호(0000)예요. 학생들이 들어오지 못하게 바꿔 주세요' : '비밀번호가 설정되어 있어요')}</span>
    </>
  );
}
