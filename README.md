# 나의 작은 별 (Daily Study)

매일 아침 미션을 풀고 별가루를 모아, 나만의 3D 별과 캐릭터를 꾸미고 친구 별로 여행하는 초등 아침 학습 앱.
지금은 **5학년 샘플 1개 반 · 로컬 데모** 단계입니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

- 학급 코드: `STAR5` → 번호 선택
- **실시간 함께 있기 체험**: 같은 브라우저에서 탭 두 개를 열고 서로 다른 번호로 로그인 → 한쪽이 🚀 여행으로 다른 쪽 별에 들어가면 서로 보이고, 이모트·꾸미기가 실시간으로 반영됩니다.
- 혼자 테스트할 때도 몇몇 친구(데모 봇)가 접속해 돌아다닙니다.
- 키보드(크롬북): ↑↓ 걷기, ←→ 방향 / 터치: 별을 탭하면 그곳으로 걸어감, 드래그로 별 돌리기

## 구조

```
src/
  theme/        디자인 토큰 (tokens.js ↔ styles.css)
  data/         아이템·캐릭터 카탈로그, 샘플 학급, 5학년 문제 은행
  engine/       미션 조립 (수학 자동 생성 + 영어 + 국·사·과 순환)
  store/        useGame(학생 상태·보상 규칙), useUI(화면 임시 상태), profileStore(저장소)
  services/     presence.js — 실시간 접속/위치 어댑터
  three/        3D: 수채화 별 셰이더, 캐릭터, 소품 모델, 별 장면, 우주 지도
  ui/           로그인, HUD, 꾸미기 패널, 미션 화면
```

## Firebase로 옮길 때 바꿀 곳 (화면 코드는 그대로)

| 지금 (로컬) | 교체 대상 |
|---|---|
| `store/profileStore.js` localStorage | Firestore `classes/{classId}/planets`, `students` |
| `services/presence.js` BroadcastChannel + 봇 | Realtime DB `presence/{classId}/{planetId}/{sid}` (onDisconnect) |
| `ui/Login.jsx` 학급코드+번호 | Google / 쎈에듀 로그인 |
| `useGame.completeMission` 클라이언트 보상 계산 | Cloud Functions (보상 조작 방지) |

## 규칙
- 미션 보상은 하루 1회, 다시 풀기는 연습 모드
- 연속 출석은 등교일 기준(주말 제외)
- 친구 별에서는 구경·하트(하루 1회)·이모트만 가능, 자유 채팅 없음
- 한 별에 8명까지 정상 표시, 그 이상은 반투명 실루엣
- 저사양 기기는 자동으로 "가볍게" 화질 (설정에서 변경)
