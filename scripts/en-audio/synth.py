"""영어 소리 파일 만들기 (Piper + LibriTTS 음성 모델, CC BY 4.0)

준비 (한 번):
  python3 -m venv venv && venv/bin/pip install piper-tts numpy
  curl -L -o v.tar.gz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-libritts-high.tar.gz && tar xzf v.tar.gz
만들기:
  node scripts/en-audio/list.mjs > /tmp/en-clips.json
  venv/bin/python scripts/en-audio/synth.py /tmp/en-clips.json en-us-libritts-high.onnx public/audio/en
목소리(화자 번호)는 VOICES 에서 바꾼다. 이미 있는 파일은 건너뛰고(--force 로 다시), 목록에 없는 옛 파일은 지운다.
만든 파일 목록은 src/data/missions/enClips.json 에 적는다 (앱은 목록에 있는 것만 소리 파일로 틀고, 없으면 기기 음성으로 읽는다).
"""
import json, os, subprocess, sys, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

VOICES = {'f1': 210, 'f2': 196, 'm1': 385, 'm2': 182}  # 여자 1·2, 남자 1·2 (LibriTTS 화자 번호)
SLOW = 1.12  # 아이들이 알아듣기 좋게 조금 천천히
GAP = 0.45  # 줄 사이 쉼(초)

clips_path, model, out_dir = sys.argv[1:4]
force = '--force' in sys.argv
os.makedirs(out_dir, exist_ok=True)
clips = json.load(open(clips_path))
voice = PiperVoice.load(model)
sr = voice.config.sample_rate
LIST = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'missions', 'enClips.json')


def say(text, who):
    tmp = '/tmp/_line.wav'
    with wave.open(tmp, 'wb') as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(speaker_id=VOICES[who], length_scale=SLOW))
    with wave.open(tmp) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)


keep = set()
for i, c in enumerate(clips):
    dst = os.path.join(out_dir, f"{c['key']}.mp3")
    keep.add(c['key'])
    if os.path.exists(dst) and not force:
        continue
    gap = np.zeros(int(sr * GAP), dtype=np.int16)
    parts = []
    for line in c['lines']:
        parts += [say(line['text'], line['voice']), gap]
    audio = np.concatenate(parts[:-1])
    with wave.open('/tmp/_clip.wav', 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(audio.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/_clip.wav', '-ac', '1', '-b:a', '48k', dst], check=True)
    if i % 25 == 0:
        print(i, '/', len(clips), flush=True)
for f in os.listdir(out_dir):
    if f.endswith('.mp3') and f[:-4] not in keep:
        os.remove(os.path.join(out_dir, f))
with open(LIST, 'w') as f:
    json.dump(sorted(keep), f)
print('done', len(keep))
