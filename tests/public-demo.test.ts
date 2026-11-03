import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../src/app/page";
import { PUBLIC_DEMO_SCENARIOS, LINK_FOLLOW_UPS, TRANSFER_FOLLOW_UP, ACCOUNT_DAMAGE_GUIDANCE, GUIDE_SOURCES, SHARED_INFORMATION_GUIDES, getPublicDemoActions, getPublicDemoNavigation, getPublicDemoPrecautions, getSharedInformationGuide } from "../src/lib/public-demo";
import { SITUATIONS, isSituation } from "../src/lib/safety";

test("공개 데모: 여섯 가상 상황을 제공하고 분석 상황 계약을 변경하지 않는다", () => {
  assert.deepEqual(
    PUBLIC_DEMO_SCENARIOS.map((item) => item.id),
    ["before_transfer", "already_transferred", "installed_app", "unsure", "shared_information", "clicked_link"]
  );
  assert.ok(SITUATIONS.every((item) => PUBLIC_DEMO_SCENARIOS.some((scenario) => scenario.id === item.id)));
  assert.equal(isSituation("clicked_link"), false);
  for (const item of PUBLIC_DEMO_SCENARIOS) {
    assert.ok(item.sample.length > 10);
    assert.ok(item.signals.length > 0);
    assert.doesNotMatch(item.sample, /https?:\/\/|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  }
});

test("링크 클릭은 추가 행동을 구분하고 감염·안전을 단정하지 않는 안내를 제공한다", () => {
  const scenario = PUBLIC_DEMO_SCENARIOS[5];
  assert.equal(scenario.label, "링크 클릭");
  assert.equal(scenario.detail, "문자 속 링크를 눌렀어요.");
  assert.equal(scenario.icon, "link");
  const actions = getPublicDemoActions("clicked_link");
  assert.equal(actions.length, scenario.steps.length);
  assert.match(actions[0], /페이지를 닫으세요.*감염이나 계좌 탈취를 단정할 수 없으며.*안전이 확인된 것도 아닙니다/);
  assert.match(actions[1], /정보·인증번호 입력, 앱 설치, 결제를 멈추세요.*공식 앱이나 홈페이지/);
  assert.match(actions[2], /보호나라.*스미싱·피싱 확인서비스.*118/);
});

test("링크 클릭 후속 행동은 기존 정보·앱·송금 안내로만 연결한다", () => {
  assert.deepEqual(LINK_FOLLOW_UPS, [
    { label: "정보도 입력했어요", situation: "shared_information" },
    { label: "앱도 설치했어요", situation: "installed_app" },
    { label: "이미 돈도 보냈어요 → 긴급 안내", situation: "already_transferred" },
  ]);
  for (const { situation } of LINK_FOLLOW_UPS) {
    assert.ok(PUBLIC_DEMO_SCENARIOS.some((item) => item.id === situation));
    assert.equal(getPublicDemoActions(situation).length, 3);
  }
  assert.deepEqual(getPublicDemoActions(LINK_FOLLOW_UPS[0].situation), getSharedInformationGuide(null).actions);
  assert.match(getPublicDemoActions(LINK_FOLLOW_UPS[1].situation)[0], /비행기|연결/);
  assert.match(getPublicDemoActions(LINK_FOLLOW_UPS[2].situation)[0], /112.*금융회사.*지급정지/);
});

test("최근 사칭 예시는 유출확인·보상금 빙자를 보여주고 일반주의와 문구 근거를 구분한다", () => {
  const clicked = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === "clicked_link")!;
  assert.match(clicked.sample, /개인정보 유출여부 확인·피해보상금 신청/);
  for (const id of ["before_transfer", "shared_information"] as const) {
    const item = PUBLIC_DEMO_SCENARIOS.find((scenario) => scenario.id === id)!;
    const precautions = getPublicDemoPrecautions(id).join(" ");
    assert.match(precautions, /정보를 알고 있어도 진짜 기관이라는 뜻은 아닙니다/);
    assert.match(precautions, /개인명의 계좌로 상환금.*보증료.*선입금.*전화·문자로 원격제어 앱/);
    assert.doesNotMatch(item.clues.map((clue) => clue.description).join(" "), /정상적인 금융기관은.*먼저 돈/);
  }
  for (const item of PUBLIC_DEMO_SCENARIOS) {
    assert.doesNotMatch(item.sample, /https?:\/\/|\d{2,4}[- ]\d{3,4}[- ]\d{4}/);
  }
  const before = PUBLIC_DEMO_SCENARIOS[0];
  assert.match(before.sample, /개인명의 계좌로 상환금.*\n보증료.*원격제어 앱/);
  assert.deepEqual(getPublicDemoPrecautions("unsure"), []);
});

