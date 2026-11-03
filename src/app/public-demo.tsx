"use client";

import { useRef, useState } from "react";
import Brand from "./brand";
import {
  PUBLIC_DEMO_SCENARIOS,
  LINK_FOLLOW_UPS,
  TRANSFER_FOLLOW_UP,
  ACCOUNT_DAMAGE_GUIDANCE,
  GUIDE_SOURCES,
  SHARED_INFORMATION_GUIDES,
  getPublicDemoActions,
  getPublicDemoNavigation,
  getPublicDemoPrecautions,
  getSharedInformationGuide,
  type SharedInformationKind,
  type PublicDemoSituation,
  type PublicDemoNavigation,
} from "@/lib/public-demo";

const paths: Record<string, React.ReactNode> = {
  send: <path d="m3 10 18-7-7 18-3-7-8-4Zm8 4L21 3" />,
  money: (
    <>
      <path d="m9 3 3 2 3-2 1 4-4 2-4-2 1-4Zm-1 6c-2 2-4 5-4 8 0 4 16 4 16 0 0-3-2-6-4-8Z" />
      <path d="M14 12h-3a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3h-3m2-7v8" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 5h4m-3 14h2" />
    </>
  ),
  question: (
    <>
      <path d="M8 8a4 4 0 1 1 6 3.5c-2 1-2 2-2 3M12 18h.01" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  call: (
    <path d="m5 3 4 4-2 3c2 4 3 5 7 7l3-2 4 4c-1 4-5 3-8 1C7 17 3 12 2 7c0-2 1-4 3-4Z" />
  ),
  bank: (
    <>
      <path d="m2 8 10-6 10 6H2Zm1 13h18M5 11v7m7-7v7m7-7v7M3 18h18" />
    </>
  ),
  document: (
    <>
      <path d="M6 2h8l4 4v16H6V2Zm8 0v5h4M9 11h6m-6 4h6m-6 4h4" />
    </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M6 17v-6a6 6 0 0 1 12 0v6l3 3H3l3-3Zm4 6h4M12 1v2M2 7 4 8m16 0 2-1" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="5" rx="6" ry="3" />
      <path d="M3 5v5c0 4 12 4 12 0V5M3 10v5c0 3 5 4 8 3m5-6c7 0 7 5 0 5s-7-5 0-5Zm-5 3v5c0 3 10 3 10 0v-5" />
    </>
  ),
  download: <path d="M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="12" rx="2" />
      <path d="M7 10V7a5 5 0 0 1 10 0v3m-5 4v4" />
    </>
  ),
  link: (
    <path d="m10 14 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2" />
  ),
  home: (
    <>
      <path d="m2 11 10-9 10 9M5 9v13h14V9m-10 13v-8h6v8" />
    </>
  ),
  guide: (
    <>
      <rect x="7" y="3" width="14" height="16" rx="2" />
      <path d="M3 7v15h14M11 8h6m-6 4h6" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6l9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 21v-5a6 6 0 0 1 12 0v5M3 11l-2 9h4m16-9 2 9h-4" />
    </>
  ),
  more: (
    <>
      <circle cx="4" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="20" cy="12" r="1" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  arrow: <path d="m9 5 7 7-7 7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.shield}
    </svg>
  );
}

function DemoBadge() {
  return (
    <div className="demo-notice">
      <span className="badge">공개 데모</span>
      <span>가상 사례 시연 · 실제 AI 분석 아님</span>
      <Icon name="info" />
    </div>
  );
}

// Reuse only the illustration regions; every UI control and heading is HTML.
function HeroArtwork() {
  return (
    <div
      className="hero-artwork"
      role="img"
      aria-label="푸른 방패가 가족의 안전한 일상을 감싸는 일러스트"
    >
      <svg
        className="desktop-art"
        viewBox="505 91 625 330"
        preserveAspectRatio="xMaxYMid meet"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="desktop-art-clip">
            <rect x="505" y="91" width="625" height="330" />
          </clipPath>
        </defs>
        <image
          href="/images/k-safe-reference-artwork.png"
          width="1536"
          height="1024"
          clipPath="url(#desktop-art-clip)"
        />
      </svg>
      <svg
        className="mobile-art"
        viewBox="1167 147 337 122"
        preserveAspectRatio="xMidYMin meet"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="mobile-art-clip">
            <rect x="1167" y="147" width="337" height="122" />
          </clipPath>
        </defs>
        <image
          href="/images/k-safe-reference-artwork.png"
          width="1536"
          height="1024"
          clipPath="url(#mobile-art-clip)"
        />
      </svg>
    </div>
  );
}

