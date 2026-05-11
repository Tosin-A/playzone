"use client";

import { useCallback } from "react";
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
  const handleShare = useCallback(async () => {
    const shareData: ShareData = {
      title: "PlayZone",
      text: `I scored ${score} on PlayZone! Can you beat me?`,
      url: gameUrl,
    };

    if (shareImage && navigator.canShare?.({ files: [new File([shareImage], "playzone.png", { type: "image/png" })] })) {
      shareData.files = [new File([shareImage], "playzone.png", { type: "image/png" })];
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="text-6xl font-bold font-[family-name:var(--font-display)] text-accent"
      >
        {score}
      </motion.div>

      {subtitle && (
        <p className="text-lg text-white/70">{subtitle}</p>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim transition-colors"
          >
            Share
          </button>
        )}
        {shareImage && (
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 transition-colors"
          >
            Download
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 transition-colors"
        >
          Play Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white/5 rounded-2xl font-medium hover:bg-white/10 transition-colors"
        >
          Try Another
        </Link>
      </div>
    </motion.div>
  );
}
