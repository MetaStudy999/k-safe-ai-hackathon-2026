export type Situation = "before_transfer" | "already_transferred" | "installed_app" | "unsure";
export type RiskLevel = "warning" | "review" | "no_clear_signal";
export type SignalId = "upfront_payment" | "unverified_app_install" | "urgent_pressure" | "impersonation" | "family_contact_scam" | "gift_card_pin_request" | "urgent_transfer_request" | "delivery_redirection" | "invitation_link" | "payment_cancel_verification" | "customs_payment_link" | "delivery_address_redirect" | "secret_investigation_chat" | "benefit_personal_data" | "changed_payment_account" | "remote_support_install" | "marketplace_external_payment" | "bank_secret_request" | "redelivery_fee";
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
    .replace(/(?<!\d)(?:\+?82[- .]?0?|0)1[016789][- .]?\d{3,4}[- .]?\d{4}(?!\d)/g, "[전화번호 가림]")
    .replace(/(?<!\d)\d{6}[- ]\d{7}(?!\d)/g, "[신분번호 형식 가림]")
    .replace(/(?<!\d)\d{2,4}[- ]\d{2,6}[- ]\d{3,8}(?!\d)/g, "[번호 가림]")
    .replace(/(?<!\d)\d{10,16}(?!\d)/g, "[긴 숫자 가림]");
}

const signalRules: { id: SignalId; reason: string; pattern: RegExp }[] = [
  { id: "upfront_payment", reason: "대출·환급을 위해 선입금이나 상환을 먼저 요구합니다.", pattern: /(선입금|먼저\s*(?:송금|입금|상환)|상환금|수수료.{0,8}(입금|송금))/i },
  { id: "unverified_app_install", reason: "별도 앱 설치를 유도하고 있습니다.", pattern: /(?:앱|어플|apk|애플리케이션).{0,25}(?:설치|다운로드)\s*(?:해\s*(?:주세요|주십시오|줘|요)|하(?:세요|십시오|라)|해야|해요|하셔야|바랍니다|해야\s*합니다)|(?:설치|다운로드)\s*(?:하(?:세요|십시오)|해\s*주세요).{0,15}(?:앱|어플|apk)/i },
  { id: "urgent_pressure", reason: "즉시 행동하도록 압박하는 표현이 있습니다.", pattern: /(?:지금\s*바로|즉시|당장|오늘\s*안에|계정.{0,10}(?:정지|차단).{0,18}(?:됩니다|예정|될\s*수|진행))/i },
  { id: "impersonation", reason: "금융회사 또는 공공기관을 사칭할 가능성이 있습니다.", pattern: /(금융감독원|경찰청|검찰청|공공기관|은행\s*담당자|금융회사\s*담당자)/i },
  { id: "family_contact_scam", reason: "가족인 것처럼 연락하며 휴대전화 문제를 핑계로 돈이나 상품권을 요구합니다. 가족의 기존 번호로 따로 확인하세요.", pattern: /(?=[\s\S]*(?:엄마|아빠|어머니|아버지|딸|아들))(?=[\s\S]*(?:휴대폰|핸드폰|폰|액정|전화번호))(?=[\s\S]*(?:고장|깨져|수리|이\s*번호|새\s*번호|번호\s*바꿨))(?=[\s\S]*(?:송금|이체|입금|상품권|핀\s*번호|돈|계좌))[\s\S]*/i },
  { id: "gift_card_pin_request", reason: "상품권·기프트카드의 PIN 번호나 코드를 전달해 달라는 요청입니다.", pattern: /(?:문화\s*상품권|상품권|기프트\s*카드|모바일\s*쿠폰).{0,80}(?:핀\s*번호|PIN\s*번호|기프트\s*코드|코드|번호|카톡|보내)|(?:핀\s*번호|PIN\s*번호|기프트\s*코드).{0,40}(?:보내|전송|알려)/i },
  { id: "urgent_transfer_request", reason: "급한 상황을 내세워 계좌이체·송금 등을 요구합니다.", pattern: /(?:급하게|급히|빨리|당장|지금).{0,55}(?:이체|송금|입금|돈.{0,8}보내|계좌.{0,12}보내)|(?:이체|송금|입금).{0,40}(?:급해|급합니다|빨리|지금)/i },
  { id: "delivery_redirection", reason: "배송지 오류를 내세워 별도 링크에서 수정을 유도합니다. 공식 택배사 경로로 확인하세요.", pattern: /(?:택배|배송지|배송).{0,70}(?:잘못|오류|틀렸|수정|변경).{0,80}(?:링크|주소|페이지|확인)/i },
  { id: "invitation_link", reason: "청첩장·초대장 링크 열람을 유도합니다. 발신자에게 기존 연락 수단으로 확인하세요.", pattern: /(?:모바일\s*)?(?:청첩장|결혼식\s*초대장).{0,90}(?:링크|주소|URL|접속|클릭)/i },
  { id: "payment_cancel_verification", reason: "카드 결제 승인 이후 별도 취소·본인확인 페이지로 이동을 유도합니다.", pattern: /(?:카드|결제).{0,45}(?:결제|승인).{0,90}(?:결제\s*취소|취소\s*페이지|본인\s*확인|인증)/i },
  { id: "customs_payment_link", reason: "관세·통관 미납을 내세워 조회 링크나 결제를 유도합니다.", pattern: /(?:관세|통관).{0,50}(?:미납|납부|결제).{0,85}(?:배송\s*조회|링크|페이지|결제|납부)/i },
  { id: "delivery_address_redirect", reason: "배송·수취지 확인을 빌미로 별도 주소 접속을 요청합니다.", pattern: /(?:택배|배송|수취지|수령지).{0,110}(?:확인|보류|변경|주소|접속|입력).{0,70}(?:주소|링크|접속|확인|입력).{0,40}(?:접속|입력|해\s*주세요|하세요)/i },
  { id: "secret_investigation_chat", reason: "수사기관을 내세우며 비밀 유지를 요구하고 별도 채팅 참여를 유도합니다.", pattern: /(?:수사관|경찰|검찰|수사기관).{0,90}(?:비밀|말하지|알리지|공개하지).{0,70}(?:채팅방|대화방|오픈채팅|들어오세요|참여)/i },
  { id: "benefit_personal_data", reason: "지원금을 내세워 별도 화면에서 개인정보·인증을 요구합니다.", pattern: /(?:지원금|보조금|환급금|지급\s*대상|대상자).{0,100}(?:주민정보|개인정보|신분증|주민번호|인증).{0,80}(?:화면|페이지|입력|신청|제출|인증)/i },
  { id: "changed_payment_account", reason: "거래처 계좌가 변경됐다며 결제 계좌 확인을 유도합니다. 기존 공식 경로로 확인하세요.", pattern: /(?:거래처|청구서|대금|회계팀|납품).{0,100}(?:변경된|새로운|바뀐|새\s*계좌|계좌\s*변경).{0,60}(?:계좌|통장|입금|송금|이체|대금)/i },
  { id: "remote_support_install", reason: "고객센터 지원을 빌미로 원격제어 프로그램을 설치하도록 유도합니다.", pattern: /(?:고객센터|상담원|기술지원|지원팀|점검).{0,100}(?:원격제어|원격\s*지원|원격접속).{0,70}(?:앱|프로그램|설치|내려받|다운로드)/i },
  { id: "marketplace_external_payment", reason: "거래를 빌미로 별도 인증 페이지에 카드·계좌 정보를 요구합니다.", pattern: /(?:중고|판매자|안전결제|직거래).{0,110}(?:인증|확인|결제).{0,50}(?:페이지|사이트|화면).{0,70}(?:카드|계좌|비밀번호).{0,50}(?:정보|번호|입력)/i },
  { id: "bank_secret_request", reason: "은행을 내세워 전화 등으로 비밀번호·인증번호를 전달하도록 요구합니다.", pattern: /(?:은행|금융회사|카드사).{0,130}(?:전화|연락처|상담|안내).{0,80}(?:비밀번호|인증번호|OTP|암호).{0,40}(?:말하세요|알려|전달|입력|공유)/i },
  { id: "redelivery_fee", reason: "택배 재배송을 위해 별도의 비용 결제·납부를 요청합니다.", pattern: /(?:택배|배송|재배송|반송).{0,120}(?:재배송|배송비|비용|수수료|결제창).{0,70}(?:납부|결제|입금|송금)/i }
];

