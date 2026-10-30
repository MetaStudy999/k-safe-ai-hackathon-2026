# K-SAFE 원본 이미지 기반 UI 구현·검증 보고

검증일: 2026-10-30 (Asia/Seoul). 외부 배포 없이 WSL2 로컬에서 확인했다.

## 기준과 작업 보존

- 기준 파일: `docs/design-reference/k-safe-ui-reference.png`.
- 실제 확인: PNG, RGBA, **1536×1024**, SHA-256 `17f98aab81a17c70a32881f7fdf3b03ae2504a7f8d20d4ff8be92d52dd965cb2`.
- 직접 이미지를 열어 왼쪽 데스크톱 영역(대략 x26–1131, y26–1006), 오른쪽 앱 영역(대략 x1167–1504, y100–970)을 구분해 비교했다. 휴대전화 외곽과 시스템 상태 표시줄은 웹 UI에 포함하지 않았다.
- 시작 브랜치 `main`, HEAD `2431c0c`. 시작 시 기존 변경은 `next-env.d.ts`와 미추적 `docs/design-reference/`였다. 모두 보존했다. 별도 작업 브랜치: `feat/reference-ui-20261030`.
- 요청에 언급된 `src/app/public-demo.tsx`, `src/lib/public-demo.ts`는 실제 시작 저장소에는 없었다. 이번에 생성했다.
- 기존 독립 이미지 `docs/08-presentation/assets/k-safe-cover.png`도 확인했으나 원본과 가족 그림이 달랐다. 따라서 기준 이미지의 **일러스트 영역만** SVG viewBox와 clipPath로 표시했다. 전체 페이지를 이미지로 덮지 않는다. 제목, 카드, 버튼, 본문, 메뉴는 HTML/React/CSS이다.
- 원본 파일은 수정하지 않았다. `public/images/k-safe-reference-artwork.png`는 SHA-256이 동일한 복사본이다.

## 구현 결과

- 하늘색 배경, 반투명 흰 내비게이션, 방패 로고, 파란 강조 제목, 가족·방패 Hero, 데모 배지.
- 데스크톱 4열 상황 선택, 분홍 가상 메시지·위험 단서, 파란 단계별 행동, 분홍/파랑/민트 공식 연락 카드.
- 모바일 헤더·펼침 메뉴, 가족 일러스트와 파란 그라디언트, 흰 제목, 2×2 선택 카드, 상황별 긴급 안내, 112/118 전화 링크 및 금융회사 안내 대화상자, 고정 하단 메뉴.
- 네 가지 상황에서 선택 상태, 가상 메시지·단서 및 대응 단계가 함께 갱신된다. 기본 선택은 기준 이미지와 같은 ‘이미 송금’이다. 송금 전/후는 같은 대출 사칭 예시를 서로 다른 대응 단계로 보여 준다.
- 상담 118은 ‘스미싱·인터넷침해 상담’으로 표시했다. 실제 분석, 사기 확정, 신고 접수, 지급정지 완료를 표시하지 않는다.
- 공개 페이지는 입력창·분석 요청·개인정보 저장을 사용하지 않는다. 개인정보 보호 안내와 서비스 소개를 제공한다.
- 원래 입력형 규칙 기반 도구는 `src/app/lab/local-analyzer.tsx`에 원문 그대로 보존했다. 개발 환경 `/lab`에서 실제 예시 입력→API→단서 표시까지 확인했다. 원래 `page.tsx`와 복사본 SHA-256은 모두 `14ebb8bc341e8f66cc5f58320074b1608ab3337983bd512368552e7d29522abf`이다. Production `/lab`은 404다.
- 기존 `safety.ts`, `request-guard.ts`, `deployment-gate.ts`, `api/analyze/route.ts` 및 기존 단위 테스트는 수정하지 않았다.

## 수정·추가 파일

