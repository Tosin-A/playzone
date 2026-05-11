"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { extractNormalizedPose, comparePoses, TARGET_POSES_ONLINE } from "./logic-online";
import CameraViewport from "@/components/shell/CameraViewport";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import type { MultiplayerManager } from "@/lib/multiplayer";

const NUM_POSES = 5;
const POSE_DURATION = 5000; // 5 seconds per pose

interface Props {
  manager: MultiplayerManager;
  opponentScore: number;
  onScoreUpdate: (score: number) => void;
  onGameFinished: (finalScore: number) => void;
}

export default function MirrorOnline({ opponentScore, onScoreUpdate, onGameFinished }: Props) {
  const { stream } = useCamera();
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POSE_DURATION / 1000);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startedRef = useRef(false);
  const scoreRef = useRef(0);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  useEffect(() => {
    if (startedRef.current || !stream) return;
    startedRef.current = true;

    (async () => {
      const landmarker = await getPoseLandmarker();
      let poseIdx = 0;
      let poseStart = performance.now();
      let total = 0;
      let bestMatch = 0;

      const runFrame = () => {
        const video = videoRef.current;
        if (!video) return;

        const now = performance.now();
        const poseElapsed = now - poseStart;
        setTimeLeft(Math.max(0, Math.ceil((POSE_DURATION - poseElapsed) / 1000)));

        // Get current pose from user
        const poseResult = landmarker.detectForVideo(video, now);
        const userPose = extractNormalizedPose(poseResult);

        if (userPose) {
          const target = TARGET_POSES_ONLINE[poseIdx % TARGET_POSES_ONLINE.length];
          const similarity = comparePoses(target.pose, userPose);
          setMatchProgress(similarity);
          bestMatch = Math.max(bestMatch, similarity);
        }

        // Time's up for this pose
        if (poseElapsed >= POSE_DURATION) {
          total += bestMatch;
          scoreRef.current = total;
          setTotalScore(total);
          onScoreUpdate(total);

          poseIdx++;
          bestMatch = 0;
          setMatchProgress(0);
          setCurrentPoseIdx(poseIdx);

          if (poseIdx >= NUM_POSES) {
            const avgScore = Math.round(total / NUM_POSES);
            onGameFinished(avgScore);
            return;
          }

          poseStart = now;
        }

        animFrameRef.current = requestAnimationFrame(runFrame);
      };

      animFrameRef.current = requestAnimationFrame(runFrame);
    })();

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [stream, onScoreUpdate, onGameFinished]);

  if (!stream) return null;

  const currentTarget = TARGET_POSES_ONLINE[currentPoseIdx % TARGET_POSES_ONLINE.length];

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          currentPoseIdx < NUM_POSES ? (
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">{timeLeft}s</div>
                <div className="flex gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">You: {totalScore}</div>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm text-red-400">VS: {opponentScore}</div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentPoseIdx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="self-center bg-black/70 backdrop-blur-md rounded-3xl p-6 text-center">
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-accent">{currentTarget.name}</h2>
                  <p className="text-sm text-white/60 mt-1">{currentTarget.description}</p>
                  <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden w-48 mx-auto">
                    <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${matchProgress}%` }} transition={{ duration: 0.2 }} />
                  </div>
                  <p className="text-xs text-white/40 mt-2">{matchProgress}%</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2">
                {Array.from({ length: NUM_POSES }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < currentPoseIdx ? "bg-accent" : i === currentPoseIdx ? "bg-white/50 animate-pulse" : "bg-white/20"}`} />
                ))}
              </div>
            </div>
          ) : undefined
        }
      />
      <PrivacySettings />
    </>
  );
}
