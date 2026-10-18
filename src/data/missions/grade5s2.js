// 5학년 2학기 문제 은행 (2022 개정 교육과정, 2026학년도)
// 5~6학년은 검정 교과서라 출판사마다 단원 이름·순서가 다르다.
//  - 수학: 출판사 공통 6단원 (engine/mathGen.js)
//  - 사회: 5-2는 역사 (선사·고대 → 고려 → 조선)
//  - 과학·국어: 5~6학년군 공통 주제. 쓰는 교과서에 맞춰 unit 순서만 조정하면 된다.
// unit: 학기 진도표(SCHEDULE)의 몇 번째 단원에 속하는지

export const SEMESTER = {
  start: '2026-08-24', // 2학기 첫 월요일 (학교 일정에 맞게 조정)
};

// 과목별 단원과 주 수. 날짜로 "지금 단원"을 계산한다.
export const SCHEDULE = {
  math: [3, 3, 3, 3, 3, 3],
  social: { titles: ['나라의 등장과 발전', '고려의 문화와 사람들', '조선과 유교 문화'], weeks: [6, 5, 7] },
  science: { titles: ['생물과 환경', '날씨와 우리 생활', '물체의 운동', '산과 염기'], weeks: [5, 4, 4, 5] },
};

export const SOCIAL = [
  // 0 나라의 등장과 발전
  { unit: 0, kind: 'choice', prompt: '돌을 깨뜨려 만든 도구를 사용하고 이동하며 살았던 시대는?', choices: ['구석기 시대', '신석기 시대', '청동기 시대', '철기 시대'], answer: 0 },
  { unit: 0, kind: 'choice', prompt: '신석기 시대 사람들이 음식을 저장하거나 조리할 때 쓴 그릇은?', choices: ['고려청자', '빗살무늬 토기', '백자', '분청사기'], answer: 1 },
  { unit: 0, kind: 'ox', prompt: '고인돌은 청동기 시대 지배자의 무덤이다.', answer: true },
  { unit: 0, kind: 'choice', prompt: '우리 역사에서 처음으로 세워진 나라는?', choices: ['고구려', '고조선', '신라', '백제'], answer: 1 },
  { unit: 0, kind: 'ox', prompt: '고조선에는 사회 질서를 지키기 위한 8조법이 있었다.', answer: true },
  { unit: 0, kind: 'choice', prompt: '영토를 크게 넓혀 고구려의 전성기를 이끈 왕은?', choices: ['광개토대왕', '세종대왕', '근초고왕', '진흥왕'], answer: 0 },
  { unit: 0, kind: 'choice', prompt: '4세기에 백제의 전성기를 이끈 왕은?', choices: ['장수왕', '근초고왕', '법흥왕', '문무왕'], answer: 1 },
  { unit: 0, kind: 'choice', prompt: '삼국을 통일한 나라는?', choices: ['고구려', '백제', '신라', '가야'], answer: 2 },
  { unit: 0, kind: 'choice', prompt: '고구려를 이어 대조영이 세운 나라는?', choices: ['발해', '고려', '조선', '가야'], answer: 0 },
  { unit: 0, kind: 'ox', prompt: '불국사와 석굴암은 신라 사람들의 불교 문화를 보여 주는 문화유산이다.', answer: true },
  // 1 고려
  { unit: 1, kind: 'choice', prompt: '고려를 세운 사람은?', choices: ['이성계', '왕건', '김유신', '대조영'], answer: 1 },
  { unit: 1, kind: 'choice', prompt: '고려 사람들이 만든, 맑은 푸른빛이 나는 도자기는?', choices: ['고려청자', '빗살무늬 토기', '조선백자', '옹기'], answer: 0 },
  { unit: 1, kind: 'choice', prompt: '고려 사람들이 부처의 힘으로 몽골의 침입을 막고자 만든 것은?', choices: ['훈민정음', '팔만대장경', '측우기', '거북선'], answer: 1 },
  { unit: 1, kind: 'ox', prompt: '「직지」는 현재 남아 있는 세계에서 가장 오래된 금속 활자본이다.', answer: true },
  { unit: 1, kind: 'choice', prompt: '거란의 침입 때 외교 담판으로 강동 6주를 얻은 사람은?', choices: ['서희', '강감찬', '이순신', '을지문덕'], answer: 0 },
  // 2 조선
  { unit: 2, kind: 'choice', prompt: '조선을 세운 사람은?', choices: ['왕건', '이성계', '정도전', '세종'], answer: 1 },
  { unit: 2, kind: 'choice', prompt: '조선의 도읍(수도)은?', choices: ['개경', '경주', '한양', '평양'], answer: 2 },
  { unit: 2, kind: 'ox', prompt: '조선은 유교를 나라를 다스리는 기본 원리로 삼았다.', answer: true },
  { unit: 2, kind: 'choice', prompt: '백성이 쉽게 글을 익히도록 훈민정음을 만든 왕은?', choices: ['태조', '세종', '정조', '영조'], answer: 1 },
  { unit: 2, kind: 'choice', prompt: '세종 때 비의 양을 재기 위해 만든 기구는?', choices: ['앙부일구', '측우기', '자격루', '혼천의'], answer: 1 },
  { unit: 2, kind: 'choice', prompt: '임진왜란 때 거북선을 이끌고 바다에서 큰 승리를 거둔 장군은?', choices: ['권율', '이순신', '곽재우', '김시민'], answer: 1 },
  { unit: 2, kind: 'ox', prompt: '경복궁은 조선의 으뜸 궁궐이다.', answer: true },
];

