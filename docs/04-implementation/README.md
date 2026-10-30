# 04단계 — 구현(Implementation)

> 04-1~04-5 소스·로컬 검증 · 2026-10-30 · **설치·타입 검사·9/9 자동 테스트·빌드·HTTP/API 스모크 PASS / 데스크톱 화면 표시 PASS / 최신 규칙 브라우저 재시연·모바일/키보드 미검증**
>
> [프로젝트 홈](../../README.md) · [03 설계 문서](../03-design/README.md)

## 0. 04-1 구현 범위와 실제 상태

- Next.js 16.4.3 App Router + React 19 + TypeScript 기반 앱 파일을 **작성**했다.
- 한글 입력 화면, 사용자 상황 4가지, 송금 후 긴급 연락 패널, 공식 신고 경로, 합성 예시를 구현했다.
- 단순 규칙 기반 메시지 분석 API, 전화번호·이메일·긴 숫자 가림, 상황별 행동 추천을 구현했다.
- 실제 외부 AI 모델은 **아직 연결하지 않았다**. 화면·API는 규칙 기반 모드를 명확히 알린다.
- 테스트 코드(합성 5개 사례)를 작성했고 **WSL2에서 npm 설치·타입 검사·단위 테스트·프로덕션 빌드가 성공**했다. 자세한 증빙은 04-4 표 참조.
- **환경 차이:** 원격 Codex 샌드박스에서는 npm DNS 조회 및 Next.js 자식 프로세스 실행(EPERM)이 실패했지만, **사용자 WSL2 일반 터미널에서 npm 설치와 빌드가 성공**했다. 원격 실패를 프로젝트 전체 실패로 취급하지 않는다.
- 실제 데이터로 테스트하지 않는다. 입력·개인정보는 로그와 DB에 영구 저장하지 않도록 설계했지만, 실운영 보안 검증 전이다.

## 1. 사용 파일

- package.json, .nvmrc, .env.example, tsconfig.json, next.config.ts, next-env.d.ts
- src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, src/app/api/analyze/route.ts
- src/lib/safety.ts, tests/safety.test.ts

## 2. WSL2 Ubuntu 빠른 시작

기존 Node18 대신 설치되어 있는 Node24.22를 **이 터미널에서만** 사용한다.

~~~bash
cd /home/ubuntu/codyssey/k-safe-ai-hackathon-2026
git pull --ff-only origin main
export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
node --version
npm --version
npm install
npm run typecheck
npm test
npm run build
npm run dev
~~~

- npm 설치에는 인터넷 연결이 필요하다. 실패하면 원문 오류를 기록하고 강제로 재설치하지 않는다.
- 실행 후 브라우저에서 http://localhost:3000 을 확인한다. 종료는 터미널에서 Ctrl+C.
- .env.example은 보안 정책 예시다. 키를 실제 값으로 채우지 않는다.
- 패키지 잠금 파일(package-lock.json)은 npm install 성공 시 생긴다. 검증 후 Git에 포함한다.

## 3. 현재 기능 현황

| 항목 | 소스 작성 | 실제 실행 확인 |
|---|---|---|
| 화면·상황 선택·긴급 패널 | 작성 | 브라우저 조작 NOT_VERIFIED |
| 합성 예시·안전행동 안내 | 작성 | 브라우저 조작 NOT_VERIFIED |
| 규칙 기반 분석 API | 작성 | **04-4 스모크 PASS** |
| 마스킹 | 작성 | 단위 테스트 일부 PASS·추가 보안 검증 필요 |
| 자동 단위테스트 5개 | 작성 | **npm test PASS** (세부 개수·출력 로그 추가 보존 권장) |
| 외부 AI 설명 | 미구현 | NOT_STARTED |
| API 과다요청 제한 | 미구현 | NOT_STARTED |
| 실제 공개 배포 | 미구현 | NOT_STARTED |

> 이 문서의 "작성"은 실제 테스트 PASS를 의미하지 않는다. API를 무료/공개 서비스에 배포하기 전 개인정보 보호·요청제한·취약점 시험이 필요하다.

## 4. 04-1 판정 및 다음 단계

- [x] 소스와 테스트 파일 작성
- [x] Node24.22.0 설치 확인
- [x] npm install 성공 및 package-lock.json 생성 (**아직 Git 미추적**)
- [x] npm run typecheck PASS (원격 WSL 실행)
- [x] npm test PASS (원격 WSL 실행)
- [x] npm run build PASS (**사용자 Ubuntu 직접 실행, BUILD_EXIT=0**)
- [ ] 브라우저에서 실제 UI 및 긴급 안내 시연
- [ ] 외부 LLM 설명 연결 여부·호출 비용 통제 결정

