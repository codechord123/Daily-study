import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { buildDailyMission, buildPractice, isCorrect } from '../engine/dailyMission';
import { SUBJECT_META } from '../data/missions/grade5';
import RichText from './RichText';
import { sfx } from '../services/sound';
import { speak, canSpeak, stopSpeaking } from '../services/speech';

// 영어 문제에서 읽어 줄 영어: 영어가 문제에 있으면 문제, 아니면 정답 보기
const hasEn = (t) => /[a-z]/i.test(t ?? '');
// 지문의 'A:' 같은 말머리와 빈칸 밑줄은 읽지 않는다
const passageSpeech = (t) => t.replace(/^[^\n:]{1,12}:\s*/gm, '').replace(/_{2,}/g, ', ');
/** 읽어 줄 영어: 문제가 영어면 문제, 답을 맞힌 뒤엔 정답 보기, 아니면 지문 */
const englishText = (q, after = false) => {
  if (hasEn(q.prompt)) return q.prompt;
  if (after && hasEn(q.choices?.[q.answer])) return q.choices[q.answer];
  if (hasEn(q.passage)) return passageSpeech(q.passage);
  return q.choices?.[q.answer];
};

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

function Result({ correct, total, reward, practice, mode, wrongCount, reviewGain, onExit, onReview, onPractice }) {
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
      <h2 className="title result-title">
        {mode === 'review' ? (correct === total ? '오답을 모두 정복했어요!' : '조금씩 정복 중!') : correct === total ? '완벽해요!' : correct >= total * 0.7 ? '잘했어요!' : '오늘도 해냈어요!'}
      </h2>
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
      ) : mode === 'review' ? (
        <p className="result-note">{reviewGain > 0 ? `다시 맞힌 아침 미션 문제로 별가루 ✦ ${reviewGain}개를 받았어요` : '다시 맞힌 문제는 오답 노트에서 지워졌어요'}</p>
      ) : (
        practice && <p className="result-note">연습이라 별가루는 없어요. 아침 미션은 내일 다시 열려요.</p>
      )}
      <div className="result-actions">
        {wrongCount > 0 && (
          <button className="btn result-sub" onClick={onReview}>
            📒 {wrongCount > 10 ? `틀린 문제 10개 다시 풀기 (모두 ${wrongCount}개)` : `틀린 ${wrongCount}문제 다시 풀기`}
          </button>
        )}
        <button className="btn result-sub" onClick={onPractice}>
          ✏️ 과목별 연습
        </button>
      </div>
      <button className="btn btn-primary btn-block result-go" onClick={onExit}>
        내 별 꾸미러 가기 →
      </button>
    </div>
  );
}

// 오늘 아침 미션을 풀다 나가도 이어서 풀 수 있게 이 기기에 저장 (날짜가 바뀌면 무시)
const progressKey = (sid) => `ds:progress:${sid}:${todayKey()}`;
export function loadProgress(sid) {
  try {
    const v = JSON.parse(localStorage.getItem(progressKey(sid)) ?? 'null');
    return Array.isArray(v?.results) ? v : null;
  } catch {
    return null;
  }
}
function saveProgress(sid, results) {
  try {
    if (results) localStorage.setItem(progressKey(sid), JSON.stringify({ results }));
    else localStorage.removeItem(progressKey(sid));
  } catch {
    /* noop */
  }
}

