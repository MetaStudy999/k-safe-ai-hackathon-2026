# 04단계 — 구현(Implementation)

> 04-1 저장소 소스 작성 · 2026-10-30 · **GitHub 소스 작성 완료 / WSL2 설치·실행·빌드 미검증**
>
> [프로젝트 홈](../../README.md) · [03 설계 문서](../03-design/README.md)

## 0. 04-1 구현 범위와 실제 상태

- Next.js 16.4.3 App Router + React 19 + TypeScript 기반 앱 파일을 **작성**했다.
- 한글 입력 화면, 사용자 상황 4가지, 송금 후 긴급 연락 패널, 공식 신고 경로, 합성 예시를 구현했다.
- 단순 규칙 기반 메시지 분석 API, 전화번호·이메일·긴 숫자 가림, 상황별 행동 추천을 구현했다.
- 실제 외부 AI 모델은 **아직 연결하지 않았다**. 화면·API는 규칙 기반 모드를 명확히 알린다.
- 테스트 코드(합성 5개 사례)를 작성했으나 실제 npm 설치·테스트·빌드는 **아직 통과하지 못했다**.
- **실패 근거:** Agent Codyssey 원격 실행환경에서 npm registry DNS가 EAI_AGAIN으로 실패. Node24는 설치돼 있음.
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
| 화면·상황 선택·긴급 패널 | 작성 | NOT_VERIFIED |
| 합성 예시·안전행동 안내 | 작성 | NOT_VERIFIED |
| 규칙 기반 분석 API | 작성 | NOT_VERIFIED |
| 마스킹 | 작성 | NOT_VERIFIED |
| 자동 단위테스트 5개 | 작성 | NOT_RUN |
| 외부 AI 설명 | 미구현 | NOT_STARTED |
| API 과다요청 제한 | 미구현 | NOT_STARTED |
| 실제 공개 배포 | 미구현 | NOT_STARTED |

> 이 문서의 "작성"은 실제 테스트 PASS를 의미하지 않는다. API를 무료/공개 서비스에 배포하기 전 개인정보 보호·요청제한·취약점 시험이 필요하다.

## 4. 04-1 판정 및 다음 단계

- [x] 소스와 테스트 파일 작성
- [x] Node24.22.0 설치 확인
- [ ] npm install 성공 및 잠금 파일 확인
- [ ] npm run typecheck PASS
- [ ] npm test PASS
- [ ] npm run build PASS
- [ ] 브라우저에서 실제 UI 및 긴급 안내 시연
- [ ] 외부 LLM 설명 연결 여부·호출 비용 통제 결정

**판정: SOURCE_READY / RUNTIME_BLOCKED(NPM_DNS_EAI_AGAIN).** 실행·빌드가 확인될 때까지 04단계 PASS를 선언하지 않는다.

## 5. 안전 유의

이 MVP는 공식 금융사기 판정이나 지급정지 서비스가 아니다. **이미 송금했다면 112 및 거래 금융회사에 즉시 연락**하도록 화면에서 안내한다. 결과가 안전을 보증하지 않으며 금융회사·수사기관의 판단을 대체하지 않는다.
