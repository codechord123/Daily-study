// 별에 놓는 소품 카탈로그. model 값은 three/items/models.jsx의 키와 맞춘다.
export const ITEM_CATEGORIES = [
  { id: 'nature', label: '자연' },
  { id: 'home', label: '생활' },
  { id: 'light', label: '빛' },
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
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// 캐릭터 꾸미기 (어린왕자 느낌: 목도리 + 망토 + 머리장식)
export const CHAR_PARTS = {
  skin: [
    { id: 'cream', color: '#f8e3cf', price: 0 },
    { id: 'peach', color: '#f2c6a5', price: 0 },
    { id: 'tan', color: '#d9a07b', price: 0 },
    { id: 'cocoa', color: '#a46f50', price: 0 },
  ],
  hair: [
    { id: 'gold', color: '#f5cf6a', price: 0 },
    { id: 'brown', color: '#7a5034', price: 0 },
    { id: 'black', color: '#2b2338', price: 0 },
    { id: 'pink', color: '#f39ac2', price: 30 },
    { id: 'mint', color: '#8fe3cf', price: 30 },
  ],
  coat: [
    { id: 'mint', color: '#7fcbb1', price: 0 },
    { id: 'sky', color: '#7fa9e6', price: 0 },
    { id: 'rose', color: '#e98aa6', price: 0 },
    { id: 'navy', color: '#3b437e', price: 20 },
    { id: 'lavender', color: '#a995e0', price: 20 },
  ],
  scarf: [
    { id: 'gold', color: '#ffd76a', price: 0 },
    { id: 'red', color: '#ef6b6b', price: 0 },
    { id: 'cyan', color: '#6ff3ff', price: 25 },
    { id: 'pink', color: '#ff7ad9', price: 25 },
  ],
  hat: [
    { id: 'none', name: '없음', price: 0 },
    { id: 'crown', name: '왕관', price: 80 },
    { id: 'star', name: '별 머리핀', price: 50 },
    { id: 'beanie', name: '털모자', price: 40 },
    { id: 'sprout', name: '새싹', price: 30 },
  ],
};

export const DEFAULT_CHARACTER = {
  skin: 'cream',
  hair: 'gold',
  coat: 'mint',
  scarf: 'gold',
  hat: 'none',
};

export function partColor(slot, id) {
  return CHAR_PARTS[slot].find((p) => p.id === id)?.color ?? CHAR_PARTS[slot][0].color;
}
