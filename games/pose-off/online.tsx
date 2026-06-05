"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, checkPoseMatch, getCurrentTargetPose, PoseOffState } from "./logic";
import CameraViewport from "@/components/shell/CameraViewport";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import type { MultiplayerManager } from "@/lib/multiplayer";

interface Props {
  manager: MultiplayerManager;
  opponentScore: number;
  onScoreUpdate: (score: number) => void;
  onGameFinished: (finalScore: number) => void;
}

export default function PoseOffOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<PoseOffState>(createInitialState());
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<PoseOffState>(createInitialState());
  const startedRef = useRef(false);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    if (startedRef.current || !stream) return;
    startedRef.current = true;

    (async () => {
      const landmarker = await getPoseLandmarker();
      const now = performance.now();
      const initial = createInitialState(6);
      initial.startTime = now;
      initial.poseStartTime = now;
      stateRef.current = initial;

      const runFrame = () => {
        const now = performance.now();
        setElapsed(now - stateRef.current.startTime);

        const video = videoRef.current;
        let newState = stateRef.current;
        if (video && video.videoWidth > 0) {
          try {
            const poseResult = landmarker.detectForVideo(video, now);
            newState = checkPoseMatch(poseResult, stateRef.current, now);
            stateRef.current = newState;
            setState(newState);
            onScoreUpdate(newState.posesCompleted);
          } catch {
            /* skip frame */
          }
        }

        if (newState.finished) {
          const totalSec = Math.round(newState.totalTime / 100) / 10;
          onGameFinished(totalSec);
          return;
        }

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream, onScoreUpdate, onGameFinished]);

  if (!stream) return null;

  const currentPose = getCurrentTargetPose(state);

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          currentPose ? (
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">{(elapsed / 1000).toFixed(1)}s</div>
                <div className="flex gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">You: {state.posesCompleted}/{state.totalPoses}</div>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm text-red-400">VS: {opponentScore}/{state.totalPoses}</div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentPose.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="self-center bg-black/70 backdrop-blur-md rounded-3xl p-6 text-center">
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-accent">{currentPose.name}</h2>
                  <p className="text-sm text-white/60 mt-1">{currentPose.description}</p>
                  <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden w-48 mx-auto">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: state.matchProgress >= 100 ? "#00ff88" : state.matchProgress > 50 ? "#ffcc00" : "#ff4444" }} animate={{ width: `${state.matchProgress}%` }} transition={{ duration: 0.188 }} />
                  </div>
                  <p className="text-xs text-white/40 mt-2">{state.matchProgress}% matched</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2">
                {Array.from({ length: state.totalPoses }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < state.posesCompleted ? "bg-accent" : i === state.posesCompleted ? "bg-white/50 animate-pulse" : "bg-white/20"}`} />
                ))}
              </div>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
