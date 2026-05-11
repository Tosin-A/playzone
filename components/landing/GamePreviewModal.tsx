"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameMeta } from "@/lib/games";

interface GamePreviewModalProps {
  game: GameMeta | null;
  onClose: () => void;
}

export default function GamePreviewModal({ game, onClose }: GamePreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!game) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [game, onClose]);

  return (
    <AnimatePresence>
      {game ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          className="fixed inset-0 z-50 p-4 md:p-8 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`preview-title-${game.slug}`}
          aria-describedby={`preview-subtitle-${game.slug}`}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-surface overflow-hidden"
          >
            <div className="grid md:grid-cols-[1.2fr_1fr]">
              <div
                className={`relative min-h-[24rem] bg-gradient-to-br ${game.gradient} overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/45" />

                <motion.div
                  className="absolute -left-14 -top-14 h-56 w-56 rounded-full blur-2xl"
                  style={{ backgroundColor: game.immersive.aura, opacity: 0.4 }}
                  animate={{ x: [0, 16, 0], y: [0, -18, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
                <motion.div
                  className="absolute right-0 bottom-0 h-72 w-72 rounded-full blur-3xl"
                  style={{ backgroundColor: game.immersive.aura, opacity: 0.45 }}
                  animate={{ x: [0, -20, 0], y: [0, 14, 0], scale: [1, 0.94, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  aria-hidden
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className="font-[family-name:var(--font-display)] font-bold text-white/20 leading-none"
                    animate={{ opacity: [0.14, 0.24, 0.14], scale: [1, 1.03, 1] }}
                    transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ fontSize: "clamp(10rem, 28vw, 18rem)" }}
                  >
                    {game.immersive.kanji}
                  </motion.span>
                </div>

                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full bg-black/45 text-accent px-3 py-1"
                      style={{
                        fontSize: "0.62rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      Anime Preview
                    </span>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={onClose}
                      className="h-11 w-11 inline-flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-300"
                      aria-label="Close preview panel"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <h2
                      id={`preview-title-${game.slug}`}
                      className="font-[family-name:var(--font-display)] font-bold text-white leading-[0.86]"
                      style={{ fontSize: "clamp(2.4rem, 7vw, 4.6rem)" }}
                    >
                      {game.title}
                    </h2>
                    <p
                      id={`preview-subtitle-${game.slug}`}
                      className="text-white/80 mt-2 text-lg"
                    >
                      {game.immersive.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-black/25">
                <div className="space-y-5">
                  <div>
                    <p className="text-white/50 uppercase tracking-[0.2em] text-[0.62rem]">Setting</p>
                    <p className="text-white/90 mt-1 leading-snug">{game.immersive.setting}</p>
                  </div>
                  <div>
                    <p className="text-white/50 uppercase tracking-[0.2em] text-[0.62rem]">Mission</p>
                    <p className="text-white/90 mt-1 leading-snug">{game.immersive.mission}</p>
                  </div>
                  <div>
                    <p className="text-white/50 uppercase tracking-[0.2em] text-[0.62rem]">Signature Move</p>
                    <p className="text-accent mt-1 font-semibold">{game.immersive.signatureMove}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  {game.available ? (
                    <Link
                      href={`/play/${game.slug}`}
                      className="inline-flex items-center justify-center rounded-xl bg-white text-black px-5 py-3 font-semibold hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-300"
                    >
                      Start {game.title}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-xl bg-white/10 text-white/70 px-5 py-3 font-semibold">
                      Coming Soon
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 text-white px-5 py-3 font-semibold hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-300"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