const navItems = [
  { href: "#home", label: "홈" },
  { href: "#guide", label: "사기예방 가이드" },
  { href: "#cases", label: "사례로 알아보기" },
  { href: "#rules", label: "안전수칙" },
  { href: "#help", label: "도움받기" },
];

const PUBLIC_SHARE = {
  title: "K-SAFE 국민안심 AI",
  text: "금융사기 예방·대응을 위한 K-SAFE 상황별 안전 안내입니다.",
  url: "https://k-safe-ai-hackathon-2026.vercel.app/",
};

export default function PublicDemo() {
  const [{ situation, useSafePhone }, setNavigation] = useState<PublicDemoNavigation>({ situation: "unsure", useSafePhone: false });
  const [hasSelected, setHasSelected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [dialogKind, setDialogKind] = useState<"about" | "bank" | "share">("about");
  const [shareMessage, setShareMessage] = useState("");
  const sharePending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const situationGroup = useRef<HTMLFieldSetElement>(null);
  const current = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === situation)!;
  const actions = getPublicDemoActions(situation);
  const precautions = getPublicDemoPrecautions(situation);

  function scrollToSituationOnMobile() {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    // Let the selected situation's guidance render before scrolling to it.
    window.requestAnimationFrame(() => {
      document.getElementById("emergency-title")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  }

  function changeSituation(next: PublicDemoSituation, focus = true) {
    setHasSelected(true);
    setNavigation((previous) => getPublicDemoNavigation(previous, next));
    if (focus) situationGroup.current?.querySelector<HTMLInputElement>(`input[value="${next}"]`)?.focus();
  }

  function openDialog(kind: "about" | "bank" | "share") {
    setDialogKind(kind);
    setMenuOpen(false);
    dialog.current?.showModal();
  }

  async function sharePage() {
    if (sharePending.current) return;
    sharePending.current = true;
    setShareMessage("");
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share(PUBLIC_SHARE);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(PUBLIC_SHARE.url);
        setShareMessage("링크를 복사했습니다. 원하는 곳에 붙여넣어 공유하세요.");
      } catch {
        openDialog("share");
      }
    } finally {
      sharePending.current = false;
    }
  }

  return (
    <div
      className={`public-site${highContrast ? " high-contrast" : ""}${largeText ? " large-text" : ""}`}
      id="home"
    >
      <a className="skip-link" href="#guide">
        상황별 안전 안내로 건너뛰기
      </a>
      <header className="site-header">
        <div className="brand-group">
          <Brand />
          <span className="badge header-badge">공개 데모</span>
        </div>
        <nav className="desktop-nav" aria-label="주 메뉴">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => { if (!hasSelected && (item.href === "#cases" || item.href === "#rules")) changeSituation("unsure", false); }}
            >
              {item.label}
            </a>
          ))}
          <button type="button" onClick={() => openDialog("about")}>
            소개
          </button>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button contrast-button"
            onClick={() => setHighContrast((value) => !value)}
            aria-label="화면 대비 높이기"
            aria-pressed={highContrast}
          >
            <Icon name="sun" />
          </button>
          <ShareButton className="site-share-button header-share" onClick={sharePage} />
          <a href="#guide" className="check-button">
            내 상황 선택하기 <span aria-hidden="true">→</span>
          </a>
        </div>
        <button
          className="icon-button mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="메뉴"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Icon name="menu" />
        </button>
        {menuOpen && (
          <nav
            className="mobile-menu"
            id="mobile-menu"
            aria-label="모바일 주 메뉴"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => { setMenuOpen(false); if (!hasSelected && (item.href === "#cases" || item.href === "#rules")) changeSituation("unsure", false); }}
              >
                {item.label}
              </a>
            ))}
            <button type="button" onClick={() => openDialog("about")}>
              서비스 소개 · 개인정보 보호
            </button>
            <button type="button" aria-pressed={highContrast} onClick={() => setHighContrast((value) => !value)}>
              화면 대비 높이기
            </button>
            <button type="button" aria-pressed={largeText} onClick={() => setLargeText((value) => !value)}>
              글자 크게 보기
            </button>
          </nav>
        )}
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <HeroArtwork />
          <div className="hero-copy">
            <p className="eyebrow">
              보이스피싱 · 스미싱 · 금융사기 예방을 위한
            </p>
            <h1 id="hero-title">
              의심스러운 연락,
              <br />
              <em>지금 안전하게</em> 대응하세요
            </h1>
            <p className="hero-subtitle">
              가상의 상황을 선택해 안전행동을 확인해 보세요.
            </p>
            <p className="hero-description">
              K-SAFE 국민안심 AI는 국민의 소중한 일상을 지키기 위한
              <br className="desktop-break" /> 금융사기 예방·대응 가이드
              서비스입니다.
            </p>
            <DemoBadge />
          </div>
        </section>
        <div className="safety-dashboard" id="guide">
          <section
            className="situation-section"
            aria-labelledby="situation-title"
          >
            <div className="section-heading">
              <Icon name="people" />
              <h2 id="situation-title">
                <span className="desktop-only">상황별 안전 안내</span>
                <span className="mobile-only">어떤 상황이신가요?</span>
              </h2>
              <p>지금 어떤 상황이신가요? 아래에서 선택해 주세요.</p>
            </div>
            <fieldset className="situation-grid" ref={situationGroup}>
              <legend className="visuallyHidden">현재 상황 선택</legend>
              {PUBLIC_DEMO_SCENARIOS.map((option) => (
                <label
                  key={option.id}
                  className={`situation-card ${option.id}${hasSelected && situation === option.id ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="situation"
                    value={option.id}
                    checked={hasSelected && situation === option.id}
                    onChange={() => changeSituation(option.id, false)}
                    onClick={scrollToSituationOnMobile}
                  />
                  <span className="situation-icon">
                    <Icon name={option.icon} />
                  </span>
                  <span className="situation-text">
                    <strong>{option.label}</strong>
                    <span>{option.detail}</span>
                  </span>
                  <span className="card-arrow">
                    <Icon name="arrow" />
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
          <section
            className={`mobile-emergency ${hasSelected ? situation : "is-initial"}`}
            aria-labelledby="emergency-title"
            aria-live="polite"
          >
            <div className="emergency-heading">
              <Icon name="bell" />
              <div>
                <h2 id="emergency-title">{hasSelected ? current.alertTitle : "이미 돈을 보냈다면"}</h2>
                <strong>{hasSelected ? current.alertText : "즉시 112 또는 금융회사에 연락해 지급정지를 요청하세요."}</strong>
                {useSafePhone && <p>의심되는 휴대폰에서는 전화하거나 비밀번호를 변경하지 마세요. 다른 안전한 전화를 사용하세요.</p>}
              </div>
            </div>
            <ContactButtons onBank={() => openDialog("bank")} safePhoneOnly={useSafePhone} />
          </section>
          {!hasSelected && (
            <p className="selection-prompt" role="status">아직 상황을 선택하지 않았습니다. 위에서 내 상황을 고르면 행동 안내와 가상 사례를 확인할 수 있습니다.</p>
          )}
          <div className="detail-grid" hidden={!hasSelected} aria-live={situation === "shared_information" ? undefined : "polite"} aria-atomic="true">
            <section
              className="action-panel"
              id="rules"
              aria-labelledby="action-title"
            >
              <div className="panel-heading">
                <span className="action-title-icon">↟</span>
                <h2 id="action-title">지금 이렇게 하세요</h2>
                <p>{situation === "installed_app" ? current.alertText : "안전한 대응을 위한 권장 행동입니다."}</p>
              </div>
              {situation === "already_transferred" && useSafePhone && (
                <p className="information-priority" role="alert">
                  의심 앱도 설치했다면 다른 안전한 전화로 112 또는 금융회사에 지급정지를 먼저 요청하세요. 의심되는 휴대폰으로 전화하지 말고 AI 분석이나 앱 점검을 기다리지 마세요.
                </p>
              )}
              {situation === "shared_information" ? (
                <SharedInformationGuide onInstalledApp={() => changeSituation("installed_app")} />
              ) : (
                <ActionList situation={situation} steps={current.steps} actions={actions} />
              )}
              {situation === "clicked_link" && (
                <div className="link-follow-ups" role="group" aria-label="링크 클릭 후 추가로 한 행동">
                  <h3 className="follow-up-heading">추가로 해당하는 상황이 있나요?</h3>
                  {LINK_FOLLOW_UPS.map((followUp) => (
                    <FollowUpButton
                      key={followUp.situation}
                      label={followUp.label}
                      urgent={followUp.situation === "already_transferred"}
                      icon={followUp.situation === "installed_app" ? "phone" : "lock"}
                      onClick={() => changeSituation(followUp.situation)}
                    />
                  ))}
                  <p className="information-note follow-up-note">
                    <Icon name="info" />
                    <span>해당하는 행동을 골라 다음 안내를 확인하세요. 버튼은 이 화면의 상황만 바꾸며 정보를 전송하거나 외부 신고를 접수하지 않습니다.</span>
                  </p>
                </div>
              )}
              {situation !== "already_transferred" && situation !== "clicked_link" && (
                <div className="link-follow-ups" role="group" aria-label="추가 상황 안내">
                  <h3 className="follow-up-heading">추가로 해당하는 상황이 있나요?</h3>
                  <FollowUpButton label={TRANSFER_FOLLOW_UP.label} urgent onClick={() => changeSituation(TRANSFER_FOLLOW_UP.situation)} />
                  <p className="information-note follow-up-note">
                    <Icon name="info" />
                    <span>이 화면의 상황만 바꾸며 정보를 전송하거나 신고를 접수하지 않습니다.</span>
                  </p>
                </div>
              )}
            </section>
            <section
              className="case-panel"
              id="cases"
              aria-labelledby="case-title"
            >
              <div className="panel-heading">
                <Icon name="alert" />
                <h2 id="case-title">선택한 상황에 대한 가상 사례</h2>
                <p>실제 사례와 유사한 형태로 재구성한 가상 예시입니다.</p>
              </div>
              <div className="case-body">
                <div className="message-example">
                  <span className="avatar" aria-hidden="true">
                    ●<span>●</span>
                  </span>
                  <blockquote>「{current.message}」</blockquote>
                  <span className="message-time">오전 10:24</span>
                </div>
                <div className="clues">
                  <h3>
                    <span aria-hidden="true">!</span> 가상 문구에서 확인한 요청
                  </h3>
                  <div className="clue-grid">
                    {current.clues.map((clue) => (
                      <div className="clue" key={clue.title}>
                        <span className="clue-icon">
                          <Icon name={clue.icon} />
                        </span>
                        <div>
                          <h4>{clue.title}</h4>
                          <p>{clue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {precautions.length > 0 && (
                  <div className="information-note general-precautions">
                    <h3>일반 주의사항</h3>
                    {precautions.map((text) => <p key={text}>{text}</p>)}
                  </div>
                )}
              </div>
            </section>
          </div>
          <section
            className="official-contacts"
            id="help"
            aria-labelledby="contacts-title"
          >
            <div className="contacts-intro">
              <Icon name="shield" />
              <div>
                <h2 id="contacts-title">공식 상담 및 신고 채널</h2>
                <p>{useSafePhone ? "다른 안전한 전화로 연락하세요. 이미 송금했다면 지급정지 요청이 먼저입니다." : "언제든지 도움을 받을 수 있습니다."}</p>
              </div>
            </div>
            <div className="desktop-contacts">
              <a className="contact-card police" href={useSafePhone ? undefined : "tel:112"}>
                <span className="contact-icon">
                  <Icon name="call" />
                </span>
                <strong>112</strong>
                <span>
                  <b>경찰청</b>
                  <span>긴급 신고</span>
                  <small>(보이스피싱, 스미싱 등)</small>
                </span>
              </a>
              <button
                className="contact-card bank"
                type="button"
                onClick={() => openDialog("bank")}
              >
                <span className="contact-icon">
                  <Icon name="bank" />
                </span>
                <span>
                  <b>금융회사 연락 방법 보기</b>
                  <span>이용 중인 은행에</span>
                  <span>지급정지 등 긴급 조치 요청</span>
                </span>
                <Icon name="arrow" />
              </button>
              <a className="contact-card hotline" href={useSafePhone ? undefined : "tel:1394"}>
                <span className="contact-icon">
                  <Icon name="call" />
                </span>
                <strong>1394</strong>
                <span>
                  <b>금융사기 의심 상담·제보</b>
                  <small>(국번 없이 1394)</small>
                </span>
              </a>
              <a className="contact-card hotline" href={useSafePhone ? undefined : "tel:118"}>
                <span className="contact-icon">
                  <Icon name="call" />
                </span>
                <strong>118</strong>
                <span>
                  <b>스미싱·인터넷침해 상담</b>
                  <small>(국번 없이 118)</small>
                </span>
              </a>
            </div>
            <div className="mobile-contacts">
              <ContactButtons onBank={() => openDialog("bank")} safePhoneOnly={useSafePhone} />
            </div>
          </section>
          <details className="guide-details guide-sources">
            <summary>안내 출처 · 공식 원문</summary>
            <p>일반 행동안내의 근거 자료입니다. 이 앱의 사기 판정이나 피해 처리 결과를 뜻하지 않습니다.</p>
            {GUIDE_SOURCES.map((source) => (
              <p key={source.href}>
                <strong>{source.agency}</strong><br />
                <a href={source.href} target="_blank" rel="noopener noreferrer">{source.title} · 공식 원문 (새 창)</a><br />
                {source.publishedAt ? `자료 발표일 ${source.publishedAt}` : "자료 발표일 미표시"} · 최종 확인일 {source.checkedAt}
              </p>
            ))}
          </details>
        </div>
        <footer className="site-footer">
          <div className="footer-notices">
            <p>
              <strong>가상 사례 시연 · 실제 AI 분석 아님</strong> · 사기 여부를
              확정하거나 신고를 접수하지 않습니다.
            </p>
            <p>
              개인정보·의심 메시지를 입력받거나 분석·저장하지 않는 공개 데모입니다.
              주민등록번호·계좌번호·비밀번호·인증번호를 입력하지 마세요.
            </p>
          </div>
          <div className="footer-actions">
            <ShareButton className="site-share-button footer-share" onClick={sharePage} />
            <button className="footer-about" type="button" onClick={() => openDialog("about")}>
              K-SAFE 소개 · 개인정보 보호 안내
            </button>
          </div>
          <p className="footer-copyright">© 2026 K-SAFE 국민안심 AI</p>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="하단 메뉴">
        <a className="active" href="#home">
          <Icon name="home" />
          <span>홈</span>
        </a>
        <a href="#cases" onClick={() => { if (!hasSelected) changeSituation("unsure", false); }}>
          <Icon name="guide" />
          <span>사례보기</span>
        </a>
        <a href="#rules" onClick={() => { if (!hasSelected) changeSituation("unsure", false); }}>
          <Icon name="shield" />
          <span>안전수칙</span>
        </a>
        <a href="#help">
          <Icon name="question" />
          <span>도움받기</span>
        </a>
        <ShareButton onClick={sharePage} />
        <button type="button" onClick={() => openDialog("about")}>
          <Icon name="more" />
          <span>더보기</span>
        </button>
      </nav>
      {shareMessage && (
        <div className="share-feedback" role="status">
          <Icon name="link" />
          <p>{shareMessage}</p>
          <button className="icon-button" type="button" aria-label="공유 알림 닫기" onClick={() => setShareMessage("")}>×</button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="info-dialog"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-top">
          {dialogKind === "share" ? <ShareIcon /> : <Icon name={dialogKind === "bank" ? "bank" : "shield"} />}
          <h2 id="dialog-title">
            {dialogKind === "share"
              ? "링크 복사해서 공유하기"
              : dialogKind === "bank"
              ? "금융회사 연락 방법"
              : "K-SAFE 국민안심 AI"}
          </h2>
          <button
            className="icon-button"
            type="button"
            aria-label="닫기"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {dialogKind === "share" ? (
          <>
            <p>자동으로 복사하지 못했습니다. 아래 주소를 길게 누르거나 선택해 복사한 뒤, 원하는 곳에 붙여넣어 주세요.</p>
            <p className="share-copy-link" tabIndex={0} onFocus={(event) => {
              const range = document.createRange();
              range.selectNodeContents(event.currentTarget);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }}>{PUBLIC_SHARE.url}</p>
          </>
        ) : dialogKind === "bank" ? (
          <>
            <p>
              의심 앱을 설치했다면 다른 안전한 전화·기기로 확인하세요.
              거래 중인 금융회사의 공식 앱, 카드 뒷면 또는 공식 홈페이지에서
              고객센터 대표번호를 확인해 직접 연락하세요.
            </p>
            <p>
              피해가 의심되면 거래 중지·지급정지 등 필요한 긴급 조치를
              문의하세요. 의심 앱을 설치했다면 안전한 다른 기기를 사용하세요.
            </p>
            <p className="dialog-note">
              문자에 적힌 번호나 상대방이 알려준 연락처는 이용하지 마세요.
              K-SAFE는 금융회사를 대신해 지급정지나 신고를 접수하지 않습니다.
            </p>
            <a className="dialog-call" href={useSafePhone ? undefined : "tel:112"}>
              <Icon name="call" />
              {useSafePhone ? "다른 안전한 전화로 112 신고" : "112 긴급 신고하기"}
            </a>
          </>
        ) : (
          <>
            <p>
              K-SAFE는 금융사기 예방과 상황별 안전행동을 안내하는 해커톤 공개
              데모입니다.
            </p>
            <p>
              <strong>가상 사례 시연 · 실제 AI 분석 아님</strong>
              <br />여섯 가지 합성 사례와 사전에 준비된 안전수칙을 보여 줍니다.
              실제 메시지를 분석하거나 사기 여부를 확정하지 않습니다.
            </p>
            <h3>개인정보 보호</h3>
            <p>
              개인정보·의심 메시지의 입력, 분석 요청, 저장 기능을 사용하지
              않습니다. 주민등록번호·계좌번호·비밀번호·인증번호를 입력하지
              마세요.
            </p>
            <p>
              실제 피해가 의심되면 즉시 112와 거래 금융회사에 연락하세요.
              금융사기 의심 상담·제보는 1394,
              스미싱·인터넷침해 상담은 118을 이용하세요.
            </p>
          </>
        )}
        <button
          className="dialog-close"
          type="button"
          onClick={() => dialog.current?.close()}
        >
          확인
        </button>
      </dialog>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" />
    </svg>
  );
}

function ShareButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" className={className} aria-label="공유하기" title="공유하기" onClick={onClick}>
      <ShareIcon />
      <span>공유하기</span>
    </button>
  );
}

function FollowUpButton({ label, onClick, urgent = false, icon = "phone" }: {
  label: string;
  onClick: () => void;
  urgent?: boolean;
  icon?: string;
}) {
  const [title, detail] = label.replace(/ →$/, "").split(" → ");
  return (
    <button className={`information-app${urgent ? " is-urgent" : ""}`} type="button" aria-label={label} onClick={onClick}>
      <span className="follow-up-icon"><Icon name={urgent ? "alert" : icon} /></span>
      <span className="follow-up-content">
        <span className="follow-up-title">{title}</span>
        {detail && <span className="follow-up-badge">→ {detail}</span>}
      </span>
      <Icon name="arrow" className="follow-up-arrow" />
    </button>
  );
}

// Mount only for this situation, so leaving it also clears the local selection.
function SharedInformationGuide({ onInstalledApp }: { onInstalledApp: () => void }) {
  const [kind, setKind] = useState<SharedInformationKind | null>(null);
  const guide = getSharedInformationGuide(kind);

  return (
    <div className="information-guide">
      <fieldset className="information-options" aria-describedby="information-privacy">
        <legend>어떤 정보를 알려주셨나요?</legend>
        <p id="information-privacy">
          정보 종류만 선택하세요. 실제 개인정보·계좌번호는 입력하지 마세요.
          선택은 이 화면에서만 사용하며 전송·저장하지 않습니다.
        </p>
        {SHARED_INFORMATION_GUIDES.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name="shared-information-kind"
              value={option.id}
              checked={kind === option.id}
              onChange={() => setKind(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        <ActionList situation="shared_information" steps={guide.steps} actions={guide.actions} />
        {kind === "identity" && (
          <p className="information-note">
            <a href="https://pd.fss.or.kr/" target="_blank" rel="noopener noreferrer">금융감독원 개인정보노출자 사고예방시스템 안내</a>
          </p>
        )}
      </div>
      <p className="information-priority">
        {ACCOUNT_DAMAGE_GUIDANCE}
      </p>
      <FollowUpButton label="의심 앱도 설치했다면 앱 설치 후 안내 보기 →" onClick={onInstalledApp} />
      <details className="guide-details additional-prevention">
        <summary>추가 피해 예방 · 노출자 등록과 안심차단</summary>
        <p>계좌 피해의 긴급 지급정지와 별개인 예방서비스입니다. 이미 송금했거나 모르는 계좌 출금이 있다면 먼저 112 또는 금융회사에 연락하세요.</p>
        <dl>
          <dt>개인정보노출자 사고예방시스템</dt>
          <dd>노출 사실을 등록하면 금융회사와 공유해 신규 계좌개설·신용카드 발급 등에서 명의도용을 예방하도록 돕습니다. 금융감독원 공식 경로에서 등록·해제 안내를 확인하세요.</dd>
          <dt>여신거래 안심차단</dt>
          <dd>신용대출·카드론·신용카드 발급 등 새로운 여신거래를 차단합니다.</dd>
          <dt>비대면 계좌개설 안심차단</dt>
          <dd>본인 명의의 비대면 계좌개설을 차단합니다.</dd>
          <dt>오픈뱅킹 안심차단</dt>
          <dd>오픈뱅킹을 통한 계좌정보 조회·이체 등을 차단합니다.</dd>
        </dl>
        <p>안심차단은 은행 공식 앱·금융회사 영업점·<a href="https://www.payinfo.or.kr/" target="_blank" rel="noopener noreferrer">내계좌한눈에 (공식, 새 창)</a>에서 서비스별 신청 경로를 확인하세요. 해제가 필요하면 금융회사 영업점에서 절차를 확인하세요. 정상적인 새 금융거래도 제한될 수 있습니다.</p>
        <p><a href="https://pd.fss.or.kr/" target="_blank" rel="noopener noreferrer">개인정보노출자 등록·해제 공식 안내 (새 창)</a></p>
        <p>이 앱은 신청·해제를 접수하지 않으며 피해금 회수나 환급을 보장하지 않습니다. 의심 앱도 설치했다면 다른 안전한 기기로 공식 경로를 확인하세요.</p>
      </details>
      <p className="information-note follow-up-note">
        <Icon name="info" />
        <span>일반적인 행동안내입니다. 실제 신고나 보호 조치가 접수되는 것은 아닙니다.</span>
      </p>
    </div>
  );
}

function ActionList({ situation, steps, actions }: {
  situation: PublicDemoSituation;
  steps: readonly string[];
  actions: readonly string[];
}) {
  return (
    <ol className="action-list">
      {steps.map((step, i) => (
        <li key={`${situation}-${i}`}>
          <span className="action-number">{i + 1}</span>
          <span className={`action-icon action-icon-${i}`}>
            <Icon
              name={
                i === 0
                  ? situation === "already_transferred"
                    ? "call"
                    : "shield"
                  : i === 1
                    ? "bank"
                    : "document"
              }
            />
          </span>
          <div>
            <h3>{step}</h3>
            <p>{actions[i]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ContactButtons({ onBank, safePhoneOnly = false }: { onBank: () => void; safePhoneOnly?: boolean }) {
  return (
    <div className="contact-buttons">
      <a href={safePhoneOnly ? undefined : "tel:112"} className="emergency-link police">
        <Icon name="call" />
        <strong>112</strong>
        <span>{safePhoneOnly ? "다른 안전한 전화로 신고" : "긴급 신고하기"}</span>
        <Icon name="arrow" />
      </a>
      <button type="button" className="emergency-link bank" onClick={onBank}>
        <Icon name="bank" />
        <span>금융회사 연락 방법 보기</span>
        <Icon name="arrow" />
      </button>
      <a href={safePhoneOnly ? undefined : "tel:1394"} className="emergency-link hotline">
        <Icon name="call" />
        <strong>1394</strong>
        <span>금융사기 의심 상담·제보</span>
        <Icon name="arrow" />
      </a>
      <a href={safePhoneOnly ? undefined : "tel:118"} className="emergency-link hotline">
        <Icon name="call" />
        <strong>118</strong>
        <span>스미싱·인터넷침해 상담</span>
        <Icon name="arrow" />
      </a>
    </div>
  );
}
