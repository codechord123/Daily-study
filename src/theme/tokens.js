// 3D와 UI가 함께 쓰는 색 토큰. CSS 변수(styles.css)와 값을 맞춰 둔다.
export const SPACE = {
  deep: '#070a22',
  mid: '#141a45',
  nebulaA: '#b44fc9',
  nebulaB: '#3fb6e0',
  nebulaC: '#f08aa8',
};

// 수채화 파스텔: 별 표면과 소품의 기본색
export const PASTEL = {
  rose: '#f2a7b8',
  peach: '#f6c89f',
  butter: '#f3e3a1',
  mint: '#a8dcc4',
  sky: '#9cc8ee',
  lavender: '#c3b2ec',
  cream: '#f7efe1',
  moss: '#8fbf8a',
  bark: '#a77b5b',
  stone: '#b9b3c9',
};

// 네온: 보상·상호작용 순간에만 쓴다
export const NEON = {
  gold: '#ffd76a',
  cyan: '#6ff3ff',
  pink: '#ff7ad9',
};

// 별 표면 색 선택지 (꾸미기에서 고름)
export const PLANET_TINTS = [
  { id: 'rose', base: PASTEL.rose, shade: '#a8607f' },
  { id: 'mint', base: PASTEL.mint, shade: '#4f8d86' },
  { id: 'sky', base: PASTEL.sky, shade: '#5571a8' },
  { id: 'butter', base: PASTEL.butter, shade: '#b48b5a' },
  { id: 'lavender', base: PASTEL.lavender, shade: '#6e5ca3' },
  { id: 'peach', base: PASTEL.peach, shade: '#b0705e' },
  { id: 'coral', base: '#f59a8b', shade: '#a8505a' },
  { id: 'lime', base: '#c8e68f', shade: '#6d9a4e' },
  { id: 'ice', base: '#dff1ff', shade: '#7f9cc8' },
  { id: 'sunset', base: '#ffc27a', shade: '#c0567a' },
  { id: 'midnight', base: '#7c83d6', shade: '#2e2f6e' },
  { id: 'aurora', base: '#9ff0d8', shade: '#7a5cc8' },
];

// 별 꾸미기: 고리 · 위성 · 빛 무리
export const PLANET_DECO = {
  ring: [
    { id: 'none', name: '없음', price: 0 },
    { id: 'gold', name: '금빛 고리', color: '#ffd76a', price: 70 },
    { id: 'ice', name: '얼음 고리', color: '#c8f6ff', price: 70 },
    { id: 'rainbow', name: '무지개 고리', color: 'rainbow', price: 120 },
    { id: 'double', name: '두 겹 고리', color: '#c3b2ec', price: 100 },
  ],
  moon: [
    { id: 'none', name: '없음', price: 0 },
    { id: 'small', name: '꼬마 달', color: '#f7efe1', price: 50 },
    { id: 'rocky', name: '바위 위성', color: '#b9b3c9', price: 50 },
    { id: 'heart', name: '하트 위성', color: '#ff8fb1', price: 80 },
    { id: 'twins', name: '쌍둥이 달', color: '#ffe08a', price: 100 },
  ],
  aura: [
    { id: 'cyan', name: '하늘빛', color: '#7fdcff', price: 0 },
    { id: 'gold', name: '금빛', color: '#ffd76a', price: 30 },
    { id: 'pink', name: '분홍빛', color: '#ff8fd0', price: 30 },
    { id: 'green', name: '오로라', color: '#8fffc8', price: 30 },
    { id: 'violet', name: '보랏빛', color: '#b48cff', price: 30 },
  ],
};

export const PLANET_RADIUS = 2;
