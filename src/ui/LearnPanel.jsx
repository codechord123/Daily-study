// 선생님 화면 · 학습 분석: 성취기준별 정답률, 많이 틀린 문제, 학생들이 보낸 '문제가 이상해요'
import { useEffect, useMemo, useState } from 'react';
import { ROSTER } from '../data/classroom';
import { loadProfile, onRemoteProfile } from '../store/profileStore';
import { getLearn, onLearnChange, qId, legacyId } from '../store/learnStore';
import { getSettings, setSettings, onSettings } from '../store/classSettings';
import { SUBJECT_META } from '../data/missions/grade5';
import { STANDARDS, stdSubject } from '../data/missions/standards';
import { UNIT_TITLES, ASSIGN_MAX } from '../engine/dailyMission';
import { todayKey } from '../store/useGame';

// 선생님이 고른 문제가 들어갈 아침 미션 날짜: 오전이면 오늘, 오후면 다음 등교일
function assignDate(now = new Date()) {
  const d = new Date(now);
  const weekend = (x) => x.getDay() === 0 || x.getDay() === 6;
  if (d.getHours() >= 12 || weekend(d)) {
    do d.setDate(d.getDate() + 1);
    while (weekend(d));
  }
  return todayKey(d);
}
const dayLabel = (key) => (key === todayKey() ? '오늘' : `${Number(key.slice(5, 7))}월 ${Number(key.slice(8))}일`);
import { BANK_SOCIAL, BANK_KOREAN, BANK_SCIENCE, BANK_ENGLISH, BANK_MATH } from '../data/missions/bank';
import RichText from './RichText';
import PresentView from './PresentView';
import { isGenerated, tplKey } from '../engine/blocking';