export function getActions(situation: Situation, signals: SignalId[] = []): string[] {
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
  if (signals.includes("family_contact_scam") || signals.includes("gift_card_pin_request")) {
    return [
      "송금하거나 상품권·PIN 번호·인증번호를 전달하지 마세요.",
      "가족이 이전부터 사용하던 번호로 직접 통화하여 요청을 확인하세요.",
      "새 번호로 연락하라는 문자만 믿지 말고, 확인이 어려우면 118 등 공식 상담 창구에 문의하세요."
    ];
  }
  return [
    "송금·앱 설치·인증번호 전달을 멈추세요.",
    "문자 속 번호가 아닌 공식 홈페이지에 나온 대표번호로 직접 확인하세요.",
    "판단이 어려우면 118 등 공식 상담 창구에 문의하세요."
  ];
}

// Meta text (training, documentation, analysis) is not a direct payment request.
// Keep warnings when a clear instruction to provide credentials, money or access exists.
// These heuristics cannot reliably understand context; do not infer that a non-match is safe.
const metaDiscussion = /(?:교육|강의|수업|발표|디자인|설명|분석|예시|사례|자료|안내서|연구)/i;
const directAction = /(?:입력(?:해|하)|보내(?:주|달라|세요)|전달(?:해|하세요)|송금(?:해|하)|이체(?:해|하)|입금(?:해|하)|클릭(?:해|하)|접속(?:해|하)|설치(?:해|하)|납부(?:해|하)|말(?:해|하)세요|알려(?:주세요|주십시오)|다운로드(?:해|하)|제출(?:해|하)|신청(?:해|하))/i;

export function analyzeMessage(message: string, situation: Situation): AnalysisResult {
  const isNonActionableDiscussion = metaDiscussion.test(message) && !directAction.test(message);
  const matches = isNonActionableDiscussion ? [] : signalRules.filter((rule) => rule.pattern.test(message));
  const signals = matches.map((rule) => rule.id);
  return {
    risk_level: matches.length >= 2 ? "warning" : matches.length === 1 ? "review" : "no_clear_signal",
    signals,
    reasons: matches.length > 0 ? matches.map((rule) => rule.reason) : ["사전 정의된 규칙에서 명확한 위험 신호를 찾지 못했습니다. 이것이 안전하다는 뜻은 아닙니다."],
    uncertainty_notice: "이 결과만으로 사기 여부를 확정할 수 없습니다. 공식 경로로 직접 확인하세요.",
    recommended_actions: getActions(situation, signals),
    source: "rules_fallback",
    analysis_status: "fallback"
  };
}
