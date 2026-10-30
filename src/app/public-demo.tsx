"use client";

import { useState } from "react";
import { SITUATIONS, type Situation } from "@/lib/safety";
import { PUBLIC_DEMO_SCENARIOS, getPublicDemoActions } from "@/lib/public-demo";

/**
 * 공개 시연 화면: 입력창·분석 요청·네트워크 전송이 없는 고정 합성 사례.
 * 실제 위험 판단/독립 평가 결과로 오해되지 않도록 명확히 표시한다.
 */
export default function PublicDemo() {
  const [situation, setSituation] = useState<Situation>("before_transfer");
  const scenario = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === situation)
    ?? PUBLIC_DEMO_SCENARIOS[0];
  const actions = getPublicDemoActions(situation);

  return (
    <main className="site">
      <header className="header">
        <a className="brand" href="/" aria-label="K-SAFE 첫 화면">
          <span className="brandIcon">✳</span>
          <span>K-SAFE <small>국민안심 AI</small></span>
        </a>
        <span className="demoTag">2026 AI 해커톤 · 공개 아이디어 데모</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow">국민안심 AI · 공개 시연</div>
        <h1 id="hero-title">의심스러운 연락,<br /><em>어떻게 대응해야 할까요?</em></h1>
        <p>가상의 상황을 바꾸면서 상황별 안전행동 안내를 체험해 보세요.</p>
        <div className="heroNotice">
          <strong>⚠️ 아이디어 검증용 시연</strong>
          <span>실제 금융사기 판별 서비스가 아닙니다. 사전 작성된 가상 사례만 보여주며, 실제 문자·전화번호·계좌·비밀번호를 입력받지 않습니다.</span>
        </div>
      </section>

      <div className="content">
        <section className="panel" aria-labelledby="scenario-heading">
          <div className="sectionHead">
            <span className="step">01</span>
            <div>
              <h2 id="scenario-heading">가상 상황 선택</h2>
              <p>하나를 선택하면 오른쪽 안전행동 안내가 달라집니다.</p>
            </div>
          </div>
          <fieldset className="choices">
            <legend className="visuallyHidden">가상 상황</legend>
            {SITUATIONS.map((option) => (
              <label key={option.id} className={"choice" + (situation === option.id ? " selected" : "")}>
                <input
                  type="radio"
                  name="public-demo-situation"
                  value={option.id}
                  checked={situation === option.id}
                  onChange={() => setSituation(option.id)}
                />
                <span className="choiceText">
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="divider" />
          <div className="sectionHead compact">
            <span className="step">02</span>
            <div>
              <h2>가상 메시지와 참고 단서</h2>
              <p>실제 탐지기를 실행한 결과가 아닌, 미리 작성된 설명입니다.</p>
            </div>
          </div>
          <div className="analysisBox" aria-live="polite">
            <span className="riskTag review">가상 시나리오 · 자동 판정 아님</span>
            <p>{scenario.sample}</p>
            <h3>살펴볼 단서</h3>
            <ul className="reasons">
              {scenario.signals.map((signal) => <li key={signal}>{signal}</li>)}
            </ul>
            <p className="disclaimer">상황별 대응을 보여주는 정적 예시이며 실제 메시지의 위험도를 평가하지 않습니다.</p>
          </div>
          <p className="helper">
            공개 데모에는 자유 입력과 서버 분석을 제공하지 않습니다. 독립 탐지 품질 검증과 운영 보안 검증은 별도 진행 중입니다.
          </p>
        </section>

        <section className="panel resultPanel" aria-labelledby="actions-heading">
          <div className="sectionHead">
            <span className="step">03</span>
            <div>
              <h2 id="actions-heading">상황별 기본 안전행동</h2>
              <p>선택한 가상 상황에 따라 안내가 바뀝니다.</p>
            </div>
          </div>
          {situation === "already_transferred" && (
            <div className="emergency" role="alert">
              <strong>🚨 이미 송금한 상황이라면 분석을 기다리지 마세요.</strong>
              <p>즉시 112 및 거래 금융회사에 연락해 신고와 지급정지를 문의하세요.</p>
            </div>
          )}
          <div className="guide">
            <h3>권장 기본 행동</h3>
            <ol aria-live="polite">{actions.map((action, index) => <li key={index}>{action}</li>)}</ol>
          </div>
          <div className="official">
            <h3>공식 확인·상담 경로</h3>
            <p><b>112</b> · 금융사기 피해 신고 / <b>118</b> · 스미싱·인터넷침해 상담</p>
            <p>문자 속 번호를 이용하지 말고 기관의 공식 홈페이지를 통해 직접 확인하세요.</p>
          </div>
          <p className="finePrint">
            K-SAFE는 사기 여부를 확정하거나 경찰·금융회사의 판단을 대신하지 않습니다.
            외부 AI 모델은 아직 연결되지 않았고, 공개 화면에서는 사전 작성 예시만 표시합니다.
          </p>
        </section>
      </div>
      <footer>© 2026 K-SAFE · AI 해커톤 아이디어 시연 · 실제 메시지 분석 서비스 아님</footer>
    </main>
  );
}
