// 05단계 평가용 합성 사례. 실제 피해자 정보·실제 URL·실제 전화번호 없음.
// scam: 사기 위험 단서가 들어 있는 가상 사례 / benign: 정상적인 가상 문장 / borderline: 정답 강제하지 않는 검토 사례
export type SyntheticCase = {
  id: string;
  expected: "scam" | "benign" | "borderline";
  category: string;
  message: string;
};
export const SYNTHETIC_CASES: SyntheticCase[] = [
  { id: "S01", expected: "scam", category: "대출 선입금", message: "저금리 대출 전환을 위해 기존 대출금을 먼저 상환하세요." },
  { id: "S02", expected: "scam", category: "은행 사칭", message: "은행 담당자입니다. 고객님의 계좌 인증을 요청합니다." },
  { id: "S03", expected: "scam", category: "앱 설치 유도", message: "보안 전용 앱을 지금 설치해 주세요." },
  { id: "S04", expected: "scam", category: "긴급 압박", message: "지금 바로 인증하지 않으면 계정이 정지됩니다." },
  { id: "S05", expected: "scam", category: "가족 상품권", message: "엄마, 폰 액정이 깨져서 수리했어. 문화상품권을 대신 구매해서 핀번호 보내줘." },
  { id: "S06", expected: "scam", category: "가족 긴급 이체", message: "엄마 휴대폰이 고장났어. 지금 급하게 이체해야 해서 돈 좀 보내줘." },
  { id: "S07", expected: "scam", category: "급한 이체", message: "급하게 이체해 주시면 확인 후 돌려드리겠습니다." },
  { id: "S08", expected: "scam", category: "공공기관 사칭", message: "경찰청 조사 담당자입니다. 지금 확인해 주세요." },
  { id: "S09", expected: "scam", category: "상품권 코드", message: "상품권을 먼저 구입한 뒤 코드를 보내 주세요." },
  { id: "S10", expected: "scam", category: "상품권 PIN", message: "문화상품권 PIN 번호를 카톡으로 보내 주세요." },
  { id: "S11", expected: "scam", category: "택배 링크", message: "택배 배송지가 잘못되었습니다. 아래 배송지 확인 링크를 눌러 수정하세요." },
  { id: "S12", expected: "scam", category: "청첩장 링크", message: "모바일 청첩장을 보냈습니다. 아래 링크에서 확인해 주세요." },
  { id: "S13", expected: "scam", category: "결제취소 링크", message: "카드 결제가 승인되었습니다. 결제취소 페이지에서 본인 확인을 진행하세요." },
  { id: "S14", expected: "scam", category: "지원금 수수료", message: "정부 지원금을 받으려면 수수료를 선입금해야 합니다." },
  { id: "S15", expected: "scam", category: "가상 관세 사칭", message: "해외 배송 관세가 미납되었습니다. 배송 조회 링크로 결제하세요." },

  { id: "B01", expected: "benign", category: "안부", message: "내일 점심에 같이 식사하실까요?" },
  { id: "B02", expected: "benign", category: "예약", message: "이번 주 도서관 예약을 확인했습니다." },
  { id: "B03", expected: "benign", category: "수업", message: "월요일 수업 자료를 공유합니다." },
  { id: "B04", expected: "benign", category: "모임", message: "주말 동호회 모임은 오전 열 시에 시작합니다." },
  { id: "B05", expected: "benign", category: "영업시간", message: "은행 영업시간은 평일 오전에 확인할 수 있습니다." },
  { id: "B06", expected: "benign", category: "교육용 문장", message: "스마트폰 앱 설치 설명 영상을 공유합니다. 교육용입니다." },
  { id: "B07", expected: "benign", category: "상품권 정보", message: "기프트카드 사용 방법 안내서를 읽어 보세요." },
  { id: "B08", expected: "benign", category: "송금 후 일상 대화", message: "지난주 이체 내역을 확인했습니다. 감사합니다." },
  { id: "B09", expected: "benign", category: "가족 수리", message: "엄마, 폰 액정이 깨져서 내일 수리 맡길 거야. 저녁에 만나자." },
  { id: "B10", expected: "benign", category: "보안 강의", message: "계정 정지 사례에 관한 보안 교육이 있습니다." },

  { id: "U01", expected: "borderline", category: "상품권 교육", message: "문화상품권을 구입한 후 사용법을 알아보겠습니다." },
  { id: "U02", expected: "borderline", category: "급한 연락", message: "급하게 통화 가능한지 알려 주세요." },
  { id: "U03", expected: "borderline", category: "앱 설치 문의", message: "새 앱을 설치해야 한다는데 맞는지 확인하고 싶습니다." },
  { id: "U04", expected: "borderline", category: "기기 수리 문의", message: "어머니, 휴대폰을 수리하셨나요? 연락 부탁드립니다." },
  { id: "U05", expected: "borderline", category: "입금 확인", message: "입금 확인을 언제 받을 수 있을까요?" }
];
