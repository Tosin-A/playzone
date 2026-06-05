"use client";

import { getGameShareUrl } from "@/lib/share/url";

import { useState, useCallback, useRef, useEffect } from "react";
import { getFaceLandmarker } from "@/lib/cv/faceLandmarker";
import { createInitialState, processFrame, StareOffState, CHARACTERS } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import BackToResultsButton from "@/components/shell/BackToResultsButton";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import StareOffOnline from "./online";

type GamePhase = "select" | "countdown" | "playing" | "result";

export default function StareOffGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Stare Off" howToPlay="Hold eye contact with the character on screen. Don't blink too long or look away!">
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
    <GameShell title="Stare Off" howToPlay="Stare at the character without blinking or looking away. They'll try to psych you out. How long can you last?">
      <OnlineGameWrapper
        gameSlug="stare-off"
        gameName="Stare Off"
        unit="s"
        renderSoloGame={() => <StareOffInner stream={stream} />}
      >
        {(props) => (
          <StareOffOnline
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

function StareOffInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("select");
  const [countdown, setCountdown] = useState(3);
  const [, setSelectedCharacter] = useState(0);
  const [state, setState] = useState<StareOffState>(createInitialState(0));
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<StareOffState>(createInitialState(0));

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async (charIdx: number) => {
    setSelectedCharacter(charIdx);
    setModelLoading(true);
    await getFaceLandmarker();
    setModelLoading(false);

    setShareImage(null);
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPhase("playing");
    const now = performance.now();
    const initial = { ...createInitialState(charIdx), startTime: now, lastTauntTime: now };
    initial.currentTaunt = CHARACTERS[charIdx].taunts[0];
    setState(initial);
    stateRef.current = initial;

    const landmarker = await getFaceLandmarker();

    const runFrame = () => {
      const now = performance.now();
      const video = videoRef.current;
      let newState = stateRef.current;
      if (video && video.videoWidth > 0) {
        try {
          const faceResult = landmarker.detectForVideo(video, now);
          newState = processFrame(faceResult, stateRef.current, now);
          stateRef.current = newState;
          setState(newState);
        } catch {
          /* skip frame */
        }
      }

      if (newState.gameOver) {
        setPhase("result");
        const seconds = (newState.survivalTime / 1000).toFixed(1);
        const character = CHARACTERS[charIdx];
        const subtitle = newState.failReason === "blink"
          ? `You blinked! ${character.name} wins.`
          : `You looked away! ${character.name} wins.`;
        generateShareCard({
          title: "Stare Off",
          score: `${seconds}s`,
          subtitle,
          gameUrl: getGameShareUrl("stare-off"),
        }).then(setShareImage);
        return;
      }

      animFrameRef.current = requestAnimationFrame(runFrame);
    };

    animFrameRef.current = requestAnimationFrame(runFrame);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // state + shareImage preserved so the last result can be re-opened.
  // startGame() re-initialises both at the start of the next round.
  const reset = useCallback(() => {
    setPhase("select");
  }, []);

  if (phase === "result") {
    const seconds = (state.survivalTime / 1000).toFixed(1);
    const subtitle = state.failReason === "blink" ? "You blinked!" : "You looked away!";
    return (
      <ShareScreen
        score={`${seconds}s`}
        numericScore={state.survivalTime / 1000}
        subtitle={subtitle}
        shareImage={shareImage}
        gameUrl={getGameShareUrl("stare-off")}
        onPlayAgain={reset}
      />
    );
  }

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          phase === "playing" ? (
            <StareOverlay state={state} />
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

      {phase === "select" && (
        <div className="flex flex-col items-center gap-5">
          <p className="text-sm text-white/50">Choose your opponent</p>
          <div className="flex gap-3">
            {CHARACTERS.map((char, i) => (
              <button
                key={char.name}
                onClick={() => startGame(i)}
                disabled={modelLoading}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <span className="text-4xl">{char.emoji}</span>
                <span className="text-xs font-medium" style={{ color: char.color }}>
                  {char.name}
                </span>
              </button>
            ))}
          </div>
          {modelLoading && <p className="text-xs text-white/40">Loading model...</p>}
          {shareImage && <BackToResultsButton onClick={() => setPhase("result")} />}
        </div>
      )}
    </>
  );
}

function StareOverlay({ state }: { state: StareOffState }) {
  const character = CHARACTERS[state.characterIndex];
  // Scale increases with intensity
  const scale = 1 + state.intensity * 1.5;
  const seconds = (state.survivalTime / 1000).toFixed(1);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Timer + eye status */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {seconds}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="text-xs text-white/50">Eyes</span>
          <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${state.eyeOpenness * 100}%` }}
              transition={{ duration: 0.062 }}
            />
          </div>
        </div>
      </div>

      {/* Character face - zooms in over time */}
      <div className="self-center flex flex-col items-center gap-3">
        <motion.div
          animate={{ scale }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="text-6xl"
        >
          {character.emoji}
        </motion.div>

        {/* Taunt text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentTaunt}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 max-w-xs text-center"
          >
            <p className="text-sm" style={{ color: character.color }}>
              {state.currentTaunt}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Warning flash at high intensity */}
      {state.intensity > 0.7 && (
        <motion.div
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ repeat: Infinity, duration: 1.875 }}
          className="absolute inset-0 bg-red-500 pointer-events-none"
        />
      )}

      <div />
    </div>
  );
}
