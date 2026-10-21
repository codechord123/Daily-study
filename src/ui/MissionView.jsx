import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, todayKey } from '../store/useGame';
import { useUI } from '../store/useUI';
import { buildDailyMission, buildPractice, isCorrect } from '../engine/dailyMission';
import { SUBJECT_META } from '../data/missions/grade5';
import RichText from './RichText';
import { Prompt, Passage, Figure } from './QuestionBody';
import { sfx } from '../services/sound';
import { speak, canSpeak, stopSpeaking } from '../services/speech';
import { playClip, stopClip } from '../services/enAudio';
import { englishSource } from '../services/enClips';
import { recordAnswer, markConfused, reportQuestion, REPORT_REASONS, dueReviews } from '../store/learnStore';
import { QUEST_BY_ID, PRINCE_REWARD } from '../data/prince';
import { ITEM_BY_ID } from '../data/items';

// 영어 문제에서 읽어 줄 영어: 영어가 문제에 있으면 문제, 아니면 정답 보기
const hasEn = (t) => /[a-z]/i.test(t ?? '');
// 학습지 그림: 'ws/…png' 경로, 보기는 'img:ws/…png'
const isImg = (c) => typeof c === 'string' && c.startsWith('img:');
// 문제 은행에 직접 그린 그림(svg 글자)을 그림 주소로
const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
// 지문의 'A:' 같은 말머리와 빈칸 밑줄은 읽지 않는다
const passageSpeech = (t) => t.replace(/^[^\n:]{1,12}:\s*/gm, '').replace(/_{2,}/g, ', ');
/** 읽어 줄 영어: 문제가 영어면 문제, 답을 맞힌 뒤엔 정답 보기, 아니면 지문 */
const englishText = (q, after = false) => {
  // 답을 낸 뒤에는 영어로 된 정답 보기를 읽어 준다
  if (after && hasEn(q.choices?.[q.answer])) return q.choices[q.answer];
  // 대화 지문은 처음부터 끝까지 (빈칸은 잠깐 쉼)
  if (hasEn(q.passage)) return passageSpeech(q.passage);
  if (q.say) return q.say; // 문제마다 정해 둔 '읽어 줄 문장'
  if (hasEn(q.prompt)) return q.prompt;
  return q.choices?.[q.answer];
};

// 국어·사회·과학은 우리말로 읽어 준다 (지문 → 문제 → 보기)
// 영어 듣기: 미리 만든 소리 파일이 있으면 그것을, 없으면 기기 음성으로
const sayEnglish = (q, after = false) => {
  stopSpeaking();
  const tts = () => speak(englishText(q, after));
  if (!playClip(englishSource(q, after), tts)) {
    stopClip();
    tts();
  }
};

const KO_READ = new Set(['korean', 'social', 'science']);
const koreanText = (q) =>
  [q.passage, q.sub, q.prompt, ...(q.kind === 'choice' ? q.choices.map((c, i) => (isImg(c) ? '' : `${i + 1}번, ${c}`)) : q.kind === 'ox' ? ['오, 엑스로 답해요'] : [])]
    .filter(Boolean)
    .join('\n');

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

