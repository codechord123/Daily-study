// 소품 4차: 교과와 이어지는 것(첨성대·앙부일구·측우기·거북선·현미경·비커·풍향계) + 동물·자연·빛·놀이
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toon, glow, glass } from '../materials';
import { PASTEL, NEON } from '../../theme/tokens';

const M = (c) => toon(c);

/* ---------- 우리 문화 ---------- */

// 첨성대: 아래가 불룩하고 위가 좁은 돌탑, 가운데 창
function Cheomseongdae() {
  return (
    <group>
      <mesh material={M('#cfc9dc')} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
      </mesh>
      <mesh material={M('#d9cfbf')} position={[0, 0.2, 0]}>
        <latheGeometry args={[[[0.085, 0], [0.09, 0.08], [0.075, 0.2], [0.05, 0.32]].map(([x, y]) => ({ x, y })), 16]} />
      </mesh>
      {[0.06, 0.12, 0.18, 0.24].map((y) => (
        <mesh key={y} material={M('#bdb3a3')} position={[0, 0.04 + y, 0]}>
          <torusGeometry args={[0.087 - y * 0.12, 0.004, 4, 20]} />
        </mesh>
      ))}
      <mesh material={M('#5a4b6e')} position={[0, 0.2, 0.078]}>
        <boxGeometry args={[0.035, 0.035, 0.01]} />
      </mesh>
      <mesh material={M('#bdb3a3')} position={[0, 0.37, 0]}>
        <boxGeometry args={[0.11, 0.025, 0.11]} />
      </mesh>
    </group>
  );
}

// 앙부일구: 솥 모양 해시계, 바늘 그림자
function Sundial() {
  return (
    <group>
      <mesh material={M('#b9b3c9')} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.08, 12]} />
      </mesh>
      <mesh material={M('#c99a52')} position={[0, 0.13, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.12, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={M('#f3e3a1')} position={[0, 0.131, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.112, 20]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} material={M('#8a6a3a')} position={[Math.cos(i * 0.52) * 0.08, 0.133, Math.sin(i * 0.52) * 0.08]} rotation={[-Math.PI / 2, 0, -i * 0.52]}>
          <planeGeometry args={[0.035, 0.004]} />
        </mesh>
      ))}
      <mesh material={M('#5a4b6e')} position={[0, 0.17, -0.02]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
      </mesh>
    </group>
  );
}

// 측우기: 받침돌 위 빗물 통
function RainGauge() {
  return (
    <group>
      <mesh material={M('#cfc9dc')} position={[0, 0.04, 0]}>
        <boxGeometry args={[0.16, 0.08, 0.16]} />
      </mesh>
      <mesh material={M('#7c8aa8')} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.18, 16, 1, true]} />
      </mesh>
      {[0.1, 0.17, 0.24].map((y) => (
        <mesh key={y} material={M('#5f6c8a')} position={[0, y, 0]}>
          <torusGeometry args={[0.051, 0.006, 4, 16]} />
        </mesh>
      ))}
      <mesh material={glass()} position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.08, 14]} />
      </mesh>
    </group>
  );
}