**판정: 04-4 HTTP/API_SMOKE_PASS, 04단계 전체는 IN_PROGRESS.** 브라우저 실제 UI 확인·개인정보 보호 검증·API 과다요청 제한·외부 AI 도입 여부가 남아 있다.

## 4-4. 실제 실행 증빙 (사용자 Ubuntu 제공 로그)

| 검증 | 실행·관찰 결과 | 상태 |
|---|---|---|
| Node.js, npm | v24.22.0 / 11.19.1 | PASS |
| npm registry | PONG 510ms, 31개 패키지 설치 | PASS |
| 설치된 버전 | Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, tsx 4.23.15 | PASS |
| npm run typecheck | exit_code=0 | PASS |
| npm test | exit_code=0 | PASS |
| npm run build | TypeScript 완료, 정적 페이지 4/4, BUILD_EXIT=0 | PASS |
| GET / | HOME_HTTP=200 | PASS |
| POST /api/analyze | 위험 `warning`, 송금 후 안내에 112 포함, 폴백 확인 | PASS |
| POST /api/analyze 잘못된 입력 | HTTP 400 | PASS |
| 통합 스모크 시험 | 04-4 API_SMOKE_TEST=PASS | PASS |
| 시각적 UI/모바일/키보드 | 브라우저 수동 검사 없음 | PENDING |
| LLM 연결/성능·보안 전체 시험 | 별도 검사 미실행 | NOT_VERIFIED |

**검증 범위의 한계:** 사용자 제공 터미널 로그를 근거로 기록했다. GET HTTP 200은 화면 렌더링·반응형·키보드 접근성 PASS를 뜻하지 않는다. API 합성 사례 1개 통과는 실제 금융사기 탐지 성능을 보장하지 않는다.

**로컬 Git 상태(사용자·원격 검사 기준):** `package-lock.json` 미추적, `next-env.d.ts` Next.js 자동 갱신, `tsconfig.tsbuildinfo` 빌드 캐시 생성. 패키지 잠금 파일은 추후 의도적으로 커밋하며, 자동 생성된 환경 선언 파일은 확인 후 반영한다. 강제 초기화나 작업물 삭제는 금지.

### 04-5 다음 작업: 사용자 화면 수동 검증

1. 기존 04-4 서버는 임시 실행 후 종료됐으므로, 새 터미널에서 Node24 경로를 적용하고 `npm run dev`로 실행.
2. Ubuntu/Windows 브라우저에서 `http://localhost:3000` 접속.
3. 가상 메시지 불러오기, '송금 전' 분석, '이미 송금'으로 전환할 때 112 안내가 **분석 버튼을 누르기 전에 즉시 나타나는지** 확인.
4. 상황 4종과 빈 입력·긴 입력 오류, 모바일 폭, 키보드 이동을 확인.
5. 개발 서버 종료(Ctrl+C), `git status --short` 확인 후 증빙 기록.

---

## 04-5. 사용자 브라우저 스크린샷 점검(2026-10-30)

**관찰 가능한 사항:** 업로드한 데스크톱 스크린샷에서 상단 브랜드, 개인정보 보호 안내, 입력칸, 상황 선택, 분석 결과, 안전행동, 112·118 상담 경로와 하단 고지가 화면에 모두 나타난다. **화면 렌더링(데스크톱) PASS**. 이는 실제 키보드/모바일/동작 테스트를 대신하지 않는다.

**결함 KSAFE-UI-001 (중요):** 가족을 사칭하면서 휴대전화 문제를 내세워 상품권 PIN 전송 및 긴급 이체를 요구하는 합성 메시지에 `no_clear_signal`이 표시됨. 이는 단어 기반 규칙의 탐지 범위가 좁기 때문으로 코드에서 확인함. '안전 보증 아님' 문구는 올바르지만 **금융사기 주요 사례 탐지 누락은 FAIL**.

