# 🇰🇷 K-SAFE — 국민안심 AI

![K-SAFE 국민안심 AI — 대한민국을 지키는 AI 보안 방패와 행복한 가족](docs/08-presentation/assets/k-safe-cover.png)

[표지 원본 PNG](docs/08-presentation/assets/k-safe-cover.png) · [발표 슬라이드 디자인 가이드](docs/08-presentation/K-SAFE-SLIDE-DESIGN-SYSTEM.md)

> **금융사기를 의심하는 순간, 국민의 다음 안전행동을 안내하는 AI**
>
> 2026 AI 해커톤 | 주제 ① AI 기반 추천 서비스 + ② AI 기반 정보보호 서비스

## 0. 1분 만에 프로젝트 이해하기

K-SAFE는 사용자가 받은 **의심스러운 문자·메신저 내용을 분석**하고, 위험 신호의 근거를 설명한 뒤, **송금 전·송금 후·앱 설치 후** 등 상황에 맞춰 안전한 행동을 추천하는 웹 서비스입니다.

- **해결할 문제:** 개인정보 유출, 금융기관 사칭, 보이스피싱·스미싱의 2차 피해
- **목표 사용자:** 대한민국 국민, 특히 금융사기에 익숙하지 않은 이용자
- **해커톤 목표:** 24시간 안에 실제 접속·시연·검증할 수 있는 최소기능제품(MVP) 제작
- **차별점:** 단순히 위험 여부만 알리는 것이 아니라 **위험 근거 → 다음 행동 → 공식 대응 경로**를 한 흐름으로 제시

> **중요:** 04-4까지 로컬 npm 설치·타입 검사·단위테스트·빌드·HTTP/API 스모크 테스트가 통과했습니다. **04-6 브라우저 UI·모바일 화면·키보드 5개 항목은 사용자 확인 PASS입니다.** **외부 AI 모델은 아직 연결되지 않았고 배포도 하지 않았습니다.** K-SAFE 결과는 금융회사·경찰의 공식 판단을 대체하지 않습니다.

## 1. 빠른 시작 (Quick Start)

### 준비물

- Git: 소스코드 변경 이력을 관리하는 도구
- Windows 11 + WSL2(Ubuntu) 또는 Git이 설치된 다른 개발환경
- VS Code: 코드 편집기

### WSL2 Ubuntu 터미널에서 복사하여 실행

```bash
cd "$HOME"
git clone https://github.com/MetaStudy999/k-safe-ai-hackathon-2026.git
cd k-safe-ai-hackathon-2026
git status
ls -la
```

**예상 결과:** 저장소 폴더로 이동하고 `git status`에서 `main` 브랜치가 표시됩니다. 파일을 수정하지 않았다면 작업 트리가 깨끗하다고 표시됩니다.

**주의:** 위 명령은 저장소를 처음 내려받을 때 한 번 실행합니다. 이미 로컬에 폴더가 있다면 다시 복제하지 말고 기존 폴더로 이동하여 `git pull --ff-only`로 업데이트합니다.

04-1 웹앱 소스가 작성됐습니다. 실제 실행은 [04 구현 안내](docs/04-implementation/README.md)의 Node24 설정·npm 설치·검증 순서를 따르세요. 원격 Codex 샌드박스에는 DNS·자식 프로세스 제약이 있었지만 사용자 Ubuntu 일반 터미널에서 설치·빌드가 정상 완료되었습니다.

## 2. 전체 로드맵 (Roadmap)

