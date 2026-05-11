"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, ShadowBoxingState } from "./logic";
import CameraViewport from "@/components/shell/CameraViewport";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";
import type { MultiplayerManager } from "@/lib/multiplayer";

const GAME_DURATION = 45000;

interface Props {
  manager: MultiplayerManager;
  opponentScore: number;
  onScoreUpdate: (score: number) => void;
  onGameFinished: (finalScore: number) => void;
}

export default function ShadowBoxingOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<ShadowBoxingState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<ShadowBoxingState>(createInitialState());
  const startedRef = useRef(false);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    if (startedRef.current || !stream) return;
    startedRef.current = true;

    (async () => {
      const landmarker = await getPoseLandmarker();
      startTimeRef.current = performance.now();

      const runFrame = () => {
        const video = videoRef.current;
        if (!video) return;

        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

        if (elapsed >= GAME_DURATION) {
          const punches = stateRef.current.player1.punches;
          onGameFinished(punches);
          return;
        }

        const poseResult = landmarker.detectForVideo(video, now);
        const newState = processPoseFrame(poseResult, stateRef.current, now);
        stateRef.current = newState;
        setState(newState);

        // Broadcast score (player 1 punches = your punches in online mode)
        onScoreUpdate(newState.player1.punches);

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream, onScoreUpdate, onGameFinished]);

  if (!stream) return null;

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        mirrored={false}
        overlay={
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">{timeLeft}s</div>
            </div>
            <div className="flex justify-between items-end">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-xs font-bold text-accent">YOU</div>
                <motion.div key={state.player1.punches} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl font-bold font-[family-name:var(--font-display)] text-accent">
                  {state.player1.punches}
                </motion.div>
                <div className="text-xs text-white/50 mt-1">Speed: {state.player1.speed}/s</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-xs font-bold text-red-400">OPPONENT</div>
                <div className="text-3xl font-bold font-[family-name:var(--font-display)] text-red-400">{opponentScore}</div>
              </div>
            </div>
          </div>
        }
      />
      <PrivacySettings />
    </>
  );
}
