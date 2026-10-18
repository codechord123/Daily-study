import { useState } from 'react';
import { useGame } from '../store/useGame';

// 처음 들어온 학생에게 한 번만 보여 주는 안내 (4장)
const STEPS = [
  { icon: '🌟', title: '여기가 너의 작은 별이야!', body: '매일 아침 미션을 풀고, 별가루를 모아 나만의 별을 꾸며요.' },
  { icon: '👆', title: '별을 누르면 걸어가요', body: '손가락으로 끌면 별이 돌아가요. 크롬북에서는 화살표 키로도 걸을 수 있어요.' },
  { icon: '✦', title: '오늘의 미션으로 별가루 받기', body: '수학·영어·국어·사회·과학 13문제! 맞힐수록, 매일 할수록 별가루가 늘어나요.' },
  { icon: '🚀', title: '꾸미고, 친구 별로 날아가요', body: '상점에서 소품과 옷을 사고, 추진기를 메고 친구 별에 놀러 가 하트를 남겨요.' },
];

export default function Onboarding() {
  const finish = useGame((s) => s.finishOnboarding);
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="sheet-backdrop onboard-backdrop">
      <div className="onboard panel rise" key={i} role="dialog" aria-label="처음 안내">
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
