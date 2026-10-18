import { ROSTER } from '../data/classroom';
import { useUI } from '../store/useUI';
import * as presence from '../services/presence';

// 친구 별 목록: 🧭 길 안내(비행 중) / ⚡ 바로 가기(순간이동)
export default function FriendPicker({ meId, here, guide, onClose }) {
  const { flightTarget, setFlightTarget, startWarp } = useUI();
  const online = presence.onlineMap();
  const list = [
    { id: meId, nickname: '내 별' },
    ...ROSTER.filter((s) => s.id !== meId).sort((a, b) => (online[b.id] ?? 0) - (online[a.id] ?? 0)),
  ].filter((s) => s.id !== here);

  return (
    <div className="picker panel rise" role="dialog" aria-label="친구 별 고르기">
      <div className="picker-head">
        <b className="title">{guide ? '어디로 갈까요?' : '어느 별로 바로 갈까요?'}</b>
        <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      {guide && <p className="picker-hint">🧭 길 안내를 받으며 날아가거나, ⚡ 바로 갈 수 있어요</p>}
      <div className="picker-list">
        {list.map((s) => (
          <div key={s.id} className={`picker-row ${flightTarget === s.id ? 'on' : ''} ${s.id === meId ? 'is-me' : ''}`}>
            <span className="picker-name">
              {s.nickname}
              {online[s.id] > 0 && <span className="map-dot">{online[s.id]}</span>}
            </span>
            {guide && (
              <button
                className="picker-act"
                aria-label={`${s.nickname} 길 안내`}
                onClick={() => {
                  setFlightTarget(s.id);
                  onClose();
                }}
              >
                🧭
              </button>
            )}
            <button
              className="picker-act warp"
              aria-label={`${s.nickname} 바로 가기`}
              onClick={() => {
                startWarp(s.id);
                onClose();
              }}
            >
              ⚡
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
