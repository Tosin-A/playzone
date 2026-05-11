"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getFaceLandmarker } from "@/lib/cv/faceLandmarker";
import { createInitialState, processFrame, DontSmileState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";

type GamePhase = "ready" | "countdown" | "playing" | "result";
const GAME_DURATION = 60000; // 60 seconds max

// Provocations shown during game to make the player smile
const PROVOCATIONS = [
  "Think about that one time you embarrassed yourself...",
  "Your crush just texted back 😏",
  "Imagine stepping on a wet sock right now",
  "Remember that voice memo you accidentally sent?",
  "Your mom just found your search history",
  "That thing you did in 2019? Yeah, we all remember.",
  "Plot twist: your front camera was on the whole time",
  "Someone's watching you try not to smile right now",
  "You look like you're holding in a sneeze",
  "Quick — think of the funniest meme you've ever seen",
  "Your ex just liked your story from 47 weeks ago",
  "Imagine explaining TikTok to your grandparents",
  "You just realized you've been on mute the whole meeting",
  "The WiFi password is 'askthewaiter' and you already asked twice",
  "Someone just sent 'we need to talk' with no context",
];

export default function DontSmileGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Don't Smile" howToPlay="Keep a straight face for 60 seconds while we try to make you laugh. One smile and it's over!">
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
    <GameShell title="Don't Smile" howToPlay="Keep a straight face for 60 seconds. The AI tracks your mouth — if you smile, you lose. Don't cover your face either!">
      <DontSmileInner stream={stream} />
    </GameShell>
  );
}

function DontSmileInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<DontSmileState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [provocation, setProvocation] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<DontSmileState>(createInitialState());
  const provocationRef = useRef<number>(0);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getFaceLandmarker();
    setModelLoading(false);

    setPhase("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPhase("playing");
    const now = performance.now();
    const initial = { ...createInitialState(), startTime: now, lastFaceTime: now };
    setState(initial);
    stateRef.current = initial;
    setProvocation(PROVOCATIONS[0]);

    const landmarker = await getFaceLandmarker();

    const runFrame = () => {
      const video = videoRef.current;
      if (!video) return;

      const now = performance.now();
      const elapsed = now - stateRef.current.startTime;
      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

      // Cycle provocations every 4 seconds
      const provIdx = Math.floor(elapsed / 4000) % PROVOCATIONS.length;
      if (provIdx !== provocationRef.current) {
        provocationRef.current = provIdx;
        setProvocation(PROVOCATIONS[provIdx]);
      }

      // Won! Survived 60 seconds
      if (elapsed >= GAME_DURATION) {
        const finalState = { ...stateRef.current, survivalTime: GAME_DURATION, gameOver: true };
        stateRef.current = finalState;
        setState(finalState);
        setPhase("result");
        generateShareCard({
          title: "Don't Smile",
          score: "60.0s",
          subtitle: "Stone cold. Never cracked.",
          gameUrl: "playzone.app/play/dont-smile",
        }).then(setShareImage);
        return;
      }

      const faceResult = landmarker.detectForVideo(video, now);
      const newState = processFrame(faceResult, stateRef.current, now);
      stateRef.current = newState;
      setState(newState);

      if (newState.gameOver) {
        setPhase("result");
        const seconds = (newState.survivalTime / 1000).toFixed(1);
        const subtitle = newState.failReason === "smile"
          ? "You cracked! 😂"
          : "Face not detected — nice try hiding!";
        generateShareCard({
          title: "Don't Smile",
          score: `${seconds}s`,
          subtitle,
          gameUrl: "playzone.app/play/dont-smile",
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

  const reset = useCallback(() => {
    setPhase("ready");
    setState(createInitialState());
    stateRef.current = createInitialState();
    setTimeLeft(GAME_DURATION / 1000);
    setShareImage(null);
    setProvocation("");
  }, []);

  if (phase === "result") {
    const seconds = (state.survivalTime / 1000).toFixed(1);
    const subtitle = state.failReason === "smile"
      ? "You smiled! 😂"
      : state.failReason === "no-face"
      ? "No hiding allowed!"
      : "Stone cold. 60 seconds.";
    return (
      <ShareScreen
        score={`${seconds}s`}
        subtitle={subtitle}
        shareImage={shareImage}
        gameUrl="https://playzone.app/play/dont-smile"
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
            <DontSmileOverlay
              timeLeft={timeLeft}
              smileIntensity={state.smileIntensity}
              provocation={provocation}
            />
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
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "I Won't Smile"}
          </button>
          <PrivacySettings />
        </div>
      )}
    </>
  );
}

function DontSmileOverlay({
  timeLeft,
  smileIntensity,
  provocation,
}: {
  timeLeft: number;
  smileIntensity: number;
  provocation: string;
}) {
  // Danger level based on how close to smiling
  const dangerColor = smileIntensity > 0.25 ? "#ff4444" : smileIntensity > 0.15 ? "#ffcc00" : "#00ff88";

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Timer */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {timeLeft}s
        </div>
        {/* Smile danger meter */}
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="text-xs text-white/50">😐</span>
          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: dangerColor }}
              animate={{ width: `${Math.min(100, smileIntensity * 285)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-xs text-white/50">😁</span>
        </div>
      </div>

      {/* Provocation text */}
      <motion.div
        key={provocation}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="self-center bg-black/70 backdrop-blur-md rounded-2xl px-5 py-3 max-w-xs text-center"
      >
        <p className="text-sm text-white/80">{provocation}</p>
      </motion.div>

      <div />
    </div>
  );
}
