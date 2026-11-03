import type { Situation } from "./safety";

// Fixed public guidance is independent of the private analyzer's contract.
export type PublicDemoSituation = Situation | "shared_information" | "clicked_link";

export const TRANSFER_FOLLOW_UP = {
  label: "이미 돈도 보냈어요 → 긴급 안내",
  situation: "already_transferred",
} as const;

export type PublicDemoNavigation = { situation: PublicDemoSituation; useSafePhone: boolean };

export function getPublicDemoNavigation(previous: PublicDemoNavigation, situation: PublicDemoSituation): PublicDemoNavigation {
  return {
    situation,
    useSafePhone: situation === "installed_app" || (situation === "already_transferred" && previous.useSafePhone),
  };
}

export const ACCOUNT_DAMAGE_GUIDANCE = "이미 송금했거나 모르는 계좌 출금이 있다면 112 또는 금융회사에 즉시 연락해 지급정지를 요청하세요.";

export const GUIDE_SOURCES = [
  {
    agency: "금융위원회",
    title: "개인정보 유출사고에 따른 보이스피싱·스미싱 피해 주의",
    publishedAt: "2026-10-06",
    href: "https://www.fsc.go.kr/no010101/87882",
    checkedAt: "2026-11-02",
  },
  {
    agency: "한국인터넷진흥원(KISA)",
    title: "개인정보 유출·피해보상금 사칭 피싱 주의 권고",
    publishedAt: "2026-10-06",
    href: "https://krcert.or.kr/kr/bbs/view.do?bbsId=B0000133&menuNo=205020&nttId=72211",
    checkedAt: "2026-11-02",
  },
  {
    agency: "경찰 피싱안심SOS",
    title: "노출 정보 종류별 상황별 조치방법",
    publishedAt: null,
    href: "https://www.counterscam112.go.kr/bbs010/board/boardList.do",
    checkedAt: "2026-11-02",
  },
] as const;

const IMPERSONATION_PRECAUTIONS = [
  "상대가 내 이름·거래 은행 등 정보를 알고 있어도 진짜 기관이라는 뜻은 아닙니다. 공식 연락처로 직접 확인하세요.",
  "대출을 내세워 개인명의 계좌로 상환금을 보내라거나 보증료를 선입금하라는 요구, 전화·문자로 원격제어 앱을 설치하라는 요구에 주의하세요.",
];

export function getPublicDemoPrecautions(situation: PublicDemoSituation): readonly string[] {
  return situation === "before_transfer" || situation === "shared_information" ? IMPERSONATION_PRECAUTIONS : [];
}

export const LINK_FOLLOW_UPS = [
  { label: "정보도 입력했어요", situation: "shared_information" },
  { label: "앱도 설치했어요", situation: "installed_app" },
  TRANSFER_FOLLOW_UP,
] as const satisfies readonly { label: string; situation: PublicDemoSituation }[];

const LINK_CLICK_ACTIONS = [
  "열린 페이지를 닫으세요. 링크를 눌렀다는 사실만으로 악성 앱 감염이나 계좌 탈취를 단정할 수 없으며, 안전이 확인된 것도 아닙니다.",
  "추가 개인정보·인증번호 입력, 앱 설치, 결제를 멈추세요. 문자 속 링크로 다시 접속하지 말고 공식 앱이나 홈페이지에서 직접 확인하세요.",
  "보호나라 카카오톡 채널의 ‘스미싱·피싱 확인서비스’로 확인하거나 국번 없이 118에 상담하세요. 정보 입력·앱 설치·송금을 했다면 아래에서 해당 상황의 안내로 이동하세요.",
];

const INITIAL_INFORMATION_GUIDE = {
  steps: [
    "정보를 더 전달하지 마세요.",
    "알려준 정보의 종류를 선택하세요.",
    "공식 연락처로 상담하세요.",
  ],
  actions: [
    "상대방과의 연락을 멈추고 추가 정보를 알려주지 마세요.",
    "위에서 정보 종류를 고르면 그에 맞는 보호 조치를 확인할 수 있습니다. 실제 정보는 입력하지 마세요.",
    "문자나 상대방이 알려준 번호 대신 금융회사·서비스의 공식 홈페이지나 고객센터에서 확인하세요.",
  ],
};

