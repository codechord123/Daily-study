// 3D 무대 (three.js): 첫 화면을 빨리 띄우려고 따로 불러온다 (App 에서 lazy)
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SpaceBackdrop from './three/SpaceBackdrop';
import PlanetScene from './three/PlanetScene';
import SpaceFlight from './three/SpaceFlight';
import LoginBackdrop from './three/LoginBackdrop';
import SceneGuard from './ui/SceneGuard';

export default function Stage3D({ low, profile, onPlanet, ownerId, screen, emote, launchFrom, visit, setReady, setLost }) {
  return (
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
  );
}
