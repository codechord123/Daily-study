import { useEffect, useState } from 'react';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { studentById } from '../data/classroom';
import { getHearts, addHeart, onPlanetChange } from '../store/profileStore';
import * as presence from '../services/presence';
import DecorPanel from './DecorPanel';
import TopBar from './TopBar';
import TravelSheet from './TravelSheet';
import { loadProgress } from './MissionView';
import ZoomButtons from './ZoomButtons';
import { getSettings, onSettings } from '../store/classSettings';
import { ClassGoalChip } from './ClassGoal';

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
  const { profile, mode, setMode, startMission, canGiveHeart, markHeartGiven, missionDoneToday } = useGame();
  const { clearDecor, showToast, startWarp } = useUI();
  const isMine = ownerId === profile.sid;
  const owner = studentById(ownerId);
  const here = useHereCount(ownerId);
  const hearts = useHearts(ownerId);
  const done = missionDoneToday();
  const progress = !done && profile ? (loadProgress(profile.sid)?.results.length ?? 0) : 0;
  const decorating = isMine && mode === 'decorate';
  const [picking, setPicking] = useState(false);
  // 내 별에 돌아오면 그사이 받은 하트를 알려 준다
  useEffect(() => {
    if (!isMine) return;
    const seen = profile.heartsSeen ?? hearts;
    if (hearts > seen) showToast(`친구들이 내 별에 하트 ${hearts - seen}개를 남겼어요 ❤️`);
    useGame.getState().setHeartsSeen(hearts);
  }, [isMine, hearts]); // eslint-disable-line react-hooks/exhaustive-deps
  const [travelOpen, setTravelOpen] = useState(() => getSettings().travelOpen);
  useEffect(() => onSettings((s) => setTravelOpen(s.travelOpen)), []);

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
          {isMine && <ClassGoalChip />}
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
          <ZoomButtons wheel />
          <div className="dock">
            {isMine ? (
              <>
                {!done ? (
                  <button className="mission-cta" onClick={() => startMission({ type: 'daily', at: Date.now() })}>
                    <span className="mission-cta-star">✦</span>
                    <span>
                      {progress ? (
                        <>
                          <b>이어서 풀기</b>
                          <small>{progress}/20문제 풀었어요 · 별가루 받기</small>
                        </>
                      ) : (
                        <>
                          <b>오늘의 미션</b>
                          <small>20문제 · 약 15분 · 별가루 받기</small>
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <button className="btn btn-done" onClick={() => startMission({ type: 'daily', at: Date.now() })}>✓ 오늘 미션 완료 · 연습하기</button>
                )}
                <button className="btn" onClick={() => setMode('decorate')}>🎨 꾸미기</button>
                {travelOpen ? (
                  <button className="btn" onClick={() => setPicking(true)}>🚀 여행</button>
                ) : (
                  <span className="chip locked">🔒 지금은 여행 시간이 아니에요</span>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-heart" data-nosfx onClick={giveHeart} disabled={!canGiveHeart(ownerId)}>
                  {canGiveHeart(ownerId) ? '❤️ 하트 남기기' : '❤️ 하트 보냄'}
                </button>
                {travelOpen && <button className="btn" onClick={() => setPicking(true)}>🚀 여행</button>}
                <button className="btn" onClick={() => startWarp(profile.sid)}>🏠 내 별로</button>
              </>
            )}
          </div>
          {picking && <TravelSheet here={ownerId} onClose={() => setPicking(false)} />}
          <p className="walk-hint">별을 누르면 그곳으로 걸어가요 · 끌어서 별을 돌려 봐요</p>
        </>
      )}
    </>
  );
}