// Public guide categories only: never pass these selections to analysis or storage.
export const SHARED_INFORMATION_GUIDES = [
  {
    id: "account_only",
    label: "계좌번호만",
    steps: ["추가 정보를 알려주지 마세요.", "공식 금융회사에 상담하세요.", "거래 내역을 확인하세요."],
    actions: [
      "계좌번호를 알려줬다는 사실만으로 송금이 완료되거나 계좌가 탈취됐다고 단정할 수 없습니다. 비밀번호·인증번호 등 추가 정보를 주지 마세요.",
      "거래 금융회사의 공식 고객센터에 상황을 설명하고 필요한 보호 조치를 상담하세요.",
      "모르는 출금·이체가 있는지 확인하고, 의심 거래가 있으면 금융회사에 즉시 알리세요.",
    ],
  },
  {
    id: "identity",
    label: "신분증·주민등록번호",
    steps: ["공식 금융회사에 보호 조치를 문의하세요.", "개인정보노출자 등록을 확인하세요.", "명의도용 의심 거래를 확인하세요."],
    actions: [
      "신분증이나 주민등록번호를 알려준 상황을 금융회사의 공식 고객센터에 설명하고 필요한 보호 조치를 문의하세요.",
      "금융감독원 개인정보노출자 사고예방시스템에서 등록 안내를 확인하세요. 금융회사와 필요한 조치를 상담하세요.",
      "본인이 하지 않은 금융거래가 있는지 확인하고 의심되는 내역은 해당 금융회사에 알리세요.",
    ],
  },
  {
    id: "credentials",
    label: "비밀번호·인증번호",
    steps: ["즉시 공식 연락처로 보호 조치를 요청하세요.", "비밀번호는 안전한 기기에서 변경하세요.", "인증번호 공유에 따른 추가 조치를 확인하세요."],
    actions: [
      "해당 금융회사·서비스의 공식 고객센터에 비밀번호 또는 인증번호를 공유한 상황을 설명하고 즉시 보호 조치를 요청하세요.",
      "의심 앱을 설치하지 않은 안전한 기기에서 해당 비밀번호를 변경하세요. 같은 비밀번호를 쓰는 다른 서비스도 확인하세요.",
      "인증번호를 공유했다면 비밀번호 변경만으로 해결되는 것은 아닙니다. 이미 진행된 거래·인증 여부와 추가 보호 조치를 해당 금융회사·서비스에 확인하세요.",
    ],
  },
  {
    id: "card",
    label: "카드정보",
    steps: ["카드사 공식 고객센터에 연락하세요.", "사용정지·재발급 등 보호 조치를 문의하세요.", "카드 사용 내역을 확인하세요."],
    actions: [
      "카드 뒷면이나 카드사 공식 홈페이지에서 고객센터 번호를 확인해 카드정보를 알려준 상황을 설명하세요.",
      "카드 사용정지·재발급 등 필요한 보호 조치를 카드사에 문의하세요.",
      "본인이 사용하지 않은 승인·결제가 있는지 확인하고 의심 내역과 처리 절차를 카드사에 문의하세요.",
    ],
  },
] as const;

export type SharedInformationKind = (typeof SHARED_INFORMATION_GUIDES)[number]["id"];

export function getSharedInformationGuide(kind: SharedInformationKind | null) {
  return SHARED_INFORMATION_GUIDES.find((guide) => guide.id === kind) ?? INITIAL_INFORMATION_GUIDE;
}

