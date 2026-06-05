"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, processPoseFrame, ShadowBoxingState } from "./logic";
import CameraViewport from "@/components/shell/CameraViewport";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import { sfxPunch, sfxCombo, sfxTimerWarning, sfxTimesUp } from "@/lib/sfx";

const GAME_DURATION = 45000;

interface Props {
  opponentScore: number;
  onScoreUpdate: (score: number, extras?: Record<string, unknown>) => void;
  onGameFinished: (finalScore: number) => void;
}

export default function ShadowBoxingOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [state, setState] = useState<ShadowBoxingState>(createInitialState());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [punchFlash, setPunchFlash] = useState(0);
  const [timesUp, setTimesUp] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<ShadowBoxingState>(createInitialState());
  const startedRef = useRef(false);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onGameFinishedRef = useRef(onGameFinished);
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onGameFinishedRef.current = onGameFinished;
  });

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
        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

        if (elapsed >= GAME_DURATION) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = 0;
          setTimesUp(true);
          sfxTimesUp();
          const finalScore = stateRef.current.player1.score;
          setTimeout(() => onGameFinishedRef.current(finalScore), 1500);
          return;
        }

        const prevScore = stateRef.current.player1.score;
        let newState = stateRef.current;
        const video = videoRef.current;
        if (video && video.videoWidth > 0) {
          try {
            const poseResult = landmarker.detectForVideo(video, now);
            newState = processPoseFrame(poseResult, stateRef.current, now, 1);
            const prev = stateRef.current;
            stateRef.current = newState;
            if (
              newState.player1.score !== prev.player1.score ||
              newState.player1.punches !== prev.player1.punches ||
              newState.player1.currentCombo !== prev.player1.currentCombo ||
              newState.player1.speed !== prev.player1.speed
            ) {
              setState(newState);
            }
          } catch {
            /* skip frame */
          }
        }

        // Only broadcast when score actually changes
        if (newState.player1.score !== prevScore) {
          onScoreUpdateRef.current(newState.player1.score, {
            combo: newState.player1.currentCombo,
            bestCombo: newState.player1.bestCombo,
            speed: newState.player1.speed,
            dodges: newState.player1.dodges,
          });
          setPunchFlash((f) => f + 1);
          if (newState.player1.currentCombo >= 3) {
            sfxCombo(newState.player1.currentCombo);
          } else {
            sfxPunch();
          }
        }

        // Timer warning sounds at 10s and 5s
        const secs = Math.ceil((GAME_DURATION - elapsed) / 1000);
        const prevSecs = Math.ceil((GAME_DURATION - (elapsed - 16)) / 1000); // ~1 frame ago
        if ((secs === 10 || secs === 5) && prevSecs !== secs) {
          sfxTimerWarning();
        }

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream]);

  if (!stream) return null;

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        mirrored
        overlay={
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
            {/* TIME'S UP overlay */}
            <AnimatePresence>
              {timesUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
                >
                  <motion.span
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="text-5xl sm:text-6xl font-bold font-[family-name:var(--font-display)] text-accent uppercase"
                  >
                    Time&apos;s Up!
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Punch flash — full-screen border flash on hit */}
            <AnimatePresence>
              {punchFlash > 0 && (
                <motion.div
                  key={punchFlash}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 border-4 border-accent rounded-3xl z-10"
                />
              )}
            </AnimatePresence>

            {/* Combo banner */}
            <AnimatePresence>
              {state.player1.currentCombo >= 3 && (
                <motion.div
                  key="combo"
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-12 left-1/2 -translate-x-1/2 bg-accent/90 text-black px-4 py-1.5 rounded-full text-sm font-bold font-[family-name:var(--font-display)] uppercase z-10"
                >
                  {state.player1.currentCombo}x Combo!
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">{timeLeft}s</div>
            </div>
            <div className="flex justify-between items-end">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-xs font-bold text-accent">YOU</div>
                <motion.div key={state.player1.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-3xl font-bold font-[family-name:var(--font-display)] text-accent">
                  {state.player1.score}
                </motion.div>
                <div className="text-xs text-white/50 mt-1">{state.player1.punches} hits &middot; {state.player1.speed}/s</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-xs font-bold text-red-400">OPPONENT</div>
                <div className="text-3xl font-bold font-[family-name:var(--font-display)] text-red-400">{opponentScore}</div>
              </div>
            </div>
            {/* Lead indicator */}
            {(state.player1.score > 0 || opponentScore > 0) && (
              <div className="self-center pb-1">
                {(() => {
                  const diff = state.player1.score - opponentScore;
                  if (diff > 0) return <span className="text-xs font-bold text-accent/80">+{diff} ahead</span>;
                  if (diff < 0) return <span className="text-xs font-bold text-red-400/80">{diff} behind</span>;
                  return <span className="text-xs font-bold text-yellow-400/80">Tied</span>;
                })()}
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
