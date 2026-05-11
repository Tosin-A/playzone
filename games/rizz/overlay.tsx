"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LiveScores } from "./logic";

interface RizzOverlayProps {
  phase: "scanning" | "done";
  progress: number;
  score?: number;
  oneLiner?: string;
  liveScores?: LiveScores;
}

export default function RizzOverlay({ phase, progress, score, oneLiner, liveScores }: RizzOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {phase === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full px-6"
          >
            {/* Scanning ring */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  style={{ stroke: "var(--accent)" }}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.83} 283`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-white/60 font-medium">Analyzing...</span>
              </div>
            </div>

            {/* Live score bars */}
            {liveScores && (
              <div className="w-full max-w-xs bg-black/60 backdrop-blur-sm rounded-2xl p-4 space-y-3">
                <ScoreBar label="Smile" value={liveScores.smile} color="#00ff88" />
                <ScoreBar label="Eye Contact" value={liveScores.eyeContact} color="#00ccff" />
                <ScoreBar label="Head Tilt" value={liveScores.headTilt} color="#ff88ff" />
                <ScoreBar label="Jawline" value={liveScores.jawline} color="#ffcc00" />
              </div>
            )}
          </motion.div>
        )}

        {phase === "done" && score !== undefined && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3 bg-black/70 backdrop-blur-md rounded-3xl p-8"
          >
            <span className="text-5xl font-bold font-[family-name:var(--font-display)] text-accent">
              {score}
            </span>
            <span className="text-sm text-white/50 uppercase tracking-wide">Rizz Score</span>
            {oneLiner && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/90 mt-2 font-medium"
              >
                &ldquo;{oneLiner}&rdquo;
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50 tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.375, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
