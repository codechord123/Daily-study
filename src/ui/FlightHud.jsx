import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { studentById } from '../data/classroom';
import * as input from '../services/flightInput';
import TopBar from './TopBar';
import FriendPicker from './FriendPicker';
import ZoomButtons from './ZoomButtons';

const JOY_R = 52; // 조이스틱이 움직이는 반경(px)

// 왼쪽 아래 가상 조이스틱: 위 = 앞으로, 좌우 = 방향 돌리기
function Joystick() {
  const base = useRef();
  const knob = useRef();
  const pid = useRef(null);

  const move = (e) => {
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > JOY_R) {
      dx = (dx / len) * JOY_R;
      dy = (dy / len) * JOY_R;
    }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    input.setJoy(true, dx / JOY_R, -dy / JOY_R);
  };
  const end = () => {
    pid.current = null;
    knob.current.style.transform = '';
    input.setJoy(false);
  };

  return (
    <div
      ref={base}
      className="joy"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.pointerId === pid.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="조이스틱"
    >
      <div ref={knob} className="joy-knob" />
    </div>
  );
}

function HoldButton({ value, children, label }) {
  const off = () => input.setLift(0);
  return (
    <button
      className="lift-btn"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        input.setLift(value);
      }}
      onPointerUp={off}
      onPointerCancel={off}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export default function FlightHud() {
  const { profile, visit } = useGame();
  const { near, flightTarget, setFlightTarget } = useUI();
  const [picking, setPicking] = useState(false);
  const nearName = near && (near === profile.sid ? '내 별' : `${studentById(near)?.nickname}의 별`);
  const targetName = flightTarget && (flightTarget === profile.sid ? '내 별' : studentById(flightTarget)?.nickname);

  // 목적지에 도착하면 안내 끄기
  useEffect(() => {
    if (near && near === flightTarget) setFlightTarget(null);
  }, [near, flightTarget, setFlightTarget]);

  return (
    <>
      <TopBar />
      <div className="hud-top">
        <div className="hud-title rise">
          <p className="hud-kicker">우주 비행 중</p>
          <h2 className="title">어느 별로 날아갈까요?</h2>
        </div>
      </div>
      <div className="flight-tools">
        <button className={`chip target-chip ${flightTarget ? 'on' : ''}`} onClick={() => setPicking((p) => !p)}>
          🧭 {targetName ? `목적지: ${targetName}` : '목적지 고르기'}
        </button>
        <button className="chip" onClick={() => visit(profile.sid)}>🏠 바로 집으로</button>
      </div>
      {picking && <FriendPicker meId={profile.sid} guide onClose={() => setPicking(false)} />}

      {near && (
        <div className="land-wrap">
          <button className="mission-cta land-cta rise" onClick={input.requestLand}>
            <span className="mission-cta-star">🛬</span>
            <span>
              <b>{nearName}에 내리기</b>
              <small>Enter 키를 눌러도 돼요</small>
            </span>
          </button>
          <button className="btn pass-btn rise" onClick={input.requestLeave}>
            ↗ 지나가기
          </button>
        </div>
      )}

      <ZoomButtons wheel />
      <Joystick />
      <div className="lift">
        <HoldButton value={1} label="위로">▲</HoldButton>
        <HoldButton value={-1} label="아래로">▼</HoldButton>
      </div>
      <p className="walk-hint">↑ 앞으로 · ←→ 방향 · Space 위로 · Shift 아래로 · Enter 착륙</p>
    </>
  );
}
