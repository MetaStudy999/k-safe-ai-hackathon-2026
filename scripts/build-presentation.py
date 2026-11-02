"""Create editable slides and a print-ready HTML deck from verified MVP evidence."""
from pathlib import Path
from html import escape
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/08-presentation'
NAVY='061634'; WHITE='ECF8FF'; CYAN='00C7FF'; MUTED='B8CDE2'
slides=[
 ('K-SAFE · 국민안심 AI','의심스러운 연락,\n다음 행동부터', ['상황별 안전행동 안내와 원문을 보내지 않는 AI 보조 설명', '해커톤 시연 MVP · 2026-11-02 · 실제 사기 판정 서비스 아님']),
 ('01 · 사용자 문제','지금 무엇부터 확인할까요?', ['송금 전: 행동을 멈추고 공식 경로로 확인', '이미 송금: AI보다 먼저 긴급 안내', '앱 설치 후: 안전한 다른 기기로 확인', '모호한 상황: 안전을 보증하지 않고 한계 표시']),
 ('02 · 현재 범위','공개 시연과 개발 기능을 구분합니다', ['공개: 네 가상 사례 · 반응형 UI · 사전 생성 AI 설명', '개발: 합성 입력 → 규칙 분석 → 실제 AI 보조 설명', '운영: 사용자 입력·실시간 AI 분석 미개방', '자동 신고·송금·지급정지·기관 연동 없음']),
 ('03 · 실제 구현 화면','AI 설명의 출처를 화면에 표시합니다', ['실제 AI로 미리 생성한 가상 사례 설명', '지금 메시지를 분석하거나 AI를 호출하지 않음', '긴급 행동·공식 확인 안내를 우선 표시']),
 ('04 · 데이터 흐름','AI에는 원문 대신 고정된 신호만', ['브라우저 → 로컬 서버: 합성 메시지와 상황', '로컬 규칙: 가림·공백 정규화·위험 신호 추출', '외부 AI: 상황 enum + 서버 신호 ID·고정 설명', '검증 후 화면: 규칙 판정·행동 + AI 보조 설명']),
 ('05 · 오류와 안전','AI가 실패해도 행동 안내를 유지합니다', ['위험 수준과 긴급 행동은 규칙이 결정', '8초 제한 · 재시도 0 · 부적절한 출력 거부', '오류 시 규칙 안내, 상황 변경 후 늦은 결과 무시', '실행당 24회·동시 1회: 운영 전체 예산은 아님']),
 ('06 · 확인한 증빙','시험 수와 탐지 정확도는 다릅니다', ['74개 자동 테스트 · 타입 검사 · 빌드 PASS', '8개 공개 브라우저 검사: 모바일·키보드·메뉴', '7개 AI 사용자 흐름 체크: 실제 응답·오류·지연', '로컬 production: / 200 · /lab 404 · 분석 POST 503']),
 ('07 · 품질과 한계','독립 품질 평가를 과장하지 않습니다', ['기존 합성 54건과 공개 사례는 개발·회귀 자료', '줄바꿈으로 인한 누락을 관측·보존한 뒤 수정', 'AI 작성 후보 24건: 독립 평가를 대체하지 않음', '실제 금융사기 탐지율·피해 예방률 주장 없음']),
 ('08 · 3분 시연','행동 → 공개 설명 → 실제 AI 연결', ['0:00–1:00: 송금 전·후 전환과 긴급 안내', '1:00–1:30: 사전 생성 설명의 표시와 한계', '1:30–2:20: 개발 화면의 실제 AI 설명', '2:20–3:00: 실패 대체·증빙·미완료 항목']),
 ('09 · 검토와 다음 단계','작동하는 시연, 근거 있는 설명', ['공식 대회 공고·기한·AI 요건 확인 필요', '정식 평가는 별도 작성자의 새 자료 필요', '발표 리허설과 최종 공개 문구 검토', '실제 입력 공개 전 접근·분산 제한·운영 검증']),
]
prs=Presentation();prs.slide_width=Inches(13.333);prs.slide_height=Inches(7.5)

def text(slide,value,x,y,w,h,size=24,color=WHITE,bold=False):
 box=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h));tf=box.text_frame;tf.word_wrap=True
 for index,line in enumerate(value.split('\n')):
  p=tf.paragraphs[0] if index==0 else tf.add_paragraph();p.text=line;p.font.name='Pretendard';p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color);p.space_after=Pt(8);p.line_spacing=1.15
 return box

def picture(slide,path,x,y,w,h):
 with Image.open(path) as image: iw,ih=image.size
 ratio=min(w/iw,h/ih);width=iw*ratio;height=ih*ratio
 slide.shapes.add_picture(str(path),Inches(x+(w-width)/2),Inches(y+(h-height)/2),width=Inches(width),height=Inches(height))