// 어린 왕자의 부탁을 다 들어준 뒤: 고마움의 말과 한정 선물
function PrinceResult({ quest, gain, onExit }) {
  useEffect(() => {
    const t = setTimeout(() => sfx('buy'), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mission-result prince-result">
      <div className="prince-face big" aria-hidden>
        <PrinceFace />
      </div>
      <h2 className="title result-title">고마워, 친구야!</h2>
      <p className="prince-say">{quest.outro}</p>
      <div className="reward panel">
        <div className="reward-row"><span>🎁 선물</span><b>{ITEM_BY_ID[quest.gift]?.name}</b></div>
        <div className="reward-row"><span>✦ 별가루</span><b>+{gain}</b></div>
        <p className="result-note small">선물은 꾸미기 → 가방에 들어 있어요</p>
      </div>
      <button className="btn btn-primary btn-block result-go" onClick={onExit}>
        내 별에 선물 놓으러 가기 →
      </button>
    </div>
  );
}

/** 어린 왕자 얼굴 (앱 그림으로 새로 그림: 금빛 머리, 초록 코트, 노란 목도리) */
export function PrinceFace() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="48" fill="#1d2462" />
      <path d="M22 96 Q50 62 78 96 Z" fill="#5fae7a" />
      <path d="M36 70 Q50 78 64 70 L72 74 Q60 86 50 84 Q40 86 28 74 Z" fill="#ffd76a" />
      <path d="M62 74 Q78 72 88 60 Q80 78 66 80 Z" fill="#ffd76a" />
      <circle cx="50" cy="48" r="22" fill="#f8e3cf" />
      <path d="M28 44 L32 26 L38 36 L42 20 L48 33 L53 18 L57 32 L63 20 L66 35 L72 26 L72 44 Q50 32 28 44 Z" fill="#f5cf6a" />
      <circle cx="42" cy="50" r="2.6" fill="#2b2338" />
      <circle cx="58" cy="50" r="2.6" fill="#2b2338" />
      <circle cx="37" cy="56" r="3.4" fill="#ff9fb4" opacity=".55" />
      <circle cx="63" cy="56" r="3.4" fill="#ff9fb4" opacity=".55" />
      <path d="M45 59 Q50 63 55 59" stroke="#2b2338" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
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
          <RewardRow label="맞힌 별 조각" value={reward.base} delay={500} />
          <RewardRow label="끝까지 풀기" value={(reward.effort ?? 0) + reward.finish} delay={650} />
          <RewardRow label={`🔥 ${reward.streak}일 연속`} value={reward.streakBonus} delay={800} />
          {reward.fixBonus > 0 && <RewardRow label={`🔁 다시 맞힌 문제 ${reward.fixed}개`} value={reward.fixBonus} delay={950} />}
          {reward.weekBonus > 0 && <RewardRow label="📅 이번 주 5일 개근" value={reward.weekBonus} delay={1100} />}
          <div className="reward-total">
            <span>받은 별가루</span>
            <b className={totalV === reward.total ? 'done' : ''}>
              <span className="star-ico" aria-hidden />
              {totalV}
            </b>
          </div>
          {reward.capped && <p className="result-note small">오늘 받을 수 있는 별가루를 다 받았어요</p>}
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
// 오늘 문제 목록도 함께 저장한다 (다시 보기·난이도는 푸는 동안 바뀌므로 다시 만들면 순서가 달라진다)
function saveProgress(sid, results, questions) {
  try {
    if (results) localStorage.setItem(progressKey(sid), JSON.stringify({ results, questions: questions ?? loadProgress(sid)?.questions }));
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
  const saved = useMemo(() => (mode === 'daily' && !practice ? loadProgress(profile.sid) : null), []); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = useMemo(() => {
    // 오답 노트 (과목을 고르면 그 과목만), 또는 문제 정거장의 '다시 보기' 미리 풀기
    if (mode === 'review' && missionMode.source === 'queue')
      return dueReviews(profile.sid, 10).filter((e) => !missionMode.subject || e.q.subject === missionMode.subject).map((e, i) => ({ ...e.q, id: i, review: true }));
    if (mode === 'review')
      return (profile.wrongNotes ?? [])
        .filter((n) => !n.cleared && (!missionMode.subject || n.q.subject === missionMode.subject))
        .slice(-10)
        .map((n, i) => ({ ...n.q, id: i, noteSource: n.source }));
    if (mode === 'practice') return buildPractice(missionMode.subject, `${profile.sid}:${Date.now()}`, todayKey());
    if (mode === 'prince') return missionMode.questions ?? [];
    if (saved?.questions?.length) return saved.questions;
    const qs = buildDailyMission(profile.sid, todayKey(), { adaptive: true });
    if (!practice) saveProgress(profile.sid, [], qs);
    return qs;
  }, [mode, missionMode, profile.sid]); // eslint-disable-line react-hooks/exhaustive-deps
  const [reviewGain, setReviewGain] = useState(0);
  const [princeGain, setPrinceGain] = useState(0);
  const quest = mode === 'prince' ? QUEST_BY_ID[missionMode.questId] : null;
  const [wrongCount, setWrongCount] = useState(0);
  const resumeAt = saved ? Math.min(saved.results.length, questions.length - 1) : 0;
  const [idx, setIdx] = useState(resumeAt);
  const [results, setResults] = useState(() => (saved ? saved.results.slice(0, resumeAt) : []));
  const [feedback, setFeedback] = useState(null); // { ok, picked, cheer }
  const [num, setNum] = useState('');
  const [hover, setHover] = useState(null); // 마우스를 올린 보기 → 빈칸 미리 보기
  const [burst, setBurst] = useState(null);
  const [reward, setReward] = useState(null);
  const [finished, setFinished] = useState(false);
  const [confused, setConfused] = useState(false); // 맞혔지만 헷갈렸어요
  const [showHint, setShowHint] = useState(false);
  const [reporting, setReporting] = useState(false); // '이상해요' 이유 고르는 중
  const [reported, setReported] = useState(false);
  const cardRef = useRef();

  const q = questions[idx];
  const meta = SUBJECT_META[q?.subject] ?? SUBJECT_META.math;
  const combo = useMemo(() => {
    let c = 0;
    for (let i = results.length - 1; i >= 0 && results[i]; i--) c++;
    return c;
  }, [results]);

  useEffect(() => {
    if (q?.subject === 'english' && (q.say || hasEn(q.prompt) || hasEn(q.passage))) {
      const t = setTimeout(() => sayEnglish(q), 450);
      return () => clearTimeout(t);
    }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      stopSpeaking();
      stopClip();
    },
    [],
  );

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
      // 학습 기록: 성취기준별 정답, 틀린 문제는 1·3·7일 뒤 다시
      recordAnswer(profile.sid, q, ok, value);
      missionFx(ok ? 'correct' : 'wrong');
      if (ok) sfx('correct', combo + 1);
      else sfx('wrong');
      setFeedback({ ok, picked: value, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
      // 휴대폰: 카드가 길어 정답 안내가 화면 밖이면 보이는 곳까지 내려 준다
      setTimeout(() => document.querySelector('.q-card .feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
      if (q.subject === 'english') setTimeout(() => sayEnglish(q, true), 500);
      // 오답 노트: 틀리면 적고, 오답 노트에서 다시 맞히면 지운다
      if (mode === 'review') {
        if (ok) {
          const gain = clearWrong(q);
          setReviewGain((g) => g + gain);
        }
      } else if (!ok) {
        noteWrong(q, mode === 'daily' && !practice ? 'daily' : 'practice');
      } else if (q.review) {
        clearWrong(q, { reward: false }); // 다시 보기로 맞힌 문제는 오답 노트에서도 지운다 (보상은 미션 결과에서)
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
    setHover(null);
    setConfused(false);
    setShowHint(false);
    setReporting(false);
    setReported(false);
    document.activeElement?.blur?.(); // 앞 문제에서 누른 버튼의 포커스가 다음 문제에 남지 않게
    setBurst(null);
    if (idx + 1 < questions.length) {
      sfx('page');
      return setIdx(idx + 1);
    }
    sfx('complete');
    const correct = results.filter(Boolean).length;
    if (mode === 'prince') {
      const quest = QUEST_BY_ID[missionMode.questId];
      setPrinceGain(useGame.getState().completePrince(quest.id, quest.gift, PRINCE_REWARD));
    } else if (!practice) {
      // 과목별 맞힌 수 / 문제 수
      const subjects = {};
      questions.forEach((qq, i) => {
        const t = (subjects[qq.subject] ??= [0, 0]);
        t[1] += 1;
        if (results[i]) t[0] += 1;
      });
      setReward(completeMission({ correct, total: questions.length, subjects, fixed: questions.filter((qq, i) => qq.review && results[i]).length }));
      saveProgress(profile.sid, null);
    }
    setWrongCount((useGame.getState().profile.wrongNotes ?? []).filter((n) => !n.cleared).length);
    missionFx('complete');
    setFinished(true);
  }, [idx, questions, results, practice, completeMission, missionFx, mode, missionMode]);

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
        if (e.isComposing) return; // 한글 입력 중인 글자를 확정하는 Enter
        e.preventDefault();
        if (feedback) return next();
        if (q.kind === 'number' && num) return answer(num, document.querySelector('.num-submit'));
        if (q.kind === 'text' && num.trim()) return answer(num.trim(), document.querySelector('.num-submit'));
        return;
      }
      if (feedback || q.kind === 'text') return;
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

  // 문제 속 □ 빈칸에 보여 줄 말: 답을 낸 뒤엔 정답, 고르기 전엔 마우스를 올린 보기나 입력 중인 수
  const plainChoice = (i) => (i != null && q?.choices && !isImg(q.choices[i]) ? q.choices[i] : null);
  const blankFill = !q
    ? null
    : feedback
      ? q.kind === 'number' || q.kind === 'text'
        ? String(q.answer)
        : q.kind === 'choice'
          ? plainChoice(q.answer)
          : null
      : q.kind === 'number' || q.kind === 'text'
        ? num
        : q.kind === 'choice'
          ? plainChoice(hover)
          : null;
  const blankState = feedback ? (feedback.ok ? 'is-right' : 'is-fix') : 'is-preview';
  // 수로 답하는 문제의 단위 '(cm)'·'(°)'는 문장에서 떼어 입력 칸 옆에 붙인다
  const unitMatch = q?.kind === 'number' ? String(q.prompt).match(/\s*\(([^()\d]{1,6})\)\s*$/) : null;
  const numUnit = unitMatch?.[1] ?? '';
  const viewQ = unitMatch ? { ...q, prompt: q.prompt.slice(0, unitMatch.index) } : q;

  const correctLabel = () => {
    if (q.kind === 'number' || q.kind === 'text') return String(q.answer);
    if (q.kind === 'ox') return q.answer ? 'O' : 'X';
    const c = q.choices[q.answer];
    return isImg(c) ? `${q.answer + 1}번 그림` : c;
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
          {mode === 'prince' ? <em>🌹 어린 왕자의 부탁 </em> : mode === 'review' ? <em>오답 노트 </em> : mode === 'practice' ? <em>{SUBJECT_META[missionMode.subject]?.label} 연습 </em> : practice && <em>연습 </em>}
          {Math.min(idx + 1, questions.length)}<small>/{questions.length}</small>
        </span>
      </header>

      <div className="mission-stage" data-nosfx>
        {finished && quest ? (
          <PrinceResult quest={quest} gain={princeGain} onExit={exit} />
        ) : finished ? (
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
              openSheet('station');
            }}
          />
        ) : (
          <article
            ref={cardRef}
            className={`q-card page-in ${feedback ? (feedback.ok ? 'is-ok' : 'is-no') : ''} ${(q.subject === 'english' || KO_READ.has(q.subject)) && canSpeak() ? 'has-speak' : ''} ${q.image || q.svg || q.passage ? 'is-wide' : ''}`}
            key={idx}
            data-subject={q.subject}
            style={{ '--subject': meta.color }}
          >
            <div className="q-top">
              <span className="q-subject">
                <span className="q-icon">{meta.icon}</span>
                {meta.label}
                {q.unit && <small className="q-unit">{q.unit}</small>}
              </span>
              {q.review && <span className="review-tag" title="예전에 틀렸거나 헷갈린 문제예요">🔁 다시 보기</span>}
              {q.assigned && <span className="review-tag" title="선생님이 골라 넣은 문제예요">📌 선생님 문제</span>}
              {combo >= 2 && (
                <span className="combo" key={combo}>
                  {combo >= 3 ? '🔥' : '✦'} {combo}연속!
                </span>
              )}
            </div>
            {quest && (
              <div className="prince-line rise" key={`pl-${idx}-${!!feedback}`}>
                <span className="prince-face" aria-hidden><PrinceFace /></span>
                <p>{feedback ? quest.steps[idx] ?? quest.steps[quest.steps.length - 1] : idx === 0 ? quest.intro[quest.intro.length - 1] : `${idx + 1}번째 수수께끼야!`}</p>
              </div>
            )}
            {q.subject === 'english' && canSpeak() && (q.say || hasEn(q.prompt) || hasEn(q.passage) || feedback) && (
              <button className="speak-btn" data-nosfx onClick={() => sayEnglish(q, !!feedback)} aria-label="영어 듣기">
                🔊 듣기
              </button>
            )}
            {KO_READ.has(q.subject) && canSpeak() && (
              <button className="speak-btn" data-nosfx onClick={() => (stopClip(), speak(koreanText(q), 'ko-KR', 1))} aria-label="문제 읽어 주기">
                🔊 읽기
              </button>
            )}
            <div className="q-layout">
              {(q.image || q.svg || q.passage) && (
                <div className="q-media">
                  {(q.image || q.svg) && <Figure src={q.image ?? svgUrl(q.svg)} />}
                  {q.passage && <Passage text={q.passage} />}
                </div>
              )}
              <div className="q-main">
            {q.sub && <p className="q-sub">{q.sub}</p>}
            <Prompt q={viewQ} fill={blankFill} fillState={blankState} />
            {/* 힌트는 바로 보이면 답을 알려 주는 셈이라, 필요한 학생만 눌러서 본다 */}
            {q.hint && !feedback && (showHint ? <p className="q-hint">💡 {q.hint}</p> : <button className="hint-btn" onClick={() => setShowHint(true)}>💡 힌트 보기</button>)}

            {q.kind === 'choice' && (
              <div className={`choices ${q.choices.length > 2 ? 'grid' : ''} ${q.choices.some((c) => c.length > 9 && !isImg(c)) ? 'long' : ''} ${q.choices.some(isImg) ? 'has-img' : ''}`}>
                {q.choices.map((c, i) => (
                  <button
                    key={`${idx}-${i}`}
                    className={`choice ${choiceState(i === q.answer, i === feedback?.picked)}`}
                    onClick={(e) => answer(i, e.currentTarget)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
                    onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                    disabled={!!feedback}
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <span className="choice-key" aria-hidden="true">{'①②③④⑤⑥'[i]}</span>
                    <span className="choice-text">
                      {isImg(c) ? <img className="choice-img" src={c.slice(4)} alt={`${i + 1}번 그림`} /> : <RichText text={c} />}
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
            {q.kind === 'text' && (
              <div className="text-answer">
                <input
                  className={`text-input ${feedback ? (feedback.ok ? 'ok' : 'no') : ''}`}
                  value={num}
                  onChange={(e) => setNum(e.target.value.slice(0, 20))}
                  disabled={!!feedback}
                  placeholder="낱말을 써요"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  lang="ko"
                  enterKeyHint="done"
                  aria-label="답 쓰기"
                />
                {!feedback && (
                  <button className="btn btn-primary num-submit" disabled={!num.trim()} onClick={(e) => answer(num.trim(), e.currentTarget)}>
                    확인
                  </button>
                )}
              </div>
            )}
            {q.kind === 'number' && (
              <div className="num-answer">
                <div className={`num-display ${feedback ? (feedback.ok ? 'ok' : 'no') : ''}`} aria-live="polite">
                  {num || <span className="num-ph">답을 눌러요</span>}
                  {!feedback && num && <span className="caret" />}
                  {numUnit && <span className="num-unit">{numUnit}</span>}
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
                <div className="fb-tools">
                  {feedback.ok && (
                    <button
                      className={`fb-tool ${confused ? 'on' : ''}`}
                      disabled={confused}
                      onClick={() => {
                        markConfused(profile.sid, q);
                        setConfused(true);
                      }}
                    >
                      {confused ? '✓ 내일 다시 볼게요' : '🤔 사실 헷갈렸어요'}
                    </button>
                  )}
                  {reported ? (
                    <span className="fb-tool on">✓ 선생님께 알렸어요</span>
                  ) : reporting ? (
                    REPORT_REASONS.map((why) => (
                      <button
                        key={why}
                        className="fb-tool"
                        onClick={() => {
                          reportQuestion(profile.sid, q, why);
                          setReported(true);
                        }}
                      >
                        {why}
                      </button>
                    ))
                  ) : (
                    <button className="fb-tool ghost" onClick={() => setReporting(true)}>
                      🚩 문제가 이상해요
                    </button>
                  )}
                </div>
              </div>
            )}
              </div>
            </div>
          </article>
        )}
      </div>
      {burst && <Burst key={burst.id} x={burst.x} y={burst.y} label="+1 별 조각" />}
    </div>
  );
}
