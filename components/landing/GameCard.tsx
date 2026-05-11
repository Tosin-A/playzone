"use client";

import { motion } from "framer-motion";
import type { GameMeta } from "@/lib/games";

interface GameCardProps {
  game: GameMeta;
  index: number;
  onSelectGame: (game: GameMeta) => void;
}

export default function GameCard({ game, index, onSelectGame }: GameCardProps) {
  const num = String(index + 1).padStart(2, "0");
  const isUnavailable = !game.available;

  return (
    <motion.button
      type="button"
      disabled={isUnavailable}
      onClick={() => onSelectGame(game)}
      aria-label={isUnavailable ? `${game.title} coming soon` : `Open ${game.title} preview`}
      // ── Entrance: scroll-triggered, staggered ────────────────
      // Cards are below the fold (hero is full-dvh), so they
      // animate in WHEN the user scrolls to them — not on mount.
      // once:true so re-scrolling up doesn't reset the animation.
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      // ── Gesture states ───────────────────────────────────────
      // Hover: lift card 5px (physical, like pressing from below)
      // Tap:   scale down 3% (immediate press feedback on mobile)
      whileHover={isUnavailable ? undefined : { y: -6, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={isUnavailable ? undefined : { scale: 0.975, transition: { duration: 0.18 } }}
      transition={{
        delay: index * 0.05,
        duration: 0.56,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative aspect-[3/4] w-full text-left rounded-2xl bg-gradient-to-br ${game.gradient} overflow-hidden flex flex-col group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isUnavailable ? "cursor-not-allowed grayscale opacity-60" : "cursor-pointer"
      }`}
    >
      {/* Ghost number watermark */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <motion.span
          className="font-[family-name:var(--font-display)] font-bold text-white leading-none"
          animate={{ y: [0, -4, 0], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
          style={{ fontSize: "clamp(7rem, 16vw, 11rem)", opacity: 0.11 }}
        >
          {num}
        </motion.span>
      </div>

      <motion.div
        aria-hidden
        className="absolute -left-16 top-0 h-full w-20 rotate-12 bg-white/10 blur-2xl"
        animate={isUnavailable ? undefined : { x: [-36, 54, 150] }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1.4,
          delay: index * 0.18,
        }}
      />

      {/* Top row: index + status badge */}
      <div className="relative z-10 flex justify-between items-start p-4">
        <span
          className="font-[family-name:var(--font-display)] font-bold text-white/50 leading-none"
          style={{ fontSize: "1.1rem" }}
        >
          {num}
        </span>

        {game.available ? (
          <span
            className="bg-black/40 text-accent rounded-full font-[family-name:var(--font-barlow)] font-semibold"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 9px",
            }}
          >
            Preview ›
          </span>
        ) : (
          <span
            className="bg-black/40 text-white/60 rounded-full font-[family-name:var(--font-barlow)] font-semibold"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 9px",
            }}
          >
            Teaser
          </span>
        )}
      </div>

      {/* Bottom: title + description */}
      <div className="relative z-10 mt-auto p-4">
        <h3
          className="font-[family-name:var(--font-display)] font-bold text-white leading-tight"
          style={{
            fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {game.title}
        </h3>
        <p
          className="text-white/70 mt-1 leading-snug"
          style={{
            fontSize: "0.7rem",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {game.description}
        </p>
      </div>

      {/* Hover brightener */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl border border-white/0"
        animate={isUnavailable ? undefined : { borderColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.16)", "rgba(255,255,255,0)"] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
      />
      {isUnavailable ? (
        <>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="rounded-full border border-white/30 bg-black/65 px-4 py-2 text-white"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Coming Soon
            </span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-300" />
      )}
    </motion.button>
  );
}
