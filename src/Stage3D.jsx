// 3D 무대 (three.js): 첫 화면을 빨리 띄우려고 따로 불러온다 (App 에서 lazy)
// 크롬북 같은 저사양 기기를 위해 '필요한 만큼만' 그린다:
//  - 화질마다 초당 그리는 횟수를 정하고(선명 60 · 가볍게 30), 문제 풀 때는 카드 뒤라 더 적게, 창이 열리면 멈춘다
//  - 처음 몇 초 동안 실제로 그려진 횟수를 재서 많이 모자라면 화질을 저절로 한 단계 낮춘다
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SpaceBackdrop from './three/SpaceBackdrop';
import PlanetScene from './three/PlanetScene';
import SpaceFlight from './three/SpaceFlight';
import LoginBackdrop from './three/LoginBackdrop';
import SceneGuard from './ui/SceneGuard';
import { useUI, QUALITIES } from './store/useUI';

const DPR = { high: [1, 2], low: 1, lite: 0.8 };
// 화면마다 초당 그리는 횟수 [선명, 가볍게, 가장 가볍게]
const FPS = {
  normal: [60, 30, 24],
  mission: [20, 12, 10], // 카드 뒤에서 별만 천천히 돈다
  login: [30, 20, 15],
};
// 이 창들이 열려 있으면 뒤 3D는 멈춘다 (꾸미기 창은 별을 보며 쓰므로 제외)
const PAUSE_SHEETS = new Set(['station', 'records', 'goal', 'prince']);

function useHidden() {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return hidden;
}

/** 정한 횟수만큼만 다시 그리기 (frameloop="demand") */
function FrameLimiter({ fps }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    if (!fps) return;
    const gap = 1000 / fps;
    let raf;
    let last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - last >= gap - 2) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

/** 내 별 화면에서 한 번: 원하는 횟수의 60%도 못 그리면 화질을 한 단계 낮춘다 */
function AutoQuality({ target, active }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    frames.current += 1;
    if (import.meta.env.DEV) window.__frames = (window.__frames ?? 0) + 1; // 시험용: 그린 횟수
  });
  useEffect(() => {
    if (!active || done.current) return;
    try {
      if (localStorage.getItem('ds:quality-picked')) return; // 학생이 직접 고른 화질은 그대로
    } catch {
      /* noop */
    }
    let t2;
    const t1 = setTimeout(() => {
      frames.current = 0;
      const start = performance.now();
      t2 = setTimeout(() => {
        const got = (frames.current * 1000) / (performance.now() - start);
        const { quality, setQuality, showToast } = useUI.getState();
        const i = QUALITIES.indexOf(quality);
        if (!document.hidden && got < target * 0.6 && i < QUALITIES.length - 1) {
          done.current = true;
          setQuality(QUALITIES[i + 1], true);
          showToast('이 기기에 맞게 화면을 가볍게 바꿨어요');
        }
      }, 4000);
    }, 3000); // 처음 불러오는 동안은 재지 않는다
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, target]);
  return null;
}

export default function Stage3D({ quality, profile, onPlanet, ownerId, screen, emote, launchFrom, visit, setReady, setLost }) {
  const sheet = useUI((s) => s.sheet);
  const hidden = useHidden();
  const tier = Math.max(0, QUALITIES.indexOf(quality));
  const low = tier > 0;
  const kind = screen === 'mission' ? 'mission' : !profile ? 'login' : 'normal';
  const paused = hidden || screen === 'teacher' || (PAUSE_SHEETS.has(sheet) && screen !== 'mission');
  const fps = paused ? 0 : FPS[kind][tier];
  return (
    <SceneGuard>
    <Canvas
      frameloop="demand"
      dpr={DPR[quality] ?? 1}
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
      <FrameLimiter fps={fps} />
      <AutoQuality target={FPS.normal[tier]} active={!paused && kind === 'normal' && screen === 'home'} />
      <Suspense fallback={null}>
        <SpaceBackdrop low={low} lite={tier > 1} />
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
