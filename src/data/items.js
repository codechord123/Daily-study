// 별에 놓는 소품 카탈로그. model 값은 three/items/models.jsx의 키와 맞춘다.
export const ITEM_CATEGORIES = [
  { id: 'animal', label: '동물' },
  { id: 'nature', label: '자연' },
  { id: 'home', label: '생활' },
  { id: 'light', label: '빛' },
  { id: 'play', label: '놀이' },
  { id: 'wonder', label: '신기한 것' },
];

export const ITEMS = [
  { id: 'rose', name: '유리덮개 장미', price: 40, category: 'nature', model: 'rose' },
  { id: 'tree', name: '몽실 나무', price: 30, category: 'nature', model: 'tree' },
  { id: 'pine', name: '뾰족 나무', price: 30, category: 'nature', model: 'pine' },
  { id: 'baobab', name: '바오밥 나무', price: 70, category: 'nature', model: 'baobab' },
  { id: 'flowers', name: '꽃밭', price: 15, category: 'nature', model: 'flowers' },
  { id: 'mushroom', name: '버섯', price: 20, category: 'nature', model: 'mushroom' },
  { id: 'rock', name: '조약돌', price: 10, category: 'nature', model: 'rock' },
  { id: 'house', name: '작은 집', price: 120, category: 'home', model: 'house' },
  { id: 'bench', name: '나무 벤치', price: 40, category: 'home', model: 'bench' },
  { id: 'fence', name: '울타리', price: 15, category: 'home', model: 'fence' },
  { id: 'mailbox', name: '우체통', price: 35, category: 'home', model: 'mailbox' },
  { id: 'lamp', name: '별빛 가로등', price: 60, category: 'light', model: 'lamp', glow: true },
  { id: 'lantern', name: '분홍 등불', price: 45, category: 'light', model: 'lantern', glow: true },
  { id: 'crystal', name: '푸른 수정', price: 70, category: 'light', model: 'crystal', glow: true },
  { id: 'volcano', name: '꼬마 화산', price: 80, category: 'wonder', model: 'volcano' },
  { id: 'telescope', name: '망원경', price: 90, category: 'wonder', model: 'telescope' },
  { id: 'rocket', name: '꼬마 로켓', price: 150, category: 'wonder', model: 'rocket' },
  // 동물
  { id: 'fox', name: '어린 여우', price: 90, category: 'animal', model: 'fox' },
  { id: 'sheepbox', name: '상자 속 양', price: 80, category: 'animal', model: 'sheepbox' },
  { id: 'cat', name: '회색 고양이', price: 70, category: 'animal', model: 'cat' },
  { id: 'bunny', name: '하얀 토끼', price: 70, category: 'animal', model: 'bunny' },
  // 꽃·나무
  { id: 'sunflower', name: '해바라기', price: 25, category: 'nature', model: 'sunflower' },
  { id: 'tulips', name: '튤립', price: 20, category: 'nature', model: 'tulips' },
  { id: 'cherry', name: '벚꽃 나무', price: 60, category: 'nature', model: 'cherry' },
  { id: 'cactus', name: '선인장', price: 25, category: 'nature', model: 'cactus' },
  { id: 'palm', name: '야자수', price: 55, category: 'nature', model: 'palm' },
  // 놀이
  { id: 'swing', name: '그네', price: 50, category: 'play', model: 'swing' },
  { id: 'tent', name: '캠핑 텐트', price: 60, category: 'play', model: 'tent' },
  { id: 'campfire', name: '모닥불', price: 45, category: 'play', model: 'campfire', glow: true },
  { id: 'snowman', name: '눈사람', price: 40, category: 'play', model: 'snowman' },
  { id: 'balloon', name: '열기구', price: 110, category: 'play', model: 'balloon' },
  // 생활·빛·신기한 것
  { id: 'windmill', name: '풍차', price: 100, category: 'home', model: 'windmill' },
  { id: 'fountain', name: '분수대', price: 85, category: 'home', model: 'fountain' },
  { id: 'starlamp', name: '별 등불', price: 55, category: 'light', model: 'starlamp', glow: true },
  { id: 'lighthouse', name: '등대', price: 130, category: 'light', model: 'lighthouse', glow: true },
  { id: 'rainbow', name: '무지개', price: 120, category: 'wonder', model: 'rainbow', glow: true },
  { id: 'flag', name: '내 별 깃발', price: 30, category: 'wonder', model: 'flag' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// 캐릭터 꾸미기 (어린왕자 느낌: 목도리 + 망토 + 머리장식)
export const CHAR_PARTS = {
  skin: [
    { id: 'cream', color: '#f8e3cf', price: 0 },
    { id: 'peach', color: '#f2c6a5', price: 0 },
    { id: 'tan', color: '#d9a07b', price: 0 },
    { id: 'cocoa', color: '#a46f50', price: 0 },
    { id: 'deep', color: '#7a4e36', price: 0 },
    { id: 'moon', color: '#dfe6ff', price: 40 },
  ],
  hairStyle: [
    { id: 'spiky', name: '삐죽 머리', price: 0 },
    { id: 'bob', name: '단발', price: 0 },
    { id: 'pigtails', name: '양갈래', price: 30 },
    { id: 'curly', name: '곱슬', price: 30 },
    { id: 'long', name: '긴 머리', price: 30 },
  ],
  hair: [
    { id: 'gold', color: '#f5cf6a', price: 0 },
    { id: 'brown', color: '#7a5034', price: 0 },
    { id: 'black', color: '#2b2338', price: 0 },
    { id: 'red', color: '#d9653b', price: 0 },
    { id: 'pink', color: '#f39ac2', price: 30 },
    { id: 'mint', color: '#8fe3cf', price: 30 },
    { id: 'blue', color: '#7fa9ff', price: 30 },
    { id: 'purple', color: '#a98bf0', price: 30 },
    { id: 'silver', color: '#e8ecf5', price: 40 },
  ],
  eyes: [
    { id: 'dot', name: '동글 눈', price: 0 },
    { id: 'sparkle', name: '반짝 눈', price: 20 },
    { id: 'smile', name: '웃는 눈', price: 20 },
    { id: 'sleepy', name: '졸린 눈', price: 20 },
  ],
  coat: [
    { id: 'mint', color: '#7fcbb1', price: 0 },
    { id: 'sky', color: '#7fa9e6', price: 0 },
    { id: 'rose', color: '#e98aa6', price: 0 },
    { id: 'butter', color: '#f3d77a', price: 0 },
    { id: 'navy', color: '#3b437e', price: 20 },
    { id: 'lavender', color: '#a995e0', price: 20 },
    { id: 'coral', color: '#f58f7c', price: 20 },
    { id: 'forest', color: '#4f8d6e', price: 20 },
    { id: 'white', color: '#f4f1fa', price: 30 },
  ],
  scarf: [
    { id: 'gold', color: '#ffd76a', price: 0 },
    { id: 'red', color: '#ef6b6b', price: 0 },
    { id: 'white', color: '#ffffff', price: 0 },
    { id: 'cyan', color: '#6ff3ff', price: 25 },
    { id: 'pink', color: '#ff7ad9', price: 25 },
    { id: 'green', color: '#7fe08a', price: 25 },
  ],
  cape: [
    { id: 'none', name: '없음', price: 0 },
    { id: 'royal', name: '푸른 망토', color: '#4a5bd6', price: 60 },
    { id: 'rose', name: '장미 망토', color: '#d9506f', price: 60 },
    { id: 'night', name: '밤하늘 망토', color: '#2b2f6e', star: true, price: 90 },
    { id: 'sun', name: '햇살 망토', color: '#ffb84a', price: 60 },
  ],
  hat: [
    { id: 'none', name: '없음', price: 0 },
    { id: 'crown', name: '왕관', price: 80 },
    { id: 'star', name: '별 머리핀', price: 50 },
    { id: 'beanie', name: '털모자', price: 40 },
    { id: 'sprout', name: '새싹', price: 30 },
    { id: 'wizard', name: '마법사 모자', price: 90 },
    { id: 'ribbon', name: '리본', price: 35 },
    { id: 'catEars', name: '고양이 귀', price: 45 },
    { id: 'flowers', name: '꽃 화관', price: 55 },
    { id: 'helmet', name: '우주 헬멧', price: 120 },
  ],
};

export const SLOT_LABEL = {
  skin: '피부',
  hairStyle: '머리 모양',
  hair: '머리 색',
  eyes: '눈',
  coat: '코트',
  scarf: '목도리',
  cape: '망토',
  hat: '머리 장식',
};

export const DEFAULT_CHARACTER = {
  skin: 'cream',
  hairStyle: 'spiky',
  hair: 'gold',
  eyes: 'dot',
  coat: 'mint',
  scarf: 'gold',
  cape: 'none',
  hat: 'none',
};

export function partColor(slot, id) {
  return CHAR_PARTS[slot].find((p) => p.id === id)?.color ?? CHAR_PARTS[slot][0].color;
}
