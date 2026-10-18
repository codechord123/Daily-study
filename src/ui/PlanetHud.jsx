import { useEffect, useState } from 'react';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { studentById } from '../data/classroom';
import { getHearts, addHeart, onPlanetChange } from '../store/profileStore';
import * as presence from '../services/presence';
import DecorPanel from './DecorPanel';
import TopBar from './TopBar';

const EMOTES = ['👋', '❤️', '⭐', '😄', '🎉'];

function useHereCount(planetId) {
  const [n, setN] = useState(() => presence.peersOn(planetId).length);
  useEffect(() => presence.subscribe(() => setN(presence.peersOn(planetId).length)), [planetId]);
  return n;
}

function useHearts(sid) {
  const [h, setH] = useState(() => getHearts(sid));
  useEffect(() => {
    setH(getHearts(sid));
    return onPlanetChange((x) => x === sid && setH(getHearts(sid)));
  }, [sid]);
  return h;
}

function EmoteBar({ onEmote }) {
  const [cool, setCool] = useState(false);
  const send = (e) => {
    if (cool) return;
    onEmote(e);
    setCool(true);
    setTimeout(() => setCool(false), 1200); // 연타 방지
  };
  return (
    <div className="emote-bar panel" role="group" aria-label="이모트" data-nosfx>
      {EMOTES.map((e) => (
        <button key={e} className="emote-btn" onClick={() => send(e)} disabled={cool} aria-label={`이모트 ${e}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

export default function PlanetHud({ ownerId, onEmote }) {
  const { profile, mode, setMode, go, visit, launch, canGiveHeart, markHeartGiven, missionDoneToday } = useGame();
  const { clearDecor, showToast } = useUI();
  const isMine = ownerId === profile.sid;
  const owner = studentById(ownerId);
  const here = useHereCount(ownerId);
  const hearts = useHearts(ownerId);
  const done = missionDoneToday();
  const decorating = isMine && mode === 'decorate';

  const giveHeart = () => {
    if (!canGiveHeart(ownerId)) return showToast('오늘은 이미 하트를 보냈어요');
    addHeart(ownerId);
    markHeartGiven(ownerId);
    onEmote('❤️');
    showToast(`${owner.nickname}의 별에 하트를 남겼어요`);
  };

  return (
    <>
      <TopBar />
      <div className="hud-top">
        <div className="hud-title rise" key={ownerId}>
          <p className="hud-kicker">{isMine ? '나의 작은 별' : '놀러 온 별'}</p>
          <h2 className="title">{owner?.nickname}의 별</h2>
          <div className="hud-meta">
            <span>❤️ {hearts}</span>
            {here > 0 && <span className="here-dot">지금 {here}명이 함께 있어요</span>}
          </div>
        </div>
      </div>

      {decorating ? (
        <DecorPanel
          onDone={() => {
            clearDecor();
            setMode('walk');
          }}
        />
      ) : (
        <>
          <EmoteBar onEmote={onEmote} />
          <div className="dock">
            {isMine ? (
              <>
                {!done ? (
                  <button className="mission-cta" onClick={() => go('mission')}>
                    <span className="mission-cta-star">✦</span>
                    <span>
                      <b>오늘의 미션</b>
                      <small>13문제 · 약 10분 · 별가루 받기</small>
                    </span>
                  </button>
                ) : (
                  <button className="btn btn-done" onClick={() => go('mission')}>✓ 오늘 미션 완료 · 연습하기</button>
                )}
                <button className="btn" onClick={() => setMode('decorate')}>🎨 꾸미기</button>
                <button className="btn" onClick={launch}>🚀 여행</button>
              </>
            ) : (
              <>
                <button className="btn btn-heart" data-nosfx onClick={giveHeart} disabled={!canGiveHeart(ownerId)}>
                  {canGiveHeart(ownerId) ? '❤️ 하트 남기기' : '❤️ 하트 보냄'}
                </button>
                <button className="btn" onClick={launch}>🚀 날아가기</button>
                <button className="btn" onClick={() => visit(profile.sid)}>🏠 내 별</button>
              </>
            )}
          </div>
          <p className="walk-hint">별을 누르면 그곳으로 걸어가요 · 끌어서 별을 돌려 봐요</p>
        </>
      )}
    </>
  );
}
