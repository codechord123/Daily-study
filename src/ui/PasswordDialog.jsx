import { useState } from 'react';
import { changePassword, authMessage } from '../services/cloud';
import { useEscape } from './useEscape';

// 학생 비밀번호 바꾸기 (지금 비밀번호를 알 때). 잊었으면 선생님의 '다시 가입 허용'
export default function PasswordDialog({ onClose }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEscape(onClose, true);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 6) return setErr('새 비밀번호는 6글자 이상이어야 해요');
    if (next !== next2) return setErr('새 비밀번호 두 개가 달라요');
    setBusy(true);
    setErr('');
    try {
      await changePassword(cur, next);
      setDone(true);
    } catch (e2) {
      setErr(e2?.code ? (/wrong-password|invalid-credential|invalid-login/.test(e2.code) ? '지금 비밀번호가 맞지 않아요' : authMessage(e2)) : e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pw-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      {done ? (
        <div className="panel login-card pw-dialog rise">
          <p className="pick-title title">비밀번호를 바꿨어요</p>
          <p className="field-hint">다음부터 새 비밀번호로 들어와요. 잊지 않게 공책에 적어 두세요</p>
          <button className="btn btn-primary btn-block" onClick={onClose}>확인</button>
        </div>
      ) : (
        <form className="panel login-card pw-dialog rise" onSubmit={submit}>
          <p className="pick-title title">🔑 비밀번호 바꾸기</p>
          <label className="field-label" htmlFor="pw-cur">지금 비밀번호</label>
          <input id="pw-cur" className="code-input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" autoFocus />
          <label className="field-label" htmlFor="pw-new">새 비밀번호 (6글자 이상)</label>
          <input id="pw-new" className="code-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <label className="field-label" htmlFor="pw-new2">새 비밀번호 한 번 더</label>
          <input id="pw-new2" className="code-input" type="password" value={next2} onChange={(e) => setNext2(e.target.value)} autoComplete="new-password" />
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={!cur || !next || !next2 || busy}>
            {busy ? '바꾸는 중…' : '바꾸기'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>닫기</button>
        </form>
      )}
    </div>
  );
}
