import generated from "@/data/ai-demo-explanations.json";
import type { Situation } from "@/lib/safety";

export default function AiDemoNote({ situation }: { situation: Situation }) {
  const note = generated.cases.find((item) => item.situation === situation);
  if (!note) return null;
  return <details className="ai-demo-note" key={situation}>
    <summary>AI가 풀어 쓴 가상 사례 설명</summary>
    <p className="ai-origin">{generated.generated_at.slice(0, 10)} · {generated.model}으로 미리 생성한 설명입니다. 지금 사용자 메시지를 분석하거나 AI를 호출하지 않습니다.</p>
    <p>{note.summary}</p>
    <ul>{note.explanations.map((item) => <li key={item.signal_id}>{item.text}</li>)}</ul>
    <p className="ai-origin">AI는 규칙 신호만 설명합니다. 실제 피해가 의심되면 위 긴급 안내를 우선 확인하세요. 설명만으로 사기나 안전 여부를 확정할 수 없습니다.</p>
  </details>;
}
