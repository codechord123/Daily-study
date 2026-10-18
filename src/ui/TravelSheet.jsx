import { ROSTER } from '../data/classroom';
import { useUI } from '../store/useUI';
import { useGame } from '../store/useGame';
import { getPlanet } from '../store/profileStore';
import { PLANET_TINTS } from '../theme/tokens';
import * as presence from '../services/presence';

// 여행 창 하나로: 별을 고르고 ⚡ 바로 가기 / 🚀 날아서 가기(비행 중엔 🧭 길 안내)
function Swatch({ sid }) {
  const t = PLANET_TINTS.find((x) => x.id === getPlanet(sid).tint) ?? PLANET_TINTS[0];
  return <span className="star-dot" style={{ background: `radial-gradient(circle at 35% 30%, ${t.base}, ${t.shade})` }} aria-hidden />;
}

export default function TravelSheet({ flying, here, onClose }) {
  const { profile, launch } = useGame();
  const { startWarp, setFlightTarget, flightTarget } = useUI();
  const online = presence.onlineMap();
  const list = [
    { id: profile.sid, nickname: '내 별' },
    ...ROSTER.filter((s) => s.id !== profile.sid).sort((a, b) => (online[b.id] ?? 0) - (online[a.id] ?? 0)),
  ].filter((s) => s.id !== here);

  const warp = (sid) => {
    onClose();
    startWarp(sid);
  };
  const fly = (sid) => {
    setFlightTarget(sid);
    if (flying) useUI.getState().setAutopilot(true); // 비행 중에 고르면 자동으로 날아간다 (조종하면 직접)
    onClose();
    if (!flying) launch();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="travel panel rise" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="여행">
        <header className="records-head">
          <h2 className="title">🚀 어디로 여행할까요?</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="닫기">✕</button>
        </header>
        {!flying && (
          <button
            className="free-fly"
            onClick={() => {
              setFlightTarget(null);
              onClose();
              launch();
            }}
          >
            <span className="free-fly-icon">🚀</span>
            <span>
              <b>우주로 날아가기</b>
              <small>추진기를 메고 직접 조종해서 친구 별을 찾아가요</small>
            </span>
          </button>
        )}
        <p className="travel-hint">
          <b>⚡ 바로 가기</b> 순간이동해요 · {flying ? (
            <>
              <b>🛸 날아가기</b> 자동으로 날아가요 (조종하면 직접)
            </>
          ) : (
            <>
              <b>🚀 날아서</b> 화살표를 따라 직접 날아가요 (가는 길에 🛸 자동 비행)
            </>
          )}
        </p>
        <div className="star-grid">
          {list.map((s) => (
            <div key={s.id} className={`star-card ${s.id === profile.sid ? 'is-me' : ''} ${flightTarget === s.id ? 'on' : ''}`}>
              <div className="star-card-top">
                <Swatch sid={s.id} />
                <span className="star-name">{s.nickname}</span>
                {online[s.id] > 0 && <span className="map-dot" title="지금 있는 친구">{online[s.id]}</span>}
              </div>
              <div className="star-card-actions">
                <button className="sc-btn sc-warp" onClick={() => warp(s.id)}>⚡ 바로 가기</button>
                <button className="sc-btn" onClick={() => fly(s.id)}>{flying ? '🛸 날아가기' : '🚀 날아서'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