// 거북선: 등에 뾰족한 가시, 앞에 용머리
function Geobukseon() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh material={M('#a77b5b')} position={[0, 0.04, 0]} scale={[1, 0.45, 0.6]}>
        <sphereGeometry args={[0.18, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh material={M('#6d8a6a')} position={[0, 0.06, 0]} scale={[1, 0.42, 0.62]}>
        <sphereGeometry args={[0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[-0.1, -0.05, 0, 0.05, 0.1].flatMap((x) => [-0.04, 0.04].map((z) => [x, z])).map(([x, z], i) => (
        <mesh key={i} material={M('#e8e2f0')} position={[x, 0.12 - Math.abs(x) * 0.25, z]}>
          <coneGeometry args={[0.008, 0.03, 4]} />
        </mesh>
      ))}
      <mesh material={M('#e0b25a')} position={[0.19, 0.08, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
      </mesh>
      <mesh material={M('#ef6b6b')} position={[0.22, 0.08, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#a77b5b')} position={[0, 0.03, s * 0.1]} rotation={[s * 0.5, 0, 0]}>
          <boxGeometry args={[0.2, 0.006, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- 공부 ---------- */

function Microscope() {
  return (
    <group>
      <mesh material={M('#5f6c8a')} position={[0, 0.015, 0]}>
        <boxGeometry args={[0.14, 0.03, 0.12]} />
      </mesh>
      <mesh material={M('#7c8aa8')} position={[-0.04, 0.12, 0]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[0.03, 0.2, 0.04]} />
      </mesh>
      <mesh material={M('#e8e2f0')} position={[0.02, 0.2, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.022, 0.026, 0.12, 12]} />
      </mesh>
      <mesh material={M('#5f6c8a')} position={[0.05, 0.26, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.016, 0.016, 0.03, 10]} />
      </mesh>
      <mesh material={M('#cfe9ff')} position={[0.03, 0.08, 0]}>
        <boxGeometry args={[0.08, 0.008, 0.07]} />
      </mesh>
    </group>
  );
}

// 비커와 시험관: 산성은 붉게, 염기성은 푸르게 (산과 염기 단원)
function Beakers() {
  return (
    <group>
      <mesh material={M('#a77b5b')} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.24, 0.04, 0.1]} />
      </mesh>
      <group position={[-0.06, 0.04, 0]}>
        <mesh material={M('#ff8fa8')} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 14]} />
        </mesh>
        <mesh material={glass()} position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 14, 1, true]} />
        </mesh>
      </group>
      {[[0.04, '#8ec9ff'], [0.08, '#c3b2ec']].map(([x, c]) => (
        <group key={x} position={[x, 0.04, 0]}>
          <mesh material={M(c)} position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.06, 10]} />
          </mesh>
          <mesh material={glass()} position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.017, 0.017, 0.14, 10, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 풍향계: 바람 따라 천천히 도는 화살 (날씨 단원)
function WeatherVane() {
  const head = useRef();
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 1.2;
  });
  return (
    <group>
      <mesh material={M('#5f6c8a')} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.34, 6]} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} material={M('#7c8aa8')} position={[0, 0.27, 0]} rotation={[0, (i * Math.PI) / 2, 0]}>
          <boxGeometry args={[0.16, 0.006, 0.006]} />
        </mesh>
      ))}
      <group ref={head} position={[0, 0.33, 0]}>
        <mesh material={M('#ef6b6b')} position={[0.07, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.022, 0.05, 8]} />
        </mesh>
        <mesh material={M('#5f6c8a')}>
          <boxGeometry args={[0.14, 0.008, 0.008]} />
        </mesh>
        <mesh material={M(PASTEL.butter)} position={[-0.07, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 0.004]} />
        </mesh>
      </group>
    </group>
  );
}

function Chalkboard() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M(PASTEL.bark)} position={[s * 0.11, 0.12, 0]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.015, 0.25, 0.015]} />
        </mesh>
      ))}
      <mesh material={M(PASTEL.bark)} position={[0, 0.16, 0.012]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.22, 0.15, 0.012]} />
      </mesh>
      <mesh material={M('#2f5a4a')} position={[0, 0.16, 0.02]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[0.2, 0.13]} />
      </mesh>
      {[[-0.05, 0.19], [0.03, 0.16], [-0.02, 0.12]].map(([x, y], i) => (
        <mesh key={i} material={M('#f7efe1')} position={[x, y, 0.024 - y * 0.15 + 0.02]} rotation={[0.15, 0, 0]}>
          <planeGeometry args={[0.07 - i * 0.015, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- 생활 ---------- */

// 빨랫줄: 습도가 낮으면 빨래가 잘 말라요 (날씨 단원)
function Clothesline() {
  const cloth = useRef();
  useFrame(({ clock }) => {
    cloth.current?.children.forEach((c, i) => (c.rotation.x = Math.sin(clock.elapsedTime * 2 + i) * 0.15));
  });
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M(PASTEL.bark)} position={[s * 0.15, 0.13, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.26, 6]} />
        </mesh>
      ))}
      <mesh material={M('#f7efe1')} position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.002, 0.002, 0.3, 4]} />
      </mesh>
      <group ref={cloth}>
        {[[-0.08, '#9cc8ee'], [0, '#f2a7b8'], [0.08, '#f3e3a1']].map(([x, c]) => (
          <group key={x} position={[x, 0.24, 0]}>
            <mesh material={M(c)} position={[0, -0.04, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.004]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Well() {
  return (
    <group>
      <mesh material={M(PASTEL.stone)} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.1, 14, 1, true]} />
      </mesh>
      <mesh material={M('#5f8fbf')} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 14]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M(PASTEL.bark)} position={[s * 0.1, 0.17, 0]}>
          <boxGeometry args={[0.015, 0.2, 0.015]} />
        </mesh>
      ))}
      <mesh material={M('#c0705a')} position={[0, 0.29, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.001, 0.13, 0.26, 4, 1, false, Math.PI / 4]} />
      </mesh>
      <mesh material={M(PASTEL.bark)} position={[0, 0.16, 0.06]}>
        <cylinderGeometry args={[0.018, 0.015, 0.03, 8]} />
      </mesh>
    </group>
  );
}

