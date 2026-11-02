# 🇰🇷 K-SAFE — 국민안심 AI

금융사기가 의심되는 상황에서 다음 안전행동을 안내하는 해커톤 시연 MVP입니다.

**2026-11-02 구현 기준** · [기존 공개 데모](https://k-safe-ai-hackathon-2026.vercel.app/) · [최신 검증 기록](docs/05-verification/MVP-20261102.md)

![K-SAFE 표지](docs/08-presentation/assets/k-safe-cover.png)

*브랜드 콘셉트 이미지입니다. 실제 공개 기능은 가상 사례와 사전 생성 설명이며 실시간 탐지 서비스가 아닙니다.*

> 공개 화면은 네 가상 사례와 **사전 생성 AI 설명**을 제공합니다. 사용자 메시지를 입력받거나 실시간 AI 탐지를 수행하지 않습니다. 실제 기관 연동·신고·송금·지급정지를 대신 처리하지 않습니다.
>
> 실제 문자·계좌·비밀번호는 입력하지 마세요. 개발과 발표에는 합성 자료만 사용합니다. 이미 송금한 경우 AI를 기다리지 말고 공식 기관·금융회사에 직접 확인하세요.

## 지금 가능한 것

| 구분 | 구현·검증 상태 | 범위 |
|---|---|---|
| 공개 시연 | 네 상황·반응형 UI·사전 생성 AI 설명 구현 | 입력·실시간 분석 없음 |
| 개발 분석 | 규칙 분석 + 실제 OpenAI 보조 설명 | 루프백 development에서만 AI 활성화 |
| AI 입력 | 상황과 서버가 정한 위험 신호·고정 설명 | 메시지 원문·가림문·사용자 명령은 전송하지 않음 |
| 안전 행동 | 기존 규칙이 결정·AI 오류에도 유지 | AI 판정·자동 금융 조치 없음 |
| 자동 검사 | 타입·74개 테스트·프로덕션 빌드 PASS | 모의 AI 검사와 실제 호출을 분리 |
| 실제 흐름 | 브라우저→개발 API→실제 AI→화면 PASS | 합성 예시의 기능 확인 |
| 공개 HTTP | 로컬 production / 200, /lab 404, 분석 POST 503 | 운영 주소의 버전은 배포 영수증과 대조 |
| 독립 탐지 품질 | 사람의 자료·라벨 검토 대기 | 시험 수를 탐지 정확도로 주장하지 않음 |
| 공식 대회 요건 | 실제 공고·기한 미확정 | 다른 대회 자료는 참고용 |

현재 운영 주소의 기존 배포와 이 브랜치의 최신 변경은 별개입니다. 최신 공개 반영 여부와 배포 커밋은 [검증 기록](docs/05-verification/MVP-20261102.md)의 배포 영수증을 확인하세요.

## 3분 시연

1. `송금 전` → `이미 송금`으로 바꾸고 AI 대기 없는 긴급 안내를 확인합니다.
2. `AI가 풀어 쓴 가상 사례 설명`을 열어 **미리 생성한 설명**이라는 표시를 확인합니다.
3. 개발 화면에서는 가상 예시를 불러오고 실제 AI 보조 설명을 확인합니다.
4. AI 연결 실패 시에도 규칙 근거·긴급 행동이 유지되는 것을 확인합니다.

[발표 PDF](docs/08-presentation/K-SAFE-MVP-20261102.pdf) · [편집 가능한 PPTX](docs/08-presentation/K-SAFE-MVP-20261102.pptx) · [시연 대본·예비 시연](docs/08-presentation/DEMO-SCRIPT-20261102.md) · [발표 디자인 가이드](docs/08-presentation/K-SAFE-SLIDE-DESIGN-SYSTEM.md)

## 로컬 재현

기존 WSL2 폴더는 `~/codyssey/k-safe-ai-hackathon-2026`입니다. 기존 작업을 초기화하거나 다시 복제할 필요는 없습니다. Node.js는 `.nvmrc`의 **24.22.0**을 사용합니다.

```bash
cd ~/codyssey/k-safe-ai-hackathon-2026
nvm use
npm ci
npm run typecheck
npm test
npm run build
npm run start
```

기본 주소는 `http://127.0.0.1:3000/`입니다. `build` → `start`는 공개 가상 사례 화면을 보여주며 `/lab`과 분석 API는 공개하지 않습니다.

개발용 규칙 분석기는 기존 서버를 종료한 뒤 `npm run dev`로 실행합니다. **실제 AI 설명은 기본 비활성화**입니다. 키를 저장소에 쓰지 않고 승인된 기존 환경파일에서 실행 환경으로만 전달하려면 다음과 같이 실행합니다.

```bash
node scripts/with-existing-key.mjs dev /path/to/approved-existing.env
```

이 실행기는 해당 파일에서 `OPENAI_API_KEY`만 읽고 다른 자격증명을 전달하지 않습니다. 키는 파일·Git·콘솔에 복사하지 않습니다. 키와 AI 활성화가 있어도 production에서는 AI 호출을 금지합니다.

AI 검증·공개 설명 재생성은 필요할 때만 명시적으로 실행합니다. 실제 호출 비용이 발생합니다.

```bash
node scripts/with-existing-key.mjs verify /path/to/approved-existing.env
node scripts/with-existing-key.mjs generate /path/to/approved-existing.env
```

현재 모델은 `gpt-6-luna`입니다. 로컬 실행당 최대 24회·동시 1회·8초 제한·재시도 0을 적용합니다. 이 장치는 재시작·여러 프로세스에 걸친 전역 예산이나 운영 WAF를 대신하지 않습니다. `store=false`와 SDK telemetry 비활성화가 제공자의 모든 보관 정책을 면제하지는 않습니다.

## 구조와 데이터 흐름

```mermaid
flowchart TB
  subgraph PUBLIC[공개 시연]
    CHOICE[네 상황 선택] --> FIXED[미리 작성한 가상 사례·행동]
    SAVED[검증한 사전 생성 AI 설명] --> FIXED
    LAB[/lab] --> HIDDEN[404]
    POST[분석 POST] --> BLOCK[503 / no-store]
  end
  subgraph LOCAL[루프백 개발 화면]
    INPUT[합성 메시지·상황] --> RULE[가림·공백 정규화·규칙]
    RULE --> CONTEXT[상황 enum·서버 고정 신호만]
    CONTEXT --> AI[OpenAI 보조 설명]
    AI --> VALIDATE[구조·신호 ID·출력 검사]
    VALIDATE --> RESULT[규칙 판정·행동 + 보조 설명]
    AI --> FALLBACK[실패 시 규칙 안내]
  end
```

- Next.js 16.4.3 · React 19 · TypeScript · AI SDK 7 · OpenAI Responses.
- `src/lib/safety.ts`: 규칙·가림·상황별 행동. 원문은 결과에 되돌리지 않습니다.
- `src/lib/ai-explanation.ts`: 고정 신호 설명·검증·로컬 예산·실패 대체.
- `src/data/ai-demo-explanations.json`: 실제 AI로 만든 공개용 정적 설명과 입력 해시.
- `src/app/public-demo.tsx`: 공개 화면. 사용자 입력·분석 POST 없음.
- `src/app/local-analyzer.tsx`: 개발 화면. 늦게 도착한 이전 결과를 새 상황에 적용하지 않습니다.
- `src/app/api/analyze/route.ts`: 요청 검증·규칙·선택적 개발 AI.
- `scripts/`: HTTP 검사·합성 평가·실제 AI 검증·사전 설명 생성.
- `artifacts/ai/`: 실제 호출·브라우저·키 검사·회귀 기준선 증빙.

## 검증과 표현의 한계

자동 테스트는 오류·시간 초과·출력 거부 등에 모의 AI 응답을 사용합니다. 실제 API 호출과 실제 브라우저 연결은 별도로 확인했습니다. [검증 보고서](docs/05-verification/MVP-20261102.md)에서 조건과 원본 JSON을 확인할 수 있습니다.

개발에 사용한 기존 합성 자료 54건과 공개 사례를 독립 평가 데이터로 부르지 않습니다. 이번에 찾은 줄바꿈 규칙 누락은 원본 관측을 보존하고 공백 정규화·회귀 검사로 수정했습니다. 새로운 AI 작성 후보도 사람의 라벨·출처 검토 전에는 독립 품질 평가로 사용하지 않습니다. [24건 사람 검토표](artifacts/evaluation/HUMAN-REVIEW.md)를 준비했고 형식 검사만 통과했습니다. 코드 버전과 원본 해시를 고정했으며 품질 평가는 아직 실행하지 않았습니다.

공개 분석 API의 차단은 실제 WAF 요청 제한·HTTP 429 검증과 다릅니다. 실제 사용자 메시지 분석 공개에는 접근 제어, 분산 제한, 운영 로그·비용·개인정보 정책 검증이 추가로 필요합니다. 현재 분석 차단을 우회하거나 검증 표시를 임의로 바꾸지 않습니다.

## 단계별 문서와 제출 준비

- [기획](docs/01-planning/README.md) · [공식 심사자료 비교·내부 기준](docs/01-planning/JUDGING-CRITERIA-2025-2026.md)
- [요구사항](docs/02-requirements/README.md) · [설계](docs/03-design/README.md) · [구현 이력](docs/04-implementation/README.md)
- [검증 이력](docs/05-verification/README.md) · [최신 구현·검증 대응표](docs/05-verification/MVP-20261102.md)
- [독립 평가 절차](docs/05-verification/BLIND-EVALUATION-05-6.md) · [평가자 안내](docs/05-verification/BLIND-EVALUATOR-GUIDE-05-6.md)
- [시연 대본](docs/08-presentation/DEMO-SCRIPT-20261102.md) · [발표 디자인 가이드](docs/08-presentation/K-SAFE-SLIDE-DESIGN-SYSTEM.md)

과거 단계 문서의 NOT_STARTED·시험 수는 작성 시점의 기록입니다. 최신 상태는 이 README와 최신 검증 보고서를 우선합니다. 실제 참가 대회의 공고·기한, 평가 자료의 사람 검토, 발표 리허설과 최종 제출 형식은 사용자 확인이 필요합니다.
