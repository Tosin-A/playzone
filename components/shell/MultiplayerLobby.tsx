"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MultiplayerManager,
  MatchmakingStatus,
  MatchmakingResult,
  getPlayerNickname,
  setPlayerNickname,
} from "@/lib/multiplayer";

interface MultiplayerLobbyProps {
  gameSlug: string;
  gameName: string;
  onMatchStart: (manager: MultiplayerManager, result: MatchmakingResult) => void;
  onCancel: () => void;
}

export default function MultiplayerLobby({
  gameSlug,
  gameName,
  onMatchStart,
  onCancel,
}: MultiplayerLobbyProps) {
  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [nickname, setNick] = useState(getPlayerNickname());
  const [opponent, setOpponent] = useState<MatchmakingResult | null>(null);
  const managerRef = useRef<MultiplayerManager | null>(null);

  const startSearching = useCallback(() => {
    setPlayerNickname(nickname);
    const manager = new MultiplayerManager(gameSlug);
    managerRef.current = manager;

    manager.joinQueue(
      (s) => setStatus(s),
      (result) => {
        setOpponent(result);
        // Brief delay to show "matched" UI, then start
        setTimeout(() => {
          onMatchStart(manager, result);
        }, 2000);
      }
    );
  }, [gameSlug, nickname, onMatchStart]);

  const cancelSearch = useCallback(() => {
    managerRef.current?.cleanup();
    managerRef.current = null;
    setStatus("idle");
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    return () => {
      managerRef.current?.leaveQueue();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 p-6 text-center w-full max-w-sm mx-auto"
    >
      <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase">
        {gameName} <span className="text-accent">Online</span>
      </h2>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="w-full">
              <label className="text-xs text-white/40 block mb-1 text-left">Your name</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNick(e.target.value.slice(0, 16))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="Enter nickname"
              />
            </div>
            <button
              onClick={startSearching}
              disabled={!nickname.trim()}
              className="w-full px-6 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim transition-colors disabled:opacity-50"
            >
              Find Opponent
            </button>
            <button
              onClick={onCancel}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Back to solo play
            </button>
          </motion.div>
        )}

        {status === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Searching animation */}
            <div className="relative w-24 h-24">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-accent/50"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
              />
              <div className="absolute inset-4 rounded-full bg-accent/10 flex items-center justify-center">
                <motion.div
                  className="w-3 h-3 rounded-full bg-accent"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-white/70">Searching for opponents...</p>
              <SearchingDots />
            </div>

            <button
              onClick={cancelSearch}
              className="px-5 py-2 bg-white/5 rounded-xl text-sm text-white/50 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {status === "matched" && opponent && (
          <motion.div
            key="matched"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl"
            >
              ⚔️
            </motion.div>
            <p className="text-lg font-bold text-accent">Opponent Found!</p>
            <div className="bg-white/5 rounded-xl px-6 py-3">
              <p className="text-sm text-white/50">You&apos;re facing</p>
              <p className="text-lg font-semibold">{opponent.opponent.nickname}</p>
            </div>
            <p className="text-xs text-white/40">Starting match...</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-red-400 text-sm">Connection error. Please try again.</p>
            <button
              onClick={() => setStatus("idle")}
              className="px-5 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/15 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SearchingDots() {
  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
