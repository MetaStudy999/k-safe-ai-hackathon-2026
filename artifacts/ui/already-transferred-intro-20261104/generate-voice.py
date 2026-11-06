from pathlib import Path
import asyncio
import hashlib
import json
import edge_tts

repo = Path(__file__).resolve().parents[3]
artifact = repo / 'artifacts/ui/already-transferred-intro-20261104'
artifact.mkdir(parents=True, exist_ok=True)
script = '이미 송금했다면, 즉시 일 일 이 또는 금융회사에 연락해 지급정지를 요청하세요. 의심 앱도 설치했다면, 의심되는 휴대폰을 사용하지 말고 다른 안전한 전화로 연락하세요. 추가 송금이나 인증번호 전달을 멈추세요. 거래 내역과 연락 기록을 안전하게 보관하세요. 에이아이 분석이나 앱 점검을 기다리지 마세요.'
asset = 'public/audio/already-transferred-ko-sunhi-v2-20261104.mp3'
path = repo / asset
assert not path.exists(), 'Do not regenerate an existing audio version'
asyncio.run(edge_tts.Communicate(script, 'ko-KR-SunHiNeural', rate='-5%').save(str(path)))
manifest = {'situation': 'already_transferred', 'voice': 'ko-KR-SunHiNeural', 'rate': '-5%', 'script': script, 'asset': asset, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size, 'audible_listening_performed': False}
(artifact / 'audio-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(artifact / 'narration.txt').write_text(script + '\n', encoding='utf-8')
source = repo / 'src/app/use-guide-speech.ts'
text = source.read_text(encoding='utf-8')
old = '/audio/already-transferred-ko-sunhi-v1-20261104.mp3'
assert text.count(old) == 1
source.write_text(text.replace(old, '/' + asset.removeprefix('public/')), encoding='utf-8')
print(json.dumps({'asset': asset, 'bytes': manifest['bytes'], 'opening': script.split('。')[0][:45]}, ensure_ascii=False))