**조치(코드·시험 작성):**
- 규칙 추가: `family_contact_scam`, `gift_card_pin_request`, `urgent_transfer_request`.
- 송금 전 가족 사칭 위험 시 **기존에 사용하던 가족 번호로 직접 통화하여 확인**하도록 추천.
- 가족 사칭 상품권, 가족 사칭 긴급 이체, 정상 가족 안부, 이미 송금했을 때 112 우선 등 회귀시험 4개 추가.
- **실제 실행 결과는 아래 체크리스트로 별도 판정한다.** 코드 작성/원격 GitHub 반영만으로 테스트 PASS를 선언하지 않는다.

| 시험 | 현재 판정 | 필요한 후속 확인 |
|---|---|---|
| 데스크톱 기본 UI 렌더링 | **PASS(제공 스크린샷 기준)** | 배치·가독성 개선 가능 |
| 가족 사칭 사례 탐지 | 기존 버전 **FAIL** · 수정 코드 작성 | `npm test` 및 실제 UI에서 재시연 |
| 기존 정상 가족 연락에 대한 오탐 | 신규 회귀시험 작성 | 실제 `npm test` 결과 |
| 송금 후 긴급 패널 즉시 표시 | 스크린샷이 송금 전 상태라 **NOT_VERIFIED** | '이미 송금' 선택 후 클릭 전에 확인 |
| 모바일/키보드 접근성 | **NOT_VERIFIED** | 실제 브라우저 점검 |
| 전체 금융사기 탐지 성능 | **NOT_VERIFIED** | 05단계 합성 사례 평가 |

### 04-5 회귀 테스트 실제 실행 기록 — 2026-10-30

사용자 WSL2 Ubuntu에서 `main`을 `c4617c6`까지 fast-forward로 가져온 후 다음 실행 로그가 제공되었다. **이전 결함 버전이 아니라 수정 후 버전의 결과**다.

| 검사 | 사용자 제공 증거 | 결과 |
|---|---|---|
| 원격 코드 반영 | `c284461..c4617c6` fast-forward | PASS |
| 타입 검사 | `npm run typecheck`, 오류 출력 없음·후속 단계 정상 진행 | PASS |
| 자동 테스트 | 9개 실행, **9 PASS / 0 FAIL / 0 SKIP** | PASS |
| 가족 사칭 상품권·PIN | 전용 회귀 시험 통과 | PASS |
| 가족 사칭 긴급 송금 | 전용 회귀 시험 통과 | PASS |
| 정상 가족 연락 오탐 방지 | 전용 회귀 시험 통과 | PASS |
| 이미 송금 시 긴급 연락 우선 | 전용 회귀 시험 통과 | PASS |
| 프로덕션 빌드 | Next.js 16.4.3, TypeScript 완료, 4/4 정적 페이지 생성 | PASS |
| 최신 코드로 실제 브라우저 재시연 | 아직 화면 조작·결과가 제공되지 않음 | **PENDING** |

**결함 KSAFE-UI-001 판정:** 가족 사칭 탐지 **수정 후 자동 회귀시험 PASS**, **브라우저 동일 사례 재시연 PENDING**. 전체 사기 탐지 성능이나 실사용 정확도는 검증되지 않았다.

**Git 작업물 보존:** 사용자 로컬 최종 `git status --short`에는 `M next-env.d.ts`, `?? package-lock.json`이 남아 있다. TypeScript 캐시 파일은 .gitignore에 의해 제외된다. 이 파일은 임의 초기화/삭제하지 않는다.

**다음 작업 04-6:** 브라우저에서 가족 사칭 합성 문자를 분석해 위험 경고와 기존 가족 연락처 확인 권고를 확인하고, '이미 송금함' 선택 시 분석 전 즉시 112 안내가 나오는지 점검한다. 모바일 폭·키보드 조작도 확인한 뒤 구현 단계의 부분 PASS/잔여 위험을 확정한다.

**다음 로컬 검증:** 개발 서버를 종료하고 기존 사용자 변경사항을 보존한 채 최신 `main`을 fast-forward로 가져온 뒤 `npm run typecheck`, `npm test`, `npm run build`을 수행한다. Git 상태에 `package-lock.json`(미추적), `next-env.d.ts`(Next.js 자동 수정)가 있을 수 있으므로 `git reset --hard`, `git clean`은 사용하지 않는다.

---

## 5. 안전 유의

이 MVP는 공식 금융사기 판정이나 지급정지 서비스가 아니다. **이미 송금했다면 112 및 거래 금융회사에 즉시 연락**하도록 화면에서 안내한다. 결과가 안전을 보증하지 않으며 금융회사·수사기관의 판단을 대체하지 않는다.
