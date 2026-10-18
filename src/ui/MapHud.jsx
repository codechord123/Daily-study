export default function MapHud({ onBack }) {
  return (
    <>
      <div className="hud-top">
        <div className="hud-title rise">
          <p className="hud-kicker">우주 지도</p>
          <h2 className="title">어느 별로 놀러 갈까요?</h2>
        </div>
      </div>
      <div className="map-legend chip">
        <span className="legend-ring gold" /> 내 별
        <span className="legend-ring cyan" /> 친구가 있는 별
      </div>
      <div className="dock">
        <button className="btn" onClick={onBack}>🏠 내 별로 돌아가기</button>
      </div>
    </>
  );
}
