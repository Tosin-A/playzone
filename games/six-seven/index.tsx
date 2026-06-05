"use client";

import { getGameShareUrl } from "@/lib/share/url";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, SixSevenState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";

type GamePhase = "ready" | "countdown" | "playing" | "result";
const GAME_DURATION = 30000; // 30 seconds

export default function SixSevenGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="6/7" howToPlay="Raise each hand alternately as fast as you can for 30 seconds. The count only goes up when you switch hands properly.">
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
    <GameShell title="6/7" howToPlay="Raise each hand alternately as fast as you can for 30 seconds. The viral TikTok workout — how many can you get?">
      <SixSevenInner stream={stream} />
    </GameShell>
  );
}

function SixSevenInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<SixSevenState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<SixSevenState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    // Countdown
    setPhase("countdown");
    setCountdown(3);
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Start playing
    setPhase("playing");
    const initial = createInitialState();
    setState(initial);
    stateRef.current = initial;
    startTimeRef.current = performance.now();

    const landmarker = await getPoseLandmarker();

    const runFrame = () => {
      // Tick the timer first — independent of CV so the loop stays
      // alive on mobile while the video element finishes decoding.
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
      setTimeLeft(remaining);

      if (elapsed >= GAME_DURATION) {
        setPhase("result");
        generateShareCard({
          title: "6/7 Challenge",
          score: stateRef.current.count,
          subtitle: `${stateRef.current.tempo} reps/sec • ${stateRef.current.bestStreak} best streak`,
          gameUrl: getGameShareUrl("six-seven"),
        }).then(setShareImage);
        return;
      }

      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        try {
          const poseResult = landmarker.detectForVideo(video, performance.now());
          const newState = processPoseFrame(poseResult, stateRef.current, performance.now());
          stateRef.current = newState;
          setState(newState);
        } catch {
          /* skip frame on detector error — loop continues */
        }
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

  const reset = useCallback(() => {
    setPhase("ready");
    setState(createInitialState());
    stateRef.current = createInitialState();
    setTimeLeft(GAME_DURATION / 1000);
    setShareImage(null);
  }, []);

  if (phase === "result") {
    return (
      <ShareScreen
        score={state.count}
        subtitle={`${state.tempo} reps/sec • Best streak: ${state.bestStreak}`}
        shareImage={shareImage}
        gameUrl={getGameShareUrl("six-seven")}
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
            <SixSevenOverlay state={state} timeLeft={timeLeft} />
          ) : phase === "countdown" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
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
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Start Challenge"}
          </button>
        </div>
      )}
    </>
  );
}

function SixSevenOverlay({ state, timeLeft }: { state: SixSevenState; timeLeft: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Timer */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {timeLeft}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">
          {state.tempo} reps/s
        </div>
      </div>

      {/* Big counter */}
      <div className="self-center">
        <motion.div
          key={state.count}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-7xl font-bold font-[family-name:var(--font-display)] text-accent drop-shadow-lg"
        >
          {state.count}
        </motion.div>
      </div>

      {/* Hand indicators */}
      <div className="flex justify-between px-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
          state.isLeftUp ? "bg-accent/80 scale-110" : "bg-white/10"
        }`}>
          L
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50">streak</span>
          <span className="text-lg font-bold">{state.streak}</span>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
          state.isRightUp ? "bg-accent/80 scale-110" : "bg-white/10"
        }`}>
          R
        </div>
      </div>
    </div>
  );
}
