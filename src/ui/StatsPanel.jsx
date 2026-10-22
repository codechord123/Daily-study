// 선생님 화면 · 통계: 날짜별 우리 반 (참여·정답률·과목별)과 학생별 날짜 기록표
// 모두 학생 별(프로필)의 history[날짜] = { correct, total, subjects: { 과목: [맞힘, 푼 수] } } 에서 계산한다
import { Fragment, useEffect, useMemo, useState } from 'react';
import { ROSTER } from '../data/classroom';
import { loadProfile, onRemoteProfile, onPlanetChange } from '../store/profileStore';
import { SUBJECT_META } from '../data/missions/grade5';

const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const RANGES = [
  ['2주', 10],
  ['4주', 20],
  ['학기 전체', Infinity],
];
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dayLabel = (key) => `${Number(key.slice(5, 7))}/${Number(key.slice(8))}(${WD[new Date(`${key}T00:00:00`).getDay()]})`;
// 정답률 칸 색: 80 이상 초록, 60 이상 노랑, 그 아래 분홍
const tone = (v) => (v == null ? '' : v >= 80 ? 'hi' : v >= 60 ? 'mid' : 'lo');

export default function StatsPanel({ onStudent }) {
  const [tick, setTick] = useState(0);
  const [range, setRange] = useState(20);
  const [openDay, setOpenDay] = useState(null);
  useEffect(() => onRemoteProfile(() => setTick((x) => x + 1)), []);
  useEffect(() => onPlanetChange(() => setTick((x) => x + 1)), []);

  const data = useMemo(() => {
    const students = ROSTER.map((st) => ({ ...st, h: loadProfile(st.id)?.history ?? {} }));
    const allDays = [...new Set(students.flatMap((s) => Object.keys(s.h)))].sort();
    const days = Number.isFinite(range) ? allDays.slice(-range) : allDays;
    const byDay = days.map((d) => {
      let c = 0;
      let t = 0;
      const sub = {};
      const who = [];
      for (const s of students) {
        const e = s.h[d];
        if (!e) continue;
        who.push({ id: s.id, number: s.number, nickname: s.nickname, rate: pct(e.correct, e.total), score: `${e.correct}/${e.total}` });
        c += e.correct;
        t += e.total;
        for (const [k, [a, b]] of Object.entries(e.subjects ?? {})) {
          sub[k] ??= [0, 0];
          sub[k][0] += a;
          sub[k][1] += b;
        }
      }
      const missing = students.filter((s) => !s.h[d]);
      return { d, n: who.length, rate: pct(c, t), sub: Object.fromEntries(SUBJECTS.map((k) => [k, pct(...(sub[k] ?? [0, 0]))])), who, missing };
    });
    const rows = students.map((s) => {
      let c = 0;
      let t = 0;
      let n = 0;
      const cells = days.map((d) => {
        const e = s.h[d];
        if (!e) return null;
        c += e.correct;
        t += e.total;
        n += 1;
        return pct(e.correct, e.total);
      });
      return { ...s, cells, n, rate: pct(c, t) };
    });
    return { days, byDay, rows };
  }, [range, tick]);

  const { days, byDay, rows } = data;
  const avgJoin = byDay.length ? Math.round((byDay.reduce((a, x) => a + x.n, 0) / byDay.length / ROSTER.length) * 100) : null;
  // 반 평균 정답률: 그날그날 푼 문제를 모두 합쳐서
  const avgRate = (() => {
    const [c, t] = rows.reduce((acc, r) => days.reduce((a, d) => (r.h[d] ? [a[0] + r.h[d].correct, a[1] + r.h[d].total] : a), acc), [0, 0]);
    return pct(c, t);
  })();

  const download = () => {
    const head = ['번호', '별명', '참여일', '평균 정답률(%)', ...days.map(dayLabel)];
    const lines = rows.map((r) => [r.number, r.nickname, r.n, r.rate ?? '', ...r.cells.map((v) => v ?? '')].join(','));
    const daily = ['', '반 평균', '', avgRate ?? '', ...byDay.map((x) => x.rate ?? '')].join(',');
    const join = ['', '참여 인원', '', '', ...byDay.map((x) => x.n)].join(',');
    const blob = new Blob(['﻿' + [head.join(','), ...lines, daily, join].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `나의작은별_날짜별기록_${days.at(-1) ?? ''}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className="t-panel" id="t-stats">
      <div className="t-panel-head">
        <h2>통계</h2>
        <div className="t-actions">
          {RANGES.map(([label, n]) => (
            <button key={label} className={`btn btn-sm ${range === n ? 'btn-primary' : ''}`} onClick={() => setRange(n)} aria-pressed={range === n}>
              {label}
            </button>
          ))}
          <button className="btn btn-sm" onClick={download} disabled={!days.length}>CSV 내보내기</button>
        </div>
      </div>

      {!days.length ? (
        <p className="muted">아직 기록이 없어요. 학생들이 아침 미션을 하면 날짜별로 모여요.</p>
      ) : (
        <>
          <p className="muted">
            미션한 날 {days.length}일 · 하루 평균 참여 <b>{avgJoin}%</b> · 반 평균 정답률 <b>{avgRate}%</b>
          </p>

          {/* 날짜별 반 정답률(막대)과 참여 인원(막대 위 숫자) */}
          <div className="st-chart" role="img" aria-label="날짜별 반 평균 정답률">
            {byDay.map((x) => (
              <button key={x.d} className={`st-bar ${openDay === x.d ? 'on' : ''}`} onClick={() => setOpenDay(openDay === x.d ? null : x.d)} title={`${dayLabel(x.d)} · ${x.n}명 · 정답률 ${x.rate}%`}>
                <span className="st-bar-n">{x.rate}</span>
                <span className={`st-bar-fill ${tone(x.rate)}`} style={{ height: `${x.rate ?? 0}%` }} />
                <span className="st-bar-d">{Number(x.d.slice(8))}</span>
              </button>
            ))}
          </div>

          <h3 className="t-sub">📅 날짜별 우리 반</h3>
          <div className="t-table-wrap">
            <table className="t-table st-days">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>참여</th>
                  <th>정답률</th>
                  {SUBJECTS.map((s) => (
                    <th key={s}>{SUBJECT_META[s].label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...byDay].reverse().map((x) => (
                  <Fragment key={x.d}>
                    <tr className="clickable" onClick={() => setOpenDay(openDay === x.d ? null : x.d)}>
                      <td>{dayLabel(x.d)}</td>
                      <td>
                        {x.n}/{ROSTER.length}명
                      </td>
                      <td className={x.rate < 60 ? 'low' : ''}>{x.rate}%</td>
                      {SUBJECTS.map((s) => (
                        <td key={s} className={x.sub[s] != null && x.sub[s] < 50 ? 'low' : ''}>{x.sub[s] ?? '–'}</td>
                      ))}
                    </tr>
                    {openDay === x.d && (
                      <tr className="st-open">
                        <td colSpan={3 + SUBJECTS.length}>
                          <div className="st-who">
                            {[...x.who].sort((a, b) => a.number - b.number).map((w) => (
                              <button key={w.id} className={`st-chip ${tone(w.rate)}`} onClick={() => onStudent(w.id)}>
                                {w.number} {w.nickname} <b>{w.score}</b>
                              </button>
                            ))}
                          </div>
                          {x.missing.length > 0 && <p className="muted small-note">안 한 학생: {x.missing.map((s) => `${s.number} ${s.nickname}`).join(', ')}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="t-sub">🧑‍🎓 학생별 날짜 기록 <small className="muted">칸: 그날 정답률(%) · 이름을 누르면 자세히</small></h3>
          <div className="t-table-wrap">
            <table className="t-table st-grid">
              <thead>
                <tr>
                  <th className="st-sticky">학생</th>
                  <th>참여</th>
                  <th>평균</th>
                  {days.map((d) => (
                    <th key={d} className={openDay === d ? 'on' : ''}>{dayLabel(d).replace(/\(.\)/, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.n ? 'clickable' : 'none'} onClick={() => r.n && onStudent(r.id)}>
                    <td className="st-sticky">
                      {r.number} {r.nickname}
                    </td>
                    <td>
                      {r.n}/{days.length}
                    </td>
                    <td className={r.rate != null && r.rate < 60 ? 'low' : ''}>{r.rate ?? '–'}</td>
                    {r.cells.map((v, i) => (
                      <td key={days[i]} className={`st-cell ${tone(v)}`}>{v ?? '·'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
