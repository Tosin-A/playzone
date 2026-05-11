"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processFrame, JutsuState, JUTSUS } from "./logic";
import CameraViewport from "@/components/shell/CameraViewport";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import type { MultiplayerManager } from "@/lib/multiplayer";

const GAME_DURATION = 30000;

interface Props {
  manager: MultiplayerManager;
  opponentScore: number;
  onScoreUpdate: (score: number) => void;
  onGameFinished: (finalScore: number) => void;
}

export default function JutsuOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<JutsuState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<JutsuState>(createInitialState());
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
      const initial = createInitialState();
      initial.startTime = now;
      stateRef.current = initial;
      startTimeRef.current = now;

      const runFrame = () => {
        const video = videoRef.current;
        if (!video) return;

        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

        if (elapsed >= GAME_DURATION) {
          onGameFinished(stateRef.current.score);
          return;
        }

        const poseResult = landmarker.detectForVideo(video, now);
        const newState = processFrame(poseResult, stateRef.current, now);
        stateRef.current = newState;
        setState(newState);
        onScoreUpdate(newState.score);

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
        overlay={
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">{timeLeft}s</div>
              <div className="flex gap-2">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-bold text-accent">{state.score} pts</div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-bold text-red-400">VS {opponentScore}</div>
              </div>
            </div>

            {state.combo > 1 && (
              <motion.div key={state.combo} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-14 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-xl">
                <span className="text-xs font-bold text-yellow-400">{state.combo}x COMBO</span>
              </motion.div>
            )}

            <AnimatePresence>
              {state.activeEffects.map((effect) => {
                const jutsu = JUTSUS.find((j) => j.type === effect.type)!;
                return (
                  <motion.div
                    key={effect.id}
                    initial={{ scale: 0.3, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute w-24 h-24 -ml-12 -mt-12 rounded-full"
                    style={{
                      left: `${effect.x * 100}%`,
                      top: `${effect.y * 100}%`,
                      background: `radial-gradient(circle, ${jutsu.chakraColor}80 0%, transparent 70%)`,
                      boxShadow: `0 0 40px ${jutsu.chakraColor}60`,
                    }}
                  />
                );
              })}
            </AnimatePresence>

            {state.lastJutsu && (
              <motion.div key={state.totalJutsus} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }} transition={{ duration: 1.25 }} className="absolute bottom-20 left-0 right-0 text-center">
                <span className="text-lg font-bold font-[family-name:var(--font-display)] uppercase" style={{ color: JUTSUS.find((j) => j.type === state.lastJutsu)?.chakraColor }}>
                  {JUTSUS.find((j) => j.type === state.lastJutsu)?.name}
                </span>
              </motion.div>
            )}
          </div>
        }
      />
      <PrivacySettings />
    </>
  );
}
