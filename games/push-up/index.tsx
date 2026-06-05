"use client";

import { getGameShareUrl } from "@/lib/share/url";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, PushUpState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import BackToResultsButton from "@/components/shell/BackToResultsButton";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import PushUpOnline from "./online";

type GamePhase = "ready" | "countdown" | "playing" | "result";
const GAME_DURATION = 30000; // 30 seconds

export default function PushUpGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell
        title="Push-Up Test"
        howToPlay="Prop your phone or laptop so the camera sees your face during a push-up. You have 30 seconds. Every clean rep counts — chest down, arms locked back up."
      >
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
    <GameShell
      title="Push-Up Test"
      howToPlay="Prop your phone or laptop so the camera sees your face during a push-up. You have 30 seconds. Every clean rep counts — chest down, arms locked back up. Half-reps don't count."
    >
      <OnlineGameWrapper
        gameSlug="push-up"
        gameName="Push-Up Test"
        renderSoloGame={() => <PushUpInner stream={stream} />}
      >
        {(props) => (
          <PushUpOnline
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

function PushUpInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<PushUpState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<PushUpState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    setShareImage(null);
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
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
      setTimeLeft(remaining);

      if (elapsed >= GAME_DURATION) {
        setPhase("result");
        const s = stateRef.current;
        generateShareCard({
          title: "Push-Up Test",
          score: s.count,
          subtitle: `${s.count} push-ups in 30s · ${s.tempo} reps/sec`,
          gameUrl: getGameShareUrl("push-up"),
        }).then(setShareImage);
        return;
      }

      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          const newState = processPoseFrame(result, stateRef.current, performance.now());
          stateRef.current = newState;
          setState(newState);
        } catch {
          /* skip frame */
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

  // state + shareImage intentionally preserved so BackToResultsButton can
  // re-render the share screen with the last round's score. startGame()
  // re-initialises both at the start of the next round.
  const reset = useCallback(() => {
    setPhase("ready");
  }, []);

  if (phase === "result") {
    return (
      <ShareScreen
        score={state.count}
        subtitle={`${state.count} push-ups in 30s · ${state.tempo} reps/sec`}
        shareImage={shareImage}
        gameUrl={getGameShareUrl("push-up")}
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
            <PushUpOverlay state={state} timeLeft={timeLeft} />
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
          <p className="text-sm text-white/55 text-center max-w-xs leading-snug">
            Set your phone on the floor or prop your laptop in front of you.
            Camera should see your face throughout. 30 seconds. Go hard.
          </p>
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Start"}
          </button>
          {shareImage && <BackToResultsButton onClick={() => setPhase("result")} />}
        </div>
      )}
    </>
  );
}

function PushUpOverlay({ state, timeLeft }: { state: PushUpState; timeLeft: number }) {
  const showCalibrating = !state.calibrated && state.framesSeen < 30;
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {timeLeft}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">
          {state.tempo} reps/s
        </div>
      </div>

      {/* Calibration hint */}
      {showCalibrating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="self-center bg-black/70 backdrop-blur-md rounded-2xl px-4 py-2 text-xs text-white/80"
        >
          Calibrating… do one full rep
        </motion.div>
      )}

      {/* Big counter */}
      <div className="self-center text-center">
        <motion.div
          key={state.count}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          className="text-8xl font-bold font-[family-name:var(--font-display)] text-accent drop-shadow-lg tabular-nums leading-none"
        >
          {state.count}
        </motion.div>
        <div className="mt-1 text-xs uppercase tracking-[0.3em] text-white/55">
          push-ups
        </div>
      </div>

      {/* Bottom: phase indicator */}
      <div className="flex justify-center">
        <div
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
            state.phase === "down"
              ? "bg-accent/80 text-black"
              : state.phase === "up"
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/40"
          }`}
        >
          {state.phase === "down" ? "▼ Down" : state.phase === "up" ? "▲ Up" : "—"}
        </div>
      </div>
    </div>
  );
}
