import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Planet from './Planet';
import Character from './Character';
import { latLonToVec, surfaceQuaternion } from './sphere';
import { samplePlanet } from '../data/classroom';

const demo = samplePlanet('s07');
const standAt = latLonToVec(90, 0);

// 로그인 화면 뒤에서 천천히 도는 별 하나
export default function LoginBackdrop() {
  const g = useRef();
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.12;
  });
  return (
    <group position={[0, -1.4, -1]}>
      <ambientLight intensity={0.85} color="#c9c3ff" />
      <directionalLight position={[6, 8, 5]} intensity={1.6} color="#fff1d6" />
      <group ref={g} rotation={[0.25, 0, 0]}>
        <Planet tint="lavender" items={demo.items} />
      </group>
      <group position={standAt.clone().multiplyScalar(2)} quaternion={surfaceQuaternion(standAt, 20)}>
        <Character look={demo.character} />
      </group>
    </group>
  );
}
