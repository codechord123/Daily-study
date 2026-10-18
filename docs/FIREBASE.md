# 반 전체 기기 연결하기 (Firebase)

키를 넣기 전에는 기록이 **각 기기에만** 저장돼요. 아래 순서대로 한 번만 설정하면 반 전체 크롬북·태블릿이 서로 연결돼요.
- 친구 별이 실시간으로 보이고, 같은 별에서 서로 만나요.
- 학생이 어느 기기로 들어와도 자기 별과 기록이 그대로예요.
- 선생님 화면에 반 전체 기록이 모이고, 출제 단원·여행 잠금 설정이 모든 기기에 바로 적용돼요.

## 1. Firebase 프로젝트 만들기 (약 10분)
1. https://console.firebase.google.com 에서 **프로젝트 추가** (Google 애널리틱스는 꺼도 됩니다 — 어린이 앱이라 끄는 것을 권장)
2. **빌드 → Authentication → 시작하기 → 로그인 방법 → 익명** 사용 설정
3. **빌드 → Firestore Database → 데이터베이스 만들기** (위치: `asia-northeast3 (서울)`, 프로덕션 모드)
4. **빌드 → Realtime Database → 데이터베이스 만들기** (위치: 싱가포르 등 가까운 곳, 잠금 모드)
5. **프로젝트 설정(⚙︎) → 일반 → 내 앱 → 웹(</>)** 으로 앱을 등록하고 나오는 `firebaseConfig` 값을 복사

## 2. 보안 규칙 올리기
Firebase 콘솔에서 직접 붙여 넣어도 되고, 컴퓨터에서 한 번에 올려도 돼요.
- Firestore → 규칙 탭에 저장소의 `firestore.rules` 내용을 붙여 넣고 **게시**
- Realtime Database → 규칙 탭에 `database.rules.json` 내용을 붙여 넣고 **게시**

(컴퓨터에서: `npx firebase-tools login` → `npx firebase-tools deploy --only firestore:rules,database --project 내프로젝트ID`)

## 3. Vercel에 키 넣기
Vercel → 프로젝트 → **Settings → Environment Variables** 에 아래를 추가하고 **Redeploy**

| 이름 | 값 (firebaseConfig에서) |
|---|---|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_DATABASE_URL` | databaseURL (Realtime Database 주소) |
| `VITE_FIREBASE_APP_ID` | appId |
| `VITE_CLASS_ID` | 학급 이름(영문·숫자), 예: `star5` |

이 값들은 원래 웹 페이지에 공개되는 값이라 넣어도 안전해요. 실제 보호는 2번의 보안 규칙이 맡아요.

## 4. 확인
- 선생님 화면 학생별 현황 아래에 **"☁︎ 학급 서버에 연결되어…"** 가 보이면 성공
- 두 기기에서 서로 다른 번호로 들어가 한쪽이 다른 쪽 별로 🚀 여행 → 서로 보이면 완료

## 운영 전에 바꿀 것
- 지금 보안 규칙은 **샘플 수준**이에요(로그인한 사람은 반 데이터를 읽고 쓸 수 있음). 실제로 쓰기 전에는 학생은 자기 문서만, 교사만 반 전체를 쓰도록 좁혀야 해요.
- 선생님 비밀번호(`0000`)는 학급 설정의 `teacherPin`이에요. Google 로그인으로 교사 계정을 붙이면 대체돼요.
- 별가루 보상은 아직 학생 기기에서 계산해요. 판매 단계에서는 Cloud Functions로 옮겨야 해요.

## 개발자용: 에뮬레이터로 시험하기
```bash
npx firebase-tools emulators:start --config firebase.emulator.json --only auth,firestore,database --project demo-dailystudy
VITE_FIREBASE_EMULATOR=1 npx vite --port 5174
```