export const SCIENCE = [
  // 0 생물과 환경
  { unit: 0, kind: 'choice', prompt: '햇빛을 받아 스스로 양분을 만드는 생물을 무엇이라고 할까요?', choices: ['생산자', '소비자', '분해자', '포식자'], answer: 0 },
  { unit: 0, kind: 'choice', prompt: '죽은 생물이나 배출물을 분해해 양분을 얻는 생물은?', choices: ['벼', '토끼', '곰팡이', '독수리'], answer: 2 },
  { unit: 0, kind: 'ox', prompt: '여러 개의 먹이 사슬이 얽혀 그물처럼 연결된 것을 먹이 그물이라고 한다.', answer: true },
  { unit: 0, kind: 'ox', prompt: '생태계에서 한 생물의 수가 갑자기 줄어도 다른 생물에게는 아무 영향이 없다.', answer: false, explain: '먹고 먹히는 관계로 연결되어 있어 생태계 평형이 깨질 수 있어요.' },
  { unit: 0, kind: 'choice', prompt: '생태계를 이루는 요소 중 비생물 요소는?', choices: ['햇빛', '버섯', '참새', '민들레'], answer: 0 },
  // 1 날씨와 우리 생활
  { unit: 1, kind: 'choice', prompt: '공기 중에 수증기가 포함된 정도를 무엇이라고 할까요?', choices: ['기압', '습도', '온도', '풍속'], answer: 1 },
  { unit: 1, kind: 'choice', prompt: '새벽에 차가운 풀잎 표면에 수증기가 응결해 맺힌 물방울은?', choices: ['이슬', '안개', '구름', '서리'], answer: 0 },
  { unit: 1, kind: 'ox', prompt: '바람은 기압이 높은 곳에서 낮은 곳으로 분다.', answer: true },
  { unit: 1, kind: 'choice', prompt: '맑은 날 낮에 바닷가에서 부는 바람의 방향은?', choices: ['바다 → 육지', '육지 → 바다', '위 → 아래', '바람이 불지 않는다'], answer: 0, explain: '낮에는 육지가 빨리 데워져 육지 쪽 기압이 낮아요.' },
  { unit: 1, kind: 'ox', prompt: '같은 부피일 때 차가운 공기는 따뜻한 공기보다 무겁다.', answer: true },
  // 2 물체의 운동 (속력 계산은 아래 생성기)
  { unit: 2, kind: 'choice', prompt: '물체의 빠르기를 나타내는 값으로, 이동 거리를 걸린 시간으로 나눈 것은?', choices: ['속력', '무게', '부피', '온도'], answer: 0 },
  { unit: 2, kind: 'ox', prompt: '같은 시간 동안 더 먼 거리를 이동한 물체가 더 빠르다.', answer: true },
  { unit: 2, kind: 'choice', prompt: '자동차의 속력과 관련된 안전장치가 아닌 것은?', choices: ['안전띠', '에어백', '과속 방지 턱', '우산꽂이'], answer: 3 },
  // 3 산과 염기
  { unit: 3, kind: 'choice', prompt: '푸른색 리트머스 종이를 붉게 변하게 하는 용액은?', choices: ['산성 용액', '염기성 용액', '중성 용액', '모든 용액'], answer: 0 },
  { unit: 3, kind: 'choice', prompt: '페놀프탈레인 용액을 넣으면 붉은색으로 변하는 용액은?', choices: ['식초', '레몬즙', '묽은 수산화 나트륨 용액', '탄산수'], answer: 2 },
  { unit: 3, kind: 'ox', prompt: '식초와 레몬즙은 산성 용액이다.', answer: true },
  { unit: 3, kind: 'ox', prompt: '산성 용액에 염기성 용액을 계속 넣으면 산성이 점점 약해진다.', answer: true },
  { unit: 3, kind: 'choice', prompt: '붉은 양배추 지시약이 붉은 계열로 변하는 용액은?', choices: ['비눗물', '유리 세정제', '사이다', '석회수'], answer: 2 },
];