const REFERENCE_SCENARIOS = [
  {
    id: "before_transfer",
    label: "송금 전",
    detail: "지금 송금하라는\n연락을 받았어요.",
    icon: "send",
    message:
      "OO은행 대출센터입니다.\n대출 전환을 위해 개인명의 계좌로 상환금과\n보증료를 먼저 보내고 원격제어 앱을 설치해 주세요.",
    clues: [
      {
        icon: "coins",
        title: "선입금 요구",
        description: "개인명의 계좌로 상환금·보증료를 먼저 보내 달라는 요청이 있습니다.",
      },
      {
        icon: "download",
        title: "원격제어 앱 설치 유도",
        description:
          "대출 전환을 내세워 원격제어 앱 설치를 요청하고 있습니다.",
      },
    ],
    alertTitle: "송금하기 전이라면",
    alertText: "송금과 앱 설치를 멈추고 공식 경로로 확인하세요.",
    steps: [
      "송금·앱 설치를 멈추세요.",
      "금융회사에 직접 확인하세요.",
      "금융사기 의심은 1394, 스미싱·인터넷침해는 118에 상담하세요.",
    ],
  },
  {
    id: "already_transferred",
    label: "이미 송금",
    detail: "이미 돈을\n보냈어요.",
    icon: "money",
    message:
      "OO은행 대출센터입니다.\n대출 전환을 위해 개인명의 계좌로 상환금과\n보증료를 먼저 보내고 원격제어 앱을 설치해 주세요.",
    clues: [
      {
        icon: "coins",
        title: "선입금 요구",
        description:
          "개인명의 계좌로 상환금·보증료를 먼저 보내 달라는 요청을 주의하세요.",
      },
      {
        icon: "download",
        title: "원격제어 앱 설치 유도",
        description:
          "전화·문자로 원격제어 앱 설치를 요구하면 공식 금융회사에 직접 확인하세요.",
      },
    ],
    alertTitle: "이미 송금했다면",
    alertText: "즉시 112 또는 금융회사에 연락해 지급정지를 요청하세요.",
    steps: [
      "즉시 지급정지를 요청하세요.",
      "추가 송금·인증번호 전달을 멈추세요.",
      "거래 내역과 연락 기록을 보관하세요.",
    ],
  },
  {
    id: "installed_app",
    label: "의심 앱 설치",
    detail: "의심스러운 앱을\n설치했어요.",
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
    alertTitle: "의심스러운 앱을 설치했어요",
    alertText: "이미 돈을 보냈다면 다른 안전한 전화로 112 또는 금융회사에 지급정지를 먼저 요청하세요. AI 분석이나 앱 점검을 기다리지 마세요.",
    steps: [
      "휴대폰 연결을 끊으세요.",
      "다른 안전한 전화로 연락하세요.",
      "금융거래를 멈추고 기기 점검을 받으세요.",
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
    alertText: "행동을 잠시 멈추고 금융사기 의심은 1394, 스미싱·인터넷침해는 118에 상담하세요.",
    steps: [
      "송금·설치·정보 전달을 멈추세요.",
      "공식 경로로 직접 확인하세요.",
      "금융사기 의심은 1394, 스미싱·인터넷침해는 118에 상담하세요.",
    ],
  },
  {
    id: "shared_information",
    label: "정보 전달함",
    detail: "계좌번호나 개인정보를\n알려줬어요.",
    icon: "lock",
    message: "고객님의 이름과 거래 은행을 알고 있습니다.\n개인정보 유출 피해보상금 신청 화면에서\n개인정보를 입력해 주세요.",
    clues: [
      {
        icon: "lock",
        title: "개인정보 입력 요구",
        description: "내 정보를 안다고 말하며 피해보상금을 내세워 별도 화면에 개인정보 입력을 요청하고 있습니다.",
      },
    ],
    alertTitle: "정보를 전달했다면",
    alertText: `알려준 정보 종류에 맞는 보호 조치를 확인하세요. ${ACCOUNT_DAMAGE_GUIDANCE}`,
    steps: INITIAL_INFORMATION_GUIDE.steps,
  },
  {
    id: "clicked_link",
    label: "링크 클릭",
    detail: "문자 속 링크를 눌렀어요.",
    icon: "link",
    message: "개인정보 유출여부 확인·피해보상금 신청 안내입니다.\n문자 속 링크에서 확인하고 신청해 주세요.\n(실제 주소가 없는 가상 예시)",
    clues: [
      {
        icon: "link",
        title: "문자 속 링크로 접속 유도",
        description: "개인정보 유출여부 확인·피해보상금 신청을 빙자해 문자 속 링크 접속을 요청하고 있습니다.",
      },
      {
        icon: "lock",
        title: "추가 행동 요구 확인",
        description: "링크 클릭과 정보 입력·앱 설치·송금은 구분해야 합니다. 추가 입력이나 설치·결제 요구를 따르지 마세요.",
      },
    ],
    alertTitle: "문자 속 링크를 눌렀어요",
    alertText: "페이지를 닫고 추가 정보 입력·앱 설치·결제를 멈추세요. 클릭만으로 감염·계좌 탈취를 단정하거나 안전을 보장할 수 없습니다.",
    steps: ["열린 페이지를 닫으세요.", "추가 행동을 멈추고 공식 경로로 확인하세요.", "보호나라 확인서비스·118에 상담하세요."],
  },
] as const satisfies readonly {
  id: PublicDemoSituation;
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

export function getPublicDemoActions(situation: PublicDemoSituation): string[] {
  if (situation === "clicked_link") return LINK_CLICK_ACTIONS;
  if (situation === "shared_information") return INITIAL_INFORMATION_GUIDE.actions;
  if (situation === "already_transferred") return [
    "즉시 112 또는 금융회사에 연락해 지급정지를 요청하세요.",
    "상대방에게 추가로 송금하거나 인증번호를 알려주지 마세요.",
    "거래 내역과 연락 기록을 안전하게 보관하세요.",
  ];
  if (situation === "installed_app") return [
    "악성 앱 설치가 의심되면 휴대폰을 비행기 모드로 전환하거나 전원을 끄세요.",
    "다른 안전한 전화로 112 또는 금융회사에 연락하세요. 스미싱·인터넷침해 상담은 118, 금융사기 의심 상담은 1394를 이용하세요.",
    "금융거래를 멈추고 공식 서비스센터 등에서 기기 점검을 받으세요. 이미 돈을 보냈다면 AI 분석이나 앱 점검보다 먼저 다른 안전한 전화로 112 또는 금융회사에 지급정지를 요청하세요.",
  ];
  return [
    "송금·앱 설치·인증번호 전달을 멈추세요.",
    "문자 속 번호가 아닌 공식 홈페이지에 나온 대표번호로 직접 확인하세요.",
    "금융사기 의심 상담·제보는 1394, 스미싱·인터넷침해 상담은 118을 이용하세요.",
  ];
}
