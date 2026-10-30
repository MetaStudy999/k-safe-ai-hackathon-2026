import { getActions, type Situation } from "./safety";

const REFERENCE_SCENARIOS = [
  {
    id: "before_transfer",
    label: "송금 전",
    detail: "지금 송금하라는\n연락을 받았어요.",
    icon: "send",
    message:
      "OO은행 대출센터입니다.\n대출 전환을 위해 먼저 상환금을 보내고\n별도 앱을 설치해 주세요.",
    clues: [
      {
        icon: "coins",
        title: "선입금 요구",
        description: "대출을 위해 먼저 돈을 보내라는 요구를 주의하세요.",
      },
      {
        icon: "download",
        title: "별도 앱 설치 유도",
        description:
          "출처가 불분명한 앱은 개인정보 유출과 추가 피해로 이어질 수 있습니다.",
      },
    ],
    alertTitle: "송금하기 전이라면",
    alertText: "송금과 앱 설치를 멈추고 공식 경로로 확인하세요.",
    steps: [
      "송금·앱 설치를 멈추세요.",
      "금융회사에 직접 확인하세요.",
      "판단이 어렵다면 118에 상담하세요.",
    ],
  },
  {
    id: "already_transferred",
    label: "이미 송금",
    detail: "이미 돈을\n보냈어요.",
    icon: "money",
    message:
      "OO은행 대출센터입니다.\n대출 전환을 위해 먼저 상환금을 보내고\n별도 앱을 설치해 주세요.",
    clues: [
      {
        icon: "coins",
        title: "선입금 요구",
        description:
          "정상적인 금융기관은 대출을 위해 먼저 돈을 요구하지 않습니다.",
      },
      {
        icon: "download",
        title: "별도 앱 설치 유도",
        description:
          "출처가 불분명한 앱 설치는 개인정보 유출과 추가 피해로 이어질 수 있습니다.",
      },
    ],
    alertTitle: "이미 송금했다면",
    alertText: "즉시 112 및 금융회사에 연락하세요.",
    steps: [
      "즉시 112에 신고하세요.",
      "금융회사에 즉시 연락하세요.",
      "관련 정보를 보관하세요.",
    ],
  },
  {
    id: "installed_app",
    label: "앱 설치함",
    detail: "안내된 앱을\n설치했어요.",
    icon: "phone",
    message:
      "고객센터입니다.\n본인 확인을 위해 원격지원 앱을 설치하고\n앱에서 계좌 비밀번호를 입력해 주세요.",
    clues: [
      {
        icon: "phone",
        title: "원격지원 앱 설치 요구",
        description: "상대방이 기기를 원격으로 조작할 수 있는 앱을 주의하세요.",
      },
      {
        icon: "lock",
        title: "금융정보 입력 요구",
        description: "계좌 비밀번호와 인증번호를 전달하지 마세요.",
      },
    ],
    alertTitle: "의심 앱을 설치했다면",
    alertText: "안전한 다른 기기로 금융회사와 118에 연락하세요.",
    steps: [
      "의심 앱 사용을 멈추세요.",
      "안전한 다른 기기로 연락하세요.",
      "금전 피해가 의심되면 즉시 신고하세요.",
    ],
  },
  {
    id: "unsure",
    label: "잘 모르겠음",
    detail: "정확히 모르겠어요.\n확인하고 싶어요.",
    icon: "question",
    message:
      "택배 배송지 정보가 잘못되었습니다.\n문자에 포함된 링크에 접속해\n주소와 개인정보를 다시 입력해 주세요.",
    clues: [
      {
        icon: "link",
        title: "확인되지 않은 링크",
        description: "문자 속 링크 대신 공식 앱이나 홈페이지에서 확인하세요.",
      },
      {
        icon: "lock",
        title: "개인정보 입력 유도",
        description: "배송을 빌미로 개인정보를 요구하는지 살펴보세요.",
      },
    ],
    alertTitle: "어떻게 해야 할지 모르겠다면",
    alertText: "행동을 잠시 멈추고 118에 상담하세요.",
    steps: [
      "송금·설치·정보 전달을 멈추세요.",
      "공식 경로로 직접 확인하세요.",
      "118에 상담하세요.",
    ],
  },
] as const satisfies readonly {
  id: Situation;
  label: string;
  detail: string;
  icon: string;
  message: string;
  clues: readonly { icon: string; title: string; description: string }[];
  alertTitle: string;
  alertText: string;
  steps: readonly string[];
}[];

// Preserve the public scenario contract introduced on main while enriching it
// with the fields required by the approved reference-based UI.
export const PUBLIC_DEMO_SCENARIOS = REFERENCE_SCENARIOS.map((scenario) => ({
  ...scenario,
  sample: scenario.message,
  signals: scenario.clues.map((clue) => clue.title),
}));

export type PublicDemoScenario = (typeof PUBLIC_DEMO_SCENARIOS)[number];

export function getPublicDemoActions(situation: Situation): string[] {
  const actions = getActions(situation);
  // Retain every established recommendation and align it to the displayed step.
  return situation === "already_transferred"
    ? [actions[1], actions[0], actions[2]]
    : actions;
}
