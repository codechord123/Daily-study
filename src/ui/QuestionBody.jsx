// 문제 카드 안쪽: 그림·지문·문제 문장을 문제 종류에 맞는 모양으로 그린다.
//  - 문제 문장: 상황 설명(작게) / 지시(꼬리표) / 묻는 말(크게)로 나누고, □는 보기를 고르면 채워지는 빈칸
//  - 지문: 대화는 말풍선, ㉠·①·보기는 '보기' 상자, 『』 사료는 한지, 나머지는 줄 공책
import { useState } from 'react';
import { createPortal } from 'react-dom';
import RichText from './RichText';
import { useEscape } from './useEscape';

const INSTRUCTION = /(써넣으세요|써 넣으세요|고르시오|고르세요|골라 보세요|쓰시오|써 보세요|쓰세요|구하세요|구해 보세요|구하시오|답하세요|답하시오|표 하세요|표를 하세요|표 하시오|표를 하시오|계산해 보세요|이으시오|이으세요)\.?$/;

/** 문제 문장 → { context: [], instruction: [], question } */
export function splitPrompt(text) {
  const raw = String(text ?? '');
  if (!/[가-힣]/.test(raw)) return { context: [], instruction: [], question: raw };
  const parts = raw
    .split('\n')
    .flatMap((l) => l.split(/(?<=[.?!])\s+(?=\S)/))
    .map((s) => s.replace(/^※\s*/, '').trim())
    .filter(Boolean);
  if (parts.length < 2) return { context: [], instruction: [], question: raw.trim() };
  // 묻는 말: 마지막 문장 (단, □ 빈칸이 있는 문장이 앞에 있고 뒤가 지시뿐이면 그 문장)
  let qi = parts.length - 1;
  const bi = parts.findLastIndex((p) => p.includes('□') && !INSTRUCTION.test(p));
  if (bi >= 0 && parts.slice(bi + 1).every((p) => INSTRUCTION.test(p))) qi = bi;
  const question = parts.splice(qi, 1)[0];
  const context = [];
  const instruction = [];
  for (const p of parts) (INSTRUCTION.test(p) ? instruction : context).push(p);
  return { context, instruction, question };
}

// 빈칸에 넣을 말: '변 □' 앞에 '변'이 있으면 보기 '변 ㅅㅇ'에서 겹치는 '변'을 뺀다
function fillText(before, value) {
  if (value == null || value === '') return '';
  const v = String(value);
  const tok = before.match(/(\S+)\s*$/)?.[1];
  return tok && v.startsWith(`${tok} `) ? v.slice(tok.length + 1) : v;
}

/** 묻는 말: □가 하나면 고르는 보기·입력한 수가 채워지는 칸으로 */
function Question({ text, fill, fillState, big }) {
  const blanks = text.split('□').length - 1;
  const cls = `q-prompt ${big ? 'is-big' : ''}`;
  if (blanks !== 1) {
    // 빈칸이 여럿이면 칸 모양만
    return (
      <h2 className={cls}>
        {text.split('□').map((s, i) => (
          <span key={i}>
            <RichText text={s} neg />
            {i < blanks && <span className="blank" />}
          </span>
        ))}
      </h2>
    );
  }
  const [before, after] = text.split('□');
  const shown = fillText(before, fill);
  return (
    <h2 className={cls}>
      <RichText text={before} neg />
      <span className={`blank ${shown ? 'filled' : ''} ${fillState ?? ''}`} key={`${shown}-${fillState}`}>
        {shown ? <RichText text={shown} /> : ' '}
      </span>
      <RichText text={after} neg />
    </h2>
  );
}

export function Prompt({ q, fill, fillState }) {
  const { context, instruction, question } = splitPrompt(q.prompt);
  return (
    <div className="q-ask">
      {context.map((c, i) => (
        <p key={i} className="q-context">
          <RichText text={c} />
        </p>
      ))}
      {instruction.map((c, i) => (
        <p key={i} className="q-instruction">
          <RichText text={c} neg />
        </p>
      ))}
      <Question text={question} fill={fill} fillState={fillState} big={q.big} />
    </div>
  );
}

/* ---------- 지문 ---------- */
const SPEAKER = /^\s*([^\s:：]{1,10})\s*[:：]\s*(.*)$/;
const MARK = /^\s*[㉠-㉿①-⑳ⓐ-ⓩ]/; // ㉠㉮ ①② ⓐⓑ

export function passageKind(text) {
  const lines = String(text).split('\n').filter((l) => l.trim());
  if (/^\s*<?보\s*기>?\s*[:：]?/.test(lines[0] ?? '') || (lines.length >= 2 && lines.filter((l) => MARK.test(l)).length >= 2)) return 'bogi';
  if (lines.length >= 2 && lines.filter((l) => SPEAKER.test(l)).length / lines.length >= 0.6) return 'dialog';
  if (/^\s*-\s*\S.*-\s*$/m.test(text) || (/『/.test(text) && String(text).length > 80)) return 'source'; // '- 고경명, 『제봉집』 -' 같은 출처가 있는 옛 글
  return 'prose';
}

function Dialog({ text }) {
  const lines = String(text).split('\n').filter((l) => l.trim());
  const order = [];
  return (
    <div className="pass pass-dialog">
      {lines.map((l, i) => {
        const m = l.match(SPEAKER);
        if (!m) return <p key={i} className="pass-note"><RichText text={l} /></p>;
        const who = m[1];
        if (!order.includes(who)) order.push(who);
        const right = order.indexOf(who) % 2 === 1;
        return (
          <div key={i} className={`bubble-row ${right ? 'right' : ''}`}>
            <span className="bubble-who">{who}</span>
            <p className="bubble">
              <RichText text={m[2] || ' '} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function Passage({ text }) {
  const kind = passageKind(text);
  if (kind === 'dialog') return <Dialog text={text} />;
  if (kind === 'bogi') {
    const body = String(text).replace(/^\s*<?보\s*기>?\s*[:：]?\s*/, '');
    return (
      <div className="pass pass-bogi">
        <span className="bogi-label">보기</span>
        <RichText text={body} />
      </div>
    );
  }
  return (
    <blockquote className={`pass pass-${kind}`}>
      <RichText text={text} />
    </blockquote>
  );
}

/* ---------- 그림: 누르면 크게 ---------- */
export function Figure({ src }) {
  const [zoom, setZoom] = useState(false);
  useEscape(() => setZoom(false), zoom);
  return (
    <>
      <button type="button" className="q-figure" onClick={() => setZoom(true)} aria-label="그림 크게 보기">
        <img src={src} alt="문제 그림" />
        <span className="zoom-chip">🔍 크게</span>
      </button>
      {/* 카드가 커져(zoom) 있어도 크게 보기는 화면 기준으로 */}
      {zoom &&
        createPortal(
          <div className="q-zoom" onClick={() => setZoom(false)} role="dialog" aria-label="크게 본 그림">
            <img src={src} alt="문제 그림 크게" />
            <span className="zoom-close">눌러서 닫기</span>
          </div>,
          document.body,
        )}
    </>
  );
}
