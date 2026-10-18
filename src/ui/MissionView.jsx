import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { buildDailyMission, isCorrect } from '../engine/dailyMission';
import { SUBJECT_META } from '../data/missions/grade5';
import RichText from './RichText';
import { sfx } from '../services/sound';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
const CHEERS = ['정답이에요!', '멋져요!', '바로 그거예요!', '똑똑해요!', '반짝반짝!'];

/* 정답 순간 버튼에서 튀어나오는 별 + 떠오르는 글자 */
function Burst({ x, y, label }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
        const d = 60 + Math.random() * 70;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 20, s: 0.6 + Math.random() * 0.8, c: ['#ffd76a', '#ff7ad9', '#6ff3ff', '#fff'][i % 4] };
      }),
    [],
  );
  return (
    <div className="burst" style={{ left: x, top: y }} aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className="burst-bit" style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--s': b.s, background: b.c }} />
      ))}
      <span className="burst-label">{label}</span>
    </div>
  );
}

function useCountUp(target, ms = 900, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return v;
}

function RewardRow({ label, value, delay }) {
  const v = useCountUp(value, 600, delay);
  return (
    <div className="reward-row" style={{ animationDelay: `${delay}ms` }}>
      <span>{label}</span>
      <b>+{v}</b>
    </div>
  );
}

function Result({ correct, total, reward, practice, onExit }) {
  const totalV = useCountUp(reward?.total ?? 0, 1100, 1300);
  const stars = Math.round((correct / total) * 5);
  useEffect(() => {
    const ts = [];
    for (let i = 0; i < stars; i++) ts.push(setTimeout(() => sfx('star'), 300 + i * 140));
    if (reward) [500, 750, 1000, 1300, 2400].forEach((ms) => ts.push(setTimeout(() => sfx('coin'), ms)));
    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mission-result">
      <div className="result-stars" aria-label={`별 ${stars}개`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`rs ${i < stars ? 'on' : ''}`} style={{ animationDelay: `${300 + i * 140}ms` }} />
        ))}
      </div>
      <h2 className="title result-title">{correct === total ? '완벽해요!' : correct >= total * 0.7 ? '잘했어요!' : '오늘도 해냈어요!'}</h2>
      <p className="result-score">
        별 조각 <b>{correct}</b> / {total}개를 모았어요
      </p>
      {reward ? (
        <div className="reward panel">
          <RewardRow label="별 조각" value={reward.base} delay={500} />
          <RewardRow label="미션 완료" value={reward.finish} delay={750} />
          <RewardRow label={`🔥 ${reward.streak}일 연속`} value={reward.streakBonus} delay={1000} />
          <div className="reward-total">
            <span>받은 별가루</span>
            <b className={totalV === reward.total ? 'done' : ''}>
              <span className="star-ico" aria-hidden />
              {totalV}
            </b>
          </div>
        </div>
      ) : (
        practice && <p className="result-note">연습 모드예요. 별가루는 내일 미션에서 다시 받을 수 있어요.</p>
      )}
      <button className="btn btn-primary btn-block result-go" onClick={onExit}>
        내 별 꾸미러 가기 →
      </button>
    </div>
  );
}

