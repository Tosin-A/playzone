"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processInput, gameStep, getScore, SubwayRunState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";

type GamePhase = "ready" | "countdown" | "playing" | "result";

export default function SubwayRunGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Subway Run" howToPlay="Control the runner with your body! Lean to change lanes, jump to hop barriers, crouch to dodge overheads.">
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
    <GameShell title="Subway Run" howToPlay="Lean left/right to switch lanes. Jump (raise hips) to clear barriers. Crouch (lower hips) to dodge overheads. How far can you go?">
      <SubwayRunInner stream={stream} />
    </GameShell>
  );
}

function SubwayRunInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<SubwayRunState>(createInitialState());
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<SubwayRunState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    setPhase("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPhase("playing");
    const initial = createInitialState();
    setState(initial);
    stateRef.current = initial;

    const landmarker = await getPoseLandmarker();

    const runFrame = () => {
      const video = videoRef.current;
      if (!video) return;

      const now = performance.now();

      // Process pose input
      const poseResult = landmarker.detectForVideo(video, now);
      let s = processInput(poseResult, stateRef.current);

      // Game physics step
      s = gameStep(s, now);
      stateRef.current = s;
      setState(s);

      // Render game
      renderGame(canvasRef.current, s);

      if (!s.alive) {
        setPhase("result");
        const score = getScore(s);
        generateShareCard({
          title: "Subway Run",
          score,
          subtitle: `Ran ${score}m before wiping out`,
          gameUrl: "playzone.app/play/subway-run",
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
    setShareImage(null);
  }, []);

  if (phase === "result") {
    const score = getScore(state);
    return (
      <ShareScreen
        score={`${score}m`}
        subtitle="Wipeout!"
        shareImage={shareImage}
        gameUrl="https://playzone.app/play/subway-run"
        onPlayAgain={reset}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Game canvas - shown during play */}
      <div className="relative w-full max-w-lg aspect-[16/9] rounded-2xl overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          width={600}
          height={340}
          className="w-full h-full"
        />
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <motion.span
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-bold font-[family-name:var(--font-display)] text-accent"
            >
              {countdown}
            </motion.span>
          </div>
        )}
        {phase === "playing" && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-xl text-sm font-mono tabular-nums text-accent">
            {getScore(state)}m
          </div>
        )}
      </div>

      {/* Camera feed - small in corner during play */}
      {phase === "playing" ? (
        <div className="w-32 h-24 rounded-xl overflow-hidden border border-white/10">
          <CameraViewport stream={stream} onVideoReady={handleVideoReady} />
        </div>
      ) : (
        <CameraViewport stream={stream} onVideoReady={handleVideoReady} />
      )}

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Run!"}
          </button>
          <PrivacySettings />
        </div>
      )}
    </div>
  );
}

function renderGame(canvas: HTMLCanvasElement | null, state: SubwayRunState) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // Clear
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = "#16213e";
  ctx.fillRect(0, H - 80, W, 80);

  // Lane lines
  const laneWidth = 80;
  const laneStart = 40;
  ctx.strokeStyle = "#ffffff15";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    const x = laneStart + i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, H - 80);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Scrolling ground markers
  const offset = state.distance % 40;
  ctx.fillStyle = "#ffffff08";
  for (let i = -1; i < 16; i++) {
    ctx.fillRect(i * 40 - offset, H - 40, 20, 3);
  }

  // Obstacles
  for (const obs of state.obstacles) {
    const ox = obs.x;
    const oy = H - 80;
    const olx = laneStart + obs.lane * laneWidth + 10;

    if (obs.type === "barrier") {
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(olx, oy - obs.height, obs.width, obs.height);
      // Stripes
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(olx, oy - obs.height, obs.width, 6);
    } else if (obs.type === "overhead") {
      ctx.fillStyle = "#4444ff";
      ctx.fillRect(olx, oy - 70, obs.width, obs.height);
      // Warning sign
      ctx.fillStyle = "#ffcc00";
      ctx.font = "10px monospace";
      ctx.fillText("LOW", olx + 15, oy - 55);
    }
    // Position indicator line from obstacle
    if (ox > 0 && ox < W) {
      ctx.strokeStyle = "#ffffff10";
      ctx.beginPath();
      ctx.moveTo(olx + obs.width / 2, oy);
      ctx.lineTo(olx + obs.width / 2, oy - 5);
      ctx.stroke();
    }
  }

  // Player
  const playerX = laneStart + state.lane * laneWidth + 20;
  const playerBottom = H - 80 - state.jumpY;
  const playerHeight = state.crouching ? 25 : 50;

  // Shadow
  ctx.fillStyle = "#00000040";
  ctx.beginPath();
  ctx.ellipse(playerX + 15, H - 78, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(playerX, playerBottom - playerHeight, 30, playerHeight);

  // Head
  ctx.beginPath();
  ctx.arc(playerX + 15, playerBottom - playerHeight - 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#00ff88";
  ctx.fill();

  // Action indicator
  if (state.action === "jump") {
    ctx.fillStyle = "#00ff8880";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("↑", playerX + 10, playerBottom - playerHeight - 25);
  } else if (state.action === "crouch") {
    ctx.fillStyle = "#ffcc0080";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("↓", playerX + 10, playerBottom + 15);
  }

  // Speed indicator
  ctx.fillStyle = "#ffffff40";
  ctx.font = "11px monospace";
  ctx.fillText(`${state.speed.toFixed(1)}x`, 10, 20);
}
