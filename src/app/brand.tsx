export default function Brand({
  href = "#home",
  ariaLabel = "K-SAFE 국민안심 AI 홈"
}: { href?: string; ariaLabel?: string }) {
  return (
    <a className="brand" href={href} aria-label={ariaLabel}>
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