function Picnic() {
  return (
    <group>
      <mesh material={M('#f2a7b8')} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.24]} />
      </mesh>
      {[-0.1, 0, 0.1].map((x) => (
        <mesh key={x} material={M('#f7efe1')} position={[x, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 0.24]} />
        </mesh>
      ))}
      <mesh material={M('#c99a52')} position={[0.05, 0.04, 0.02]}>
        <boxGeometry args={[0.1, 0.06, 0.07]} />
      </mesh>
      <mesh material={M('#a77b5b')} position={[0.05, 0.09, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.035, 0.005, 4, 12, Math.PI]} />
      </mesh>
      <mesh material={M('#ef6b6b')} position={[-0.07, 0.025, -0.04]}>
        <sphereGeometry args={[0.025, 10, 8]} />
      </mesh>
    </group>
  );
}

/* ---------- 동물 ---------- */

function Penguin() {
  return (
    <group>
      <mesh material={M('#3c4166')} position={[0, 0.11, 0]} scale={[1, 1.3, 0.9]}>
        <sphereGeometry args={[0.08, 14, 12]} />
      </mesh>
      <mesh material={M('#f7efe1')} position={[0, 0.1, 0.035]} scale={[0.8, 1.15, 0.6]}>
        <sphereGeometry args={[0.07, 14, 12]} />
      </mesh>
      <mesh material={M('#3c4166')} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#20233a')} position={[s * 0.02, 0.235, 0.048]}>
          <sphereGeometry args={[0.008, 6, 6]} />
        </mesh>
      ))}
      <mesh material={M('#f6a54c')} position={[0, 0.215, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.014, 0.03, 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#f6a54c')} position={[s * 0.03, 0.01, 0.02]} scale={[1, 0.4, 1.4]}>
          <sphereGeometry args={[0.02, 6, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Turtle() {
  return (
    <group>
      <mesh material={M('#6d9a5a')} position={[0, 0.05, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[[0, 0.1, 0], [0.05, 0.08, 0.04], [-0.05, 0.08, 0.04], [0.05, 0.08, -0.04], [-0.05, 0.08, -0.04]].map((p, i) => (
        <mesh key={i} material={M('#8fbf6a')} position={p} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      ))}
      <mesh material={M('#b8d98a')} position={[0, 0.04, 0.11]}>
        <sphereGeometry args={[0.032, 10, 8]} />
      </mesh>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <mesh key={i} material={M('#b8d98a')} position={[x * 0.07, 0.015, z * 0.06]}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Owl() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
      </mesh>
      <group position={[0, 0.07, 0]}>
        <mesh material={M('#a98b6c')} position={[0, 0.07, 0]} scale={[1, 1.15, 0.9]}>
          <sphereGeometry args={[0.07, 14, 12]} />
        </mesh>
        <mesh material={M('#e8d8bf')} position={[0, 0.06, 0.04]} scale={[0.8, 0.9, 0.5]}>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.028, 0.1, 0.055]}>
            <mesh material={M('#ffffff')}>
              <sphereGeometry args={[0.022, 10, 8]} />
            </mesh>
            <mesh material={M('#20233a')} position={[0, 0, 0.016]}>
              <sphereGeometry args={[0.011, 8, 6]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} material={M('#8a6d50')} position={[s * 0.04, 0.155, 0]} rotation={[0, 0, s * -0.4]}>
            <coneGeometry args={[0.015, 0.04, 5]} />
          </mesh>
        ))}
        <mesh material={M('#f6a54c')} position={[0, 0.078, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.01, 0.02, 5]} />
        </mesh>
      </group>
    </group>
  );
}