export default function MissionView() {
  const { profile, go, setMode, completeMission, missionDoneToday, missionMode, noteWrong, clearWrong, startMission } = useGame();
  const { setMission, missionFx, openSheet } = useUI();
  const mode = missionMode?.type ?? 'daily';
  // 오늘 미션을 이미 했으면 다시 푸는 것은 연습
  const practice = useMemo(() => mode !== 'daily' || missionDoneToday(), [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(() => {
    if (mode === 'review') return (profile.wrongNotes ?? []).filter((n) => !n.cleared).slice(-10).map((n, i) => ({ ...n.q, id: i, noteSource: n.source }));
    if (mode === 'practice') return buildPractice(missionMode.subject, `${profile.sid}:${Date.now()}`, todayKey());
    return buildDailyMission(profile.sid, todayKey());
  }, [mode, missionMode, profile.sid]); // eslint-disable-line react-hooks/exhaustive-deps
  const [reviewGain, setReviewGain] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const saved = useMemo(() => (mode === 'daily' && !practice ? loadProgress(profile.sid) : null), []); // eslint-disable-line react-hooks/exhaustive-deps
  const resumeAt = saved ? Math.min(saved.results.length, questions.length - 1) : 0;
  const [idx, setIdx] = useState(resumeAt);
  const [results, setResults] = useState(() => (saved ? saved.results.slice(0, resumeAt) : []));
  const [feedback, setFeedback] = useState(null); // { ok, picked, cheer }
  const [num, setNum] = useState('');
  const [burst, setBurst] = useState(null);
  const [reward, setReward] = useState(null);
  const [finished, setFinished] = useState(false);
  const cardRef = useRef();

  const q = questions[idx];
  const meta = SUBJECT_META[q?.subject] ?? SUBJECT_META.math;
  const combo = useMemo(() => {
    let c = 0;
    for (let i = results.length - 1; i >= 0 && results[i]; i--) c++;
    return c;
  }, [results]);

  useEffect(() => {
    if (q?.subject === 'english' && /[a-z]/i.test(q.prompt)) {
      const t = setTimeout(() => speak(q.prompt), 450);
      return () => clearTimeout(t);
    }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => stopSpeaking, []);

  // 3D 장면에 미션 시작·종료 알림
  useEffect(() => {
    setMission({ results, total: questions.length, fx: null });
    if (saved?.results.length) useUI.getState().showToast(`지난번에 이어서 ${resumeAt + 1}번부터 풀어요`);
    return () => setMission({ results: [], total: 0, fx: null });
  }, [questions.length, setMission]);

  const answer = useCallback(
    (value, el) => {
      if (feedback || finished) return;
      const ok = isCorrect(q, value);
      const next = [...results, ok];
      setResults(next);
      setMission({ results: next });
      if (mode === 'daily' && !practice) saveProgress(profile.sid, next);
      missionFx(ok ? 'correct' : 'wrong');
      if (ok) sfx('correct', combo + 1);
      else sfx('wrong');
      setFeedback({ ok, picked: value, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
      if (q.subject === 'english') setTimeout(() => speak(englishText(q, true)), 500);
      // 오답 노트: 틀리면 적고, 오답 노트에서 다시 맞히면 지운다
      if (mode === 'review') {
        if (ok) {
          const gain = clearWrong(q.prompt);
          setReviewGain((g) => g + gain);
        }
      } else if (!ok) {
        noteWrong(q, mode === 'daily' && !practice ? 'daily' : 'practice');
      }
      if (ok) {
        const r = (el ?? cardRef.current)?.getBoundingClientRect();
        if (r) setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2, id: performance.now() });
      }
    },
    [feedback, finished, q, results, combo, setMission, missionFx, mode, practice, clearWrong, noteWrong],
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
    if (!practice) {
      // 과목별 맞힌 수 / 문제 수
      const subjects = {};
      questions.forEach((qq, i) => {
        const t = (subjects[qq.subject] ??= [0, 0]);
        t[1] += 1;
        if (results[i]) t[0] += 1;
      });
      setReward(completeMission({ correct, total: questions.length, subjects }));
      saveProgress(profile.sid, null);
    }
    setWrongCount((useGame.getState().profile.wrongNotes ?? []).filter((n) => !n.cleared).length);
    missionFx('complete');
    setFinished(true);
  }, [idx, questions, results, practice, completeMission, missionFx]);

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
    if (finished || !q) return;
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

  if (!questions.length)
    return (
      <div className="mission">
        <div className="mission-stage">
          <div className="mission-result">
            <h2 className="title result-title">오답 노트가 비어 있어요</h2>
            <p className="result-score">아침 미션에서 틀린 문제가 생기면 여기서 다시 풀 수 있어요.</p>
            <button className="btn btn-primary btn-block" onClick={() => go('home')}>내 별로 돌아가기</button>
          </div>
        </div>
      </div>
    );

  return (
    <div className={`mission ${finished ? 'is-finished' : ''}`}>
      <header className="mission-head">
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => {
            if (mode === 'daily' && !practice && !finished && results.length) useUI.getState().showToast(`${results.length}문제까지 저장했어요. 다음에 이어서 풀어요`);
            go('home');
          }}
          aria-label="나가기"
        >
          ✕
        </button>
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
          {mode === 'review' ? <em>오답 노트 </em> : mode === 'practice' ? <em>{SUBJECT_META[missionMode.subject]?.label} 연습 </em> : practice && <em>연습 </em>}
          {Math.min(idx + 1, questions.length)}<small>/{questions.length}</small>
        </span>
      </header>

      <div className="mission-stage" data-nosfx>
        {finished ? (
          <Result
            correct={results.filter(Boolean).length}
            total={questions.length}
            reward={reward}
            practice={practice}
            mode={mode}
            wrongCount={mode === 'review' ? 0 : wrongCount}
            reviewGain={reviewGain}
            onExit={exit}
            onReview={() => startMission({ type: 'review', at: Date.now() })}
            onPractice={() => {
              go('home');
              openSheet('records');
            }}
          />
        ) : (
          <article
            ref={cardRef}
            className={`q-card page-in ${feedback ? (feedback.ok ? 'is-ok' : 'is-no') : ''} ${q.subject === 'english' && canSpeak() ? 'has-speak' : ''}`}
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
            {q.subject === 'english' && canSpeak() && (hasEn(q.prompt) || hasEn(q.passage) || feedback) && (
              <button className="speak-btn" data-nosfx onClick={() => speak(englishText(q, !!feedback))} aria-label="영어 듣기">
                🔊 듣기
              </button>
            )}
            {q.passage && <blockquote className="q-passage">{q.passage}</blockquote>}
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
                      {(q.explain || q.hint) && <span className="explain">💡 {q.explain || q.hint}</span>}
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
