"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface GameShellProps {
  title: string;
  howToPlay: string;
  children: ReactNode;
  onShare?: () => void;
  onRecord?: () => void;
  onPlayAgain?: () => void;
  showControls?: boolean;
  isRecording?: boolean;
}

export default function GameShell({
  title,
  howToPlay,
  children,
  onShare,
  onRecord,
  onPlayAgain,
  showControls = false,
  isRecording = false,
}: GameShellProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0">
        <Link
          href="/all"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-[0.93] transition-all duration-300"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-wide font-[family-name:var(--font-display)]">
          {title}
        </h1>
        <InfoButton howToPlay={howToPlay} />
      </header>

      {/* Game area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-4 gap-4">
        {children}
      </main>

      {/* Bottom bar */}
      {showControls && (
        <footer className="flex items-center justify-center gap-6 px-4 py-4 shrink-0">
          {onRecord && (
            <button
              onClick={onRecord}
              className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-colors ${
                isRecording
                  ? "border-red-500 bg-red-500/20"
                  : "border-white/30 hover:border-white/50"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <div
                className={`rounded-full transition-all ${
                  isRecording ? "w-5 h-5 rounded-sm bg-red-500" : "w-8 h-8 bg-red-500"
                }`}
              />
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all duration-300"
            >
              Share
            </button>
          )}
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-300"
            >
              Play Again
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

function InfoButton({ howToPlay }: { howToPlay: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-[0.93] transition-all duration-300"
        aria-label="How to play"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="How to play"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-accent">
                  How to play
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/85 leading-relaxed">{howToPlay}</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-5 w-full px-5 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.98] transition-all duration-200"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
