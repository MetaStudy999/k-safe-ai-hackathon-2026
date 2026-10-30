import { getActions, type Situation } from "./safety";

/**
 * 공개 아이디어 데모는 미리 작성한 가상 사례만 보여준다.
 * 실제 문자/연락처/계좌를 입력받거나 위험 여부를 자동 판정하지 않는다.
 * 05-6 독립 평가 데이터와 기존 탐지 규칙은 사용하거나 변경하지 않는다.
 */
export type PublicDemoScenario = {
  id: Situation;
  sample: string;
  signals: readonly string[];
};

export const PUBLIC_DEMO_SCENARIOS: readonly PublicDemoScenario[] = [
  {
    id: "before_transfer",
    sample: "고객님, 대출 전환을 위해 먼저 상환금을 보내고 별도 앱을 설치해 주세요.",
    signals: ["선입금 요구", "별도 앱 설치 유도"],
  },
  {
    id: "already_transferred",
    sample: "대출 변경 비용을 먼저 입금하라는 연락을 받고 이미 송금한 가상 상황입니다.",
    signals: ["이미 송금한 상황", "추가 송금 요구 경계"],
  },
  {
    id: "installed_app",
    sample: "고객센터라고 주장하는 상대의 안내에 따라 원격지원 앱을 설치한 가상 상황입니다.",
    signals: ["상대의 신원 미확인", "별도 원격지원 앱 설치"],
  },
  {
    id: "unsure",
    sample: "택배 배송지 확인이 필요하다며 별도 링크를 보내온 가상 상황입니다.",
    signals: ["출처 확인 필요", "링크 접속 유도"],
  },
];

export function getPublicDemoActions(situation: Situation): string[] {
  return getActions(situation);
}
