"use client";

import { motion } from "framer-motion";

interface BackToResultsButtonProps {
  onClick: () => void;
}

// Shown on a game's ready/select screen when a finished result is still
// available in memory. Lets the player jump back to the share screen to
// re-read the score, copy the share link, or grab the clip without having
// to replay the whole round.
export default function BackToResultsButton({ onClick }: BackToResultsButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/90 transition-colors duration-300"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to your last result
    </motion.button>
  );
}
