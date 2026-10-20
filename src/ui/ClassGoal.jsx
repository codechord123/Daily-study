// 우리 반 공동 목표(이번 주 아침 미션 횟수)와 '이번 주 반짝 친구' (점수 순위 대신 노력을 칭찬)
import { useEffect, useMemo, useState } from 'react';
import { ROSTER } from '../data/classroom';
import { loadProfile, onPlanetChange } from '../store/profileStore';
import { getSettings, onSettings } from '../store/classSettings';
import { todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { useEscape } from './useEscape';

// 이번 주 월요일
export function weekStart(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return todayKey(m);
}
// 이번 주에 지난 등교일 수 (오늘 포함)
function schoolDaysSoFar(d = new Date()) {
  const dow = d.getDay();
  return dow === 0 || dow === 6 ? 5 : dow;
}
export const goalTarget = (s = getSettings()) => s.classGoal?.target || ROSTER.length * 4;

export function useClassWeek() {
  const [tick, setTick] = useState(0);
  const [settings, setS] = useState(getSettings);
  useEffect(() => onPlanetChange(() => setTick((x) => x + 1)), []);
  useEffect(() => onSettings(setS), []);
  return useMemo(() => {
    const wk = weekStart();
    const soFar = schoolDaysSoFar();
    let done = 0;
    const rows = ROSTER.map((st) => {
      const p = loadProfile(st.id);
      const days = Object.keys(p?.history ?? {}).filter((d) => d >= wk).length;
      const fixed = (p?.wrongNotes ?? []).filter((n) => n.cleared && n.clearedAt >= wk).length;
      done += days;
      return { ...st, days, fixed, streak: p?.streak ?? 0, has: !!p };
    });
    const target = goalTarget(settings);
    const fullWeek = rows.filter((r) => r.days >= soFar && r.days > 0);
    const fixers = rows.filter((r) => r.fixed > 0).sort((a, b) => b.fixed - a.fixed).slice(0, 5);
    const streaks = rows.filter((r) => r.streak >= 3).sort((a, b) => b.streak - a.streak).slice(0, 5);
    return { done, target, reward: settings.classGoal?.reward ?? '', fullWeek, fixers, streaks, soFar };
  }, [tick, settings]);
}

/** 집 화면 위쪽의 작은 막대 */
export function ClassGoalChip() {
  const w = useClassWeek();
  const pct = Math.min(100, Math.round((w.done / w.target) * 100));
  return (
    <button className="goal-chip" onClick={() => useUI.getState().openSheet('goal')} aria-label={`우리 반 목표 ${w.done}/${w.target}`}>
      <span>🌌 우리 반</span>
      <span className="goal-track"><i style={{ width: `${pct}%` }} /></span>
      <b>{pct >= 100 ? '달성!' : `${pct}%`}</b>
    </button>
  );
}

export function PraiseBoard({ w }) {
  const names = (list, fmt) => (list.length ? list.map((r) => <span key={r.id} className="praise-name">{r.nickname}{fmt ? <small>{fmt(r)}</small> : null}</span>) : <span className="muted">곧 나올 거예요</span>);
  return (
    <div className="praise">
      <div className="praise-row">
        <h4>📅 이번 주 하루도 안 빠진 친구</h4>
        <div className="praise-names">{names(w.fullWeek)}</div>
      </div>
      <div className="praise-row">
        <h4>🔁 틀린 문제를 다시 맞힌 친구</h4>
        <div className="praise-names">{names(w.fixers, (r) => ` ${r.fixed}문제`)}</div>
      </div>
      <div className="praise-row">
        <h4>🔥 꾸준히 이어 가는 친구</h4>
        <div className="praise-names">{names(w.streaks, (r) => ` ${r.streak}일`)}</div>
      </div>
    </div>
  );
}

export default function ClassGoalSheet() {
  const w = useClassWeek();
  const close = () => useUI.getState().openSheet(null);
  useEscape(close);
  const pct = Math.min(100, Math.round((w.done / w.target) * 100));
  return (
    <div className="sheet-backdrop" onClick={close}>
      <section className="records panel rise" onClick={(e) => e.stopPropagation()} aria-label="우리 반 목표">
        <header className="records-head">
          <h2 className="title">🌌 우리 반 이번 주 목표</h2>
          <button className="btn btn-icon btn-ghost" onClick={close} aria-label="닫기">✕</button>
        </header>
        <div className="rec-card goal-card">
          <p>
            반 친구들이 함께 아침 미션 <b>{w.target}번</b>을 채우면 {w.reward ? <b className="goal-reward">🎁 {w.reward}</b> : '목표 달성!'}
          </p>
          <div className="goal-big"><i style={{ width: `${pct}%` }} /></div>
          <p className="muted">
            지금 <b>{w.done}번</b> 했어요 {pct >= 100 ? '— 목표를 이뤘어요! 🎉' : `— ${w.target - w.done}번 남았어요. 나도 오늘 한 칸 채워요!`}
          </p>
        </div>
        <div className="rec-card">
          <h3>✨ 이번 주 반짝 친구</h3>
          <PraiseBoard w={w} />
        </div>
      </section>
    </div>
  );
}