| 파일 | 내용 |
|---|---|
| `src/app/page.tsx` | 공개 데모 진입점 |
| `src/app/public-demo.tsx` | 내비게이션, Hero, 카드, 시나리오, 연락처, 모달 |
| `src/app/globals.css` | 데스크톱/모바일 반응형, 폰트, 접근성 스타일; 기존 스타일은 legacy layer로 보존 |
| `src/lib/public-demo.ts` | 합성 시나리오와 기존 안전행동 연결 |
| `src/app/lab/page.tsx` | 개발 도구 경로 및 Production 접근 차단 |
| `src/app/lab/local-analyzer.tsx` | 기존 입력형 페이지 원문 복사 |
| `public/images/k-safe-reference-artwork.png` | 일러스트 표시용 원본 복사본 |
| `public/PretendardVariable.woff2`, `public/Pretendard-LICENSE.txt` | 로컬 한글 폰트 및 라이선스, Pretendard v1.3.9 |
| `package.json`, `package-lock.json` | Playwright/axe 검사 도구와 `test:ui` 명령 |
| `playwright.config.ts`, `tests/browser/public-demo.spec.ts` | 반복 가능한 실제 브라우저 검사 |
| `scripts/verify-public-production.mjs` | 로컬 Production 공개 모드·API 차단 검사 |
| `artifacts/ui/` | 초기/최종 캡처, 원본 비교 HTML, 검사 결과 및 실행 로그 |
| 이 문서 | 원본 분석, 변경 내역, 검증 결과 |

`next-env.d.ts` 변경은 시작 전에 존재한 Next.js 생성 파일 변경이며 이번 작업으로 새로 만든 변경이 아니다. 기존 `docs/design-reference/` 자료도 보존했다.

## 검사 결과와 증거

| 항목 | 실제 결과 | 증거 |
|---|---|---|
| `npm run typecheck` | PASS | `artifacts/ui/typecheck.txt` |
| `npm test` | PASS, 62/62 | `artifacts/ui/unit-tests.txt` |
| `npm run build` | PASS | `artifacts/ui/build.txt` |
| Production Chromium Playwright | PASS, 8/8 | `artifacts/ui/playwright-results.json` |
| 320 / 375 / 390 / 768 / 1024 / 1440px | PASS | `artifacts/ui/final/{width}.png` 및 Playwright 결과 |
| 네 상황 선택, 단서, 메시지, 단계별 행동 | PASS, 위 6개 너비 각각 검사 | Playwright 시나리오 검사 |
| 가로 스크롤·선택 카드 겹침·주요 텍스트 넘침 | 검사한 DOM 기준 발견 없음 | 시나리오마다 geometry 검사 |
| 모바일 터치 영역 | 표시된 링크·버튼·상황 카드 모두 44×44px 이상 | 320 / 375 / 390 / 768px 검사 |
| 하단 메뉴·콘텐츠 | 끝까지 스크롤 시 마지막 콘텐츠가 메뉴 위에 표시됨 | footer/nav 위치 검사 |
| 메뉴·소개·금융회사 모달·대비 버튼 | PASS | 데스크톱/모바일 동작 검사 |
| 키보드 라디오 선택·모달 Escape·포커스 복귀 | PASS | 브라우저 동작 검사 |
| 콘솔 오류 및 분석 POST 요청 | 6개 너비 시나리오 검사에서 각각 0건 | 브라우저 이벤트 검사 |
| axe WCAG A/AA 관련 자동 검사 | 390 / 1440px 자동 탐지 위반 0건 | `artifacts/ui/axe-390.json`, `axe-1440.json` |
| Production 공개 `/` | HTTP 200 | `artifacts/ui/production-security.json` |
| Production 개발 도구 `/lab` | HTTP 404 | 같은 파일 |
| Production `/api/analyze` | HTTP 503, `Cache-Control: no-store` | 같은 파일 |
| `git diff --check` | PASS | 로컬 실행 |