export const KOREAN = [
  { kind: 'choice', prompt: '"과일"과 "사과"의 관계처럼, 다른 낱말을 포함하는 낱말을 무엇이라고 할까요?', choices: ['상위어', '하위어', '반의어', '동음이의어'], answer: 0 },
  { kind: 'choice', prompt: '"발이 넓다"의 뜻으로 알맞은 것은?', choices: ['발 크기가 크다', '아는 사람이 많다', '걸음이 빠르다', '신발이 크다'], answer: 1 },
  { kind: 'choice', prompt: '"손이 크다"의 뜻으로 알맞은 것은?', choices: ['씀씀이가 넉넉하다', '손바닥이 넓다', '힘이 세다', '손재주가 좋다'], answer: 0 },
  { kind: 'choice', prompt: '바르게 쓴 문장은?', choices: ['숙제를 다 했어. 이제 돼.', '숙제를 다 했어. 이제 되.', '숙제를 다 했어. 이제 됬어.', '숙제를 다 했어. 이제 되요.'], answer: 0 },
  { kind: 'choice', prompt: '바르게 쓴 문장은?', choices: ['오늘은 왠일로 일찍 왔니?', '오늘은 웬일로 일찍 왔니?', '오늘은 웬지 일찍 왔니?', '오늘은 왠 일로 일찍 왔니?'], answer: 1 },
  { kind: 'ox', prompt: '"며칠"을 "몇일"로 쓰는 것은 바른 표기이다.', answer: false, explain: '"며칠"이 바른 표기예요.' },
  { kind: 'choice', prompt: '다음 중 "의견"에 해당하는 문장은?', choices: ['우리 학교는 1950년에 세워졌다.', '운동장에 나무를 더 심어야 한다.', '우리 반 학생은 25명이다.', '어제 비가 왔다.'], answer: 1 },
  { kind: 'choice', prompt: '여럿이 모여 문제를 해결하는 가장 좋은 방법을 찾으려고 협의하는 말하기는?', choices: ['토의', '토론', '발표', '면담'], answer: 0 },
  { kind: 'ox', prompt: '토론에서는 찬성과 반대 편으로 나누어 근거를 들어 주장한다.', answer: true },
  { kind: 'choice', prompt: '글을 요약하는 방법으로 알맞지 않은 것은?', choices: ['중요한 내용을 고른다', '비슷한 내용을 묶는다', '예시를 모두 자세히 쓴다', '글의 구조를 생각한다'], answer: 2 },
  { kind: 'choice', prompt: '높임 표현이 바르게 쓰인 문장은?', choices: ['할머니께서 진지를 잡수신다.', '할머니가 밥을 먹는다.', '할머니께서 밥을 먹는다.', '할머니가 진지를 먹는다.'], answer: 0 },
  { kind: 'choice', prompt: '"티끌 모아 태산"과 뜻이 비슷한 말은?', choices: ['작은 것도 모이면 크게 된다', '말 한마디로 천 냥 빚을 갚는다', '가는 말이 고와야 오는 말이 곱다', '소 잃고 외양간 고친다'], answer: 0 },
  { kind: 'choice', prompt: '여행하며 보고, 듣고, 느낀 것을 쓴 글은?', choices: ['기행문', '설명문', '논설문', '편지'], answer: 0 },
  { kind: 'ox', prompt: '기행문에는 여정, 견문, 감상이 드러난다.', answer: true },
  { kind: 'choice', prompt: '띄어쓰기가 바른 것은?', choices: ['먹을수있다', '먹을 수 있다', '먹을수 있다', '먹을 수있다'], answer: 1 },
  { kind: 'choice', prompt: '"너무 기뻐서 눈물이 났다"에서 글쓴이의 마음과 가장 가까운 것은?', choices: ['감동', '두려움', '지루함', '짜증'], answer: 0 },
];