// 화면에 띄울 때 정답이 늘 ①에 오지 않게 보기를 섞는다 (문제마다 같은 순서)
export function shuffled(q, seed) {
  if (q.kind !== 'choice') return q;
  let h = [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const order = q.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const SEEN_KEY = 'ds:reports-seen';
const readSeen = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
};

// 문제 이름표 → 문항 은행 문제
let QMAP = null;
export function questionOf(id) {
  if (!QMAP) {
    QMAP = new Map();
    for (const [subject, bank] of Object.entries({ social: BANK_SOCIAL, korean: BANK_KOREAN, science: BANK_SCIENCE, english: BANK_ENGLISH, math: BANK_MATH }))
      for (const q of bank) {
        const item = { subject, ...q, unitTitle: UNIT_TITLES[subject][q.unit] };
        QMAP.set(qId(q), item);
        if (!QMAP.has(legacyId(q))) QMAP.set(legacyId(q), item); // 예전 이름표로 모인 기록
      }
  }
  return QMAP.get(id);
}

const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// 문제 한눈에 보기: 그림·지문·보기(그림 보기도)·정답·풀이
export function QuestionPeek({ q }) {
  if (!q) return <p className="muted">문제 내용을 찾을 수 없어요.</p>;
  return (
    <div className="t-peek">
      {(q.image || q.svg) && <img className="t-peek-fig" src={q.image ?? svgUrl(q.svg)} alt="문제 그림" />}
      {q.passage && <p className="t-peek-pass"><RichText text={q.passage} /></p>}
      {q.sub && <p className="t-peek-sub"><RichText text={q.sub} neg /></p>}
      <p><RichText text={q.prompt} neg /></p>
      {q.kind === 'choice' && (
        <ol>
          {q.choices.map((c, i) => (
            <li key={i} className={i === q.answer ? 'right' : ''}>
              {c.startsWith?.('img:') ? <img className="t-peek-choice" src={c.slice(4)} alt={`${i + 1}번 그림`} /> : <RichText text={c} />}
              {i === q.answer && ' ✓'}
            </li>
          ))}
        </ol>
      )}
      {q.kind !== 'choice' && <p>정답: <b>{q.kind === 'ox' ? (q.answer ? 'O' : 'X') : String(q.answer)}</b></p>}
      {q.explain && <p className="muted">💡 <RichText text={q.explain} /></p>}
    </div>
  );
}

function AssignButton({ id, assigned }) {
  const date = assignDate();
  const list = assigned?.date === date ? assigned.ids : [];
  const on = list.includes(id);
  return (
    <button
      className={`btn btn-sm ${on ? 'btn-primary' : ''}`}
      disabled={!on && list.length >= ASSIGN_MAX}
      onClick={() => setSettings({ assigned: { date, ids: on ? list.filter((x) => x !== id) : [...list, id] } })}
      title={`${dayLabel(date)} 아침 미션에 반 모두에게 나와요 (최대 ${ASSIGN_MAX}문제)`}
    >
      {on ? `📌 ${dayLabel(date)} 미션에 넣음` : `📌 ${dayLabel(date)} 아침 미션에 넣기`}
    </button>
  );
}

// 은행 문제는 그 문제 하나, 자동 생성 문제는 숫자만 다른 같은 틀의 문제를 모두 뺀다
function BlockButton({ id, q, blocked }) {
  const gen = q && isGenerated(q);
  const key = gen ? tplKey(q) : id;
  const on = blocked.includes(key) || blocked.includes(id);
  return (
    <button
      className={`btn btn-sm ${on ? 'btn-primary' : ''}`}
      onClick={() => setSettings({ blocked: on ? blocked.filter((x) => x !== id && x !== key) : [...blocked, key] })}
      title={on ? '다시 출제해요' : gen ? '숫자만 다른 같은 모양의 문제도 모두 더 내지 않아요' : '이 문제는 더 내지 않아요'}
    >
      {on ? '빠짐 · 다시 내기' : gen ? '이 모양 문제 출제에서 빼기' : '출제에서 빼기'}
    </button>
  );
}

const topPick = (m) => Object.entries(m.picks ?? {}).sort((a, b) => b[1] - a[1])[0];

export default function LearnPanel() {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(null);
  const [seen, setSeen] = useState(readSeen);
  const [blocked, setBlocked] = useState(() => getSettings().blocked ?? []);
  const [present, setPresent] = useState(null); // { items, start }
  const [showAllWrong, setShowAllWrong] = useState(false);
  const [assigned, setAssigned] = useState(() => getSettings().assigned ?? null);
  useEffect(() => onSettings((s) => setAssigned(s.assigned ?? null)), []); // 수업 화면에 띄우는 중: 시작 번호
  useEffect(() => onLearnChange(() => setTick((x) => x + 1)), []);
  useEffect(() => onRemoteProfile(() => setTick((x) => x + 1)), []);
  useEffect(() => onSettings((s) => setBlocked(s.blocked ?? [])), []);

  const data = useMemo(() => {
    const std = {};
    const items = {};
    const reports = {};
    let review = 0;
    for (const st of ROSTER) {
      const l = getLearn(st.id);
      review += l.review.length;
      for (const [code, [c, t]] of Object.entries(l.std)) {
        const e = (std[code] ??= { c: 0, t: 0, low: 0, n: 0 });
        e.c += c;
        e.t += t;
        if (t >= 5) {
          e.n += 1;
          if (c / t < 0.6) e.low += 1;
        }
      }
      for (const [id, [w, t]] of Object.entries(l.items)) {
        const e = (items[id] ??= { w: 0, t: 0, who: 0, picks: {} });
        e.w += w;
        e.t += t;
        if (w) e.who += 1;
        for (const [label, n] of Object.entries(l.picks?.[id] ?? {})) e.picks[label] = (e.picks[label] ?? 0) + n;
      }
      for (const r of l.reports) {
        const e = (reports[r.id] ??= { ...r, reasons: {}, who: [], last: 0 });
        e.reasons[r.reason] = (e.reasons[r.reason] ?? 0) + 1;
        if (!e.who.includes(st.nickname)) e.who.push(st.nickname);
        e.last = Math.max(e.last, r.at ?? 0);
      }
    }
    const stdRows = Object.entries(std)
      .map(([code, e]) => ({ code, ...e, rate: pct(e.c, e.t), subject: stdSubject(code) }))
      .sort((a, b) => a.code.localeCompare(b.code));
    const missed = Object.entries(items)
      .filter(([, e]) => e.t >= 3 && e.w > 0)
      .map(([id, e]) => ({ id, ...e, rate: pct(e.w, e.t), q: questionOf(id) }))
      .sort((a, b) => b.rate - a.rate || b.w - a.w)
      .slice(0, 10);
    const reportRows = Object.values(reports)
      .map((r) => ({ ...r, q: questionOf(r.id) ?? (r.q && { subject: r.subject, ...r.q }) }))
      .sort((a, b) => b.last - a.last);
    // 최근 2주 동안 오답 노트에 들어간 문제 (다시 풀어 해결한 것도): 문제마다 누가 틀렸고 해결했는지
    const since = todayKey(new Date(Date.now() - 13 * 864e5));
    const wrong = {};
    for (const st of ROSTER) {
      for (const n of loadProfile(st.id)?.wrongNotes ?? []) {
        if (!n?.q || n.date < since) continue;
        const id = qId(n.q);
        const e = (wrong[id] ??= { id, q: questionOf(id) ?? n.q, who: [], last: '' });
        if (!e.who.some((w) => w.sid === st.id)) e.who.push({ sid: st.id, name: st.nickname, cleared: !!n.cleared });
        if (n.date > e.last) e.last = n.date;
      }
    }
    const wrongRows = Object.values(wrong).sort((a, b) => b.who.length - a.who.length || b.last.localeCompare(a.last));
    return { stdRows, missed, reportRows, review, wrongRows };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // 예전에 생성 문제를 하나만 빼 둔 것: 숫자만 바뀐 같은 틀이 계속 나오므로 그 틀 전체로 넓힌다
  useEffect(() => {
    const extra = data.reportRows
      .map((r) => ({ id: r.id, q: r.q ?? { prompt: r.prompt } }))
      .filter((x) => blocked.includes(x.id) && isGenerated(x.q) && !blocked.includes(tplKey(x.q)))
      .map((x) => tplKey(x.q));
    if (extra.length) setSettings({ blocked: [...new Set([...blocked, ...extra])] });
  }, [data, blocked]);

  const markSeen = (id) => {
    const next = new Set(seen).add(id);
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    } catch {
      /* noop */
    }
  };
  const slides = data.missed.filter((m) => m.q).map((m) => ({ ...m, q: shuffled(m.q, m.id) }));
  const reportSlides = data.reportRows.filter((r) => r.q).map((r) => ({ id: r.id, q: r.q }));
  const wrongShown = showAllWrong ? data.wrongRows : data.wrongRows.slice(0, 12);
  const wrongSlides = wrongShown.map((w) => ({ id: w.id, q: shuffled(w.q, w.id), who: w.who.length }));
  const newReports = data.reportRows.filter((r) => !seen.has(r.id));
  const oldReports = data.reportRows.filter((r) => seen.has(r.id));

  return (
    <section className="t-panel" id="t-learn">
      <div className="t-panel-head">
        <h2>학습 분석</h2>
        <span className="muted">틀린 문제·헷갈린 문제는 1·3·7일 뒤 아침 미션에 다시 나와요 (지금 반 전체 {data.review}문제 대기)</span>
      </div>

      <div className="t-sub-row" id="t-reports">
        <h3 className="t-sub">🚩 학생들이 알려 준 문제 {newReports.length > 0 && <span className="t-badge">{newReports.length}</span>}</h3>
        {reportSlides.length > 0 && (
          <button className="btn btn-sm btn-primary" onClick={() => setPresent({ items: reportSlides, start: 0 })}>📺 모두 띄워 보기</button>
        )}
      </div>
      {data.reportRows.length ? (
        <ul className="t-list">
          {[...newReports, ...oldReports].map((r) => (
            <li key={r.id} className={seen.has(r.id) ? 'seen' : ''}>
              <button className="t-row-btn" onClick={() => setOpen(open === `r${r.id}` ? null : `r${r.id}`)}>
                <span className="t-dot" style={{ background: SUBJECT_META[r.subject]?.color }} />
                <span className="t-row-main">
                  <b>{Object.entries(r.reasons).map(([why, n]) => `${why}${n > 1 ? ` ×${n}` : ''}`).join(' · ')}</b>
                  <span className="muted">{SUBJECT_META[r.subject]?.label} · {r.unit} — {r.prompt}</span>
                  <small className="muted">{r.who.join(', ')}</small>
                </span>
              </button>
              {open === `r${r.id}` && (
                <div className="t-row-open">
                  <QuestionPeek q={r.q} />
                  <div className="t-actions">
                    {r.q && <button className="btn btn-sm" onClick={() => setPresent({ items: reportSlides, start: reportSlides.findIndex((x) => x.id === r.id) })}>📺 크게 띄워 보기</button>}
                    {!seen.has(r.id) && <button className="btn btn-sm" onClick={() => markSeen(r.id)}>확인했어요</button>}
                    <BlockButton id={r.id} q={r.q ?? { prompt: r.prompt }} blocked={blocked} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">아직 없어요. 학생이 문제를 푼 뒤 '🚩 문제가 이상해요'를 누르면 여기에 모여요.</p>
      )}

      <h3 className="t-sub" id="t-std">📌 성취기준별 정답률</h3>
      {data.stdRows.length ? (
        <div className="t-std">
          {data.stdRows.map((r) => (
            <div key={r.code} className="t-std-row" title={STANDARDS[r.code]}>
              <span className="t-std-code" style={{ color: SUBJECT_META[r.subject]?.color }}>{r.code}</span>
              <span className="t-std-text">{STANDARDS[r.code] ?? ''}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${r.rate ?? 0}%`, background: SUBJECT_META[r.subject]?.color }} /></span>
              <em className={r.rate < 60 ? 'low' : ''}>{r.rate}%</em>
              <small className="muted">{r.t}번 풂{r.low ? ` · 60% 아래 ${r.low}명` : ''}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">학생들이 문제를 풀면 성취기준마다 정답률이 모여요.</p>
      )}

      <div className="t-sub-row" id="t-wrong">
        <h3 className="t-sub">🗂 최근 2주 틀린 문제 (오답 노트로 해결한 것도)</h3>
        {wrongSlides.length > 0 && (
          <button className="btn btn-sm btn-primary" onClick={() => setPresent({ items: wrongSlides, start: 0 })}>📺 수업 화면에 띄우기</button>
        )}
      </div>
      {data.wrongRows.length ? (
        <ol className="t-list">
          {wrongShown.map((w) => (
            <li key={w.id}>
              <button className="t-row-btn" onClick={() => setOpen(open === `w${w.id}` ? null : `w${w.id}`)}>
                <span className="t-dot" style={{ background: SUBJECT_META[w.q?.subject]?.color }} />
                <span className="t-row-main">
                  <b><RichText text={w.q.prompt} /></b>
                  <span className="muted">{SUBJECT_META[w.q?.subject]?.label} · {w.q?.unitTitle ?? w.q?.unit ?? ''}{w.q?.svg || w.q?.image ? ' · 그림 문제' : ''}</span>
                  <span className="t-who">
                    {w.who.map((x) => (
                      <span key={x.sid} className={x.cleared ? 'done' : ''} title={x.cleared ? '오답 노트에서 다시 풀어 해결' : '아직 해결 전'}>
                        {x.name}{x.cleared ? ' ✓' : ''}
                      </span>
                    ))}
                  </span>
                </span>
                <em className="t-miss">{w.who.length}명<small>{w.who.filter((x) => x.cleared).length}명 해결</small></em>
              </button>
              {open === `w${w.id}` && (
                <div className="t-row-open">
                  <QuestionPeek q={w.q} />
                  <div className="t-actions">
                    <button className="btn btn-sm" onClick={() => setPresent({ items: wrongSlides, start: wrongSlides.findIndex((x) => x.id === w.id) })}>📺 이 문제 띄우기</button>
                    <AssignButton id={w.id} assigned={assigned} />
                    <BlockButton id={w.id} q={w.q} blocked={blocked} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">최근 2주 동안 틀린 문제가 없어요.</p>
      )}
      {data.wrongRows.length > 12 && (
        <button className="btn btn-sm btn-ghost" onClick={() => setShowAllWrong((v) => !v)}>
          {showAllWrong ? '접기' : `${data.wrongRows.length - 12}문제 더 보기`}
        </button>
      )}

      <div className="t-sub-row" id="t-missed">
        <h3 className="t-sub">❗ 많이 틀린 문제 (3번 넘게 나온 문제 중)</h3>
        {slides.length > 0 && (
          <button className="btn btn-sm btn-primary" onClick={() => setPresent({ items: slides, start: 0 })}>📺 수업 화면에 띄우기</button>
        )}
      </div>
      {data.missed.length ? (
        <ol className="t-list">
          {data.missed.map((m) => (
            <li key={m.id}>
              <button className="t-row-btn" onClick={() => setOpen(open === m.id ? null : m.id)}>
                <span className="t-dot" style={{ background: SUBJECT_META[m.q?.subject]?.color }} />
                <span className="t-row-main">
                  <b>{m.q ? <RichText text={m.q.prompt} /> : '(찾을 수 없는 문제)'}</b>
                  <span className="muted">{SUBJECT_META[m.q?.subject]?.label} · {m.q?.unitTitle} · {m.q?.std}</span>
                  {topPick(m) && <span className="t-pick">가장 많이 고른 오답: <b><RichText text={topPick(m)[0]} /></b> ({topPick(m)[1]}번)</span>}
                </span>
                <em className="t-miss">{m.rate}% 오답<small>{m.w}/{m.t}번 · {m.who}명</small></em>
              </button>
              {open === m.id && (
                <div className="t-row-open">
                  <QuestionPeek q={m.q} />
                  <div className="t-actions">
                    {m.q && <button className="btn btn-sm" onClick={() => setPresent({ items: slides, start: slides.findIndex((x) => x.id === m.id) })}>📺 이 문제 띄우기</button>}
                    <AssignButton id={m.id} assigned={assigned} />
                    <BlockButton id={m.id} q={m.q} blocked={blocked} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">아직 기록이 적어요.</p>
      )}
      {assigned?.date === assignDate() && assigned.ids.length > 0 && (
        <p className="muted small-note">
          📌 {dayLabel(assigned.date)} 아침 미션에 선생님이 고른 문제 {assigned.ids.length}개가 반 모두에게 나와요 (이미 그날 미션을 시작한 학생은 빼고){' '}
          <button className="btn btn-sm" onClick={() => setSettings({ assigned: null })}>비우기</button>
        </p>
      )}
      {blocked.length > 0 && (
        <p className="muted small-note">
          출제에서 뺀 문제 {blocked.length}개 <button className="btn btn-sm" onClick={() => setSettings({ blocked: [] })}>모두 다시 내기</button>
        </p>
      )}
      {present && <PresentView items={present.items} start={Math.max(0, present.start)} onClose={() => setPresent(null)} />}
    </section>
  );
}
