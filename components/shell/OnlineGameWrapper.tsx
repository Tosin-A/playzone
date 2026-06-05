"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MultiplayerManager,
  MatchmakingResult,
} from "@/lib/multiplayer";
import MultiplayerLobby from "./MultiplayerLobby";
import VSResult from "./VSResult";
import PlayZoneLogo from "./PlayZoneLogo";

export type OnlineGamePhase = "mode-select" | "matchmaking" | "countdown" | "playing" | "waiting" | "result";

interface OnlineGameWrapperProps {
  gameSlug: string;
  gameName: string;
  unit?: string;
  lowerIsBetter?: boolean;
  children: (props: {
    phase: OnlineGamePhase;
    manager: MultiplayerManager;
    opponentScore: number;
    onScoreUpdate: (score: number, extras?: Record<string, unknown>) => void;
    onGameFinished: (finalScore: number, extras?: Record<string, unknown>) => void;
  }) => React.ReactNode;
  renderSoloGame: () => React.ReactNode;
}

export default function OnlineGameWrapper({
  gameSlug,
  gameName,
  unit = "",
  lowerIsBetter = false,
  children,
  renderSoloGame,
}: OnlineGameWrapperProps) {
  const [mode, setMode] = useState<"select" | "solo" | "online">("select");
  const [onlinePhase, setOnlinePhase] = useState<OnlineGamePhase>("matchmaking");
  const [countdown, setCountdown] = useState(3);
  const [opponentScore, setOpponentScore] = useState(0);
  const [myFinalScore, setMyFinalScore] = useState(0);
  const [opponentFinalScore, setOpponentFinalScore] = useState<number | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [myNickname, setMyNickname] = useState("You");
  const [activeManager, setActiveManager] = useState<MultiplayerManager | null>(null);

  const handleMatchStart = useCallback(async (manager: MultiplayerManager, result: MatchmakingResult) => {
    setActiveManager(manager);
    setMyNickname(manager.getNickname());
    setOpponentName(result.opponent.nickname);

    const onOpponentFinished = (data: { finalScore: number }) => {
      setOpponentFinalScore(data.finalScore);
      // If we're already waiting (finished), go to result
      setOnlinePhase((prev) => prev === "waiting" ? "result" : prev);
    };

    // Host drives the countdown
    if (result.isHost) {
      // Host joins room and controls countdown
      manager.joinRoom(
        result.roomId,
        (data) => setOpponentScore(data.score),
        onOpponentFinished,
        (count) => setCountdown(count)
      );

      setOnlinePhase("countdown");
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        manager.sendCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setOnlinePhase("playing");
      manager.sendCountdown(0);
    } else {
      // Non-host joins room and listens for countdown from host
      setOnlinePhase("countdown");
      manager.joinRoom(
        result.roomId,
        (data) => setOpponentScore(data.score),
        onOpponentFinished,
        (count) => {
          setCountdown(count);
          if (count === 0) {
            setOnlinePhase("playing");
          }
        }
      );
    }
  }, []);

  const handleScoreUpdate = useCallback((score: number, extras?: Record<string, unknown>) => {
    activeManager?.sendScoreUpdate(score, extras);
  }, [activeManager]);

  const handleGameFinished = useCallback((finalScore: number, extras?: Record<string, unknown>) => {
    setMyFinalScore(finalScore);
    activeManager?.sendGameFinished(finalScore, extras);

    // Check if opponent already finished
    setOpponentFinalScore((prev) => {
      if (prev !== null) {
        setOnlinePhase("result");
      } else {
        setOnlinePhase("waiting");
      }
      return prev;
    });
  }, [activeManager]);

  const resetOnline = useCallback(() => {
    activeManager?.cleanup();
    setActiveManager(null);
    setOnlinePhase("matchmaking");
    setOpponentScore(0);
    setMyFinalScore(0);
    setOpponentFinalScore(null);
    setMode("select");
  }, [activeManager]);

  const rematch = useCallback(() => {
    activeManager?.cleanup();
    setActiveManager(null);
    setOnlinePhase("matchmaking");
    setOpponentScore(0);
    setMyFinalScore(0);
    setOpponentFinalScore(null);
    setMode("online");
  }, [activeManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeManager?.cleanup();
    };
  }, [activeManager]);

  // Mode selection screen
  if (mode === "select") {
    return (
      <div className="flex flex-col items-center gap-6 p-6 w-full max-w-md mx-auto">
        <PlayZoneLogo size="lg" />
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/40 font-[family-name:var(--font-display)] -mt-3">
          Camera Arcade · One vs One
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => setMode("solo")}
            className="group relative h-20 rounded-2xl bg-gradient-to-b from-white to-neutral-300 text-black font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-[0.18em] shadow-[0_4px_0_rgba(0,0,0,0.4),0_8px_24px_rgba(255,255,255,0.08)] hover:translate-y-[1px] hover:shadow-[0_3px_0_rgba(0,0,0,0.4),0_6px_18px_rgba(255,255,255,0.12)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-all"
          >
            Solo
          </button>
          <button
            onClick={() => setMode("online")}
            className="group relative h-20 rounded-2xl text-black font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-[0.18em] hover:translate-y-[1px] active:translate-y-[2px] transition-all"
            style={{
              background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-dim) 100%)",
              boxShadow:
                "0 4px 0 color-mix(in oklch, var(--accent-dim) 60%, black), 0 0 36px color-mix(in oklch, var(--accent) 55%, transparent)",
            }}
          >
            Duel
          </button>
        </div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/35 font-[family-name:var(--font-display)]">
          Pick your mode
        </p>
      </div>
    );
  }

  if (mode === "solo") {
    return <>{renderSoloGame()}</>;
  }

  // Online mode
  if (onlinePhase === "matchmaking") {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <PlayZoneLogo size="md" />
        <MultiplayerLobby
          gameSlug={gameSlug}
          gameName={gameName}
          onMatchStart={handleMatchStart}
          onCancel={resetOnline}
        />
      </div>
    );
  }

  if (onlinePhase === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 min-h-[40vh]">
        <PlayZoneLogo size="md" />
        <p className="text-sm text-white/50 font-[family-name:var(--font-display)] uppercase tracking-[0.24em]">
          VS <span className="text-accent font-semibold">{opponentName}</span>
        </p>
        <motion.span
          key={countdown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent"
        >
          {countdown}
        </motion.span>
      </div>
    );
  }

  if (onlinePhase === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 min-h-[40vh]">
        <PlayZoneLogo size="md" />
        <p className="text-lg font-bold text-accent font-[family-name:var(--font-display)] uppercase tracking-[0.18em]">
          Your score: {myFinalScore}{unit}
        </p>
        <p className="text-sm text-white/50">Waiting for {opponentName} to finish...</p>
        <motion.div
          className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      </div>
    );
  }

  if (onlinePhase === "result") {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <PlayZoneLogo size="md" />
        <VSResult
          yourScore={myFinalScore}
          opponentScore={opponentFinalScore ?? 0}
          yourName={myNickname}
          opponentName={opponentName}
          unit={unit}
          lowerIsBetter={lowerIsBetter}
          onPlayAgain={resetOnline}
          onRematch={rematch}
        />
      </div>
    );
  }

  // Playing phase - render game with multiplayer hooks
  if (onlinePhase === "playing" && activeManager) {
    return (
      <>
        {/* Opponent score bar */}
        <div className="w-full max-w-lg mx-auto mb-2">
          <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2">
            <span className="text-xs text-white/40">
              <span className="text-red-400 font-semibold">{opponentName}</span>
            </span>
            <span className="text-sm font-bold text-red-400 font-mono tabular-nums">
              {opponentScore}{unit}
            </span>
          </div>
        </div>
        {children({
          phase: onlinePhase,
          manager: activeManager,
          opponentScore,
          onScoreUpdate: handleScoreUpdate,
          onGameFinished: handleGameFinished,
        })}
      </>
    );
  }

  return null;
}
