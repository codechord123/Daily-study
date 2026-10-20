// 내 별 궤도를 도는 '문제 정거장': 누르면 과목별 연습·오답·다시 보기를 한곳에서 관리한다
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { glow } from './materials';
import { PLANET_RADIUS } from '../theme/tokens';
import { SUBJECT_META } from '../data/missions/grade5';
import { useUI } from '../store/useUI';
import { sfx } from '../services/sound';

const ORBIT = PLANET_RADIUS * 1.5;
const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const hull = new THREE.MeshStandardMaterial({ color: '#e9ecff', roughness: 0.35, metalness: 0.4 });
const panel = new THREE.MeshStandardMaterial({ color: '#3b4a9a', roughness: 0.3, metalness: 0.6, emissive: '#1a2a7a', emissiveIntensity: 0.6 });

export default function StudyStation({ badge = 0, hidden = false }) {
  const orbit = useRef();
  const body = useRef();
  const [hover, setHover] = useState(false);

  useFrame((_, dt) => {
    if (!orbit.current) return;
    orbit.current.rotation.y += dt * 0.07; // 아주 천천히 돈다
    body.current.rotation.y -= dt * 0.5;
    const s = THREE.MathUtils.damp(body.current.scale.x, hover ? 1.25 : 1, 8, dt);
    body.current.scale.setScalar(s);
  });

  const open = (e) => {
    if (hidden) return; // 숨겨 둔 동안엔 눌리지 않게 (보이지 않아도 3D 클릭은 닿는다)
    e.stopPropagation();
    sfx('tap');
    useUI.getState().openSheet('station');
  };

  return (
    <group rotation={[0.35, 0, 0.18]} visible={!hidden}>
      <group ref={orbit} rotation={[0, -1.2, 0]}>
        {/* 궤도선 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ORBIT, 0.006, 4, 120]} />
          <meshBasicMaterial color="#c9d6ff" transparent opacity={0.18} toneMapped={false} />
        </mesh>
        <group position={[ORBIT, 0, 0]}>
          <group
            ref={body}
            onClick={open}
            onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = 'pointer'))}
            onPointerOut={() => (setHover(false), (document.body.style.cursor = ''))}
          >
            {/* 가운데 몸통 + 둘레 고리 + 과목 색 창 다섯 개 */}
            <mesh material={hull}>
              <cylinderGeometry args={[0.13, 0.13, 0.22, 16]} />
            </mesh>
            <mesh material={glow('#9fe8ff', 1.6)} position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
            <mesh material={hull} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.3, 0.035, 8, 32]} />
            </mesh>
            {SUBJECTS.map((s, i) => {
              const a = (i / SUBJECTS.length) * Math.PI * 2;
              return (
                <mesh key={s} material={glow(SUBJECT_META[s].color, 1.5)} position={[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3]}>
                  <boxGeometry args={[0.08, 0.08, 0.08]} />
                </mesh>
              );
            })}
            {/* 태양 전지판 */}
            <mesh material={panel} position={[0.5, 0, 0]}>
              <boxGeometry args={[0.3, 0.012, 0.14]} />
            </mesh>
            <mesh material={panel} position={[-0.5, 0, 0]}>
              <boxGeometry args={[0.3, 0.012, 0.14]} />
            </mesh>
            {/* 손가락으로 누르기 쉽게 보이지 않는 큰 판 */}
            <mesh visible={false}>
              <sphereGeometry args={[0.55, 8, 6]} />
            </mesh>
          </group>
          <Html center position={[0, 0.48, 0]} zIndexRange={[12, 0]}>
            <button className="station-tag" onClick={open} style={hidden ? { display: 'none' } : undefined} tabIndex={hidden ? -1 : 0}>
              🛰 문제 정거장{badge > 0 && <b>{badge}</b>}
            </button>
          </Html>
        </group>
      </group>
    </group>
  );
}
