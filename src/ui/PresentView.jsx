// 선생님 · 수업 화면 띄우기: 많이 틀린 문제를 칠판(TV)에 크게 띄워 함께 풀이한다
// ←/→ 다음 문제, Space 정답 보기, Esc 닫기
import { useEffect, useState } from 'react';
import { SUBJECT_META } from '../data/missions/grade5';
import { Prompt, Passage, Figure } from './QuestionBody';
import RichText from './RichText';

const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const isImg = (c) => typeof c === 'string' && c.startsWith('img:');

export default function PresentView({ items, start = 0, onClose }) {
  const [i, setI] = useState(start);
  const [show, setShow] = useState(false);
  const it = items[i];
  const q = it?.q;
  const move = (d) => {
    setI((x) => Math.max(0, Math.min(items.length - 1, x + d)));
    setShow(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') move(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') move(-1);
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShow((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 전체 화면으로 (지원하는 브라우저만)
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  if (!q) return null;
  const meta = SUBJECT_META[q.subject] ?? SUBJECT_META.math;
  // 수로 답하는 문제의 단위 '(cm)'는 문장에서 떼어 답 칸 옆에 (학생 화면과 같게)
  const unitMatch = q.kind === 'number' ? String(q.prompt).match(/\s*\(([^()\d]{1,6})\)\s*$/) : null;
  const unit = unitMatch?.[1] ?? '';
  const viewQ = unitMatch ? { ...q, prompt: q.prompt.slice(0, unitMatch.index) } : q;
  const answerText = q.kind === 'ox' ? (q.answer ? 'O' : 'X') : q.kind === 'number' || q.kind === 'text' ? String(q.answer) : null;
  // 우리 반 학생들이 고른 오답 (보기 글자로 모은 것)
  const picks = it.picks ?? {};
  const pickTotal = Object.values(picks).reduce((a, b) => a + b, 0);
  const pickOf = (label) => picks[label] ?? 0;
  const topWrong = Object.entries(picks).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="present" role="dialog" aria-label="수업 화면">
      <header className="present-head">
        <span className="present-count">
          {i + 1} / {items.length}
        </span>
        {it.rate != null && (
          <span className="present-rate">
            우리 반 오답률 <b>{it.rate}%</b> <small>({it.who}명이 틀렸어요)</small>
          </span>
        )}
        <button className="btn" onClick={onClose}>닫기 ✕</button>
      </header>

      <article className={`q-card present-card ${show ? 'is-ok' : ''} ${q.image || q.svg || q.passage ? 'is-wide' : ''}`} data-subject={q.subject} style={{ '--subject': meta.color }} key={i}>
        <div className="q-top">
          <span className="q-subject">
            <span className="q-icon">{meta.icon}</span>
            {meta.label}
            {q.unitTitle && <small className="q-unit">{q.unitTitle}</small>}
          </span>
          {q.std && <span className="present-std">{q.std}</span>}
        </div>
        <div className="q-layout">
          {(q.image || q.svg || q.passage) && (
            <div className="q-media">
              {(q.image || q.svg) && <Figure src={q.image ?? svgUrl(q.svg)} />}
              {q.passage && <Passage text={q.passage} />}
            </div>
          )}
          <div className="q-main">
            {q.sub && <p className={`q-sub ${/않은|아닌|틀린|없는|잘못된/.test(q.sub) ? 'is-neg' : ''}`}><RichText text={q.sub} neg /></p>}
            <Prompt q={viewQ} fill={show && q.kind === 'choice' && !isImg(q.choices[q.answer]) ? q.choices[q.answer] : show ? answerText : null} fillState={show ? 'is-right' : 'is-preview'} />
            {q.kind === 'choice' && (
              <div className={`choices ${q.choices.length > 2 ? 'grid' : ''} ${q.choices.some((c) => c.length > 9) ? 'long' : ''}`}>
                {q.choices.map((c, k) => (
                  <div key={k} className={`choice ${show ? (k === q.answer ? 'right' : 'dim') : ''}`}>
                    <span className="choice-key" aria-hidden="true">{'①②③④⑤⑥'[k]}</span>
                    <span className="choice-text">{isImg(c) ? <img className="choice-img" src={c.slice(4)} alt={`${k + 1}번 그림`} /> : <RichText text={c} />}</span>
                    {show && k !== q.answer && pickOf(c) > 0 && (
                      <span className="pick-bar" style={{ '--w': `${Math.round((pickOf(c) / pickTotal) * 100)}%` }}>
                        <i /> {pickOf(c)}명
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {q.kind === 'ox' && (
              <div className="choices ox">
                {[true, false].map((v) => (
                  <div key={String(v)} className={`choice ox-btn ${v ? 'is-o' : 'is-x'} ${show ? (v === q.answer ? 'right' : 'dim') : ''}`}>
                    {v ? 'O' : 'X'}
                  </div>
                ))}
              </div>
            )}
            {(q.kind === 'number' || q.kind === 'text') && !show && <p className="present-num">답: ( &nbsp; &nbsp; &nbsp; ) {unit}</p>}
            {show && (
              <div className="feedback ok" role="status">
                <div>
                  <p className="fb-title">정답 {answerText ?? `${q.answer + 1}번`}{answerText && unit ? ` ${unit}` : ''}</p>
                  {q.explain && <p className="fb-answer"><span className="explain">💡 <RichText text={q.explain} /></span></p>}
                  {q.kind !== 'choice' && topWrong && (
                    <p className="fb-answer">
                      <span className="explain">가장 많이 쓴 오답: <b>{topWrong[0]}</b> ({topWrong[1]}번)</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      <footer className="present-foot">
        <button className="btn" onClick={() => move(-1)} disabled={i === 0}>← 이전</button>
        <button className="btn btn-primary" onClick={() => setShow((s) => !s)}>{show ? '정답 숨기기' : '정답 보기'}</button>
        <button className="btn" onClick={() => move(1)} disabled={i === items.length - 1}>다음 →</button>
      </footer>
    </div>
  );
}
