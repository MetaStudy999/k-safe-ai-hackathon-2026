// 05-4 신규 검증용 합성 문장. 기존 05-1/05-2 규칙 수정에 사용한 30건과 문구가 다릅니다.
// 위험(scam)은 '사기 위험 상황을 가정한 인위적 예문'을 뜻하며 실제 사건 확정이 아닙니다.
// 첫 실행 결과를 기록하기 전에는 이 데이터나 위험 탐지 규칙을 수정하지 마세요.
export type HoldoutCase = {
  id: string;
  expected: "scam" | "benign" | "borderline";
  category: string;
  message: string;
};
export const HOLDOUT_CASES: HoldoutCase[] = [
  { id: "HS01", expected: "scam", category: "자녀 신원 사칭", message: "아버지, 내 휴대전화가 먹통이라 친구 번호로 보내요. 오늘 안에 병원비를 다른 통장으로 보내줘." },
  { id: "HS02", expected: "scam", category: "택배기사 사칭", message: "배송 담당자입니다. 수취지 확인이 안 되어 배송이 보류됐습니다. 확인용 주소로 접속해 주세요." },
  { id: "HS03", expected: "scam", category: "수사기관 사칭", message: "수사관입니다. 비밀 조사이므로 다른 사람에게 말하지 말고 채팅방에 들어오세요." },
  { id: "HS04", expected: "scam", category: "지원금 인증 유도", message: "특별 지원금 대상자로 선정됐습니다. 오늘까지 주민정보 인증 화면에서 신청하세요." },
  { id: "HS05", expected: "scam", category: "거래처 계좌 변경", message: "거래처 회계팀입니다. 이번 청구서부터 변경된 계좌로 대금을 송금해 주십시오." },
  { id: "HS06", expected: "scam", category: "통관비 결제 유도", message: "해외 직구 통관료 납부가 지연됐습니다. 안내 페이지에서 결제해야 택배를 받습니다." },
  { id: "HS07", expected: "scam", category: "원격제어 유도", message: "고객센터 점검 때문에 휴대전화 원격제어 프로그램을 내려받아야 한다고 합니다." },
  { id: "HS08", expected: "scam", category: "가상 안전결제 사칭", message: "중고 거래 안전결제를 위해 판매자가 보내 준 인증 페이지에 카드 정보를 입력해 주세요." },
  { id: "HS09", expected: "scam", category: "초대장 사칭", message: "오랜만입니다. 모바일 청첩장을 보냈는데 초대장 링크를 열어 참석 여부를 답해주세요." },
  { id: "HS10", expected: "scam", category: "전화 사칭", message: "은행입니다. 부정 사용을 막으려면 안내된 연락처로 전화해 계좌 비밀번호를 말하세요." },
  { id: "HS11", expected: "scam", category: "배송 사칭 수수료", message: "택배가 멈춰 있습니다. 재배송 비용을 모바일 결제창에서 납부해 주세요." },
  { id: "HS12", expected: "scam", category: "상품권 코드 편취", message: "담당자님, 회사 행사 경품으로 쓸 기프트카드를 구매하고 코드를 사진으로 전송해 주세요." },

  { id: "HB01", expected: "benign", category: "택배 예방 교육", message: "택배 배송지 확인 링크를 악용한 사기 사례를 공부하는 자료입니다." },
  { id: "HB02", expected: "benign", category: "청첩장 발송 안내", message: "친구에게 보내는 모바일 청첩장 링크 문구를 디자인하고 있습니다." },
  { id: "HB03", expected: "benign", category: "가족 휴대전화 수리", message: "어머니, 제 휴대전화가 고장 났지만 기존 연락처는 그대로예요. 내일 뵙겠습니다." },
  { id: "HB04", expected: "benign", category: "결제 안내 강의", message: "카드 승인과 결제 취소의 차이를 설명하는 금융교육 강의입니다." },
  { id: "HB05", expected: "benign", category: "계정 정지 강의", message: "계정 정지 관련 안내 문구를 모아서 교육 자료로 만듭니다." },
  { id: "HB06", expected: "benign", category: "기관 안내문 분석", message: "공공기관 사칭 메시지를 어떻게 구별하는지 수업에서 발표합니다." },
  { id: "HB07", expected: "benign", category: "상품권 보안 교육", message: "상품권 PIN 번호는 타인에게 보내지 말라는 보안 교육 내용입니다." },
  { id: "HB08", expected: "benign", category: "재배송 정책 안내", message: "택배 배송 정책과 분실 신고 절차를 정리한 안내서입니다." },

  { id: "HU01", expected: "borderline", category: "대리 납부", message: "오늘 안에 가족의 병원비를 대신 입금해도 되는지 확인하고 싶습니다." },
  { id: "HU02", expected: "borderline", category: "업무 계좌 변경", message: "거래처가 계좌를 변경했다고 하는데 진짜인지 확인하고 싶습니다." },
  { id: "HU03", expected: "borderline", category: "모바일 청첩장", message: "모바일 청첩장 링크가 왔는데 아는 사람인지 기억나지 않습니다." },
  { id: "HU04", expected: "borderline", category: "로그인 확인", message: "최근 로그인 확인 메시지가 왔어요. 무슨 뜻인가요?" }
];
