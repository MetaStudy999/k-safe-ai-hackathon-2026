"use client";

import { useRef, useState } from "react";
import { PUBLIC_DEMO_SCENARIOS, getPublicDemoActions } from "@/lib/public-demo";
import type { Situation } from "@/lib/safety";

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

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="K-SAFE 국민안심 AI 홈">
      <svg className="brand-shield" viewBox="0 0 36 42" aria-hidden="true">
        <defs>
          <linearGradient id="brand-blue">
            <stop stopColor="#45baff" />
            <stop offset="1" stopColor="#1547ff" />
          </linearGradient>
        </defs>
        <path
          fill="url(#brand-blue)"
          d="M18 1c5 5 10 6 16 7v15c0 9-9 15-16 19C11 38 2 32 2 23V8c6-1 11-2 16-7Z"
        />
        <path
          fill="#fff"
          d="M18 10c3 2 6 3 9 4v9c0 5-5 9-9 12-4-3-9-7-9-12v-9c3-1 6-2 9-4Z"
        />
        <path fill="#d2efff" d="M18 10v25c-4-3-9-7-9-12v-9c3-1 6-2 9-4Z" />
      </svg>
      <span>
        K-SAFE{" "}
        <small>
          국민안심 <b>AI</b>
        </small>
      </span>
    </a>
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

export default function PublicDemo() {
  const [situation, setSituation] = useState<Situation>("already_transferred");
  const [menuOpen, setMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [dialogKind, setDialogKind] = useState<"about" | "bank">("about");
  const dialog = useRef<HTMLDialogElement>(null);
  const current = PUBLIC_DEMO_SCENARIOS.find((item) => item.id === situation)!;
  const actions = getPublicDemoActions(situation);

  function openDialog(kind: "about" | "bank") {
    setDialogKind(kind);
    setMenuOpen(false);
    dialog.current?.showModal();
  }

  return (
    <div
      className={`public-site${highContrast ? " high-contrast" : ""}`}
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
              className={item.href === "#home" ? "active" : ""}
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
          <a href="#guide" className="check-button">
            지금 안전하게 확인하기 <span aria-hidden="true">→</span>
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
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <button type="button" onClick={() => openDialog("about")}>
              서비스 소개 · 개인정보 보호
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
            <fieldset className="situation-grid">
              <legend className="visuallyHidden">현재 상황 선택</legend>
              {PUBLIC_DEMO_SCENARIOS.map((option) => (
                <label
                  key={option.id}
                  className={`situation-card ${option.id}${situation === option.id ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="situation"
                    value={option.id}
                    checked={situation === option.id}
                    onChange={() => setSituation(option.id)}
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
            className={`mobile-emergency ${situation}`}
            aria-labelledby="emergency-title"
            aria-live="polite"
          >
            <div className="emergency-heading">
              <Icon name="bell" />
              <div>
                <h2 id="emergency-title">{current.alertTitle}</h2>
                <strong>{current.alertText}</strong>
                <p>
                  {situation === "already_transferred"
                    ? "추가 피해를 막기 위해 신속한 신고와 지급정지가 중요합니다."
                    : "문자 속 연락처 대신 공식 상담 창구를 이용하세요."}
                </p>
              </div>
            </div>
            <ContactButtons onBank={() => openDialog("bank")} />
          </section>
          <div className="detail-grid" aria-live="polite" aria-atomic="true">
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
                    <span aria-hidden="true">!</span> 이런 점이 의심스러워요!
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
              </div>
            </section>
            <section
              className="action-panel"
              id="rules"
              aria-labelledby="action-title"
            >
              <div className="panel-heading">
                <span className="action-title-icon">↟</span>
                <h2 id="action-title">지금 이렇게 하세요</h2>
                <p>안전한 대응을 위한 권장 행동입니다.</p>
              </div>
              <ol className="action-list">
                {current.steps.map((step, i) => (
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
                <p>언제든지 도움을 받을 수 있습니다.</p>
              </div>
            </div>
            <div className="desktop-contacts">
              <a className="contact-card police" href="tel:112">
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
              <a className="contact-card hotline" href="tel:118">
                <span className="contact-icon">
                  <Icon name="call" />
                </span>
                <strong>118</strong>
                <span>
                  <b>스미싱·인터넷침해 상담</b>
                  <span>금융사기 의심 문자 등</span>
                  <small>(국번 없이 118)</small>
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
                  <b>금융회사 고객센터</b>
                  <span>이용 중인 은행에</span>
                  <span>지급정지 등 긴급 조치 요청</span>
                </span>
                <Icon name="arrow" />
              </button>
            </div>
            <div className="mobile-contacts">
              <ContactButtons onBank={() => openDialog("bank")} />
            </div>
          </section>
        </div>
        <footer className="site-footer">
          <p>
            <strong>가상 사례 시연 · 실제 AI 분석 아님</strong> · 사기 여부를
            확정하거나 신고를 접수하지 않습니다.
          </p>
          <p>
            개인정보를 입력받거나 메시지를 전송·저장하지 않는 공개 데모입니다.
            주민등록번호·계좌번호·비밀번호·인증번호를 입력하지 마세요.
          </p>
          <button type="button" onClick={() => openDialog("about")}>
            K-SAFE 소개 · 개인정보 보호 안내
          </button>
          <span>© 2026 K-SAFE 국민안심 AI</span>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="하단 메뉴">
        <a className="active" href="#home">
          <Icon name="home" />
          <span>홈</span>
        </a>
        <a href="#cases">
          <Icon name="guide" />
          <span>사례보기</span>
        </a>
        <a href="#rules">
          <Icon name="shield" />
          <span>안전수칙</span>
        </a>
        <a href="#help">
          <Icon name="question" />
          <span>도움받기</span>
        </a>
        <button type="button" onClick={() => openDialog("about")}>
          <Icon name="more" />
          <span>더보기</span>
        </button>
      </nav>
      <dialog
        ref={dialog}
        className="info-dialog"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-top">
          <Icon name={dialogKind === "bank" ? "bank" : "shield"} />
          <h2 id="dialog-title">
            {dialogKind === "bank"
              ? "거래 금융회사에 연락하기"
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
        {dialogKind === "bank" ? (
          <>
            <p>
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
            <a className="dialog-call" href="tel:112">
              <Icon name="call" />
              112 긴급 신고하기
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
              <br />네 가지 합성 사례와 사전에 준비된 안전수칙을 보여 줍니다.
              실제 메시지를 분석하거나 사기 여부를 확정하지 않습니다.
            </p>
            <h3>개인정보 보호</h3>
            <p>
              입력창, 메시지 전송, 분석 요청, 개인정보 저장 기능을 사용하지
              않습니다. 주민등록번호·계좌번호·비밀번호·인증번호를 입력하지
              마세요.
            </p>
            <p>
              실제 피해가 의심되면 즉시 112와 거래 금융회사에 연락하세요.
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

function ContactButtons({ onBank }: { onBank: () => void }) {
  return (
    <div className="contact-buttons">
      <a href="tel:112" className="emergency-link police">
        <Icon name="call" />
        <strong>112</strong>
        <span>긴급 신고하기</span>
        <Icon name="arrow" />
      </a>
      <a href="tel:118" className="emergency-link hotline">
        <Icon name="call" />
        <strong>118</strong>
        <span>스미싱·인터넷침해 상담</span>
        <Icon name="arrow" />
      </a>
      <button type="button" className="emergency-link bank" onClick={onBank}>
        <Icon name="bank" />
        <span>이용 중인 금융회사에 연락하기</span>
        <Icon name="arrow" />
      </button>
    </div>
  );
}