export default function MissionView() {
  const { profile, go, setMode, completeMission, missionDoneToday } = useGame();
  const { setMission, missionFx } = useUI();
  const practice = useMemo(() => missionDoneToday(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(() => buildDailyMission(profile.sid, todayKey()), [profile.sid]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // { ok, picked, cheer }
  const [num, setNum] = useState('');
  const [burst, setBurst] = useState(null);
  const [reward, setReward] = useState(null);
  const [finished, setFinished] = useState(false);
  const cardRef = useRef();

  const q = questions[idx];
  const meta = SUBJECT_META[q?.subject];
  const combo = useMemo(() => {
    let c = 0;
    for (let i = results.length - 1; i >= 0 && results[i]; i--) c++;
    return c;
  }, [results]);

  // 3D 장면에 미션 시작·종료 알림
  useEffect(() => {
    setMission({ results: [], total: questions.length, fx: null });
    return () => setMission({ results: [], total: 0, fx: null });
  }, [questions.length, setMission]);

  const answer = useCallback(
    (value, el) => {
      if (feedback || finished) return;
      const ok = isCorrect(q, value);
      const next = [...results, ok];
      setResults(next);
      setMission({ results: next });
      missionFx(ok ? 'correct' : 'wrong');
      if (ok) sfx('correct', combo + 1);
      else sfx('wrong');
      setFeedback({ ok, picked: value, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
      if (ok) {
        const r = (el ?? cardRef.current)?.getBoundingClientRect();
        if (r) setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2, id: performance.now() });
      }
    },
    [feedback, finished, q, results, combo, setMission, missionFx],
  );

  const next = useCallback(() => {
    setFeedback(null);
    setNum('');
    setBurst(null);
    if (idx + 1 < questions.length) {
      sfx('page');
      return setIdx(idx + 1);
    }
    sfx('complete');
    const correct = results.filter(Boolean).length;
    if (!practice) setReward(completeMission({ correct, total: questions.length }));
    missionFx('complete');
    setFinished(true);
  }, [idx, questions.length, results, practice, completeMission, missionFx]);

  const pressKey = useCallback(
    (k) => {
      if (feedback) return;
      sfx('key');
      if (k === '⌫') return setNum((s) => s.slice(0, -1));
      setNum((s) => {
        if (k === '.' && (s.includes('.') || !s)) return s;
        return s.length < 7 ? s + k : s;
      });
    },
    [feedback],
  );

  // 크롬북 키보드: 숫자/1~4 고르기, O·X, Enter 확인·다음
  useEffect(() => {
    if (finished) return;
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (feedback) return next();
        if (q.kind === 'number' && num) return answer(num, document.querySelector('.num-submit'));
        return;
      }
      if (feedback) return;
      if (q.kind === 'number') {
        if (/^[0-9.]$/.test(e.key)) pressKey(e.key);
        else if (e.key === 'Backspace') pressKey('⌫');
      } else if (q.kind === 'choice') {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < q.choices.length) answer(i, document.querySelectorAll('.choice')[i]);
      } else if (q.kind === 'ox') {
        const k = e.key.toLowerCase();
        if (k === 'o' || k === '1') answer(true, document.querySelectorAll('.choice')[0]);
        if (k === 'x' || k === '2') answer(false, document.querySelectorAll('.choice')[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feedback, finished, q, num, answer, next, pressKey]);

  const exit = () => {
    go('home');
    if (finished) setMode('decorate');
  };

  const correctLabel = () => {
    if (q.kind === 'number') return String(q.answer);
    if (q.kind === 'ox') return q.answer ? 'O' : 'X';
    return q.choices[q.answer];
  };

  const choiceState = (match, picked) =>
    feedback ? (match ? 'right' : picked ? 'wrong' : 'dim') : '';

  return (
    <div className={`mission ${finished ? 'is-finished' : ''}`}>
      <header className="mission-head">
        <button className="btn btn-icon btn-ghost" onClick={() => go('home')} aria-label="나가기">✕</button>
        <div className="track" aria-label={`${Math.min(idx + 1, questions.length)} / ${questions.length}`}>
          {questions.map((qq, i) => (
            <span
              key={i}
              className={`seg-dot ${i < results.length ? (results[i] ? 'ok' : 'miss') : ''} ${i === idx && !finished ? 'now' : ''}`}
              style={{ '--c': SUBJECT_META[qq.subject].color }}
            />
          ))}
        </div>
        <span className="q-count">
          {practice && <em>연습 </em>}
          {Math.min(idx + 1, questions.length)}<small>/{questions.length}</small>
        </span>
      </header>

      <div className="mission-stage" data-nosfx>
        {finished ? (
          <Result correct={results.filter(Boolean).length} total={questions.length} reward={reward} practice={practice} onExit={exit} />
        ) : (
          <article
            ref={cardRef}
            className={`q-card page-in ${feedback ? (feedback.ok ? 'is-ok' : 'is-no') : ''}`}
            key={idx}
            style={{ '--subject': meta.color }}
          >
            <div className="q-top">
              <span className="q-subject">
                <span className="q-icon">{meta.icon}</span>
                {meta.label}
                {q.unit && <small className="q-unit">{q.unit}</small>}
              </span>
              {combo >= 2 && (
                <span className="combo" key={combo}>
                  {combo >= 3 ? '🔥' : '✦'} {combo}연속!
                </span>
              )}
            </div>
            {q.sub && <p className="q-sub">{q.sub}</p>}
            <h2 className={`q-prompt ${q.big ? 'is-big' : ''}`}>
              <RichText text={q.prompt} />
            </h2>
            {q.hint && !feedback && <p className="q-hint">💡 {q.hint}</p>}

            {q.kind === 'choice' && (
              <div className={`choices ${q.choices.length > 2 ? 'grid' : ''} ${q.choices.some((c) => c.length > 9) ? 'long' : ''}`}>
                {q.choices.map((c, i) => (
                  <button
                    key={i}
                    className={`choice ${choiceState(i === q.answer, i === feedback?.picked)}`}
                    onClick={(e) => answer(i, e.currentTarget)}
                    disabled={!!feedback}
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <span className="choice-key">{i + 1}</span>
                    <span className="choice-text">
                      <RichText text={c} />
                    </span>
                  </button>
                ))}
              </div>
            )}
            {q.kind === 'ox' && (
              <div className="choices ox">
                {[true, false].map((v, i) => (
                  <button
                    key={String(v)}
                    className={`choice ox-btn ${v ? 'is-o' : 'is-x'} ${choiceState(v === q.answer, v === feedback?.picked)}`}
                    onClick={(e) => answer(v, e.currentTarget)}
                    disabled={!!feedback}
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    {v ? 'O' : 'X'}
                  </button>
                ))}
              </div>
            )}
            {q.kind === 'number' && (
              <div className="num-answer">
                <div className={`num-display ${feedback ? (feedback.ok ? 'ok' : 'no') : ''}`} aria-live="polite">
                  {num || <span className="num-ph">답을 눌러요</span>}
                  {!feedback && num && <span className="caret" />}
                </div>
                <div className="keypad">
                  {KEYPAD.map((k) => (
                    <button key={k} className={`key ${k === '⌫' ? 'key-back' : ''}`} onClick={() => pressKey(k)} disabled={!!feedback}>
                      {k}
                    </button>
                  ))}
                </div>
                {!feedback && (
                  <button className="btn btn-primary btn-block num-submit" disabled={!num} onClick={(e) => answer(num, e.currentTarget)}>
                    확인
                  </button>
                )}
              </div>
            )}

            {feedback && (
              <div className={`feedback ${feedback.ok ? 'ok' : 'no'}`} role="status">
                <div>
                  <p className="fb-title">{feedback.ok ? feedback.cheer : '괜찮아요, 다시 보면 돼요'}</p>
                  {!feedback.ok && (
                    <p className="fb-answer">
                      정답은 <b><RichText text={correctLabel()} /></b>
                      {q.explain && <span className="explain">{q.explain}</span>}
                    </p>
                  )}
                </div>
                <button className="btn btn-primary fb-next" onClick={next}>
                  {idx + 1 < questions.length ? '다음 →' : '결과 보기 ✦'}
                </button>
              </div>
            )}
          </article>
        )}
      </div>
      {burst && <Burst key={burst.id} x={burst.x} y={burst.y} label="+1 별 조각" />}
    </div>
  );
}
