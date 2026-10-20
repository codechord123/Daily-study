import { useEffect, useState } from 'react';
import { lookupClass, studentSignUp, studentSignIn, teacherSignIn, createClass, authMessage, getAccount, onAccount } from '../services/cloud';

const LAST_KEY = 'ds:last-login'; // { code, sid } 다음 아침에 번호를 다시 찾지 않게
const readLast = () => {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null');
  } catch {
    return null;
  }
};

export function useAccount() {
  const [a, setA] = useState(getAccount);
  useEffect(() => onAccount(setA), []);
  return a;
}

// 학급 서버 로그인: 학생은 학급 코드 → 번호 → 비밀번호, 선생님은 Google
export default function CloudLogin() {
  const account = useAccount();
  const [step, setStep] = useState('code'); // code | pick | password | teacher
  const [code, setCode] = useState(() => readLast()?.code ?? '');
  const [cls, setCls] = useState(null);
  const [sid, setSid] = useState(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const last = readLast();

  useEffect(() => {
    if (account.status === 'needsClass') setStep('teacher');
    if (account.error) setErr(account.error);
  }, [account.status, account.error]);

  const run = async (fn) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      console.warn(e);
      setErr(e?.code ? authMessage(e) : e?.message || '잠시 뒤에 다시 해 주세요');
    } finally {
      setBusy(false);
    }
  };

  const openClass = (c, then) =>
    run(async () => {
      const found = await lookupClass(c);
      if (!found) return setErr('학급 코드를 다시 확인해 주세요');
      setCls(found);
      if (then && found.roster.some((s) => s.id === then)) {
        setSid(then);
        setStep('password');
      } else setStep('pick');
    });

  const student = cls?.roster.find((s) => s.id === sid);
  const joined = !!cls?.seats[sid]?.taken;

  const submitPassword = (e) => {
    e.preventDefault();
    if (!joined && pw !== pw2) return setErr('두 비밀번호가 달라요');
    run(async () => {
      if (joined) await studentSignIn(cls, sid, pw);
      else await studentSignUp(cls, sid, pw);
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify({ code: cls.code, sid }));
      } catch {
        /* noop */
      }
    });
  };

  if (account.status === 'loading' || account.status === 'student' || account.status === 'teacher')
    return (
      <div className="login">
        <header className="login-head rise">
          <p className="login-kicker">매일 아침, 나만의 별을 키워요</p>
          <h1 className="title login-title">나의 작은 별</h1>
        </header>
        <p className="field-hint">학급에 연결하는 중…</p>
      </div>
    );

  return (
    <div className="login">
      <header className="login-head rise">
        <p className="login-kicker">매일 아침, 나만의 별을 키워요</p>
        <h1 className="title login-title">나의 작은 별</h1>
      </header>

      {step === 'teacher' ? (
        <TeacherLogin account={account} onBack={() => (setStep('code'), setErr(''))} />
      ) : step === 'code' ? (
        <form
          className="panel login-card rise"
          onSubmit={(e) => {
            e.preventDefault();
            openClass(code);
          }}
          style={{ animationDelay: '120ms' }}
        >
          <label className="field-label" htmlFor="code">학급 코드</label>
          <input
            id="code"
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="예) K7QM2P"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={6}
          />
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={code.length < 6 || busy}>
            {busy ? '찾는 중…' : '들어가기'}
          </button>
          {last?.sid && (
            <button type="button" className="btn btn-block login-last" onClick={() => openClass(last.code, last.sid)} disabled={busy}>
              ▶ 지난번 번호로 들어가기
            </button>
          )}
          <button type="button" className="btn btn-ghost teacher-link" onClick={() => (setStep('teacher'), setErr(''))}>
            🧑‍🏫 선생님이세요?
          </button>
        </form>
      ) : step === 'pick' ? (
        <div className="panel login-card login-pick rise">
          <div className="pick-head">
            <button className="btn btn-icon btn-ghost" onClick={() => setStep('code')} aria-label="뒤로">←</button>
            <div>
              <p className="field-label">{cls.name}</p>
              <p className="pick-title title">내 번호를 눌러요</p>
            </div>
          </div>
          <p className="field-hint">⭐ 표시는 이미 가입한 번호예요</p>
          <div className="roster">
            {cls.roster.map((s) => (
              <button
                key={s.id}
                className={`roster-btn ${cls.seats[s.id]?.taken ? 'has-star' : ''}`}
                onClick={() => (setSid(s.id), setPw(''), setPw2(''), setErr(''), setStep('password'))}
              >
                <span className="roster-num">{s.number}</span>
                <span className="roster-nick">{s.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form className="panel login-card rise" onSubmit={submitPassword}>
          <div className="pick-head">
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => (setStep('pick'), setErr(''))} aria-label="뒤로">←</button>
            <div>
              <p className="field-label">{cls.name}</p>
              <p className="pick-title title">{student?.number}번 {student?.nickname}</p>
            </div>
          </div>
          <label className="field-label" htmlFor="pw">{joined ? '비밀번호' : '비밀번호 만들기 (6글자 이상)'}</label>
          <input id="pw" className="code-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={joined ? 'current-password' : 'new-password'} autoFocus />
          {!joined && (
            <>
              <label className="field-label" htmlFor="pw2">한 번 더</label>
              <input id="pw2" className="code-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            </>
          )}
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={pw.length < 6 || (!joined && !pw2) || busy}>
            {busy ? '잠시만요…' : joined ? '들어가기' : '가입하고 들어가기'}
          </button>
          <p className="field-hint">{joined ? '비밀번호를 잊었으면 선생님께 말해 주세요' : '비밀번호는 잊지 않게 공책에 적어 두세요'}</p>
        </form>
      )}
    </div>
  );
}

function TeacherLogin({ account, onBack }) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(24);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      console.warn(e);
      setErr(e?.code ? authMessage(e) : e?.message || '잠시 뒤에 다시 해 주세요');
    } finally {
      setBusy(false);
    }
  };

  if (account.status === 'needsClass')
    return (
      <form
        className="panel login-card rise"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createClass(name.trim(), count));
        }}
      >
        <p className="pick-title title">우리 반 만들기</p>
        <p className="field-hint">{account.email}</p>
        <label className="field-label" htmlFor="cname">학급 이름</label>
        <input id="cname" className="code-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 5학년 별빛반" maxLength={20} />
        <label className="field-label" htmlFor="ccount">학생 수</label>
        <input id="ccount" className="code-input" type="number" min={1} max={40} value={count} onChange={(e) => setCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} />
        {err && <p className="field-err">{err}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={!name.trim() || busy}>
          {busy ? '만드는 중…' : '학급 만들고 학급 코드 받기'}
        </button>
        <p className="field-hint">별명과 학생 수는 나중에 선생님 화면에서 바꿀 수 있어요</p>
      </form>
    );

  return (
    <div className="panel login-card rise">
      <p className="pick-title title">선생님 로그인</p>
      <button
        className="btn btn-primary btn-block"
        onClick={() =>
          run(() =>
            // 로그인 창이 답을 못 돌려주면 1분 뒤 다시 누를 수 있게
            Promise.race([teacherSignIn(), new Promise((_, no) => setTimeout(() => no(new Error('로그인 창이 응답하지 않아요. 창을 닫고 다시 눌러 주세요')), 60000))]),
          )
        }
        disabled={busy}
      >
        {busy ? '잠시만요…' : 'G  Google 계정으로 로그인'}
      </button>
      {err && <p className="field-err">{err}</p>}
      <p className="field-hint">처음이면 로그인한 뒤 우리 반을 만들어요</p>
      <button type="button" className="btn btn-ghost" onClick={onBack}>← 학생 로그인</button>
    </div>
  );
}
