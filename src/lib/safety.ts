export type Situation = "before_transfer" | "already_transferred" | "installed_app" | "unsure";
export type RiskLevel = "warning" | "review" | "no_clear_signal";
export type SignalId = "upfront_payment" | "unverified_app_install" | "urgent_pressure" | "impersonation";
export type AnalysisResult = {
  risk_level: RiskLevel;
  signals: SignalId[];
  reasons: string[];
  uncertainty_notice: string;
  recommended_actions: string[];
  source: "rules_fallback";
  analysis_status: "fallback";
};

export const SITUATIONS: { id: Situation; label: string; detail: string }[] = [
  { id: "before_transfer", label: "송금 전", detail: "아직 돈을 보내지 않았어요" },
  { id: "already_transferred", label: "이미 송금", detail: "돈을 보냈거나 계좌를 알려줬어요" },
  { id: "installed_app", label: "앱 설치함", detail: "안내받은 앱을 설치했어요" },
  { id: "unsure", label: "잘 모르겠음", detail: "상황을 판단하기 어려워요" }
];

export function isSituation(value: unknown): value is Situation {
  return SITUATIONS.some((item) => item.id === value);
}

export const EXAMPLE_MESSAGE =
  "고객님, 저금리 대출 전환을 위해 기존 대출금을 먼저 상환하고 전용 앱을 지금 설치하세요.";

export function redactMessage(input: string): string {
  return input
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[이메일 가림]")
    .replace(/(?<!\d)(?:\+?82[- ]?0?|0)1[016789][-\s]?\d{3,4}[-\s]?\d{4}(?!\d)/g, "[전화번호 가림]")
    .replace(/(?<!\d)\d{2,4}[- ]\d{2,6}[- ]\d{3,8}(?!\d)/g, "[번호 가림]")
    .replace(/(?<!\d)\d{10,16}(?!\d)/g, "[긴 숫자 가림]");
}

const signalRules: { id: SignalId; reason: string; pattern: RegExp }[] = [
  { id: "upfront_payment", reason: "대출·환급을 위해 선입금이나 상환을 먼저 요구합니다.", pattern: /(선입금|먼저\s*(?:송금|입금|상환)|상환금|수수료.{0,8}(입금|송금))/i },
  { id: "unverified_app_install", reason: "별도 앱 설치를 유도하고 있습니다.", pattern: /(앱|어플|apk|애플리케이션).{0,12}(설치|다운로드)|(설치|다운로드).{0,12}(앱|어플|apk)/i },
  { id: "urgent_pressure", reason: "즉시 행동하도록 압박하는 표현이 있습니다.", pattern: /(지금\s*바로|즉시|당장|오늘\s*안에|계정.{0,8}(정지|차단))/i },
  { id: "impersonation", reason: "금융회사 또는 공공기관을 사칭할 가능성이 있습니다.", pattern: /(금융감독원|경찰청|검찰청|공공기관|은행\s*담당자|금융회사\s*담당자)/i }
];

export function getActions(situation: Situation): string[] {
  if (situation === "already_transferred") {
    return [
      "AI 분석을 기다리지 말고 즉시 112와 거래 금융회사에 연락해 피해 신고·지급정지를 문의하세요.",
      "상대방에게 추가로 송금하거나 인증번호를 알려주지 마세요.",
      "거래 내역과 연락 기록을 안전하게 보관하세요."
    ];
  }
  if (situation === "installed_app") {
    return [
      "의심 앱에서 로그인·인증·송금을 하지 마세요.",
      "안전한 다른 기기로 금융회사에 직접 연락하고, 스미싱 상담은 118에 문의하세요.",
      "금전 피해가 의심된다면 112와 금융회사에 즉시 연락하세요."
    ];
  }
  return [
    "송금·앱 설치·인증번호 전달을 멈추세요.",
    "문자 속 번호가 아닌 공식 홈페이지에 나온 대표번호로 직접 확인하세요.",
    "판단이 어려우면 118 등 공식 상담 창구에 문의하세요."
  ];
}

export function analyzeMessage(message: string, situation: Situation): AnalysisResult {
  const matches = signalRules.filter((rule) => rule.pattern.test(message));
  const signals = matches.map((rule) => rule.id);
  return {
    risk_level: matches.length >= 2 ? "warning" : matches.length === 1 ? "review" : "no_clear_signal",
    signals,
    reasons: matches.length > 0 ? matches.map((rule) => rule.reason) : ["사전 정의된 규칙에서 명확한 위험 신호를 찾지 못했습니다. 이것이 안전하다는 뜻은 아닙니다."],
    uncertainty_notice: "이 결과만으로 사기 여부를 확정할 수 없습니다. 공식 경로로 직접 확인하세요.",
    recommended_actions: getActions(situation),
    source: "rules_fallback",
    analysis_status: "fallback"
  };
}
