"use client";

import { useState } from "react";
import { EXAMPLE_MESSAGE, SITUATIONS, getActions, redactMessage } from "@/lib/safety";
import type { AnalysisResult, Situation } from "@/lib/safety";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [situation, setSituation] = useState<Situation>("before_transfer");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    setResult(null);
    if (!message.trim() || message.length > 2000) {
      setError("메시지를 1~2,000자로 입력해 주세요.");
      setState("error");
      return;
    }
    setState("loading");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: redactMessage(message), situation }),
        signal: AbortSignal.timeout(10000)
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const detail = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "분석 요청이 실패했습니다.";
        throw new Error(detail);
      }
      setResult(data as AnalysisResult);
      setState("success");
    } catch {
      setState("error");
      setError("분석 서버에 연결할 수 없습니다. 아래 기본 안전행동을 우선 확인하세요.");
    }
  }

  function updateSituation(next: Situation) {
    setSituation(next);
    setResult(null);
    setState("idle");
    setError("");
  }

  const currentActions = result?.recommended_actions ?? getActions(situation);

  return (
    <main className="site">
      <header className="header">
        <a className="brand" href="/" aria-label="K-SAFE 첫 화면"><span className="brandIcon">✳</span><span>K-SAFE <small>국민안심 AI</small></span></a>
        <span className="demoTag">2026 AI 해커톤 · 시연용</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow">대한민국 국민의 금융안전을 위한 서비스</div>
        <h1 id="hero-title">의심스러운 연락,<br /><em>어떻게 대응해야 할까요?</em></h1>
        <p>문자의 위험 신호를 살펴보고, 지금 상황에 맞는 안전행동을 확인하세요.</p>
        <div className="heroNotice"><strong>개인정보 보호 안내</strong><span>실제 주민등록번호·계좌번호·비밀번호·인증번호를 입력하지 마세요. 합성 예시로 테스트해 주세요.</span></div>
      </section>

      <div className="content">
        <section className="panel" aria-labelledby="form-heading">
          <div className="sectionHead"><span className="step">01</span><div><h2 id="form-heading">의심 메시지를 확인해 보세요</h2><p>문자나 메신저의 내용을 입력해 주세요.</p></div></div>
          <label htmlFor="message" className="fieldLabel">메시지 내용</label>
          <textarea id="message" placeholder="예: 대출 전환을 위해 먼저 상환금을 보내고 전용 앱을 설치하세요." maxLength={2001} value={message} onChange={(e) => {setMessage(e.target.value);setResult(null);setState("idle");setError("");}} rows={6}/>
          <div className="fieldFooter"><button className="textButton" type="button" onClick={() => {setMessage(EXAMPLE_MESSAGE);setResult(null);setState("idle");}}>가상 예시 불러오기 ↗</button><span>{message.length.toLocaleString("ko-KR")} / 2,000자</span></div>

          <div className="divider" />
          <div className="sectionHead compact"><span className="step">02</span><div><h2>지금 어떤 상황인가요?</h2><p>선택한 상황에 따라 안전행동이 달라집니다.</p></div></div>
          <fieldset className="choices"><legend className="visuallyHidden">현재 상황</legend>
            {SITUATIONS.map((option) => (
              <label key={option.id} className={"choice" + (situation === option.id ? " selected" : "")}>
                <input type="radio" name="situation" value={option.id} checked={situation === option.id} onChange={() => updateSituation(option.id)}/>
                <span className="choiceText"><strong>{option.label}</strong><small>{option.detail}</small></span>
              </label>
            ))}
          </fieldset>

          {situation === "already_transferred" && (
            <div className="emergency" role="alert"><strong>🚨 이미 송금하셨다면 지금 즉시 신고하세요.</strong><p>AI 분석을 기다리지 말고 <b>112 또는 거래 금융회사</b>에 연락해 피해 신고와 지급정지를 문의하세요. 추가 송금은 하지 마세요.</p></div>
          )}

          <button className="primaryButton" type="button" disabled={state === "loading"} onClick={analyze}>{state === "loading" ? "위험 신호를 살펴보는 중…" : "위험 신호 분석하기"} <span aria-hidden="true">→</span></button>
          <p className="helper">현재 버전은 <b>규칙 기반 탐지 데모</b>입니다. 외부 AI 모델은 아직 연결하지 않았습니다.</p>
          {error && <p className="error" role="alert">{error}</p>}
        </section>

        <section className="panel resultPanel" aria-labelledby="result-heading">
          <div className="sectionHead"><span className="step">03</span><div><h2 id="result-heading">안전행동 가이드</h2><p>위험 신호보다 중요한 것은 다음 행동입니다.</p></div></div>
          {result ? (
            <div aria-live="polite" className="analysisBox">
              <div className={"riskTag " + result.risk_level}>{result.risk_level === "warning" ? "주의 · 다수 위험 신호" : result.risk_level === "review" ? "추가 확인 · 위험 신호" : "명확한 신호 없음 · 안전 보증 아님"}</div>
              <h3>감지한 단서</h3>
              <ul className="reasons">{result.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>
              <p className="disclaimer">{result.uncertainty_notice}</p>
              <p className="mode">분석 방식: 규칙 기반 · AI 설명 미연결</p>
            </div>
          ) : (
            <div className="emptyResult"><span aria-hidden="true">◎</span><strong>분석할 메시지를 입력해 주세요</strong><p>위험 신호와 판단의 한계가 이곳에 표시됩니다.</p></div>
          )}

          <div className="guide"><h3>지금 해야 할 일</h3><ol>{currentActions.map((action, i) => <li key={i}>{action}</li>)}</ol></div>
          <div className="official"><h3>공식 확인·상담 안내</h3><p><b>112</b> · 금융사기 피해 신고 / <b>118</b> · 스미싱·인터넷침해 상담</p><p>금융회사는 메시지의 번호가 아니라 공식 홈페이지의 대표번호로 직접 확인하세요.</p></div>
          <p className="finePrint">⚠️ K-SAFE는 사기 여부를 확정하지 않으며, 경찰·금융회사 판단이나 신고 절차를 대신하지 않습니다. 실제 피해가 의심된다면 결과를 기다리지 마세요.</p>
        </section>
      </div>
      <footer>© 2026 K-SAFE · 국민 안전을 위한 AI 해커톤 프로젝트 · 합성 데이터 시연</footer>
    </main>
  );
}
