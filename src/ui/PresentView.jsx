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
  const answerText = q.kind === 'ox' ? (q.answer ? 'O' : 'X') : q.kind === 'number' ? String(q.answer) : null;

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

      <article className={`q-card present-card ${show ? 'is-ok' : ''} ${q.svg || q.passage ? 'is-wide' : ''}`} data-subject={q.subject} style={{ '--subject': meta.color }} key={i}>
        <div className="q-top">
          <span className="q-subject">
            <span className="q-icon">{meta.icon}</span>
            {meta.label}
            {q.unitTitle && <small className="q-unit">{q.unitTitle}</small>}
          </span>
          {q.std && <span className="present-std">{q.std}</span>}
        </div>
        <div className="q-layout">
          {(q.svg || q.passage) && (
            <div className="q-media">
              {q.svg && <Figure src={svgUrl(q.svg)} />}
              {q.passage && <Passage text={q.passage} />}
            </div>
          )}
          <div className="q-main">
            {q.sub && <p className="q-sub">{q.sub}</p>}
            <Prompt q={q} fill={show && q.kind === 'choice' && !isImg(q.choices[q.answer]) ? q.choices[q.answer] : show ? answerText : null} fillState={show ? 'is-right' : 'is-preview'} />
            {q.kind === 'choice' && (
              <div className={`choices ${q.choices.length > 2 ? 'grid' : ''} ${q.choices.some((c) => c.length > 9) ? 'long' : ''}`}>
                {q.choices.map((c, k) => (
                  <div key={k} className={`choice ${show ? (k === q.answer ? 'right' : 'dim') : ''}`}>
                    <span className="choice-key" aria-hidden="true">{'①②③④⑤⑥'[k]}</span>
                    <span className="choice-text">{isImg(c) ? <img className="choice-img" src={c.slice(4)} alt={`${k + 1}번 그림`} /> : <RichText text={c} />}</span>
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
            {q.kind === 'number' && !show && <p className="present-num">답: ( &nbsp; &nbsp; &nbsp; )</p>}
            {show && (
              <div className="feedback ok" role="status">
                <div>
                  <p className="fb-title">정답 {answerText ?? `${q.answer + 1}번`}</p>
                  {q.explain && <p className="fb-answer"><span className="explain">💡 <RichText text={q.explain} /></span></p>}
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
