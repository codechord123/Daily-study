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
];

export const PLANET_RADIUS = 2;
