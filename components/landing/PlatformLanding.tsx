import GameGrid from "@/components/landing/GameGrid";
import ReactBitsAmbient from "@/components/landing/ReactBitsAmbient";
import LeaderboardPanel from "@/components/leaderboard/LeaderboardPanel";

export default function PlatformLanding() {
  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 flex flex-col md:flex-row">
        <section
          className={[
            "grain relative flex flex-col shrink-0",
            "px-6 py-8",
            "md:px-10 md:py-10",
            "md:w-[44%] md:sticky md:top-0 md:h-dvh",
            "border-b md:border-b-0 md:border-r border-white/[0.06]",
            "overflow-hidden",
          ].join(" ")}
        >
          <ReactBitsAmbient className="z-[1]" />

          <div className="hero-grid absolute inset-0 pointer-events-none" />

          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 5% 80%, oklch(0.82 0.22 50 / 0.10) 0%, transparent 65%)",
            }}
          />

          <nav className="hero-line hero-line-1 relative z-10 flex justify-between items-center">
            <span
              className="font-[family-name:var(--font-display)] font-bold text-foreground select-none"
              style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}
            >
              PZ
            </span>

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

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h1
              className="font-[family-name:var(--font-display)] font-bold uppercase leading-[0.86] tracking-tight select-none"
              style={{ fontSize: "clamp(4rem, 18vw, 12rem)" }}
            >
              <span className="hero-play block text-outlined">Play</span>
              <span
                className="hero-zone block text-accent"
                style={{
                  textShadow:
                    "0 0 80px oklch(0.82 0.22 50 / 0.45), 0 0 200px oklch(0.82 0.22 50 / 0.18)",
                }}
              >
                Zone
              </span>
            </h1>
          </div>

          <div className="hero-line hero-line-3 relative z-10 flex flex-col gap-3 mt-auto">
            <p
              className="font-[family-name:var(--font-display)] uppercase text-muted"
              style={{
                fontSize: "clamp(0.65rem, 1.4vw, 0.9rem)",
                letterSpacing: "0.28em",
              }}
            >
              Ten&nbsp;games&nbsp;·&nbsp;One&nbsp;webcam&nbsp;·&nbsp;No&nbsp;download
            </p>

            <a
              href="#games"
              className="inline-flex items-center gap-2 text-accent/60 hover:text-accent transition-colors duration-300 md:hidden"
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
        </section>

        <main
          id="games"
          className="flex-1 px-6 md:px-8 pt-6 pb-12"
        >
          <div className="flex items-center gap-4 mb-6">
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
          <LeaderboardPanel />
        </main>
      </div>

      <footer
        className="text-center text-muted py-6"
        style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}
      >
        <p>All processing happens in your browser. Your camera feed never leaves your device.</p>
        <p className="mt-2 text-white/70">Made by Tosin</p>
      </footer>
    </div>
  );
}
