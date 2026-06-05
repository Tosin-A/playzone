"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { submitScore, getPlayerRank } from "@/lib/leaderboard";
import { useCamera } from "@/lib/CameraProvider";
import EntryModal from "./EntryModal";

interface ShareScreenProps {
  score: string | number;
  subtitle?: string;
  shareImage?: Blob | null;
  gameUrl: string;
  onPlayAgain: () => void;
  /** Raw numeric value for the leaderboard (required for string scores) */
  numericScore?: number;
  /** Defaults to true. Set false for "lower is better" games (e.g. Pose-Off) */
  higherIsBetter?: boolean;
}

export default function ShareScreen({
  score,
  subtitle,
  shareImage,
  gameUrl,
  onPlayAgain,
  numericScore,
  higherIsBetter = true,
}: ShareScreenProps) {
  // Parse game slug from URL
  const gameSlug = gameUrl.split("/play/").pop()?.split("?")[0] ?? "";

  // Numeric value to submit: prefer explicit numericScore, fall back to score if it's a number
  const leaderboardScore =
    numericScore ?? (typeof score === "number" ? score : null);

  // ── Score count-up animation ──────────────────────────────
  const scoreIsNumber = typeof score === "number";
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    if (!scoreIsNumber) return;
    const target = score as number;
    const duration = 1400;
    const startTime = performance.now();
    let rafId: number;
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * target));
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [score, scoreIsNumber]);

  // ── Share image preview URL ────────────────────────────────
  // The card is the share artifact. Render it on screen so the user
  // can long-press to save (mobile pattern), see what they're about
  // to share, and screenshot the visual — not just the page chrome.
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shareImage) {
      setShareImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(shareImage);
    setShareImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [shareImage]);

  // ── Leaderboard state ──────────────────────────────────────
  const [name, setName] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done">("idle");
  const [rank, setRank] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Giveaway entry modal ──────────────────────────────────
  const { privacyMode } = useCamera();
  const [entryOpen, setEntryOpen] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!gameSlug || leaderboardScore === null) return;
    setSubmitState("loading");
    const playerName = name.trim() || "Anonymous";
    const scoreDisplay = typeof score === "string" ? score : String(score);
    await submitScore({
      gameSlug,
      playerName,
      score: leaderboardScore,
      scoreDisplay,
      higherIsBetter,
    });
    const r = await getPlayerRank(gameSlug, leaderboardScore, higherIsBetter);
    setRank(r);
    setSubmitState("done");
  }, [gameSlug, leaderboardScore, name, score, higherIsBetter]);

  // ── Share / download ───────────────────────────────────────
  const handleShare = useCallback(async () => {
    const shareData: ShareData = {
      title: "PlayZone",
      text: `I scored ${score} on PlayZone! Can you beat me?`,
      url: gameUrl,
    };
    if (
      shareImage &&
      navigator.canShare?.({
        files: [new File([shareImage], "playzone.png", { type: "image/png" })],
      })
    ) {
      shareData.files = [
        new File([shareImage], "playzone.png", { type: "image/png" }),
      ];
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch { /* cancelled */ }
    }
  }, [score, shareImage, gameUrl]);

  const handleDownload = useCallback(() => {
    if (!shareImage) return;
    const url = URL.createObjectURL(shareImage);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playzone-result.png";
    a.click();
    URL.revokeObjectURL(url);
  }, [shareImage]);

  const rankLabel =
    rank === 1 ? "🥇 All-time #1!" :
    rank === 2 ? "🥈 All-time #2!" :
    rank === 3 ? "🥉 All-time #3!" :
    rank !== null ? `You're ranked #${rank} all-time` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 p-6 text-center w-full max-w-sm mx-auto"
    >
      {/* Score reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1], scale: [0.6, 1.06, 1] }}
        transition={{
          duration: 0.688,
          times: [0, 0.65, 1],
          ease: [[0.16, 1, 0.3, 1], "easeIn"],
        }}
        className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent tabular-nums leading-none"
      >
        {scoreIsNumber ? displayScore : score}
      </motion.div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-white/70"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Share card preview — THE artifact people screenshot. Rendered
          as a tall 9:16 to mirror what posts to TikTok / IG Stories.
          On mobile, long-press the image to save directly. */}
      {shareImageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[240px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_18px_60px_-12px_rgba(255,138,61,0.35)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shareImageUrl}
            alt={`Your ${gameSlug} result — score ${score}`}
            className="block w-full h-auto select-none"
            draggable
          />
        </motion.div>
      )}

      {/* Leaderboard submission */}
      {leaderboardScore !== null && gameSlug && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.438, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <AnimatePresence mode="wait">
            {submitState === "done" && rankLabel ? (
              <motion.p
                key="rank"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm font-semibold text-accent py-2"
              >
                {rankLabel}
              </motion.p>
            ) : submitState !== "done" ? (
              <motion.div
                key="form"
                className="flex gap-2 w-full"
              >
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Your name"
                  maxLength={20}
                  className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitState === "loading"}
                  className="shrink-0 px-4 py-2 bg-accent text-black text-sm font-semibold rounded-xl hover:bg-accent-dim active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {submitState === "loading" ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    "Save"
                  )}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Share / download */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.438, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap justify-center gap-3"
      >
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all duration-300"
          >
            Share
          </button>
        )}
        {shareImage && (
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-300"
          >
            Download
          </button>
        )}
      </motion.div>

      {/* Weekly draw entry */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.438, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setEntryOpen(true)}
        className="group relative w-full max-w-xs px-5 py-3 rounded-2xl border border-accent/40 bg-accent/[0.08] hover:bg-accent/[0.14] active:scale-[0.98] transition-all duration-300"
      >
        <span className="flex items-center justify-center gap-2 text-sm font-semibold text-accent">
          <span className="text-base">🎟️</span>
          Enter the weekly £30 draw
        </span>
        <span className="block text-[10px] text-white/40 mt-0.5">
          Free to enter · Drawn every Monday
        </span>
      </motion.button>

      <EntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        gameSlug={gameSlug}
        score={leaderboardScore}
        scoreDisplay={typeof score === "string" ? score : String(score)}
        faceShown={privacyMode === "normal"}
        initialName={name}
      />

      {/* Play again / try another */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.438, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-3"
      >
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-300"
        >
          Play Again
        </button>
        <Link
          href="/all"
          className="px-5 py-2.5 bg-white/5 rounded-2xl font-medium hover:bg-white/10 active:scale-[0.97] transition-all duration-300"
        >
          Try Another
        </Link>
      </motion.div>
    </motion.div>
  );
}
