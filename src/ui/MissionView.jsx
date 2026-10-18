import { useMemo, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { buildDailyMission, isCorrect } from '../engine/dailyMission';
import { SUBJECT_META } from '../data/missions/grade5';
import RichText from './RichText';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

function NumberAnswer({ onSubmit, locked }) {
  const [v, setV] = useState('');
  const press = (k) => {
    if (locked) return;
    if (k === '⌫') return setV((s) => s.slice(0, -1));
    if (k === '.' && v.includes('.')) return;
    if (v.length < 7) setV((s) => s + k);
  };
  return (
    <div className="num-answer">
      <div className="num-display" aria-live="polite">{v || <span className="num-ph">답을 눌러요</span>}</div>
      <div className="keypad">
        {KEYPAD.map((k) => (
          <button key={k} className="key" onClick={() => press(k)} disabled={locked}>
            {k}
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-block" disabled={!v || locked} onClick={() => onSubmit(v)}>
        확인
      </button>
    </div>
  );
}

function Result({ correct, total, reward, practice, onExit }) {
  return (
    <div className="mission-result rise">
      <div className="result-stars" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`rs ${i < Math.round((correct / total) * 5) ? 'on' : ''}`} style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <h2 className="title result-title">{correct === total ? '완벽해요!' : correct >= total * 0.7 ? '잘했어요!' : '오늘도 해냈어요!'}</h2>
      <p className="result-score">{total}문제 중 {correct}개 맞혔어요</p>
      {reward ? (
        <div className="reward panel">
          <div className="reward-row"><span>맞힌 문제</span><b>+{reward.base}</b></div>
          <div className="reward-row"><span>미션 완료</span><b>+{reward.finish}</b></div>
          <div className="reward-row"><span>🔥 {reward.streak}일 연속</span><b>+{reward.streakBonus}</b></div>
          <div className="reward-total"><span>별가루</span><b>✦ {reward.total}</b></div>
        </div>
      ) : (
        practice && <p className="result-note">연습 모드라 별가루는 내일 다시 받을 수 있어요</p>
      )}
      <button className="btn btn-primary btn-block" onClick={onExit}>내 별 꾸미러 가기</button>
    </div>
  );
}

export default function MissionView() {
  const { profile, go, setMode, completeMission, missionDoneToday } = useGame();
  const practice = useMemo(() => missionDoneToday(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(() => buildDailyMission(profile.sid, todayKey()), [profile.sid]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // { ok, picked }
  const [reward, setReward] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = questions[idx];
  const meta = SUBJECT_META[q?.subject];

  const answer = (value) => {
    if (feedback) return;
    const ok = isCorrect(q, value);
    setFeedback({ ok, picked: value });
    setResults((r) => [...r, ok]);
  };

  const next = () => {
    setFeedback(null);
    if (idx + 1 < questions.length) return setIdx(idx + 1);
    const correct = results.filter(Boolean).length;
    if (!practice) setReward(completeMission({ correct, total: questions.length }));
    setFinished(true);
  };

  const exit = () => {
    go('home');
    if (finished) setMode('decorate');
  };

  const correctLabel = () => {
    if (q.kind === 'number') return String(q.answer);
    if (q.kind === 'ox') return q.answer ? 'O' : 'X';
    return q.choices[q.answer];
  };

  return (
    <div className="mission">
      <header className="mission-head">
        <button className="btn btn-icon btn-ghost" onClick={() => go('home')} aria-label="나가기">✕</button>
        <div className="progress" aria-label={`${idx + 1} / ${questions.length}`}>
          {questions.map((qq, i) => (
            <span
              key={i}
              className={`pstar ${i < results.length ? (results[i] ? 'ok' : 'miss') : ''} ${i === idx && !finished ? 'now' : ''}`}
            />
          ))}
        </div>
        {practice && <span className="chip">연습</span>}
      </header>

      {finished ? (
        <Result correct={results.filter(Boolean).length} total={questions.length} reward={reward} practice={practice} onExit={exit} />
      ) : (
        <article className="q-card rise" key={idx} style={{ '--subject': meta.color }}>
          <span className="q-subject">{meta.label}</span>
          {q.sub && <p className="q-sub">{q.sub}</p>}
          <h2 className={`q-prompt ${q.big ? 'is-big' : ''}`}>
            <RichText text={q.prompt} />
          </h2>
          {q.hint && !feedback && <p className="q-hint">💡 {q.hint}</p>}

          {q.kind === 'choice' && (
            <div className={`choices ${q.choices.length > 2 ? 'grid' : ''}`}>
              {q.choices.map((c, i) => {
                const state = feedback ? (i === q.answer ? 'right' : i === feedback.picked ? 'wrong' : 'dim') : '';
                return (
                  <button key={i} className={`choice ${state}`} onClick={() => answer(i)} disabled={!!feedback}>
                    <RichText text={c} />
                  </button>
                );
              })}
            </div>
          )}
          {q.kind === 'ox' && (
            <div className="choices ox">
              {[true, false].map((v) => {
                const state = feedback ? (v === q.answer ? 'right' : v === feedback.picked ? 'wrong' : 'dim') : '';
                return (
                  <button key={String(v)} className={`choice ox-btn ${state}`} onClick={() => answer(v)} disabled={!!feedback}>
                    {v ? 'O' : 'X'}
                  </button>
                );
              })}
            </div>
          )}
          {q.kind === 'number' && <NumberAnswer key={idx} onSubmit={answer} locked={!!feedback} />}

          {feedback && (
            <div className={`feedback ${feedback.ok ? 'ok' : 'no'}`} role="status">
              <p>
                {feedback.ok ? '정답이에요! ✦' : <>정답은 <b><RichText text={correctLabel()} /></b></>}
                {q.explain && !feedback.ok && <span className="explain"> {q.explain}</span>}
              </p>
              <button className="btn btn-primary" onClick={next} autoFocus>
                {idx + 1 < questions.length ? '다음' : '결과 보기'}
              </button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
