import { useState } from 'react';
import { useGame } from '../store/useGame';

// 공부를 돕는 기능 안내 (처음 안내에도, 이미 쓰던 학생의 '새로워졌어요'에도)
const STUDY_STEPS = [
  { icon: '🛰', title: '문제 정거장에서 내 공부 보기', body: '위쪽 🛰 정거장 버튼이나 별 궤도를 도는 정거장을 누르면 기록, 과목별 연습, 오답, 다시 볼 문제를 한 번에 볼 수 있어요.' },
  { icon: '🔁', title: '틀려도 괜찮아요, 다시 나와요', body: '틀린 문제는 1일·3일·7일 뒤 아침 미션에 다시 나와요. 맞혔지만 헷갈렸다면 🤔, 문제가 이상하면 🚩를 눌러 선생님께 알려요.' },
  { icon: '🌌', title: '우리 반이 함께 채우는 목표', body: '반 친구들이 아침 미션을 할 때마다 우리 반 막대가 차요. 목표를 채우면 선생님이 정한 선물이 있어요!' },
];
// 이 숫자를 올리면 이미 쓰던 학생에게도 '새로워졌어요'를 한 번 보여 준다
export const NEWS_VERSION = 1;
export const NEWS_STEPS = STUDY_STEPS;

// 처음 들어온 학생에게 한 번만 보여 주는 안내
const FIRST_STEPS = [
  { icon: '🌟', title: '여기가 너의 작은 별이야!', body: '매일 아침 미션을 풀고, 별가루를 모아 나만의 별을 꾸며요.' },
  { icon: '👆', title: '별을 누르면 걸어가요', body: '한 손가락으로 끌거나 두 손가락으로 비틀면 별이 돌아가요. 벌리면 가까이 봐요. 크롬북은 화살표 키로도 걸어요.' },
  { icon: '✦', title: '오늘의 미션으로 별가루 받기', body: '수학·영어·국어·사회·과학 20문제! 맞힐수록, 매일 할수록 별가루가 늘어나요.' },
  ...STUDY_STEPS.slice(0, 2),
  { icon: '🚀', title: '꾸미고, 친구 별로 날아가요', body: '소품은 끌어서 옮겨요. 친구 별은 ⚡ 바로 가거나 🛸 자동 비행으로 날아가 하트를 남겨요.' },
];

export default function Onboarding({ news = false }) {
  const finishOnboarding = useGame((s) => s.finishOnboarding);
  const seeNews = useGame((s) => s.seeNews);
  const finish = () => (news ? seeNews(NEWS_VERSION) : finishOnboarding());
  const STEPS = news ? NEWS_STEPS : FIRST_STEPS;
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="sheet-backdrop onboard-backdrop">
      <div className="onboard panel rise" key={i} role="dialog" aria-label="처음 안내">
        {news && i === 0 && <p className="onboard-kicker">✨ 새로워졌어요</p>}
        <div className="onboard-icon">{s.icon}</div>
        <h2 className="title">{s.title}</h2>
        <p>{s.body}</p>
        <div className="onboard-dots" aria-hidden>
          {STEPS.map((_, k) => (
            <span key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
        <div className="onboard-actions">
          {!last && (
            <button className="btn btn-ghost" onClick={finish}>
              건너뛰기
            </button>
          )}
          <button className="btn btn-primary" onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? '시작하기 ✦' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
