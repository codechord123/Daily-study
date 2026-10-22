# 나의 작은 별 — 작업 안내

- 5학년 아침 학습 웹앱 (Vite + React + R3F + zustand + Firebase). 사용자(선생님)와는 한국어로 이야기한다.
- **문제를 만들거나 고칠 때는 `docs/문제규칙.md` 를 따른다.** 문항 은행(`src/data/missions/bank/`)이나 수학 생성기(`src/engine/mathGen.js`, 그림은 `src/engine/mathFigures.js`)를 바꾸면 `npm run check:questions` 가 오류 0이어야 하고, `-- --sheet` 로 그림을 눈으로 확인한다.
- 새 단원 문제는 선생님 검수 전에는 앱에 넣지 않는다.
- 없앤 생성 문제 틀은 `src/data/missions/retired.js` 에 적는다.