| 단계 | 목적 | 검증 기준 (Gate) | 현황 |
|---|---|---|---|
| 00. 초기화 | README·기본 보안 설정 | 저장소 및 기본 파일 확인 | **PASS (완료)** |
| 01. 기획 | 문제 정의·사례·기존 서비스 비교 | 공익성·차별성·대상 사용자 명확화 | **진행(공식 대회 공고 확인 대기)** |
| 02. 요구사항 | 기능·비기능·수용 기준 정의 | MVP 범위와 우선순위 확정 | **문서 PASS(공식 공고 확인 대기)** |
| 03. 설계 | 화면·데이터·AI·보안 구조 | 사용자 흐름 및 개인정보 처리 검토 | **설계문서 PASS (실제 시험 미실행)** |
| 04. 구현 | 웹앱·분석·추천 개발 | 핵심 시연 시나리오 실행 | **04-6 규칙 기반 MVP PASS(사용자 UI 5/5)** · LLM 미구현 |
| 05. 검증 | 기능·AI·보안 테스트 | 기록된 시험 케이스 기준 통과 | **05-5 49/49·회귀평가·빌드 PASS, 05-6 새 데이터 독립평가 대기** |
| 06. 배포 | 접근 가능한 데모 공개 | HTTPS URL 접속·동작 확인 | 예정 |
| 07. 운영 | 장애·비용·오류 관리 | 운영 및 장애 대응 점검 | 예정 |
| 08. 발표 | 시연·증빙·사회적 효과 발표 | 발표자료·리허설·예비 영상 준비 | 예정 |

운영 원칙: 각 단계마다 **목적 → 작업 → 산출물 → 검증 → PASS/FAIL → 다음 단계** 순서로 기록합니다. 문서보다 작동하는 시연과 실제 증빙을 우선합니다.

**01단계 자료:** [기획서](docs/01-planning/README.md) · [2025~2026 공식 해커톤 심사기준 비교 및 내부 평가표](docs/01-planning/JUDGING-CRITERIA-2025-2026.md)

**02단계 자료:** [요구사항 명세서 및 수용·보안·시험 기준](docs/02-requirements/README.md)

**03단계 자료:** [시스템·화면·API·보안 설계 및 Mermaid 다이어그램](docs/03-design/README.md)

**04단계 자료:** [구현 현황·Node24·설치/시험 방법](docs/04-implementation/README.md)

**05단계 자료:** [종합 검증·합성 30개 평가·보안 위험](docs/05-verification/README.md) · [05-1 실제 측정 기준선](docs/05-verification/BASELINE-20261030.md) · [05-2 개선 후 실제 측정 기록](docs/05-verification/POSTFIX-20261030.md) · [05-3b 요청률 제한 설정](docs/05-verification/RATE-LIMIT-SETUP.md) · [05-3c 개인정보·악성 입력 검증](docs/05-verification/PRIVACY-SECURITY-PLAN.md) · [05-3c 로컬 HTTP 보안 검사 스크립트](scripts/verify-http-security.py) · [05-3c 실제 HTTP 8/8 결과](docs/05-verification/HTTP-INTEGRATION-20261030.md) · [05-4 배포 전 승인 기준](docs/05-verification/PREDEPLOY-GATE.md) · [05-4 신규 합성 평가](scripts/evaluate-holdout.ts) · [05-4 최초 실측 기준선](docs/05-verification/HOLDOUT-BASELINE-20261030.md) · [05-5 문맥 개선 설계](docs/05-verification/CONTEXT-IMPROVEMENT-05-5.md) · [05-5 실제 PASS 보고서](docs/05-verification/CONTEXT-RESULT-05-5-20261030.md) · [05-6 외부 작성 평가 방법](docs/05-verification/BLIND-EVALUATION-05-6.md)

## 3. 최소기능제품 (MVP) 범위

### 반드시 구현할 기능

1. 사용자가 의심 메시지를 직접 입력한다.
2. 전화번호·계좌번호 등 개인정보를 가린 후 분석한다.
3. 규칙 및 AI로 위험 신호를 설명하되 불확실성도 표시한다.
4. 사용자 상황(송금 전 / 이미 송금 / 앱 설치 등)에 맞게 안전행동을 추천한다.
5. 신고·피해 대응을 위한 공식 채널을 안내한다.

