import { useEffect, useState } from 'react';
import { ROSTER, makeRoster, onRoster, DEFAULT_NICKS } from '../data/classroom';
import { saveRoster, loadSeats, allowRejoin } from '../services/cloud';
import { useAccount } from './CloudLogin';

// 선생님 화면 · 우리 반: 학급 코드, 명단(별명), 가입 상태와 다시 가입 허용
export default function ClassPanel() {
  const account = useAccount();
  const [roster, setRosterState] = useState(() => ROSTER.map((s) => ({ ...s })));
  const [dirty, setDirty] = useState(false);
  const [seats, setSeats] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshSeats = () => loadSeats().then(setSeats).catch((e) => console.warn(e));
  useEffect(() => {
    refreshSeats();
    return onRoster((r) => !dirty && setRosterState(r.map((s) => ({ ...s }))));
  }, [dirty]);

  const setCount = (n) => {
    const count = Math.max(1, Math.min(40, n));
    const base = makeRoster(count, DEFAULT_NICKS);
    setRosterState(base.map((s, i) => roster[i] ?? s));
    setDirty(true);
  };
  const rename = (i, nickname) => {
    setRosterState(roster.map((s, j) => (j === i ? { ...s, nickname } : s)));
    setDirty(true);
  };
  const save = async () => {
    const cleaned = roster.map((s) => ({ ...s, nickname: s.nickname.trim() || `${s.number}번` }));
    setBusy(true);
    try {
      await saveRoster(cleaned);
      setDirty(false);
      setMsg('명단을 저장했어요');
    } catch (e) {
      console.warn(e);
      setMsg('저장하지 못했어요. 인터넷 연결을 확인해 주세요');
    } finally {
      setBusy(false);
    }
  };
  const rejoin = async (s) => {
    if (!window.confirm(`${s.number}번 ${s.nickname}: 새 비밀번호로 다시 가입할 수 있게 할까요?\n별과 기록은 그대로 남아요.`)) return;
    try {
      await allowRejoin(s.id);
      setMsg(`${s.number}번은 이제 같은 번호를 눌러 새 비밀번호로 가입하면 돼요`);
      refreshSeats();
    } catch (e) {
      console.warn(e);
      setMsg('바꾸지 못했어요. 인터넷 연결을 확인해 주세요');
    }
  };
  const joinedCount = roster.filter((s) => seats[s.id]?.uid).length;

  return (
    <section className="t-panel" id="t-class">
      <h2>우리 반</h2>
      <div className="class-code-box">
        <span className="muted">학급 코드</span>
        <b className="class-code">{account.code}</b>
        <span className="muted">학생들은 이 코드를 넣고 자기 번호를 눌러 가입해요 · 가입 {joinedCount}/{roster.length}명</span>
      </div>
      <div className="class-count">
        <label htmlFor="class-count">학생 수</label>
        <input id="class-count" type="number" min={1} max={40} value={roster.length} onChange={(e) => setCount(Number(e.target.value) || 1)} />
        <button className="btn btn-sm btn-primary" onClick={save} disabled={!dirty || busy}>
          {busy ? '저장 중…' : '명단 저장'}
        </button>
        {msg && <span className="muted">{msg}</span>}
      </div>
      <div className="class-roster">
        {roster.map((s, i) => {
          const joined = !!seats[s.id]?.uid;
          return (
            <div key={s.id} className={`class-row ${joined ? 'joined' : ''}`}>
              <span className="roster-num">{s.number}</span>
              <input value={s.nickname} maxLength={10} onChange={(e) => rename(i, e.target.value)} aria-label={`${s.number}번 별명`} />
              <span className="class-state">{joined ? '가입함' : '아직'}</span>
              {joined && (
                <button className="btn btn-sm" onClick={() => rejoin(s)} title="비밀번호를 잊었을 때">
                  다시 가입 허용
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
