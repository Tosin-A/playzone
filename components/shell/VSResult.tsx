"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface VSResultProps {
  yourScore: number | string;
  opponentScore: number | string;
  yourName: string;
  opponentName: string;
  unit?: string;
  lowerIsBetter?: boolean;
  onPlayAgain: () => void;
  onRematch: () => void;
}

export default function VSResult({
  yourScore,
  opponentScore,
  yourName,
  opponentName,
  unit = "",
  lowerIsBetter = false,
  onPlayAgain,
  onRematch,
}: VSResultProps) {
  const yourNum = typeof yourScore === "number" ? yourScore : parseFloat(String(yourScore));
  const oppNum = typeof opponentScore === "number" ? opponentScore : parseFloat(String(opponentScore));

  let result: "win" | "lose" | "tie";
  if (yourNum === oppNum) {
    result = "tie";
  } else if (lowerIsBetter) {
    result = yourNum < oppNum ? "win" : "lose";
  } else {
    result = yourNum > oppNum ? "win" : "lose";
  }

  const resultText = result === "win" ? "You Win!" : result === "lose" ? "You Lose" : "It's a Tie!";
  const resultColor = result === "win" ? "text-accent" : result === "lose" ? "text-red-400" : "text-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 p-6 text-center"
    >
      <motion.h2
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className={`text-4xl font-bold font-[family-name:var(--font-display)] uppercase ${resultColor}`}
      >
        {resultText}
      </motion.h2>

      {/* VS Scoreboard */}
      <div className="flex items-center gap-6">
        {/* Your score */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-xs text-white/40 uppercase">You</span>
          <span className="text-sm font-medium text-white/70">{yourName}</span>
          <span className={`text-4xl font-bold font-[family-name:var(--font-display)] ${result === "win" ? "text-accent" : "text-white/80"}`}>
            {yourScore}{unit}
          </span>
        </motion.div>

        <span className="text-2xl text-white/20 font-bold">VS</span>

        {/* Opponent score */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-xs text-white/40 uppercase">Opponent</span>
          <span className="text-sm font-medium text-white/70">{opponentName}</span>
          <span className={`text-4xl font-bold font-[family-name:var(--font-display)] ${result === "lose" ? "text-red-400" : "text-white/80"}`}>
            {opponentScore}{unit}
          </span>
        </motion.div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <button
          onClick={onRematch}
          className="px-5 py-2.5 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim transition-colors"
        >
          Rematch
        </button>
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 bg-white/10 rounded-2xl font-medium hover:bg-white/15 transition-colors"
        >
          Solo Play
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white/5 rounded-2xl font-medium hover:bg-white/10 transition-colors"
        >
          Home
        </Link>
      </div>
    </motion.div>
  );
}
