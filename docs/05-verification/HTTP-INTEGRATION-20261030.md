# 05-3c 로컬 HTTP 보안 통합시험 — 실제 결과

> **2026-10-30 | 사용자 Ubuntu WSL2 실행 로그 | 8/8 PASS**
>
> [05단계 검증](README.md) · [05-3c 검증 계획](PRIVACY-SECURITY-PLAN.md) · [시험 스크립트](../../scripts/verify-http-security.py)

## 1. 실행 환경 및 판정 근거

- 저장소: `MetaStudy999/k-safe-ai-hackathon-2026`
- 로컬 경로: `/home/ubuntu/codyssey/k-safe-ai-hackathon-2026`
- 사용자 `git pull --ff-only origin main`: `967c559..fb5400b` fast-forward 성공
- 명령: `python3 scripts/verify-http-security.py`
- 시험 호스트: `127.0.0.1:3103`(외부 네트워크 공개 아님)
- 시험은 **새로 생성한 합성 입력**만 사용했고 기존 3000번 개발서버에 영향을 주지 않는 전용 포트로 설계됐다.
- 스크립트가 임시로 `RATE_LIMIT_RULE_VERIFIED=true`를 넣은 것은 **로컬 HTTP 동작 시험**을 위한 것으로 실제 WAF 인증을 의미하지 않는다.

## 2. 실제 HTTP 응답 표

| 검사 ID | 사용자 제공 실제 출력 | 판정 |
|---|---|---|
| H-01 | `public-home-when-gated: HTTP 200` | PASS |
| H-02 | `production-gate-locked: HTTP 503` | PASS |
| H-03 | `valid-synthetic-request: HTTP 200` | PASS |
| H-04 | `malformed-json: HTTP 400` | PASS |
| H-05 | `unsupported-content-type: HTTP 415` | PASS |
| H-06 | `oversized-request-8kib: HTTP 413` | PASS |
| H-07 | `message-over-2000-characters: HTTP 400` | PASS |
| H-08 | `untrusted-instructions-input: HTTP 200` 및 안전한 권고 내용 검증 | PASS |

- 종료 출력: **`05-3c HTTP_INTEGRATION_PASS (8/8 checks)`**
- 기존 단위시험: **33개 PASS** (별도 이전 실행 결과)
- 기존 Next.js 프로덕션 빌드: **PASS** (별도 이전 실행 결과)

**의미:** 로컬 서버에서 HTTP 기본 오류 처리, 8KiB 요청 차단, 프로덕션 API 진입 차단과 합성 악성 지시의 안전한 응답이 시험 조건에서 동작했다.

## 3. 확인되지 않은 범위

- **실제 WAF 요청률 제한(HTTP 429), 다중 인스턴스 공유 정책:** NOT_VERIFIED
- **실제 공개 호스팅의 로그·원문/개인정보 보관 및 삭제 정책:** NOT_VERIFIED
- **브라우저 DOM 취약점, 침투 테스트, 대용량 부하·DoS 방어:** NOT_VERIFIED
- **다양한 개인정보 형식과 실환경 탐지 정확도:** NOT_VERIFIED
- **LLM(대형언어모델) 연동·프롬프트 인젝션 방어:** NOT_IMPLEMENTED / NOT_VERIFIED

**보안 해석 주의:** H-08의 HTTP 200은 서버가 응답했다는 상태이며, 스크립트가 출력 내용의 기본 안전 기준도 검사했지만 모든 악성 입력을 차단했다는 증거는 아니다. HTTP 413은 응용서버의 제한이며 프록시 앞단의 대역폭이나 리소스 보호는 별개다.

## 4. Git 작업물 보존

시험 완료 후 사용자 터미널의 `git status --short`:

```text
 M next-env.d.ts
?? package-lock.json
```

두 파일은 사용자 로컬 작업물로 간주하고 **강제 초기화·삭제·무단 덮어쓰기 금지**.

## 5. 단계 판정

- **05-3c 로컬 자동단위·빌드·HTTP 통합 시험: PASS**
- **05단계 전체 보안 검증: IN_PROGRESS**
- **공개 API 운영 / 06 외부 공개 배포: BLOCKED**

다음은 [05-4 배포 전 보안 승인표](PREDEPLOY-GATE.md)의 보류 항목을 검토한다.
