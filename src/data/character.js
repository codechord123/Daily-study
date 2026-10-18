// 캐릭터 꾸미기 데이터. 색은 팔레트에서 자유롭게, 모양은 별가루로 모은다.

// 모든 색 칸이 함께 쓰는 팔레트 (무료)
export const PALETTE = [
  '#f8e3cf', '#f2c6a5', '#d9a07b', '#a46f50', '#7a4e36', '#3b2a22',
  '#ffffff', '#e8ecf5', '#b9b3c9', '#6b6386', '#3b437e', '#2b2338',
  '#ffd76a', '#ffb84a', '#f58f7c', '#ef6b6b', '#d9506f', '#ff8fb1',
  '#c3b2ec', '#a98bf0', '#7fa9ff', '#6ff3ff', '#7fcbb1', '#8fd18a',
];

export const COLOR_SLOTS = {
  skin: { label: '피부·털', def: '#f8e3cf' },
  hair: { label: '머리 색', def: '#f5cf6a' },
  coat: { label: '옷 색', def: '#7fcbb1' },
  accent: { label: '포인트 색', def: '#ffd76a' },
  scarf: { label: '목도리 색', def: '#ffd76a' },
  capeColor: { label: '망토 색', def: '#4a5bd6' },
  petColor: { label: '펫 색', def: '#f7efe1' },
};

const o = (id, name, price = 0, extra) => ({ id, name, price, ...extra });

export const OPTION_SLOTS = {
  species: {
    label: '종족',
    options: [
      o('human', '사람'), o('cat', '고양이', 0), o('dog', '강아지', 0), o('bunny', '토끼', 0),
      o('bear', '곰', 40), o('fox', '여우', 40), o('penguin', '펭귄', 60), o('robot', '로봇', 80),
      o('alien', '외계인', 80), o('ghost', '꼬마 유령', 100),
    ],
  },
  eyes: {
    label: '눈',
    options: [o('dot', '동글'), o('sparkle', '반짝', 20), o('smile', '웃음', 20), o('sleepy', '졸린', 20), o('wink', '윙크', 30), o('star', '별눈', 40)],
  },
  hairStyle: {
    label: '머리 모양',
    options: [
      o('spiky', '삐죽'), o('bob', '단발'), o('pigtails', '양갈래', 30), o('curly', '곱슬', 30),
      o('long', '긴 머리', 30), o('bun', '똥머리', 30), o('mohawk', '닭벼슬', 40), o('none', '민머리'),
    ],
  },
  hat: {
    label: '머리 장식',
    options: [
      o('none', '없음'), o('crown', '왕관', 80), o('star', '별 머리핀', 50), o('beanie', '털모자', 40),
      o('sprout', '새싹', 30), o('wizard', '마법사 모자', 90), o('ribbon', '리본', 35), o('catEars', '고양이 귀', 45),
      o('flowers', '꽃 화관', 55), o('helmet', '우주 헬멧', 120), o('headband', '머리띠', 25), o('cap', '야구 모자', 40),
      o('pirate', '해적 모자', 70), o('santa', '산타 모자', 60), o('bunnyBand', '토끼 머리띠', 45), o('halo', '천사 고리', 90),
      o('unicorn', '유니콘 뿔', 100),
    ],
  },
  outfit: {
    label: '옷',
    options: [
      o('coat', '어린왕자 코트'), o('overalls', '멜빵바지', 40), o('dress', '원피스', 40), o('hoodie', '후드티', 40),
      o('hanbok', '한복', 80), o('tuxedo', '턱시도', 80), o('spacesuit', '우주복', 120),
    ],
  },
  cape: {
    label: '망토',
    options: [o('none', '없음'), o('plain', '망토', 60), o('stars', '별무늬 망토', 90)],
  },
  acc: {
    label: '소품',
    options: [
      o('none', '없음'), o('glasses', '동그란 안경', 30), o('sunglasses', '선글라스', 40), o('heartGlasses', '하트 안경', 50),
      o('backpack', '책가방', 40), o('wand', '별 지팡이', 70), o('bouquet', '꽃다발', 50), o('balloon', '풍선', 30),
      o('angelWings', '천사 날개', 120), o('butterflyWings', '나비 날개', 110), o('fairyWings', '요정 날개', 130),
    ],
  },
  pet: {
    label: '펫',
    options: [
      o('none', '없음'), o('puppy', '강아지', 60), o('kitty', '고양이', 60), o('bunny', '토끼', 60), o('chick', '병아리', 40),
      o('hamster', '햄스터', 50), o('sheep', '아기 양', 70), o('penguin', '펭귄', 80), o('fox', '아기 여우', 90),
      o('owl', '부엉이', 90), o('dragon', '아기 용', 150), o('jellyfish', '우주 해파리', 120), o('spirit', '별의 정령', 140),
      o('drone', '꼬마 드론', 110),
    ],
  },
};