### 시간 여유가 있을 때만 추가

- 이미지에서 문자 추출(OCR), QR 분석, 보고서 내보내기
- 음성·실시간 통화 분석, 금융기관 직접 연동은 후속 개발로 분리

## 4. 예정 기술 구성

- **웹 화면·서버:** Next.js + TypeScript (04-1 소스 작성, 04-4 HTTP/API 스모크 통과)
- **분석:** 위험 규칙 + LLM(대형언어모델, Large Language Model) 기반 맥락 설명
- **자동화:** GitHub 버전관리, Codex 개발 보조, 자동 테스트
- **배포:** HTTPS를 지원하는 웹 호스팅(확정 시 06단계 기록)

아직 기술 선택을 구현 완료로 간주하지 않습니다.

## 5. 안전·개인정보 보호 원칙

- **실제 주민등록번호·계좌정보·비밀번호·접근토큰을 업로드하거나 커밋하지 않습니다.**
- 개발 및 발표에서는 **가상의 합성 사례 데이터**만 사용합니다.
- AI 전송 전 개인정보 가림, 서버의 최소 로그 정책, API 키의 환경변수 관리가 기본입니다.
- 의심 URL을 서버가 자동으로 방문하거나 사용자 대신 송금·계좌차단을 실행하지 않습니다.
- AI의 위험 판단은 오류가 있을 수 있습니다. 실제 송금 피해가 발생했다면 분석 결과를 기다리지 않고 **112 또는 해당 금융회사**에 즉시 신고·지급정지를 요청하도록 안내합니다.

## 6. 최종 발표에서 입증할 것

- **문제의 현실성:** 정부·금융기관·언론 자료로 근거 제시(01 단계)
- **기술적 차별성:** 단순 분류와 상황별 추천의 차이를 시연
- **정량적 검증:** 합성 사례의 탐지 누락·오경보·개인정보 가림 결과 기록
- **재현 가능성:** 소스코드, 테스트 방법, 배포 URL, 시연 절차 제공

## 7. 문서 폴더 구성 (예정)

```text
docs/
  01-planning/
  02-requirements/
  03-design/
  04-implementation/
  05-verification/
  06-deployment/
  07-operations/
  08-presentation/
```

폴더와 각 단계의 `README.md`는 해당 단계를 시작할 때 생성합니다. 비어 있는 폴더는 Git에 보이지 않습니다.

## 8. 자주 쓰는 용어

| 한글 | 영어 | 약어/뜻 |
|---|---|---|
| 저장소 | Repository | Repo, 코드·문서의 버전 관리 공간 |
| 빠른 시작 | Quick Start | 입문자가 바로 실행하는 안내 |
| 최소기능제품 | Minimum Viable Product | MVP, 핵심 기능만 구현한 제품 |
| 사용자 화면 | User Interface | UI |
| 사용자 경험 | User Experience | UX |
| 응용프로그램 인터페이스 | Application Programming Interface | API |
| 대형언어모델 | Large Language Model | LLM |
| 지속적 통합 | Continuous Integration | CI, 자동 검사·테스트 |
| 통과·실패 | Pass / Fail | 다음 단계 진입 판정 |

---

**프로젝트 상태:** 00 초기화 PASS · 01 기획 문서 PASS(대회 규정 대기) · 02 요구사항 문서 PASS · 03 설계 문서 PASS · **04-6 규칙 기반 MVP PASS, LLM 미구현** · **05-3c 33/33 자동 테스트·HTTP 8/8 PASS** · **05-4 최초 신규 24건 품질 FAIL(FN=8, FP=4), 05-5 개선 후 49/49 회귀시험·동일 데이터 재평가·빌드 PASS** · **05-6 평가기 TypeScript 검사 PASS(데이터 미수령·평가 미실행)** · 실제 WAF 429/호스팅 로그/AI 규정 미검증, 공개 배포 보류.
