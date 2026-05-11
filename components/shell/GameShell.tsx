"use client";

import { ReactNode } from "react";
import Link from "next/link";

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
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-[0.93] transition-all duration-150"
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
              className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all duration-150"
            >
              Share
            </button>
          )}
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-150"
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
  return (
    <button
      onClick={() => alert(howToPlay)}
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-[0.93] transition-all duration-150"
      aria-label="How to play"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    </button>
  );
}
