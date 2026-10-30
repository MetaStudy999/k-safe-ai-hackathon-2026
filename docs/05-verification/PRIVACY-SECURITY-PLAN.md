# 05-3c — 개인정보 및 악성 입력 보안 검증

> 2026-10-30 · 상태: **정적 코드 개선·합성 단위시험 작성 / 사용자 Ubuntu 실행·실제 HTTP 보안시험 대기**
>
> [05단계 보고서](README.md) · [04 구현](../04-implementation/README.md) · [프로젝트 홈](../../README.md)

## 0. 목적

이 단계는 실제 피해자 데이터 없이 **가상의 합성 메시지**로 개인정보 마스킹, 악성 명령문 대응, 응답 내용 최소화, HTTP API 오류 처리를 점검한다.

중요: *마스킹은 완전한 익명화가 아니다*. 계좌·신분증 번호 등 **실제 민감정보를 입력하지 않는다**. 실서비스 제공이나 개인 금융정보 수집은 대회 시연 범위를 넘어선다.

## 1. 지금까지 확인된 실측 결과

- **05-3a:** 사용자 Ubuntu에서 `npm test` **24/24 PASS**, `npm run build` PASS. 8KiB 바이트 초과 오류 함수 단위시험 통과.
- **05-3b:** 사용자 Ubuntu에서 `npm run typecheck` PASS, `npm test` **27/27 PASS**, `npm run build` PASS, `GET /` PASS, WAF 검증되지 않은 상태의 `POST /api/analyze` **HTTP 503 PASS**.
- **제한:** 이 503은 기본 차단 확인이며 실제 요청률 제한(WAF) 또는 429 검증 성공을 뜻하지 않는다. WAF 설정은 아직 미완료.

## 2. 05-3c 코드 및 합성 시험 준비

| 파일 | 개선·시험 내용 | 현재 |
|---|---|---|
| `src/lib/safety.ts` | 점으로 구분한 합성 휴대전화와 신분번호 모양 `6자리-7자리` 마스킹 추가 | 코드 반영, 재시험 대기 |
| `tests/privacy-security.test.ts` | 휴대전화 점 표기·무효 신분번호 모양·가상 이메일/계좌 표기·원문 비반사·악성 명령·HTML 입력 총 6개 | 테스트 작성, **NOT_RUN** |
| `src/lib/request-guard.ts` | 8KiB 요청 크기 보호 | 단위 테스트 PASS, HTTP 통합 시험 대기 |
| `src/app/api/analyze/route.ts` | 원문 요청은 서버에서 재마스킹하고 고정 사유/행동만 응답 | 소스 확인, 실제 로그·트래픽 감리 전 |
| `src/lib/deployment-gate.ts` | 생산 환경 WAF 검증 전 분석 API를 503으로 거부 | 로컬 PASS / WAF 실제 미설정 |

**테스트 총수 예상:** 기존 27개 + 신규 6개 = **33개**. 예상일 뿐이며 결과는 Ubuntu 실제 출력 후 기록한다.

## 3. 위험모델(Threat Model)과 검증 경계

| 구분 | 검증할 것 | 한계·잔여 조치 |
|---|---|---|
| SR-01 개인정보 가림 | 점 표기 전화·하이픈 신분번호·예시 이메일·계좌번호가 문자열에 남지 않음 | 다양한 실제 입력 형식을 전부 처리하지 못함. 원문 입력을 금지하도록 안내해야 함 |
| SR-02 비밀키·로그 | 코드에 키·명시적 원문 로깅 없음 | 배포 제공자·프록시·장애 로그를 실제 확인해야 함 |
| SR-03 프롬프트 인젝션 | 악성 명령문에 지시된 송금을 반환하지 않고 고정 안내 | 외부 LLM은 미구현이므로 LLM 인젝션 안전성 **미평가** |
| SR-04 HTML/XSS | 위험 사유·추천 결과에 스크립트 입력 미반사 | 실제 브라우저 DOM 렌더·CSP 추가 점검 필요 |
| SR-04 SSRF | 입력 URL을 서버에서 자동 조회하는 코드 없음 | 실제 네트워크 요청/리다이렉트 동적 검증 필요 |
| SR-05 무보관 | DB 기록 기능 없음 | 서버·호스팅 수집 및 오류 로그 확인 필요 |
| SR-06 API 남용 | 미검증 WAF에서 503 로컬 PASS | 실제 WAF 정책 및 429 **미검증** — 공개 배포 차단 유지 |
| SR-07 안전행동 | 송금 전·후 고정 권고·112 긴급 조치 | 넓은 공격 시나리오 및 추가 평가 필요 |

## 4. 사용자 Ubuntu에서 수행할 순서

현재 WSL2 경로에 기존 `next-env.d.ts` 수정 및 `package-lock.json` 미추적 파일이 남아 있다. 둘 다 보존한다. **강제 reset/clean, npm 재설치, Git 로컬 파일 삭제를 하지 않는다.**

~~~bash
cd /home/ubuntu/codyssey/k-safe-ai-hackathon-2026
export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
git pull --ff-only origin main || exit 1
npm run typecheck || exit 1
npm test || exit 1
npm run build || exit 1
git status --short
~~~

**예상:** 타입 검사 PASS, 자동 테스트 33개 PASS, 빌드 PASS. 결과는 실측 후에만 판정한다.

## 5. 실제 API 동적 시험 — 다음 별도 단계(미실행)

개발 서버나 다른 작업 중인 포트를 건드리지 않도록 전용 테스트 포트를 사용한다.

- `RATE_LIMIT_RULE_VERIFIED=false` 프로덕션: `POST /api/analyze` → 503(기존 실측 확인)
- 시험용으로만 **로컬 프로덕션 서버**를 일시 `RATE_LIMIT_RULE_VERIFIED=true`로 실행: 정상 합성 JSON → 200, 잘못된 JSON → 400, 미지원 Content-Type → 415, 8KiB 초과 JSON → 413
- 이 임시 플래그는 **실제 WAF가 구성됐다는 뜻이 아니다**. 해당 실험 서버는 반드시 `127.0.0.1`에만 바인딩하고 종료한다.
- 서버 로그/응답에 원본 합성 민감정보가 노출되지 않음을 확인한다.
- 운영 WAF의 429는 Vercel 또는 실제 선택한 호스팅 환경에서 **추가로 수행**해야 한다.

## 6. PASS/FAIL 게이트

- [x] 05-3b 사용자 Ubuntu 로컬 게이트 **27/27, 503 PASS** 기록
- [x] 05-3c 마스킹 보완 코드 및 **신규 6개 합성 시험** GitHub 작성
- [ ] 05-3c 사용자 Ubuntu TypeScript·33개 테스트·빌드 실제 PASS
- [ ] 로컬 HTTP 200/400/413/415 시험
- [ ] 요청/응답·서버 로그·DOM 보안 점검
- [ ] 실사용 임의 신규 합성 공격 시나리오 추가
- [ ] 운영 WAF 429 및 모든 공개 엔드포인트 보호 확인

**현재 판정: 05-3b LOCAL_GATE_PASS / 05-3c TESTS_READY / PUBLIC_DEPLOYMENT_BLOCKED.** 저장소의 정적 변경만으로 실운영 개인정보 보호 수준을 인증하지 않는다.
