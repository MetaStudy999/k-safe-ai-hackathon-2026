# 04단계 — 구현(Implementation)

> 04-1~04-4 소스·로컬 검증 · 2026-10-30 · **설치·타입 검사·단위테스트·빌드·HTTP/API 스모크 테스트 PASS / 브라우저 시각·상호작용 미검증**
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

## 5. 안전 유의

이 MVP는 공식 금융사기 판정이나 지급정지 서비스가 아니다. **이미 송금했다면 112 및 거래 금융회사에 즉시 연락**하도록 화면에서 안내한다. 결과가 안전을 보증하지 않으며 금융회사·수사기관의 판단을 대체하지 않는다.
