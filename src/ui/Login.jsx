import { useState } from 'react';
import { ROSTER, SAMPLE_CLASS } from '../data/classroom';
import { useGame } from '../store/useGame';
import { loadProfile } from '../store/profileStore';
import { getSettings } from '../store/classSettings';
import { cloudEnabled, cloudReady } from '../services/cloud';
import { useEffect } from 'react';

// 샘플 로그인: 학급 코드 → 내 번호. (나중에 Google/쎈에듀 로그인으로 교체)
export default function Login() {
  const login = useGame((s) => s.login);
  const go = useGame((s) => s.go);
  const [pin, setPin] = useState('');
  // 학급 서버에 연결된 뒤에 번호를 고를 수 있다 (다른 기기에서 꾸민 별을 받아 오기 위해)
  const [ready, setReady] = useState(!cloudEnabled);
  useEffect(() => {
    let alive = true;
    cloudReady.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
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

      {step === 'teacher' ? (
        <form
          className="panel login-card rise"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === getSettings().teacherPin) go('teacher');
            else setErr('비밀번호가 맞지 않아요');
          }}
        >
          <label className="field-label" htmlFor="pin">선생님 비밀번호</label>
          <input id="pin" className="code-input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={8} autoComplete="off" />
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={!pin}>
            선생님 화면 열기
          </button>
          {getSettings().teacherPin === '0000' && <p className="field-hint">샘플 비밀번호는 <b>0000</b> 이에요</p>}
          <button type="button" className="btn btn-ghost" onClick={() => (setStep('code'), setErr(''))}>← 학생 로그인</button>
        </form>
      ) : step === 'code' ? (
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
          <button type="button" className="btn btn-ghost teacher-link" onClick={() => (setStep('teacher'), setErr(''))}>
            🧑‍🏫 선생님이세요?
          </button>
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
          {!ready && <p className="field-hint">학급에 연결하는 중…</p>}
          <div className={`roster ${ready ? '' : 'is-wait'}`}>
            {ROSTER.map((s) => {
              const has = !!loadProfile(s.id);
              return (
                <button key={s.id} className={`roster-btn ${has ? 'has-star' : ''}`} onClick={() => login(s.id)} disabled={!ready}>
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
