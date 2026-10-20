import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { nebulaMaterial } from './materials';
import { SPACE, NEON } from '../theme/tokens';
import { ShootingStars } from './SkyExtras';

// 수채화 성운 + 별빛 + 떠다니는 별가루
export default function SpaceBackdrop({ low, lite }) {
  const mat = useMemo(() => nebulaMaterial(SPACE), []);
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });
  return (
    <>
      <mesh material={mat} renderOrder={-1}>
        <sphereGeometry args={[90, 32, 16]} />
      </mesh>
      <Stars radius={60} depth={20} count={lite ? 600 : low ? 1200 : 3000} factor={3.2} saturation={0.4} fade speed={0.6} />
      {!low && <ShootingStars />}
      {!lite && <Sparkles count={low ? 30 : 70} scale={[16, 10, 16]} size={2.4} speed={0.25} color={NEON.gold} opacity={0.7} />}
    </>
  );
}
