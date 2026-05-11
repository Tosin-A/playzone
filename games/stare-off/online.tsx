"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getFaceLandmarker } from "@/lib/cv/faceLandmarker";
import { createInitialState, processFrame, StareOffState, CHARACTERS } from "./logic";
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

export default function StareOffOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<StareOffState>(createInitialState(0));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<StareOffState>(createInitialState(0));
  const startedRef = useRef(false);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    if (startedRef.current || !stream) return;
    startedRef.current = true;

    (async () => {
      const landmarker = await getFaceLandmarker();
      const now = performance.now();
      const initial = { ...createInitialState(0), startTime: now, lastTauntTime: now };
      initial.currentTaunt = CHARACTERS[0].taunts[0];
      stateRef.current = initial;

      const runFrame = () => {
        const video = videoRef.current;
        if (!video) return;

        const now = performance.now();
        const faceResult = landmarker.detectForVideo(video, now);
        const newState = processFrame(faceResult, stateRef.current, now);
        stateRef.current = newState;
        setState(newState);

        // Broadcast survival time as score (in tenths of seconds)
        const survivalTenths = Math.round(newState.survivalTime / 100);
        onScoreUpdate(survivalTenths);

        if (newState.gameOver) {
          const survivalSec = Math.round(newState.survivalTime / 100) / 10;
          onGameFinished(survivalSec);
          return;
        }

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream, onScoreUpdate, onGameFinished]);

  if (!stream) return null;

  const character = CHARACTERS[0];
  const scale = 1 + state.intensity * 1.5;
  const seconds = (state.survivalTime / 1000).toFixed(1);
  const opponentSec = (opponentScore / 10).toFixed(1);

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">You: {seconds}s</div>
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums text-red-400">VS: {opponentSec}s</div>
            </div>

            <div className="self-center flex flex-col items-center gap-3">
              <motion.div animate={{ scale }} transition={{ duration: 2.5, ease: "easeOut" }} className="text-6xl">
                {character.emoji}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={state.currentTaunt} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 max-w-xs text-center">
                  <p className="text-sm" style={{ color: character.color }}>{state.currentTaunt}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {state.intensity > 0.7 && (
              <motion.div animate={{ opacity: [0, 0.1, 0] }} transition={{ repeat: Infinity, duration: 1.875 }} className="absolute inset-0 bg-red-500 pointer-events-none" />
            )}

            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 self-center">
              <span className="text-xs text-white/50">Eyes</span>
              <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${state.eyeOpenness * 100}%` }} transition={{ duration: 0.062 }} />
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}
