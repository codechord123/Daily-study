// 선생님 화면 · 학년 정리: 기록 백업(JSON)과 학년말 기록 지우기
import { useState } from 'react';
import { ROSTER } from '../data/classroom';
import { loadProfile } from '../store/profileStore';
import { getLearn } from '../store/learnStore';
import { getSettings } from '../store/classSettings';
import { todayKey } from '../store/useGame';
import { cloudEnabled, wipeClassRecords } from '../services/cloud';

function backup() {
  const students = ROSTER.map((st) => ({ ...st, profile: loadProfile(st.id), learn: getLearn(st.id) }));
  const { teacherPin, ...settings } = getSettings(); // eslint-disable-line no-unused-vars
  return JSON.stringify({ app: '나의 작은 별', exportedAt: new Date().toISOString(), settings, students }, null, 1);
}

function clearLocal() {
  try {
    Object.keys(localStorage)
      .filter((k) => /^ds:(profile|learn|hearts|progress):/.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}

export default function YearEnd() {
  const [text, setText] = useState(null);
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const download = () => {
    const t = backup();
    setText(t);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' }));
      a.download = `나의작은별_백업_${todayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      /* 저장이 막힌 곳은 아래 복사 칸으로 */
    }
  };
  const wipe = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (cloudEnabled) await wipeClassRecords();
      clearLocal();
      setMsg('모든 학생의 별과 학습 기록을 지웠어요. 학생들은 같은 번호·비밀번호로 들어와 새 별로 시작해요.');
      setConfirm('');
    } catch (e) {
      setMsg(`지우지 못했어요: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="t-panel" id="t-year">
      <h2>학년 정리</h2>
      <p className="muted">학년이 끝나면 기록을 내려받아 보관하고, 학급 서버의 기록을 지워 주세요 (학교 개인정보 보관 기준에 맞게).</p>
      <div className="t-actions">
        <button className="btn btn-sm" onClick={download}>💾 전체 기록 백업 (JSON)</button>
      </div>
      {text && (
        <>
          <p className="muted small-note">파일이 저장되지 않았다면 아래 내용을 모두 복사해 메모장에 붙여 넣고 .json 으로 저장하세요.</p>
          <textarea className="csv-box" readOnly value={text} onFocus={(e) => e.target.select()} />
        </>
      )}
      <div className="year-wipe">
        <label htmlFor="wipe">기록을 모두 지우려면 <b>지우기</b> 라고 쓰세요</label>
        <input id="wipe" className="t-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="지우기" />
        <button className="btn btn-sm btn-danger" disabled={confirm.trim() !== '지우기' || busy} onClick={wipe}>
          {busy ? '지우는 중…' : '🗑 별·학습 기록 모두 지우기'}
        </button>
      </div>
      {msg && <p className="muted">{msg}</p>}
      <p className="muted small-note">학생 계정과 번호, 명단, 학급 코드는 남아요. 먼저 백업해 두세요. 지운 기록은 되돌릴 수 없어요.</p>
    </section>
  );
}
