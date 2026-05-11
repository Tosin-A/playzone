"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { GameMeta } from "@/lib/games";

interface GameCardProps {
  game: GameMeta;
  index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
  const num = String(index + 1).padStart(2, "0");

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        game.available
          ? { y: -5, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
          : undefined
      }
      transition={{
        delay: index * 0.04,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative aspect-[3/4] rounded-2xl bg-gradient-to-br ${game.gradient} overflow-hidden flex flex-col group ${
        !game.available ? "opacity-40 grayscale" : "cursor-pointer"
      }`}
    >
      {/* Ghost number watermark */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-[family-name:var(--font-display)] font-bold text-white leading-none"
          style={{ fontSize: "clamp(7rem, 16vw, 11rem)", opacity: 0.11 }}
        >
          {num}
        </span>
      </div>

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
            Play ›
          </span>
        ) : (
          <span
            className="bg-black/40 text-white/40 rounded-full font-[family-name:var(--font-barlow)] font-semibold"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 9px",
            }}
          >
            Soon
          </span>
        )}
      </div>

      {/* Bottom: title + description */}
      <div className="relative z-10 mt-auto p-4">
        <h3
          className="font-[family-name:var(--font-display)] font-bold text-white leading-tight"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)" }}
        >
          {game.title}
        </h3>
        <p
          className="text-white/65 mt-1 leading-snug"
          style={{ fontSize: "0.7rem" }}
        >
          {game.description}
        </p>
      </div>

      {/* Hover brightener */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-150" />
    </motion.div>
  );

  if (!game.available) return content;
  return <Link href={`/play/${game.slug}`}>{content}</Link>;
}