접근성 검사는 전체 적합성 인증이 아니다. 이미지/그라디언트 배경의 일부 색상 대비는 axe가 자동 판정하지 못해 `incomplete`로 남는다. 실제 화면도 직접 열어 읽기와 겹침을 확인했다. 실제 휴대전화 통화·신고 접수는 수행하지 않았으며, 전화 링크의 목적지와 클릭 전달만 검증했다. Safari/Firefox/실기기 및 외부 WAF의 429 응답·운영 로그는 검증하지 않았다.

## 실제 캡처와 비교

- 데스크톱 1440×900 첫 화면: `artifacts/ui/final/desktop-1440x900.png`.
- 데스크톱 전체 페이지: `artifacts/ui/final/1440.png`.
- 모바일 390×844 첫 화면: `artifacts/ui/final/mobile-390x844.png`.
- 모바일 전체 페이지: `artifacts/ui/final/390.png`.
- 기타 너비: `artifacts/ui/final/320.png`, `375.png`, `768.png`, `1024.png`.
- 원본의 두 화면을 구분한 나란히 비교: `artifacts/ui/comparison.html`.
- 초기 화면: `artifacts/ui/initial/`. 중간 확인 캡처: `artifacts/ui/check-*.png`.

직접 캡처를 열어 비교하면서 로고 줄바꿈, Hero 원본 글자 비침, 이미지 경계, 선택 카드 테두리, 상담 118 숫자 대비, 긴급 버튼 대비, 캡처 스크롤 위치를 수정한 뒤 재빌드·재검사했다.

## 원본과의 차이 및 한계

- 원본 폰트의 정확한 서체 정보가 없어 로컬 Pretendard와 직접 작성한 SVG 아이콘을 사용했다. 일부 획·굵기·줄바꿈·간격은 원본과 다르며 픽셀 단위 완전 일치를 주장하지 않는다.
- 접근성을 위해 112 버튼 배경을 원본보다 약간 어둡게 했다.
- 실제 화면 너비에 맞춰 카드와 Hero 크기가 변한다. 목업의 휴대전화 프레임과 시스템 시계는 웹에 복제하지 않았다.
- 모바일도 가상 사례·단서·단계별 안내·개인정보 문구를 제공하므로 세로 스크롤한다. 390×844 첫 화면 아래에 금융회사 버튼과 자세한 안내가 이어진다. 1440×900에서도 공식 연락 카드·푸터는 스크롤 후 볼 수 있다.
- 실제 AI 분석을 제공하지 않는 공개 데모이며 Production 분석 제한은 유지된다. 외부 운영 환경에서 분석 서비스를 활성화할 준비가 됐다는 의미는 아니다.

## 재현 방법

```bash
npm run typecheck
npm test
npm run build
# 별도 터미널: 기존 서버와 겹치지 않는 로컬 포트 사용
# API 검증 플래그를 켜지 않고 공개 모드 확인
env -u RATE_LIMIT_RULE_VERIFIED npm run start -- --port 3102
# 다른 터미널
UI_BASE_URL=http://127.0.0.1:3102 npm run test:ui
node scripts/verify-public-production.mjs
```

Playwright Chromium이 없는 새 환경에서는 `npx playwright install chromium`이 먼저 필요하다. 검증은 설치된 Chromium에서 실제 수행했다.

## Git 및 배포

- 작업 브랜치: `feat/reference-ui-20261030`.
- 기준 커밋: `2431c0c` (`test: prepare independent blind evaluation tooling`). 이번 변경은 미커밋 상태다.
- 기존 미커밋 변경을 보존했고 main push, force push, 기존 작업 삭제, GitHub 원격 변경, Vercel 배포는 하지 않았다.
- 공개 합성 데모의 로컬 검증은 완료되어 변경 검토 및 GitHub/배포 단계로 넘길 수 있다. 외부 배포 확인과 WAF 검증은 이번 완료 범위에 포함하지 않는다.
