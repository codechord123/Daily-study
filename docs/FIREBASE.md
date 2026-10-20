# 반 전체 기기 연결하기 (Firebase)

키를 넣기 전에는 기록이 **각 기기에만** 저장돼요. 아래 순서대로 한 번만 설정하면 반 전체 크롬북·태블릿이 서로 연결돼요.
- 친구 별이 실시간으로 보이고, 같은 별에서 서로 만나요.
- 학생이 어느 기기로 들어와도 자기 별과 기록이 그대로예요.
- 선생님 화면에 반 전체 기록이 모이고, 출제 단원·여행 잠금 설정이 모든 기기에 바로 적용돼요.

## 1. Firebase 프로젝트 만들기 (약 10분)
1. https://console.firebase.google.com 에서 **프로젝트 추가** (Google 애널리틱스는 꺼도 됩니다 — 어린이 앱이라 끄는 것을 권장)
2. **빌드 → Authentication → 시작하기 → 로그인 방법**에서 두 가지를 사용 설정
   - **Google** (선생님 로그인) — 프로젝트 지원 이메일을 고르고 저장
   - **이메일/비밀번호** (학생 가입) — 아이들은 이메일이 없어도 돼요. 앱이 학급·번호로 계정을 만들어요
   - 같은 화면의 **설정 → 승인된 도메인**에 Vercel 주소(예: `daily-study-five.vercel.app`)를 추가
3. **빌드 → Firestore Database → 데이터베이스 만들기** (위치: `asia-northeast3 (서울)`, 프로덕션 모드)
4. **빌드 → Realtime Database → 데이터베이스 만들기** (위치: 싱가포르 등 가까운 곳, 잠금 모드)
5. **프로젝트 설정(⚙︎) → 일반 → 내 앱 → 웹(</>)** 으로 앱을 등록하고 나오는 `firebaseConfig` 값을 복사

## 2. 보안 규칙 올리기
Firebase 콘솔에서 직접 붙여 넣어도 되고, 컴퓨터에서 한 번에 올려도 돼요.
- Firestore → 규칙 탭에 저장소의 `firestore.rules` 내용을 붙여 넣고 **게시**
- Realtime Database → 규칙 탭에 `database.rules.json` 내용을 붙여 넣고 **게시**

(컴퓨터에서: `npx firebase-tools login` → `npx firebase-tools deploy --only firestore:rules,database --project 내프로젝트ID`)

## 3. Vercel에 키 넣기 (선택)
우리 반 서버(`learn-cube-281e2`) 값은 이미 코드(`src/services/cloud.js`)에 들어 있어서 배포판은 따로 넣지 않아도 연결돼요. 다른 프로젝트로 바꿀 때만 아래 값을 넣으면 그것이 우선이에요.

Vercel → 프로젝트 → **Settings → Environment Variables** 에 아래를 추가하고 **Redeploy**

| 이름 | 값 (firebaseConfig에서) |
|---|---|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_DATABASE_URL` | databaseURL (Realtime Database 주소) |
| `VITE_FIREBASE_APP_ID` | appId |

이 값들은 원래 웹 페이지에 공개되는 값이라 넣어도 안전해요. 실제 보호는 2번의 보안 규칙이 맡아요.

## 4. 우리 반 만들기
1. 앱 첫 화면 → **🧑‍🏫 선생님이세요?** → **Google 계정으로 로그인**
2. 학급 이름과 학생 수를 넣으면 **학급 코드(6글자)**가 나와요. 선생님 화면 맨 위 **🏫 우리 반**에서 언제든 다시 볼 수 있어요
3. 같은 곳에서 번호마다 별명을 바꾸고 **명단 저장**

## 5. 학생 가입 (처음 한 번)
1. 학급 코드 입력 → 자기 번호 누르기 → 비밀번호(6글자 이상) 두 번 → **가입하고 들어가기**
2. 다음 날부터는 기기가 로그인을 기억해서 바로 들어가요. 다른 기기에서는 학급 코드 → 번호 → 비밀번호
3. 비밀번호를 바꾸려면: 학생 화면 오른쪽 위 ⚙︎ → **🔑 비밀번호 바꾸기** (지금 비밀번호가 필요해요)
4. 비밀번호를 잊으면: 선생님 화면 **우리 반**에서 그 번호의 **다시 가입 허용** → 학생이 같은 번호로 새 비밀번호를 정해요. 별과 기록은 그대로예요

## 보안 규칙이 지키는 것
- 학생은 **자기 번호의 별만** 쓰고, 반 친구 별은 볼 수만 있어요
- 학급 설정·명단·다시 가입 허용은 **그 반 담임(만든 Google 계정)만** 할 수 있어요
- 학급 코드를 모르면 다른 반 데이터는 볼 수 없어요
- **별가루 조작 막기**: 늘어난 별가루는 '오늘 받은 별가루' 기록으로 설명돼야 하고 하루 250개까지만 받을 수 있어요(날짜는 서버 시각). 개발자 도구로 값을 고쳐도 서버가 거절하고, 앱은 서버에 있는 진짜 값으로 되돌려요. 돈 없이 옷·장식을 추가하는 것도 막혀요
- 학습 기록(`learn`: 다시 볼 문제·성취기준별 정답·'이상해요' 신고)은 **본인과 담임만** 읽어요

## 개발자용: 에뮬레이터로 시험하기
```bash
npx firebase-tools emulators:start --config firebase.emulator.json --only auth,firestore,database --project demo-dailystudy
# Realtime Database 규칙은 따로 올린다
curl -X PUT -H "Authorization: Bearer owner" --data-binary @database.rules.json "http://127.0.0.1:9000/.settings/rules.json?ns=demo-dailystudy-default-rtdb"
VITE_FIREBASE_EMULATOR=1 npx vite --port 5174
```