html=[]
for n,(label,title,points) in enumerate(slides):
 slide=prs.slides.add_slide(prs.slide_layouts[6]);slide.background.fill.solid();slide.background.fill.fore_color.rgb=RGBColor.from_string(NAVY)
 text(slide,label,0.65,0.35,12,0.4,16,CYAN,True)
 text(slide,title,0.65,1.05,12,1.5,38,WHITE,True)
 if n==3:
  picture(slide,ROOT/'artifacts/ai/public-ai-panel.png',0.65,2.4,7.2,4.5)
  text(slide,'\n'.join(points),8.15,2.6,4.45,3.9,22)
  body='<div class="image-grid"><img src="../../artifacts/ai/public-ai-panel.png" alt="실제 공개 화면 AI 설명 패널"><div>'+''.join('<p>'+escape(p)+'</p>' for p in points)+'</div></div>'
 elif n==0:
  picture(slide,OUT/'assets/k-safe-cover.png',7.5,2.65,5.2,3.8)
  text(slide,points[0],0.65,3.05,6.5,1.35,22)
  text(slide,points[1],0.65,4.65,6.5,1.35,22)
  text(slide,'브랜드 콘셉트 이미지 · 실제 기능 범위는 본문 기준',7.5,6.55,5.2,0.3,10,MUTED)
  body='<div class="cover-grid"><div>'+''.join('<p>'+escape(p)+'</p>' for p in points)+'</div><figure><img src="assets/k-safe-cover.png" alt="K-SAFE 브랜드 표지"><figcaption>브랜드 콘셉트 이미지 · 실제 기능 범위는 본문 기준</figcaption></figure></div>'
 else:
  text(slide,'\n'.join('• '+p for p in points),0.85,2.8,11.8,3.75,25)
  body='<div class="cards">'+''.join('<div><span>'+str(i+1).zfill(2)+'</span><p>'+escape(p)+'</p></div>' for i,p in enumerate(points))+'</div>'
 text(slide,f'K-SAFE · 검증된 시연 범위만 설명 · 2026-11-02                                  {n+1:02d} / 10',0.65,7.02,12,0.28,11,MUTED)
 slide.notes_slide.notes_text_frame.text='증빙: docs/05-verification/MVP-20261102.md 및 artifacts/ai. 자동 검사 결과는 탐지 품질이 아니다. 실제 참가 대회 요건·사람 라벨 검토·발표자 리허설은 미확인.\n'+'\n'.join(points)
 html.append('<section class="slide"><header>'+escape(label)+'</header><h1>'+escape(title).replace('\n','<br>')+'</h1>'+body+'<footer>K-SAFE · 검증된 시연 범위만 설명 · 2026-11-02 <b>'+str(n+1).zfill(2)+' / 10</b></footer></section>')
prs.save(OUT/'K-SAFE-MVP-20261102.pptx')
style='''@font-face{font-family:Pretendard;src:url('../../public/PretendardVariable.woff2')}*{box-sizing:border-box}body{margin:0;background:#061634;color:#ECF8FF;font-family:Pretendard,sans-serif}.slide{width:1280px;height:720px;padding:46px 64px 52px;position:relative;page-break-after:always;overflow:hidden}header{font-size:20px;font-weight:700;color:#00C7FF;letter-spacing:1px}h1{font-size:49px;line-height:1.25;margin:28px 0 34px;font-weight:800}.cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px}.cards>div{background:#10305c;padding:22px 26px;border-left:3px solid #00C7FF;border-radius:12px;min-height:150px;display:flex;gap:20px;align-items:center}.cards span{color:#00C7FF;font-size:22px;font-weight:800}.cards p{font-size:25px;line-height:1.55;margin:0}.image-grid{display:grid;grid-template-columns:710px 1fr;gap:32px;height:450px;align-items:center}.image-grid img{width:100%;height:440px;object-fit:contain}.image-grid p{font-size:24px;line-height:1.6;margin:0 0 22px}.cover-grid{display:grid;grid-template-columns:1fr 560px;gap:24px;align-items:center;height:360px}.cover-grid img{width:100%;height:340px;object-fit:contain}.cover-grid p{font-size:28px;line-height:1.7}.cover-grid figure{margin:0}.cover-grid figcaption{font-size:14px;color:#B8CDE2}.slide:first-child h1{margin-bottom:8px}footer{position:absolute;bottom:25px;left:64px;right:64px;color:#B8CDE2;font-size:15px}footer b{float:right}@media print{@page{size:1280px 720px;margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.slide:last-child{page-break-after:auto}}'''
(OUT/'K-SAFE-MVP-20261102.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>K-SAFE MVP 발표</title><style>'+style+'</style><body>'+''.join(html)+'</body></html>')
print('Generated editable PPTX and print-ready HTML: 10 slides')
