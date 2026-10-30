# 05-3b — API 요청률 제한 설정·검증 가이드

> 상태: **보호용 게이트 코드 작성 완료 / 외부 방화벽 규칙 실제 설정·검증 미수행**
> 2026-10-30 · [종합 검증](README.md) · [프로젝트 홈](../../README.md)

## 0. 쉬운 설명

- **요청률 제한(Rate Limiting):** 특정 사용자·IP의 짧은 시간 내 호출 횟수를 제한하여 오남용·과금 사고를 줄임.
- **WAF(Web Application Firewall, 웹 애플리케이션 방화벽):** 웹 서비스 앞단에서 요청을 검사·제한하는 장치.
- **503(Service Unavailable):** 분석 API를 아직 공개하도록 승인하지 않은 경우 제공하는 중단 신호.
- **429(Too Many Requests):** 일정 시간 동안 허용 횟수를 초과했을 때 주는 거부 신호.
- **중요:** K-SAFE의 `canUseAnalyzeApi`는 503을 반환하는 **진입 차단장치**이지 여러 서버에서 요청 수를 세는 분산 요청 제한기 자체는 아니다.

## 1. 소스에 작성한 보호 동작

- `src/lib/deployment-gate.ts`: `NODE_ENV=production`에서 `RATE_LIMIT_RULE_VERIFIED`가 정확히 `true`가 아니면 API 사용 금지.
- `src/app/api/analyze/route.ts`: 요청 본문을 읽기 전에 게이트 확인. 거부 시 민감정보 없는 JSON 및 **HTTP 503** 반환.
- `tests/deployment-gate.test.ts`: 개발모드 허용·프로덕션 기본 차단·검증 선언 후 허용 등의 단위 시험.
- `.env.example`: `RATE_LIMIT_RULE_VERIFIED=false` (기본값).
- **어떤 환경에서도** 환경변수를 `true`로 바꾸는 행위 자체는 WAF 제한의 증거가 아니다.

## 2. 권장 운영 방법 — Vercel WAF (예시, 실제 설정 미실행)

※ 아래는 **Vercel에 배포할 경우**의 안내다. 다른 배포 플랫폼을 사용하면 동일한 기능의 공유 요청 제한 서비스를 설정해야 한다.

1. Vercel 프로젝트 대시보드 → **Firewall** → **Configure** → **New Rule** 선택.
2. 규칙명 예: `k-safe-analyze-post-limit`.
3. 적용 대상: `Request Path`가 `/api/analyze`과 일치하고 가능한 경우 HTTP Method가 POST인 요청.
4. 초기 해커톤 제한 예시: **IP별 60초 동안 최대 10요청**. 평가용 단기 시험에는 낮은 한도(예: 60초 3회)를 잠시 쓰고 실제 429를 확인한 다음 운영 한도로 복구.
5. 초과 시 동작: **429 응답 또는 Deny**. 이때 API 본문이 실제로 실행되지 않는지 확인.
6. 규칙 저장 후 **Publish/Apply**해 보호 대상의 실제 서비스 호스트와 Preview URL을 모두 확인. 대시보드의 Firewall 로그·계수도 확인.
7. **실제 제한 응답·범위 검증 이후에만** 배포 환경변수 `RATE_LIMIT_RULE_VERIFIED=true`를 설정하고 재배포.
8. 공개 호스트에서 정상 요청(200), 초과 요청(429 또는 설정된 차단 응답), 일정 시간 후 회복, 잘못된 입력(400/413/415)을 확인.
9. 규칙을 제거하거나 보호 대상 URL/프로젝트가 바뀌면 즉시 플래그를 false로 되돌리고 서비스 점검.

**참고:** Hobby/Pro/Enterprise 기능·할당량·요금 조건은 수시로 달라질 수 있으며 배포 시 공식 문서로 재확인한다.

- [Vercel 공식 WAF Rate Limiting 문서](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Vercel 공식 Custom Rules 문서](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [Vercel 공식 이용량 및 과금](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)

## 3. 안전한 단계별 검증

**A. 로컬 개발 단계(지금):**

~~~bash
cd /home/ubuntu/codyssey/k-safe-ai-hackathon-2026
export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
git pull --ff-only origin main
npm run typecheck
npm test
npm run build
~~~

예상: 기존 24개 테스트에 **3개 게이트 시험 추가 → 총 27개**. 이는 예상이고 아직 실제 결과가 아니다.

**B. 로컬 프로덕션 게이트 시험(개발 서버 종료 후, 별도 시험):**

- `RATE_LIMIT_RULE_VERIFIED`를 설정하지 않은 상태에서 `npm start`로 기동하면 `POST /api/analyze`는 **503**이어야 한다.
- 같은 상황의 `GET /`은 정상 페이지를 보여야 한다.
- 로컬에서 `RATE_LIMIT_RULE_VERIFIED=true`를 **일시 적용**하면 API 호출이 허용되지만, 이는 **실제 요청 제한 동작 확인이 아니다**.
- 패키지 잠금 파일 및 Next.js 자동 생성 파일을 삭제하거나 강제 리셋하지 않는다.

**C. 공개 배포 전 필수 시험(현재 NOT_RUN):**

- [ ] Vercel WAF 또는 동일 기능의 분산 요청 제한 장치 적용
- [ ] 실제 배포 호스트에서 제한 초과에 대한 429/거부 응답 확인
- [ ] 보호 대상에 모든 공개·미리보기 URL이 포함됨 확인
- [ ] 우회 경로·IP 공용 NAT/프록시에서 오차 확인
- [ ] API 요청 본문 8KiB 초과 시 413, 잘못된 JSON 400, 형식 오류 415 확인
- [ ] 사용자 원문/비밀키가 응답·로그에 기록되지 않음 확인
- [ ] 비용·사용량 상한 설정
- [ ] 실제 해커톤 AI 필수 요건 및 제출 규정 확인

## 4. 현행 단계 판정

- **05-3a:** 타입 검사·24개 자동 테스트·빌드 **PASS(사용자 Ubuntu 실제 실행)**. 8KiB 크기 제한의 **실제 HTTP 413 시험은 아직 별도 확인 필요**.
- **05-3b:** 소스와 3개 단위테스트 **작성**, Ubuntu 실제 실행 **NOT_RUN**.
- **05-3b 외부 WAF:** **NOT_CONFIGURED / NOT_VERIFIED**.
- **05-3c 개인정보·공격 시험:** **NOT_STARTED**.
- **공개 배포:** **BLOCKED**.

플래그를 true로 바꾸는 것만으로 05-3b 완료 또는 보안 PASS를 선언하지 않는다.
