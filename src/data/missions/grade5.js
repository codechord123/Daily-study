// 5학년 샘플 문제 은행. 커리큘럼이 정해지면 이 형식 그대로 데이터만 늘린다.
// 분수는 프롬프트/보기 안에서 {분자/분모} 로 쓴다.

export const ENGLISH_WORDS = [
  ['morning', '아침'], ['planet', '행성'], ['travel', '여행하다'], ['friend', '친구'],
  ['library', '도서관'], ['weather', '날씨'], ['subject', '과목'], ['busy', '바쁜'],
  ['favorite', '가장 좋아하는'], ['science', '과학'], ['vacation', '방학'], ['museum', '박물관'],
  ['history', '역사'], ['healthy', '건강한'], ['dangerous', '위험한'], ['borrow', '빌리다'],
  ['delicious', '맛있는'], ['future', '미래'], ['island', '섬'], ['bridge', '다리'],
  ['star', '별'], ['rose', '장미'], ['volcano', '화산'], ['garden', '정원'],
  ['comfortable', '편안한'], ['different', '다른'], ['remember', '기억하다'], ['practice', '연습하다'],
  ['exercise', '운동'], ['festival', '축제'], ['village', '마을'], ['scientist', '과학자'],
];

export const INQUIRY = {
  korean: [
    { kind: 'choice', prompt: '"사과를 먹었다"에서 "먹었다"는 어떤 낱말일까요?', choices: ['이름을 나타내는 말', '움직임을 나타내는 말', '모양을 꾸미는 말', '느낌을 나타내는 말'], answer: 1 },
    { kind: 'ox', prompt: '"며칠"은 "몇일"로 쓰는 것이 맞다.', answer: false, explain: '"며칠"이 바른 표기예요.' },
    { kind: 'choice', prompt: '다음 중 높임 표현이 바르게 쓰인 문장은?', choices: ['할머니가 밥을 먹는다.', '할머니께서 진지를 잡수신다.', '할머니가 진지를 먹는다.', '할머니께서 밥을 먹는다.'], answer: 1 },
    { kind: 'ox', prompt: '토론에서는 근거를 들어 자기 주장을 말해야 한다.', answer: true },
    { kind: 'choice', prompt: '"낫다"를 바르게 쓴 문장은?', choices: ['감기가 다 나았다.', '감기가 다 낳았다.', '감기가 다 났았다.', '감기가 다 낮았다.'], answer: 0 },
  ],
  social: [
    { kind: 'choice', prompt: '우리나라 최초의 국가는 무엇일까요?', choices: ['고구려', '고조선', '신라', '백제'], answer: 1 },
    { kind: 'ox', prompt: '세종대왕은 훈민정음을 만들었다.', answer: true },
    { kind: 'choice', prompt: '지도에서 실제 거리를 줄인 정도를 나타내는 것은?', choices: ['방위표', '범례', '축척', '등고선'], answer: 2 },
    { kind: 'ox', prompt: '우리나라는 삼면이 바다로 둘러싸인 반도 국가이다.', answer: true },
    { kind: 'choice', prompt: '국민이 나라의 주인이 되어 함께 결정하는 정치는?', choices: ['왕정', '민주주의', '봉건제', '독재'], answer: 1 },
  ],
  science: [
    { kind: 'choice', prompt: '물이 끓어 수증기가 되는 현상은?', choices: ['응결', '증발', '끓음', '응고'], answer: 2 },
    { kind: 'ox', prompt: '태양계에서 태양과 가장 가까운 행성은 수성이다.', answer: true },
    { kind: 'choice', prompt: '식물이 빛을 받아 양분을 만드는 과정은?', choices: ['광합성', '증산 작용', '호흡', '발아'], answer: 0 },
    { kind: 'ox', prompt: '용액이 진할수록 물체가 더 잘 가라앉는다.', answer: false, explain: '진한 용액일수록 물체가 더 잘 떠요.' },
    { kind: 'choice', prompt: '온도를 정확하게 재는 데 쓰는 도구는?', choices: ['저울', '온도계', '눈금실린더', '돋보기'], answer: 1 },
  ],
};

export const SUBJECT_META = {
  math: { label: '수학', color: '#ffd76a' },
  english: { label: '영어', color: '#6ff3ff' },
  korean: { label: '국어', color: '#f2a7b8' },
  social: { label: '사회', color: '#a8dcc4' },
  science: { label: '과학', color: '#c3b2ec' },
};
