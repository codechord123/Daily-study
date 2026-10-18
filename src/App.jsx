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
import { useGame } from './store/useGame';
import { useUI } from './store/useUI';
import * as presence from './services/presence';

export default function App() {
  const { profile, screen, visiting, launchFrom, restoreSession, visit } = useGame();
  const quality = useUI((s) => s.quality);
  const low = quality === 'low';
  const [emote, setEmote] = useState(null);

  useEffect(() => restoreSession(), [restoreSession]);

  useEffect(() => {
    if (screen === 'login') presence.leave();
  }, [screen]);

  const sendEmote = (e) => {
    presence.sendEmote(e);
    setEmote({ e, at: Date.now() });
  };

  const onPlanet = profile && (screen === 'home' || screen === 'visit' || screen === 'mission');
  const ownerId = screen === 'visit' ? visiting : profile?.sid;

  return (
    <div className={`app paper-grain screen-${screen}`}>
      <div className="canvas-wrap">
        <Canvas dpr={low ? [1, 1.25] : [1, 2]} camera={{ fov: 45, position: [0, 4, 7] }} gl={{ antialias: !low, powerPreference: 'high-performance' }}>
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
      </div>

      <div className="ui-layer">
        {!profile && <Login />}
        {profile && (screen === 'home' || screen === 'visit') && <PlanetHud ownerId={ownerId} onEmote={sendEmote} />}
        {profile && screen === 'space' && <FlightHud />}
        {profile && screen === 'mission' && <MissionView />}
        <Toast />
      </div>
    </div>
  );
}
