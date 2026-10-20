// 어린 왕자가 오늘 내 별에 오는지, 어떤 부탁(문제 3개)을 가져오는지
//  - 선생님이 정한 날(settings.princeDay): 그날은 반 모두에게
//  - 그 밖에는 아침 미션을 마친 뒤, 지난 부탁에서 이틀 넘게 지났으면 반쯤의 확률로 (학생·날짜로 정해져 하루 동안 같다)
// 문제는 그 학생의 '다시 볼 문제'와 요즘 가장 약한 과목에서 고른다
import { seeded } from './rng';
import { buildPractice } from './dailyMission';
import { getSettings } from '../store/classSettings';
import { getLearn, dayNum, recentAccuracy } from '../store/learnStore';
import { PRINCE_QUESTS, QUEST_BY_ID } from '../data/prince';

export const PRINCE_QUESTIONS = 3;
const SUBJECTS = ['math', 'english', 'korean', 'social', 'science'];
const dayOf = (dateKey) => dayNum(new Date(`${dateKey}T09:00:00+09:00`).getTime());

/** 오늘 찾아올 부탁 (없으면 null) */
export function princeToday(profile, dateKey) {
  if (!profile || profile.sid === 'teacher') return null;
  const pr = profile.prince ?? {};
  if (pr.last === dateKey) return null; // 오늘은 이미 들어줬다
  const day = getSettings().princeDay;
  if (day?.date === dateKey && QUEST_BY_ID[day.questId]) return QUEST_BY_ID[day.questId];
  if (profile.lastMissionDate !== dateKey) return null; // 아침 미션이 먼저
  if (pr.last && dayOf(dateKey) - dayOf(pr.last) < 3) return null;
  if (seeded(`prince:${profile.sid}:${dateKey}`)() > 0.5) return null;
  const done = new Set(pr.done ?? []);
  const fresh = PRINCE_QUESTS.filter((q) => !done.has(q.id));
  const pool = fresh.length ? fresh : PRINCE_QUESTS;
  return pool[Math.floor(seeded(`prince-q:${profile.sid}:${dateKey}`)() * pool.length)];
}

/** 부탁 문제 3개: 다시 볼 문제(오래 기다린 것부터) → 모자라면 가장 약한 과목 연습 문제 */
export function princeQuestions(sid, dateKey) {
  const learn = getLearn(sid);
  const review = learn.review
    .slice()
    .sort((a, b) => a.due - b.due)
    .slice(0, PRINCE_QUESTIONS)
    .map((e) => ({ ...e.q, review: true }));
  const out = [...review];
  if (out.length < PRINCE_QUESTIONS) {
    const acc = SUBJECTS.map((s) => [s, recentAccuracy(sid, s) ?? 1]).sort((a, b) => a[1] - b[1]);
    const weakest = acc[0][1] < 1 ? acc[0][0] : SUBJECTS[Math.floor(seeded(`prince-s:${sid}:${dateKey}`)() * SUBJECTS.length)];
    const seen = new Set(out.map((q) => q.prompt));
    for (const q of buildPractice(weakest, `prince:${sid}:${dateKey}`, dateKey)) {
      if (out.length >= PRINCE_QUESTIONS) break;
      if (!seen.has(q.prompt)) out.push(q);
    }
  }
  return out.slice(0, PRINCE_QUESTIONS).map((q, i) => ({ ...q, id: i }));
}
