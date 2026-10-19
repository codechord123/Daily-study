import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SpaceBackdrop from './three/SpaceBackdrop';
import PlanetScene from './three/PlanetScene';
import SpaceFlight from './three/SpaceFlight';
import LoginBackdrop from './three/LoginBackdrop';
import Login from './ui/Login';
import PlanetHud from './ui/PlanetHud';
import FlightHud from './ui/FlightHud';
import MissionView from './ui/MissionView';
import Toast from './ui/Toast';
import WarpOverlay from './ui/WarpOverlay';
import RecordsSheet from './ui/RecordsSheet';
import TeacherView from './ui/TeacherView';
import Onboarding from './ui/Onboarding';
import SceneGuard, { webglAvailable } from './ui/SceneGuard';
import { prewarmAtlases } from './three/thumbAtlas';
import { useGame } from './store/useGame';
import { useUI } from './store/useUI';
import * as presence from './services/presence';
import { sfx, playMusic } from './services/sound';
import { cloudEnabled, cloudReady } from './services/cloud';
import { useAccount } from './ui/CloudLogin';

export default function App() {
  const { profile, screen, visiting, launchFrom, restoreSession, visit, missionMode } = useGame();
  const sheet = useUI((s) => s.sheet);
  const quality = useUI((s) => s.quality);
  const low = quality === 'low';
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
    if (profile && gl3d) prewarmAtlases();
  }, [!!profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen === 'login') presence.leave();
    playMusic(screen === 'visit' ? 'home' : screen);
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
        <SceneGuard>
        <Canvas
          dpr={low ? [1, 1.25] : [1, 2]}
          camera={{ fov: 45, position: [0, 4, 7] }}
          gl={{ antialias: !low, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            requestAnimationFrame(() => setReady(true));
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setLost(true);
            });
          }}
        >
          <Suspense fallback={null}>
            <SpaceBackdrop low={low} />
            {!profile && <LoginBackdrop />}
            {onPlanet && <PlanetScene key={ownerId} ownerId={ownerId} editable={screen === 'home'} emote={emote} inMission={screen === 'mission'} />}
            {profile && screen === 'space' && <SpaceFlight me={profile} launchFrom={launchFrom} onLand={visit} low={low} />}
            {!low && (
              <EffectComposer multisampling={0}>
                <Bloom intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
                <Vignette offset={0.3} darkness={0.55} />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
        </SceneGuard>
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
        {profile && (screen === 'home' || screen === 'visit') && <PlanetHud ownerId={ownerId} onEmote={sendEmote} />}
        {profile && screen === 'space' && <FlightHud />}
        {profile && screen === 'mission' && <MissionView key={missionMode?.at ?? 'daily'} />}
        {profile && sheet === 'records' && screen !== 'mission' && <RecordsSheet />}
        {profile && !profile.onboarded && screen === 'home' && <Onboarding />}
        <WarpOverlay />
        <Toast />
      </div>
    </div>
  );
}