function Duck() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.06;
  });
  return (
    <group>
      <mesh material={M('#7fb6e8')} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 20]} />
      </mesh>
      <group ref={g} position={[0, 0.04, 0]}>
        <mesh material={M('#f3e3a1')} scale={[1.3, 0.8, 1]}>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
        <mesh material={M('#f3e3a1')} position={[0.05, 0.06, 0]}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
        <mesh material={M('#f6a54c')} position={[0.09, 0.055, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.5]}>
          <coneGeometry args={[0.015, 0.03, 6]} />
        </mesh>
        <mesh material={M('#20233a')} position={[0.07, 0.07, 0.022]}>
          <sphereGeometry args={[0.006, 6, 6]} />
        </mesh>
      </group>
    </group>
  );
}

// 나비: 꽃 위에서 날개를 팔랑
function Butterfly() {
  const wings = useRef();
  const body = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (wings.current) wings.current.children.forEach((w, i) => (w.rotation.y = (i ? -1 : 1) * (0.3 + Math.abs(Math.sin(t * 7)) * 1.0)));
    if (body.current) body.current.position.y = 0.22 + Math.sin(t * 1.5) * 0.03;
  });
  return (
    <group>
      <mesh material={M(PASTEL.moss)} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.006, 0.008, 0.14, 5]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} material={M('#f2a7b8')} position={[Math.cos(i * 1.256) * 0.025, 0.145, Math.sin(i * 1.256) * 0.025]}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
      ))}
      <group ref={body} position={[0, 0.22, 0]}>
        <mesh material={M('#3c4166')}>
          <capsuleGeometry args={[0.006, 0.04, 4, 6]} />
        </mesh>
        <group ref={wings}>
          {[1, -1].map((s) => (
            <group key={s}>
              <mesh material={M(s > 0 ? '#c3b2ec' : '#9cc8ee')} position={[s * 0.035, 0.01, 0]} scale={[1, 1.2, 0.2]}>
                <sphereGeometry args={[0.032, 10, 8]} />
              </mesh>
              <mesh material={M('#f3e3a1')} position={[s * 0.028, -0.025, 0]} scale={[1, 1, 0.2]}>
                <sphereGeometry args={[0.02, 8, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/* ---------- 자연 ---------- */

function Bamboo() {
  return (
    <group>
      {[[0, 0, 0.42], [0.06, 0.03, 0.34], [-0.05, -0.04, 0.3]].map(([x, z, h], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={M('#8fbf6a')} position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.014, 0.016, h, 8]} />
          </mesh>
          {[0.25, 0.5, 0.75].map((k) => (
            <mesh key={k} material={M('#6d9a5a')} position={[0, h * k, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.008, 8]} />
            </mesh>
          ))}
          <mesh material={M('#a8dc7a')} position={[0.03, h * 0.9, 0]} rotation={[0, 0, -0.8]} scale={[1, 0.25, 0.5]}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Maple() {
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.2, 8]} />
      </mesh>
      {[[0, 0.26, 0, 0.11, '#f08a5a'], [0.07, 0.22, 0.03, 0.08, '#f2b25a'], [-0.07, 0.23, -0.02, 0.085, '#e8664f'], [0, 0.32, 0.02, 0.07, '#f2b25a']].map(([x, y, z, r, c], i) => (
        <mesh key={i} material={M(c)} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 0]} />
        </mesh>
      ))}
      {[[0.1, 0.01, 0.05], [-0.08, 0.01, 0.07]].map((p, i) => (
        <mesh key={i} material={M('#f08a5a')} position={p} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.02, 5]} />
        </mesh>
      ))}
    </group>
  );
}

function Clover() {
  return (
    <group>
      {[[0, 0, 1], [0.08, 0.05, 0.8], [-0.07, 0.06, 0.75]].map(([x, z, k], j) => (
        <group key={j} position={[x, 0, z]} scale={k}>
          <mesh material={M('#6d9a5a')} position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 4]} />
          </mesh>
          {[0, 1, 2, 3].slice(0, j === 0 ? 4 : 3).map((i) => (
            <mesh key={i} material={M(j === 0 ? '#7fd36a' : '#8fbf6a')} position={[Math.cos((i * Math.PI) / 2) * 0.022, 0.082, Math.sin((i * Math.PI) / 2) * 0.022]} scale={[1, 0.25, 1]}>
              <sphereGeometry args={[0.022, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- 빛 ---------- */

function FireflyJar() {
  const flies = useRef();
  useFrame(({ clock }) => {
    flies.current?.children.forEach((f, i) => {
      const t = clock.elapsedTime * (0.8 + i * 0.2) + i * 2;
      f.position.set(Math.sin(t) * 0.03, 0.09 + Math.sin(t * 1.7) * 0.035, Math.cos(t * 1.3) * 0.03);
      f.scale.setScalar(0.6 + Math.abs(Math.sin(t * 3)) * 0.6);
    });
  });
  return (
    <group>
      <mesh material={glass()} position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.16, 14]} />
      </mesh>
      <mesh material={M(PASTEL.bark)} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.025, 14]} />
      </mesh>
      <group ref={flies}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={glow('#d7ff7a', 2)}>
            <sphereGeometry args={[0.008, 6, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function MoonLamp() {
  return (
    <group>
      <mesh material={M('#5f6c8a')} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.04, 12]} />
      </mesh>
      <mesh material={M('#5f6c8a')} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
      </mesh>
      <mesh material={glow('#fff1c4', 1.5)} position={[0, 0.17, 0]}>
        <sphereGeometry args={[0.07, 18, 14]} />
      </mesh>
      {[[0.03, 0.2, 0.06], [-0.03, 0.15, 0.065], [0.01, 0.13, 0.068]].map((p, i) => (
        <mesh key={i} material={M('#e8d8a8')} position={p}>
          <sphereGeometry args={[0.012, 6, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Candle() {
  const flame = useRef();
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.set(1, 1 + Math.sin(clock.elapsedTime * 11) * 0.15, 1);
  });
  return (
    <group>
      <mesh material={M('#c99a52')} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.02, 14]} />
      </mesh>
      {[[0, 0.1], [0.035, 0.07], [-0.03, 0.06]].map(([x, h], i) => (
        <group key={i} position={[x, 0.02, i === 2 ? 0.02 : 0]}>
          <mesh material={M('#f7efe1')} position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.014, 0.014, h, 10]} />
          </mesh>
          <mesh ref={i === 0 ? flame : undefined} material={glow(NEON.gold, 2)} position={[0, h + 0.015, 0]} scale={[1, 1.6, 1]}>
            <sphereGeometry args={[0.01, 8, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- 놀이 ---------- */

function Kite() {
  const k = useRef();
  useFrame(({ clock }) => {
    if (k.current) {
      const t = clock.elapsedTime;
      k.current.position.set(Math.sin(t * 0.6) * 0.03, 0.42 + Math.sin(t * 1.1) * 0.03, 0);
      k.current.rotation.z = Math.sin(t * 0.9) * 0.2;
    }
  });
  return (
    <group>
      <mesh material={M(PASTEL.bark)} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
      </mesh>
      <mesh material={M('#f7efe1')} position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.38, 3]} />
      </mesh>
      <group ref={k}>
        {/* 방패연: 가운데 둥근 구멍 */}
        <mesh material={M('#f7efe1')}>
          <boxGeometry args={[0.13, 0.16, 0.004]} />
        </mesh>
        <mesh material={M('#ef6b6b')} position={[0, 0.06, 0.003]}>
          <circleGeometry args={[0.025, 12]} />
        </mesh>
        <mesh material={M('#4c4f86')} position={[0, 0, 0.003]}>
          <ringGeometry args={[0.02, 0.028, 14]} />
        </mesh>
      </group>
    </group>
  );
}

function Trampoline() {
  const pad = useRef();
  useFrame(({ clock }) => {
    if (pad.current) pad.current.position.y = 0.06 - Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.01;
  });
  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} material={M('#5f6c8a')} position={[Math.cos(i * 1.047) * 0.13, 0.03, Math.sin(i * 1.047) * 0.13]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 5]} />
        </mesh>
      ))}
      <mesh material={M('#9cc8ee')} position={[0, 0.062, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.014, 6, 24]} />
      </mesh>
      <mesh ref={pad} material={M('#3c4166')} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 20]} />
      </mesh>
    </group>
  );
}

function SoccerBall() {
  return (
    <group position={[0, 0.06, 0]}>
      <mesh material={M('#f7efe1')}>
        <icosahedronGeometry args={[0.06, 1]} />
      </mesh>
      {[[0, 1, 0], [0.9, 0.3, 0.3], [-0.6, 0.3, 0.75], [-0.6, 0.3, -0.75], [0.3, -0.3, -0.9], [0.3, -0.3, 0.9], [-0.9, -0.3, 0], [0, -1, 0]].map(([x, y, z], i) => (
        <mesh key={i} material={M('#3c4166')} position={[x * 0.056, y * 0.056, z * 0.056]} rotation={[Math.atan2(Math.hypot(x, z), y), Math.atan2(x, z), 0]}>
          <circleGeometry args={[0.016, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- 신기한 것 ---------- */

function CrystalBall() {
  const inner = useRef();
  useFrame(({ clock }) => {
    if (inner.current) {
      inner.current.rotation.y = clock.elapsedTime * 0.8;
      inner.current.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 2) * 0.1);
    }
  });
  return (
    <group>
      <mesh material={M('#7a5aa8')} position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.05, 6]} />
      </mesh>
      <mesh ref={inner} material={glow(NEON.pink, 1.4)} position={[0, 0.115, 0]}>
        <octahedronGeometry args={[0.03, 0]} />
      </mesh>
      <mesh material={glass()} position={[0, 0.115, 0]}>
        <sphereGeometry args={[0.065, 18, 14]} />
      </mesh>
    </group>
  );
}

function Robot() {
  const head = useRef();
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * 0.9) * 0.5;
  });
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#7c8aa8')} position={[s * 0.03, 0.03, 0]}>
          <boxGeometry args={[0.025, 0.06, 0.03]} />
        </mesh>
      ))}
      <mesh material={M('#cfe9ff')} position={[0, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.09, 0.07]} />
      </mesh>
      <mesh material={glow(NEON.cyan, 1.2)} position={[0, 0.1, 0.036]}>
        <circleGeometry args={[0.014, 10]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M('#7c8aa8')} position={[s * 0.065, 0.1, 0]} rotation={[0, 0, s * 0.3]}>
          <capsuleGeometry args={[0.01, 0.05, 4, 6]} />
        </mesh>
      ))}
      <group ref={head} position={[0, 0.18, 0]}>
        <mesh material={M('#e8e2f0')}>
          <boxGeometry args={[0.08, 0.06, 0.065]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={glow(NEON.cyan, 1.6)} position={[s * 0.018, 0.005, 0.033]}>
            <circleGeometry args={[0.008, 8]} />
          </mesh>
        ))}
        <mesh material={M('#7c8aa8')} position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.03, 4]} />
        </mesh>
        <mesh material={glow('#ff8fa8', 1.6)} position={[0, 0.065, 0]}>
          <sphereGeometry args={[0.009, 6, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export const MODELS4 = {
  cheomseongdae: Cheomseongdae,
  sundial: Sundial,
  rainGauge: RainGauge,
  geobukseon: Geobukseon,
  microscope: Microscope,
  beakers: Beakers,
  weatherVane: WeatherVane,
  chalkboard: Chalkboard,
  clothesline: Clothesline,
  well: Well,
  picnic: Picnic,
  penguin: Penguin,
  turtle: Turtle,
  owl: Owl,
  duck: Duck,
  butterfly: Butterfly,
  bamboo: Bamboo,
  maple: Maple,
  clover: Clover,
  fireflyJar: FireflyJar,
  moonLamp: MoonLamp,
  candle: Candle,
  kite: Kite,
  trampoline: Trampoline,
  soccerBall: SoccerBall,
  crystalBall: CrystalBall,
  robot: Robot,
};