export const DEFAULT_CHARACTER = {
  species: 'human',
  eyes: 'dot',
  hairStyle: 'spiky',
  hat: 'none',
  outfit: 'coat',
  cape: 'none',
  acc: 'none',
  pet: 'none',
  ...Object.fromEntries(Object.entries(COLOR_SLOTS).map(([k, v]) => [k, v.def])),
};

// 예전 저장 데이터(색 이름)를 색 값으로 바꿔 읽는다
const LEGACY = {
  skin: { cream: '#f8e3cf', peach: '#f2c6a5', tan: '#d9a07b', cocoa: '#a46f50', deep: '#7a4e36', moon: '#dfe6ff' },
  hair: { gold: '#f5cf6a', brown: '#7a5034', black: '#2b2338', red: '#d9653b', pink: '#f39ac2', mint: '#8fe3cf', blue: '#7fa9ff', purple: '#a98bf0', silver: '#e8ecf5' },
  coat: { mint: '#7fcbb1', sky: '#7fa9e6', rose: '#e98aa6', butter: '#f3d77a', navy: '#3b437e', lavender: '#a995e0', coral: '#f58f7c', forest: '#4f8d6e', white: '#f4f1fa' },
  scarf: { gold: '#ffd76a', red: '#ef6b6b', white: '#ffffff', cyan: '#6ff3ff', pink: '#ff7ad9', green: '#7fe08a' },
};
const LEGACY_CAPE = { royal: ['plain', '#4a5bd6'], rose: ['plain', '#d9506f'], night: ['stars', '#2b2f6e'], sun: ['plain', '#ffb84a'] };

export function normalizeLook(raw = {}) {
  const look = { ...DEFAULT_CHARACTER, ...raw };
  for (const slot of Object.keys(LEGACY)) {
    const v = look[slot];
    if (v && !String(v).startsWith('#')) look[slot] = LEGACY[slot][v] ?? COLOR_SLOTS[slot].def;
  }
  if (LEGACY_CAPE[look.cape]) {
    const [style, color] = LEGACY_CAPE[look.cape];
    look.cape = style;
    if (!raw.capeColor) look.capeColor = color;
  }
  for (const [slot, def] of Object.entries(OPTION_SLOTS)) {
    if (!def.options.some((x) => x.id === look[slot])) look[slot] = DEFAULT_CHARACTER[slot];
  }
  return look;
}

// 꾸미기 탭 묶음
export const LOOK_GROUPS = [
  { id: 'body', label: '몸', slots: ['species', 'skin', 'eyes'] },
  { id: 'head', label: '머리', slots: ['hairStyle', 'hair', 'hat'] },
  { id: 'wear', label: '옷', slots: ['outfit', 'coat', 'accent', 'scarf', 'cape', 'capeColor'] },
  { id: 'extra', label: '소품·펫', slots: ['acc', 'pet', 'petColor'] },
];

export const SPECIES_WITH_HAIR = new Set(['human', 'alien']);
