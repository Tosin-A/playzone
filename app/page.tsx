import GameGrid from "@/components/landing/GameGrid";

export default function Home() {
  return (
    <div className="grain relative flex flex-col min-h-dvh">

      {/* ─── HERO ─────────────────────────────────────────── */}
      {/* Full viewport height, dot-grid bg, film grain, all   */}
      {/* content stacked with nav top / wordmark mid / CTA bot */}
      <section className="relative z-10 flex flex-col min-h-dvh px-6 md:px-10 overflow-hidden">

        {/* Dot grid texture */}
        <div className="hero-grid absolute inset-0 pointer-events-none" />

        {/* Top nav */}
        <nav className="hero-line hero-line-1 relative z-10 flex justify-between items-center py-6">

          {/* Monogram */}
          <span
            className="font-[family-name:var(--font-display)] font-bold text-foreground select-none"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}
          >
            PZ
          </span>

          {/* Live indicator — only shown when a game is live */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="live-dot w-1.5 h-1.5 rounded-full bg-accent block"
              style={{ boxShadow: "0 0 6px var(--accent)" }}
            />
            <span
              className="text-accent"
              style={{
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Rizz Rater&nbsp;·&nbsp;Live now
            </span>
          </div>
        </nav>

        {/* ── Wordmark ──────────────────────────────────────── */}
        {/* "PLAY" is outlined (hollow white stroke, transparent  */}
        {/* fill) and "ZONE" is solid orange — this hollow/filled */}
        {/* contrast is the hero's single biggest statement.      */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1
            className="font-[family-name:var(--font-display)] font-bold uppercase leading-[0.86] tracking-tight select-none"
            style={{ fontSize: "clamp(5.5rem, 24vw, 19rem)" }}
          >
            {/* Each word has its own directional entrance:          */}
            {/* PLAY slides in from the left, ZONE from the right,   */}
            {/* so they close in toward each other like a curtain.   */}
            <span className="hero-play block text-outlined">Play</span>
            <span
              className="hero-zone block text-accent"
              style={{
                textShadow:
                  "0 0 80px oklch(0.82 0.22 50 / 0.4), 0 0 200px oklch(0.82 0.22 50 / 0.15)",
              }}
            >
              Zone
            </span>
          </h1>
        </div>

        {/* ── Bottom bar ────────────────────────────────────── */}
        {/* Tagline + CTA left, decorative ghost "10" right     */}
        {/* The ghost "10" communicates "10 games" visually     */}
        {/* without repeating the tagline text.                 */}
        <div className="hero-line hero-line-3 relative z-10 flex justify-between items-end pb-8">

          <div className="flex flex-col gap-3">
            <p
              className="font-[family-name:var(--font-display)] uppercase text-muted"
              style={{
                fontSize: "clamp(0.7rem, 1.5vw, 0.95rem)",
                letterSpacing: "0.3em",
              }}
            >
              Ten&nbsp;games&nbsp;&nbsp;·&nbsp;&nbsp;One&nbsp;webcam&nbsp;&nbsp;·&nbsp;&nbsp;No&nbsp;download
            </p>

            <a
              href="#games"
              className="inline-flex items-center gap-2 text-accent/60 hover:text-accent transition-colors"
              style={{
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Pick a game
              <svg
                className="nudge-down"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
          </div>

          {/* Ghost "10" — decorative, desktop-only */}
          <span
            aria-hidden
            className="font-[family-name:var(--font-display)] font-bold text-foreground select-none pointer-events-none hidden md:block"
            style={{
              fontSize: "clamp(7rem, 16vw, 13rem)",
              lineHeight: 1,
              opacity: 0.06,
              letterSpacing: "-0.03em",
            }}
          >
            10
          </span>
        </div>
      </section>

      {/* ─── GAMES ────────────────────────────────────────── */}
      <main id="games" className="relative z-10 flex-1 px-6 md:px-10 pb-16">

        {/* Section divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span
            className="font-[family-name:var(--font-display)] text-muted"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            All Games
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <GameGrid />
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center text-muted py-6"
        style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}
      >
        All processing happens in your browser. Your camera feed never leaves your device.
      </footer>
    </div>
  );
}