test("여섯 상황의 긴급 전환은 앱·송금 복수상황에서 안전한 다른 전화 경고를 유지한다", () => {
  assert.equal(TRANSFER_FOLLOW_UP.label, "이미 돈도 보냈어요 → 긴급 안내");
  assert.deepEqual(LINK_FOLLOW_UPS.filter((item) => item.situation === "already_transferred"), [TRANSFER_FOLLOW_UP]);
  for (const item of PUBLIC_DEMO_SCENARIOS) {
    const selected = getPublicDemoNavigation({ situation: "already_transferred", useSafePhone: false }, item.id);
    assert.equal(selected.useSafePhone, item.id === "installed_app");
    const emergency = getPublicDemoNavigation(selected, TRANSFER_FOLLOW_UP.situation);
    assert.equal(emergency.situation, "already_transferred");
    assert.equal(emergency.useSafePhone, item.id === "installed_app");
    assert.deepEqual(getPublicDemoNavigation(emergency, "already_transferred"), emergency);
    assert.match(getPublicDemoActions(emergency.situation)[0], /112.*금융회사.*지급정지/);
  }
  const client = readFileSync("src/app/public-demo.tsx", "utf8");
  assert.match(client, /situation !== "already_transferred" && situation !== "clicked_link"/);
  assert.match(client, /safePhoneOnly=\{useSafePhone\}/);
  assert.match(client, /의심 앱도 설치했다면 다른 안전한 전화.*지급정지.*기다리지 마세요/);
});

test("출처는 공식 원문·실제 발표일과 확인일을 표시하며 경찰 페이지 발표일을 만들지 않는다", () => {
  assert.equal(GUIDE_SOURCES.length, 3);
  assert.deepEqual(GUIDE_SOURCES.map((item) => item.publishedAt), ["2026-10-06", "2026-10-06", null]);
  const html = renderToStaticMarkup(createElement(HomePage));
  assert.match(html, /<details class="guide-details guide-sources"><summary>안내 출처/);
  assert.doesNotMatch(html, /<details class="guide-details guide-sources" open/);
  for (const item of GUIDE_SOURCES) {
    assert.equal(item.checkedAt, "2026-11-02");
    assert.ok(html.includes(item.agency));
    assert.ok(html.includes(item.href.replaceAll("&", "&amp;")));
  }
  assert.match(html, /자료 발표일 미표시.*최종 확인일 2026-11-02/);
  assert.match(html, /일반 행동안내의 근거 자료/);
  for (const [, tag] of html.matchAll(/(<a\b[^>]*target="_blank"[^>]*>)/g)) {
    assert.match(tag, /rel="noopener noreferrer"/);
  }
});

test("정보 종류별 보호 조치와 계좌 피해 지급정지·예방서비스는 구분된다", () => {
  assert.match(ACCOUNT_DAMAGE_GUIDANCE, /이미 송금했거나 모르는 계좌 출금이 있다면 112 또는 금융회사에 즉시 연락해 지급정지를 요청/);
  const shared = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === "shared_information")!;
  assert.ok(shared.alertText.includes(ACCOUNT_DAMAGE_GUIDANCE));
  const client = readFileSync("src/app/public-demo.tsx", "utf8");
  assert.doesNotMatch(client, /금전 피해가 있다면.*지급정지/);
  assert.match(client, /<details className="guide-details additional-prevention">/);
  for (const label of ["개인정보노출자 사고예방시스템", "여신거래 안심차단", "비대면 계좌개설 안심차단", "오픈뱅킹 안심차단"]) assert.ok(client.includes(`<dt>${label}</dt>`));
  assert.match(client, /은행 공식 앱·금융회사 영업점/);
  assert.match(client, /href="https:\/\/www.payinfo.or.kr\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(client, /긴급 지급정지와 별개인 예방서비스/);
  assert.match(client, /이 앱은 신청·해제를 접수하지 않으며/);
  assert.match(getSharedInformationGuide("card").actions.join(" "), /카드 사용정지·재발급.*본인이 사용하지 않은 승인·결제/);
});

test("공개 데모: 이미 송금한 경우 기존 긴급 안전행동을 유지한다", () => {
  const steps = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === "already_transferred")!.steps;
  const actions = getPublicDemoActions("already_transferred");
  assert.match(steps[0], /즉시 지급정지/);
  assert.match(actions[0], /즉시 112 또는 금융회사.*지급정지.*요청/);
  assert.doesNotMatch(actions[0], /1394|118|추가로 송금/);
  assert.match(actions[1], /추가로 송금.*마세요/);
  assert.match(actions[2], /거래 내역.*연락 기록.*보관/);
});

test("첫 화면은 피해 상황을 미리 선택하지 않고 긴급 연락 수단을 제공한다", () => {
  const html = renderToStaticMarkup(createElement(HomePage));
  assert.doesNotMatch(html, /<input[^>]*checked/);
  assert.match(html, /아직 상황을 선택하지 않았습니다/);
  assert.match(html, /이미 돈을 보냈다면/);
  assert.match(html, /href="tel:112"/);
});

