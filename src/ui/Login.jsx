import { useState } from 'react';
import { ROSTER, SAMPLE_CLASS } from '../data/classroom';
import { useGame } from '../store/useGame';
import { loadProfile } from '../store/profileStore';

// 샘플 로그인: 학급 코드 → 내 번호. (나중에 Google/쎈에듀 로그인으로 교체)
export default function Login() {
  const login = useGame((s) => s.login);
  const [code, setCode] = useState('');
  const [step, setStep] = useState('code');
  const [err, setErr] = useState('');

  const submitCode = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === SAMPLE_CLASS.code) {
      setStep('pick');
      setErr('');
    } else setErr('학급 코드를 다시 확인해 주세요');
  };

  return (
    <div className="login">
      <header className="login-head rise">
        <p className="login-kicker">매일 아침, 나만의 별을 키워요</p>
        <h1 className="title login-title">나의 작은 별</h1>
      </header>

      {step === 'code' ? (
        <form className="panel login-card rise" onSubmit={submitCode} style={{ animationDelay: '120ms' }}>
          <label className="field-label" htmlFor="code">학급 코드</label>
          <input
            id="code"
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="STAR5"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={8}
          />
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={!code}>
            들어가기
          </button>
          <p className="field-hint">샘플 학급 코드는 <b>STAR5</b> 예요</p>
        </form>
      ) : (
        <div className="panel login-card login-pick rise">
          <div className="pick-head">
            <button className="btn btn-icon btn-ghost" onClick={() => setStep('code')} aria-label="뒤로">←</button>
            <div>
              <p className="field-label">{SAMPLE_CLASS.name}</p>
              <p className="pick-title title">내 번호를 눌러요</p>
            </div>
          </div>
          <div className="roster">
            {ROSTER.map((s) => {
              const has = !!loadProfile(s.id);
              return (
                <button key={s.id} className={`roster-btn ${has ? 'has-star' : ''}`} onClick={() => login(s.id)}>
                  <span className="roster-num">{s.number}</span>
                  <span className="roster-nick">{s.nickname}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
