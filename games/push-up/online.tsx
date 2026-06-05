"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, PushUpState } from "./logic";
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

export default function PushUpOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<PushUpState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<PushUpState>(createInitialState());
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
            const result = landmarker.detectForVideo(video, performance.now());
            const newState = processPoseFrame(result, stateRef.current, performance.now());
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

  const showCalibrating = !state.calibrated && state.framesSeen < 30;

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
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums text-red-400">
              VS: {opponentScore}
            </div>
          </div>

          {showCalibrating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="self-center bg-black/70 backdrop-blur-md rounded-2xl px-4 py-2 text-xs text-white/80"
            >
              Calibrating… do one full rep
            </motion.div>
          )}

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
      }
    />
  );
}
