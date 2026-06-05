"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, SixSevenState } from "./logic";
import CameraViewport from "@/components/shell/CameraViewport";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";
import type { MultiplayerManager } from "@/lib/multiplayer";

interface Props {
  manager: MultiplayerManager;
  opponentScore: number;
  onScoreUpdate: (score: number) => void;
  onGameFinished: (finalScore: number) => void;
}

const GAME_DURATION = 30000;

export default function SixSevenOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<SixSevenState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<SixSevenState>(createInitialState());
  const startedRef = useRef(false);
  const lastReportedRef = useRef(0);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    if (startedRef.current || !stream) return;
    startedRef.current = true;

    (async () => {
      const landmarker = await getPoseLandmarker();
      const initial = createInitialState();
      stateRef.current = initial;
      setState(initial);
      startTimeRef.current = performance.now();

      const runFrame = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
        setTimeLeft(remaining);

        if (elapsed >= GAME_DURATION) {
          onGameFinished(stateRef.current.count);
          return;
        }

        const video = videoRef.current;
        if (video && video.videoWidth > 0) {
          try {
            const poseResult = landmarker.detectForVideo(video, performance.now());
            const newState = processPoseFrame(poseResult, stateRef.current, performance.now());
            stateRef.current = newState;
            setState(newState);
            if (newState.count !== lastReportedRef.current) {
              lastReportedRef.current = newState.count;
              onScoreUpdate(newState.count);
            }
          } catch {
            /* skip frame */
          }
        }

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream, onScoreUpdate, onGameFinished]);

  if (!stream) return null;

  const qualityHint =
    state.detectionQuality === "none"
      ? { label: "No pose detected", color: "bg-red-500/80" }
      : state.detectionQuality === "head-only"
      ? { label: "Selfie mode", color: "bg-amber-500/80" }
      : { label: "Full body", color: "bg-emerald-500/80" };

  return (
    <CameraViewport
      stream={stream}
      onVideoReady={handleVideoReady}
      overlay={
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
              {timeLeft}s
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums text-red-400">
                VS: {opponentScore}
              </div>
              <div className={`${qualityHint.color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider`}>
                {qualityHint.label}
              </div>
            </div>
          </div>

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
      }
    />
  );
}
