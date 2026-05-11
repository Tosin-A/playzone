"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ShareScreenProps {
  score: string | number;
  subtitle?: string;
  shareImage?: Blob | null;
  gameUrl: string;
  onPlayAgain: () => void;
}

export default function ShareScreen({
  score,
  subtitle,
  shareImage,
  gameUrl,
  onPlayAgain,
}: ShareScreenProps) {
  // ── Score count-up animation ──────────────────────────────
  // If score is a number (0-100 range), count from 0 to target
  // over 1.4s using ease-out cubic — like a real scoreboard.
  // If score is a string, display it as-is.
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
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayScore(Math.round(eased * target));
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [score, scoreIsNumber]);

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
      } catch {
        // User cancelled share
      }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 p-6 text-center"
    >
      {/* ── Score reveal ──────────────────────────────────────
          Scales from 0.6→1.06→1 (single deliberate pop, not
          spring bounce). The counter runs simultaneously so the
          number "snaps into focus" as it reaches the final value. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1], scale: [0.6, 1.06, 1] }}
        transition={{
          duration: 0.55,
          times: [0, 0.65, 1],
          ease: [[0.16, 1, 0.3, 1], "easeIn"],
        }}
        className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent tabular-nums leading-none"
      >
        {scoreIsNumber ? displayScore : score}
      </motion.div>

      {/* Subtitle — appears after score pop settles */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-white/70"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Share / download row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap justify-center gap-3"
      >
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all duration-150"
          >
            Share
          </button>
        )}
        {shareImage && (
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-150"
          >
            Download
          </button>
        )}
      </motion.div>

      {/* Play again / try another row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-3"
      >
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-150"
        >
          Play Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white/5 rounded-2xl font-medium hover:bg-white/10 active:scale-[0.97] transition-all duration-150"
        >
          Try Another
        </Link>
      </motion.div>
    </motion.div>
  );
}
