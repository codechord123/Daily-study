// 별에 놓는 소품 카탈로그. model 값은 three/items/models.jsx의 키와 맞춘다.
export const ITEM_CATEGORIES = [
  { id: 'animal', label: '동물' },
  { id: 'nature', label: '자연' },
  { id: 'home', label: '생활' },
  { id: 'light', label: '빛' },
  { id: 'play', label: '놀이' },
  { id: 'korea', label: '우리 문화' },
  { id: 'study', label: '공부' },
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
  // 우리 문화 (사회 역사 단원과 연결)
  { id: 'hanok', name: '한옥', price: 140, category: 'korea', model: 'hanok' },
  { id: 'pagoda', name: '석탑', price: 100, category: 'korea', model: 'pagoda' },
  { id: 'jangdok', name: '장독대', price: 60, category: 'korea', model: 'jangdok' },
  { id: 'stoneStack', name: '돌탑', price: 20, category: 'korea', model: 'stoneStack' },
  { id: 'lotusPond', name: '연꽃 연못', price: 70, category: 'korea', model: 'lotusPond' },
  // 집
  { id: 'castle', name: '작은 성', price: 200, category: 'home', model: 'castle' },
  { id: 'cottage', name: '통나무집', price: 130, category: 'home', model: 'cottage' },
  { id: 'mushroomHouse', name: '버섯 집', price: 120, category: 'home', model: 'mushroomHouse' },
  { id: 'signpost', name: '이정표', price: 25, category: 'home', model: 'signpost' },
  // 자연·놀이·탈것
  { id: 'hydrangea', name: '수국', price: 30, category: 'nature', model: 'hydrangea' },
  { id: 'seesaw', name: '시소', price: 50, category: 'play', model: 'seesaw' },
  { id: 'slide', name: '미끄럼틀', price: 60, category: 'play', model: 'slide' },
  { id: 'train', name: '꼬마 기차', price: 110, category: 'play', model: 'train' },
  { id: 'car', name: '꼬마 자동차', price: 90, category: 'play', model: 'car' },
  { id: 'gift', name: '선물 상자', price: 30, category: 'play', model: 'gift' },
  // 공부
  { id: 'books', name: '책 더미', price: 25, category: 'study', model: 'books' },
  { id: 'globe', name: '지구본', price: 60, category: 'study', model: 'globe' },
  // 신기한 것·빛
  { id: 'ufo', name: 'UFO', price: 180, category: 'wonder', model: 'ufo', glow: true },
  { id: 'dino', name: '아기 공룡', price: 150, category: 'animal', model: 'dino' },
  { id: 'shootingStar', name: '별똥별', price: 80, category: 'light', model: 'shootingStar', glow: true },
  { id: 'crystalCluster', name: '수정 덩굴', price: 90, category: 'light', model: 'crystalCluster', glow: true },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// 캐릭터 꾸미기 데이터는 data/character.js
export { DEFAULT_CHARACTER } from './character';
