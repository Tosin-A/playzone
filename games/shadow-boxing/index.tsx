"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, ShadowBoxingState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import ShadowBoxingOnline from "./online";

type GamePhase = "ready" | "countdown" | "playing" | "result";
const GAME_DURATION = 45000; // 45 seconds

export default function ShadowBoxingGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Shadow Boxing" howToPlay="Two players face the camera. Throw punches, dodge attacks. Most punches landed wins!">
        <div className="flex items-center justify-center min-h-[60vh]">
          {status === "denied" ? (
            <p className="text-red-400">Camera access required.</p>
          ) : (
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Shadow Boxing" howToPlay="Two players face the camera. Throw punches to score, alternate hands for combos. Dodge by moving your head. 45 seconds — most punches wins!">
      <OnlineGameWrapper
        gameSlug="shadow-boxing"
        gameName="Shadow Boxing"
        unit=" punches"
        renderSoloGame={() => <ShadowBoxingInner stream={stream} />}
      >
        {(props) => (
          <ShadowBoxingOnline
            manager={props.manager}
            opponentScore={props.opponentScore}
            onScoreUpdate={props.onScoreUpdate}
            onGameFinished={props.onGameFinished}
          />
        )}
      </OnlineGameWrapper>
    </GameShell>
  );
}

function ShadowBoxingInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<ShadowBoxingState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<ShadowBoxingState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    setPhase("countdown");
    setCountdown(3);
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPhase("playing");
    const initial = createInitialState();
    setState(initial);
    stateRef.current = initial;
    startTimeRef.current = performance.now();

    const landmarker = await getPoseLandmarker();

    const runFrame = () => {
      const video = videoRef.current;
      if (!video) return;

      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
      setTimeLeft(remaining);

      if (elapsed >= GAME_DURATION) {
        setPhase("result");
        const s = stateRef.current;
        const winner = s.player1.punches > s.player2.punches ? "Player 1" : s.player2.punches > s.player1.punches ? "Player 2" : "Tie";
        generateShareCard({
          title: "Shadow Boxing",
          score: `${s.player1.punches} - ${s.player2.punches}`,
          subtitle: `${winner} wins! • Best combo: ${Math.max(s.player1.bestCombo, s.player2.bestCombo)}`,
          gameUrl: "https://playzone-omega.vercel.app/play/shadow-boxing",
        }).then(setShareImage);
        return;
      }

      const poseResult = landmarker.detectForVideo(video, performance.now());
      const newState = processPoseFrame(poseResult, stateRef.current, performance.now());
      stateRef.current = newState;
      setState(newState);

      animFrameRef.current = requestAnimationFrame(runFrame);
    };

    animFrameRef.current = requestAnimationFrame(runFrame);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setPhase("ready");
    setState(createInitialState());
    stateRef.current = createInitialState();
    setTimeLeft(GAME_DURATION / 1000);
    setShareImage(null);
  }, []);

  if (phase === "result") {
    const winner = state.player1.punches > state.player2.punches ? "Player 1 wins!" : state.player2.punches > state.player1.punches ? "Player 2 wins!" : "It's a tie!";
    return (
      <ShareScreen
        score={`${state.player1.punches} - ${state.player2.punches}`}
        numericScore={Math.max(state.player1.punches, state.player2.punches)}
        subtitle={winner}
        shareImage={shareImage}
        gameUrl="https://playzone-omega.vercel.app/play/shadow-boxing"
        onPlayAgain={reset}
      />
    );
  }

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        mirrored={false}
        overlay={
          phase === "playing" ? (
            <BoxingOverlay state={state} timeLeft={timeLeft} />
          ) : phase === "countdown" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent"
              >
                {countdown}
              </motion.span>
            </div>
          ) : undefined
        }
      />

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-white/50 text-center max-w-xs">
            Both players stand in front of the camera. Throw punches and dodge!
          </p>
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Fight!"}
          </button>
        </div>
      )}
    </>
  );
}

function BoxingOverlay({ state, timeLeft }: { state: ShadowBoxingState; timeLeft: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Timer */}
      <div className="self-center bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-xl text-sm font-mono tabular-nums">
        {timeLeft}s
      </div>

      {/* Player stats - split screen */}
      <div className="flex justify-between items-end">
        <PlayerHUD player={state.player1} label="P1" color="#00ff88" />
        <PlayerHUD player={state.player2} label="P2" color="#ff6688" />
      </div>
    </div>
  );
}

function PlayerHUD({ player, label, color }: { player: ShadowBoxingState["player1"]; label: string; color: string }) {
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 min-w-[120px]">
      <div className="text-xs font-bold mb-1" style={{ color }}>{label}</div>
      <motion.div
        key={player.punches}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-3xl font-bold font-[family-name:var(--font-display)]"
        style={{ color }}
      >
        {player.punches}
      </motion.div>
      <div className="text-xs text-white/50 mt-1 space-y-0.5">
        <div>Combo: {player.currentCombo}</div>
        <div>Speed: {player.speed}/s</div>
        <div>Dodges: {player.dodges}</div>
      </div>
    </div>
  );
}