// 영어: 5~6학년군 기본 어휘 (8개씩 한 주 묶음, 학기 진도에 따라 앞쪽부터)
export const ENGLISH_WORDS = [
  ['weekend', '주말'], ['favorite', '가장 좋아하는'], ['subject', '과목'], ['science', '과학'], ['history', '역사'], ['library', '도서관'], ['museum', '박물관'], ['vacation', '방학'],
  ['weather', '날씨'], ['cloudy', '흐린'], ['windy', '바람 부는'], ['season', '계절'], ['autumn', '가을'], ['winter', '겨울'], ['warm', '따뜻한'], ['cold', '추운'],
  ['breakfast', '아침 식사'], ['delicious', '맛있는'], ['healthy', '건강한'], ['exercise', '운동하다'], ['dentist', '치과 의사'], ['sick', '아픈'], ['headache', '두통'], ['medicine', '약'],
  ['travel', '여행하다'], ['island', '섬'], ['bridge', '다리'], ['village', '마을'], ['straight', '똑바로'], ['corner', '모퉁이'], ['next to', '~ 옆에'], ['between', '~ 사이에'],
  ['future', '미래'], ['dream', '꿈'], ['scientist', '과학자'], ['pilot', '조종사'], ['astronaut', '우주 비행사'], ['planet', '행성'], ['star', '별'], ['space', '우주'],
  ['borrow', '빌리다'], ['remember', '기억하다'], ['practice', '연습하다'], ['different', '다른'], ['same', '같은'], ['famous', '유명한'], ['festival', '축제'], ['special', '특별한'],
];

export const ENGLISH_EXPRESSIONS = [
  ['What grade are you in?', '너는 몇 학년이니?'],
  ['What time do you get up?', '너는 몇 시에 일어나니?'],
  ['How much is it?', '그것은 얼마예요?'],
  ['Where is the library?', '도서관은 어디에 있니?'],
  ['What do you want to be?', '너는 무엇이 되고 싶니?'],
  ['What’s wrong?', '무슨 일 있니? (어디 아프니?)'],
  ['Can I borrow your pencil?', '연필 좀 빌려도 될까?'],
  ['How was your vacation?', '방학은 어땠니?'],
  ['What’s the weather like?', '날씨가 어때?'],
  ['I want to be a scientist.', '나는 과학자가 되고 싶어.'],
];
