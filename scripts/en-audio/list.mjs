// 영어 소리 파일 목록 만들기: 앱이 읽어 주는 영어(대화 지문·읽어 줄 문장·영어 문제·영어 정답 보기·단어)를 모아
// 파일 이름(clipKey)과 읽을 줄(대화면 말하는 사람별)을 JSON 으로 낸다. synth.py 가 이걸 읽어 mp3 를 만든다.
//   node scripts/en-audio/list.mjs > /tmp/en-clips.json
import { clipKey, englishSources } from '../../src/services/enClips.js';
import BANK from '../../src/data/missions/bank/english.js';
import { ENGLISH_WORDS } from '../../src/data/missions/grade5s2.js';

const SPEAKER = /^\s*([^\s:：]{1,10})\s*[:：]\s*(.*)$/;
// 소리로 읽을 영어만: 한글·빈칸·번호 기호는 빼고 (빈칸은 잠깐 쉼)
const clean = (l) =>
  l
    .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]+[^A-Za-z]*/g, ' ')
    .replace(/_{2,}|□|\(\s*\)/g, ' ... ')
    .replace(/[①-⑳㉠-㉻ⓐ-ⓩ]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// 말하는 사람: A·B 는 이름 없이, 이름이 있으면 '이름.'을 앞에 붙여 읽는다 (누가 말했는지 묻는 문제가 있다)
// 목소리: 여자 f1·f2, 남자 m1·m2 (synth.py 에서 화자 번호로)
const FEMALE = new Set(['A', 'Nari', 'Amy', 'Minji', 'Jimin', 'Yuna', 'Sora', 'Mina', 'Jenny', 'Emma']);
const MALE = new Set(['B', 'Seho', 'Tom', 'Junho', 'Minho', 'Jiho', 'Mike', 'Brian', 'Ben']);
const isPerson = (who) => FEMALE.has(who) || MALE.has(who);

const out = new Map();
const add = (raw) => {
  if (!raw || !/[a-z]/i.test(raw)) return;
  const key = clipKey(raw);
  if (out.has(key)) return;
  const rows = String(raw).split('\n').filter((l) => l.trim());
  const used = { f: 0, m: 0 };
  const voiceOf = {};
  const lines = rows
    .map((l) => {
      const m = l.match(SPEAKER);
      if (!m || !isPerson(m[1])) return { voice: 'f1', text: clean(l) }; // 가격표처럼 '이름: 값'은 그대로 읽는다
      const who = m[1];
      if (!voiceOf[who]) {
        const g = FEMALE.has(who) ? 'f' : 'm';
        voiceOf[who] = `${g}${Math.min(2, ++used[g])}`;
      }
      const say = clean(m[2]);
      return { voice: voiceOf[who], text: who.length > 1 ? `${who}. ${say}` : say };
    })
    .filter((x) => /[A-Za-z]/.test(x.text));
  if (lines.length) out.set(key, { key, lines });
};
for (const q of BANK) for (const raw of englishSources(q)) add(raw);
for (const [en] of ENGLISH_WORDS) add(en);
process.stdout.write(JSON.stringify([...out.values()]));
