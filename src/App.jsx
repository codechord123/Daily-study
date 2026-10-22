import { Suspense, lazy, useEffect, useState } from 'react';
import Login from './ui/Login';
import MissionView from './ui/MissionView';
import Toast from './ui/Toast';
import WarpOverlay from './ui/WarpOverlay';
import StationSheet from './ui/StationSheet';
import ClassGoalSheet from './ui/ClassGoal';
import PrinceSheet from './ui/PrinceSheet';
import TeacherView from './ui/TeacherView';
import Onboarding, { NEWS_VERSION } from './ui/Onboarding';
import { webglAvailable } from './ui/SceneGuard';

// 3D(three.js)와 3D를 쓰는 화면은 따로 불러온다: 로그인·미션·선생님 화면이 먼저 뜬다
const Stage3D = lazy(() => import('./Stage3D'));
const PlanetHud = lazy(() => import('./ui/PlanetHud'));
const FlightHud = lazy(() => import('./ui/FlightHud'));
import { useGame } from './store/useGame';
import { useUI } from './store/useUI';
import * as presence from './services/presence';
import { sfx, playMusic, stopMusic } from './services/sound';
import { cloudEnabled, cloudReady } from './services/cloud';
import { useAccount } from './ui/CloudLogin';
import { DEMO, resetDemo, exitDemo } from './demo';

export default function App() {
  const { profile, screen, visiting, launchFrom, restoreSession, visit, missionMode } = useGame();
  const sheet = useUI((s) => s.sheet);
  const quality = useUI((s) => s.quality);
  const [emote, setEmote] = useState(null);
  const [ready, setReady] = useState(false); // 3D 첫 화면이 그려졌는지
  const [lost, setLost] = useState(false); // 그래픽 연결이 끊김
  const [gl3d] = useState(webglAvailable);

  useEffect(() => restoreSession(), [restoreSession]);
  // 학급 서버: 로그인된 계정이 정해지면 학생은 내 별로, 선생님은 선생님 화면으로
  const account = useAccount();
  useEffect(() => {
    if (!cloudEnabled) return;
    const g = useGame.getState();
    if (account.status === 'teacher') {
      if (g.screen !== 'teacher') g.go('teacher');
    } else if (account.status === 'student') {
      if (g.profile?.sid === account.sid) return;
      let alive = true;
      cloudReady.then(() => alive && useGame.getState().profile?.sid !== account.sid && useGame.getState().login(account.sid));
      return () => {
        alive = false;
      };
    } else if (account.status === 'signedOut' && (g.profile || g.screen !== 'login')) {
      useGame.setState({ profile: null, screen: 'login', visiting: null });
    }
  }, [account.status, account.sid]);
  useEffect(() => {
    if (profile && gl3d) import('./three/thumbAtlas').then((m) => m.prewarmAtlases());
  }, [!!profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen === 'login') presence.leave();
    // 문제를 풀 때는 배경음악 없이 (영어 듣기와 겹쳐 아이폰에서 음성이 끊긴다)
    if (screen === 'mission') stopMusic();
    else playMusic(screen === 'visit' ? 'home' : screen);
  }, [screen]);

  // 버튼을 누르면 작은 탭 소리 (자기 소리가 있는 버튼은 data-nosfx)
  useEffect(() => {
    const onClick = (e) => {
      const b = e.target.closest?.('button');
      if (b && !b.disabled && !b.closest('[data-nosfx]')) sfx('tap');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const sendEmote = (e) => {
    sfx(e === '❤️' ? 'heart' : 'emote');
    presence.sendEmote(e);
    setEmote({ e, at: Date.now() });
  };

  const onPlanet = profile && (screen === 'home' || screen === 'visit' || screen === 'mission');
  const ownerId = screen === 'visit' ? visiting : profile?.sid;

  return (
    <div className={`app screen-${screen}`}>
      <div className="canvas-wrap">
        {gl3d ? (
        <Suspense fallback={null}>
          <Stage3D quality={quality} profile={profile} onPlanet={onPlanet} ownerId={ownerId} screen={screen} emote={emote} launchFrom={launchFrom} visit={visit} setReady={setReady} setLost={setLost} />
        </Suspense>
        ) : (
          <div className="scene-fallback">
            <p>이 기기에서는 3D 별을 보여 줄 수 없어요.<br />미션과 기록은 그대로 할 수 있어요.</p>
          </div>
        )}
        {gl3d && !ready && (
          <div className="splash" aria-live="polite">
            <div className="splash-star" />
            <p>별을 불러오는 중…</p>
          </div>
        )}
        {lost && (
          <div className="splash">
            <p>화면이 잠깐 멈췄어요.</p>
            <button className="btn btn-primary" onClick={() => location.reload()}>다시 불러오기</button>
          </div>
        )}
      </div>

      <div className="ui-layer">
        {!profile && screen !== 'teacher' && <Login />}
        {screen === 'teacher' && <TeacherView />}
        <Suspense fallback={null}>
          {profile && (screen === 'home' || screen === 'visit') && <PlanetHud ownerId={ownerId} onEmote={sendEmote} />}
          {profile && screen === 'space' && <FlightHud />}
        </Suspense>
        {profile && screen === 'mission' && <MissionView key={missionMode?.at ?? 'daily'} />}
        {/* 나의 기록은 문제 정거장의 '기록' 탭 */}
        {profile && (sheet === 'station' || sheet === 'records') && screen !== 'mission' && <StationSheet key={sheet} initialTab={sheet === 'records' ? 'records' : 'subjects'} />}
        {profile && sheet === 'goal' && screen !== 'mission' && <ClassGoalSheet />}
        {profile && sheet === 'prince' && screen !== 'mission' && <PrinceSheet />}
        {profile && !profile.onboarded && screen === 'home' && <Onboarding />}
        {profile && profile.onboarded && (profile.newsSeen ?? 0) < NEWS_VERSION && screen === 'home' && profile.sid !== 'teacher' && <Onboarding news key="news" />}
        <WarpOverlay />
        <Toast />
        {DEMO && screen !== 'mission' && (
          <div className={`demo-bar ${screen === 'login' ? '' : 'is-mini'}`} role="note">
            <b>체험판</b>
            {screen === 'login' && <span>실제 학급과 연결되지 않아요 · 학급 코드 STAR5 · 선생님 비밀번호 0000</span>}
            <button className="btn btn-sm btn-ghost" onClick={resetDemo}>처음부터</button>
            <button className="btn btn-sm btn-ghost" onClick={exitDemo}>끝내기</button>
          </div>
        )}
      </div>
    </div>
  );
}