test("메인 공식·모바일 연락처는 긴급 채널을 우선하고 1394·118을 올바르게 연결한다", () => {
  const html = renderToStaticMarkup(createElement(HomePage));
  const groups = [...html.matchAll(/<div class="(?:desktop-contacts|contact-buttons)">([\s\S]*?)<\/div>/g)];
  assert.equal(groups.length, 3);
  for (const [, group] of groups) {
    const links = [...group.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.deepEqual(links.map(([, href]) => href), ["tel:112", "tel:1394", "tel:118"]);
    const financial = links[1][2].replace(/<[^>]*>/g, "");
    const smishing = links[2][2].replace(/<[^>]*>/g, "");
    assert.match(financial, /1394.*금융사기 의심 상담·제보/);
    assert.match(smishing, /118.*스미싱·인터넷침해 상담/);
    assert.doesNotMatch(smishing, /금융사기/);
    assert.ok(group.indexOf("bank") < group.indexOf("tel:1394"));
  }
  for (const id of ["before_transfer", "unsure"] as const) {
    const scenario = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === id)!;
    assert.match(scenario.steps[2], /금융사기 의심은 1394.*스미싱·인터넷침해는 118/);
    assert.match(getPublicDemoActions(id)[2], /금융사기.*1394.*스미싱·인터넷침해.*118/);
  }
});

test("메인페이지: 개발·운영 모두 입력 없는 공개 디자인을 표시한다", () => {
  const client = readFileSync("src/app/public-demo.tsx", "utf8");
  assert.doesNotMatch(client, /<textarea\b|\bfetch\s*\(|\/api\/analyze/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|useEffect/);
  assert.equal([...client.matchAll(/<input\b/g)].length, [...client.matchAll(/type="radio"/g)].length);
  const previous = process.env.NODE_ENV;
  try {
    for (const mode of ["development", "production"]) {
      Object.assign(process.env, { NODE_ENV: mode });
      const html = renderToStaticMarkup(createElement(HomePage));
      assert.match(html, /class="public-site"/);
      assert.match(html, /의심스러운 연락/);
      assert.match(html, /정보 전달함/);
      assert.doesNotMatch(html, /<textarea\b/);
    }
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previous });
  }
});

test("정보 전달 초기 안내는 종류 선택을 요청하며 인증번호 노출을 단정하지 않는다", () => {
  const initial = getSharedInformationGuide(null);
  assert.deepEqual(SHARED_INFORMATION_GUIDES.map((guide) => guide.label), ["계좌번호만", "신분증·주민등록번호", "비밀번호·인증번호", "카드정보"]);
  assert.match(initial.actions.join(" "), /정보 종류를 고르면/);
  assert.doesNotMatch(initial.actions.join(" "), /인증번호|유출됐|탈취됐/);
  assert.deepEqual(getPublicDemoActions("shared_information"), initial.actions);
  for (const guide of SHARED_INFORMATION_GUIDES) {
    assert.equal(guide.steps.length, 3);
    assert.equal(guide.actions.length, 3);
    assert.notDeepEqual(guide.actions, initial.actions);
  }
});

test("계좌번호만 전달한 상황과 신분증 노출의 조치를 구분한다", () => {
  const account = getSharedInformationGuide("account_only").actions.join(" ");
  assert.match(account, /송금이 완료되거나 계좌가 탈취됐다고 단정할 수 없습니다/);
  assert.match(account, /추가 정보를 주지 마세요/);
  assert.match(account, /공식 고객센터.*상담/);
  assert.match(account, /모르는 출금·이체/);
  assert.doesNotMatch(account, /비밀번호를 변경|개인정보노출자/);
  const identity = getSharedInformationGuide("identity").actions.join(" ");
  assert.match(identity, /공식 고객센터.*보호 조치/);
  assert.match(identity, /개인정보노출자 사고예방시스템.*등록/);
});

test("인증번호 공유는 비밀번호 변경만으로 해결하지 않으며 카드 보호 조치를 따로 안내한다", () => {
  const credentials = getSharedInformationGuide("credentials").actions.join(" ");
  assert.match(credentials, /공식 고객센터.*즉시 보호 조치/);
  assert.match(credentials, /안전한 기기.*비밀번호를 변경/);
  assert.match(credentials, /인증번호를 공유했다면 비밀번호 변경만으로 해결되는 것은 아닙니다/);
  assert.match(credentials, /이미 진행된 거래·인증 여부.*추가 보호 조치/);
  const card = getSharedInformationGuide("card").actions.join(" ");
  assert.match(card, /카드사 공식 홈페이지.*고객센터/);
  assert.match(card, /사용정지·재발급/);
  assert.match(card, /본인이 사용하지 않은 승인·결제/);
  assert.doesNotMatch(card, /승인취소|환급|보장|반드시/);
});
