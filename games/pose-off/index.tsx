"use client";

import { getGameShareUrl } from "@/lib/share/url";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, checkPoseMatch, getCurrentTargetPose, PoseOffState } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion, AnimatePresence } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import PoseOffOnline from "./online";

type GamePhase = "ready" | "countdown" | "playing" | "result";

export default function PoseOffGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Pose-Off" howToPlay="Match the poses on screen as fast as you can! The faster you match all poses, the better your score.">
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
    <GameShell title="Pose-Off" howToPlay="Match the poses shown on screen as fast as possible. Complete all 6 poses in the fastest time to win!">
      <OnlineGameWrapper
        gameSlug="pose-off"
        gameName="Pose-Off"
        unit="s"
        lowerIsBetter
        renderSoloGame={() => <PoseOffInner stream={stream} />}
      >
        {(props) => (
          <PoseOffOnline
            manager={props.manager}
            opponentScore={props.opponentScore}
            onScoreUpdate={props.onScoreUpdate}
            onGameFinished={props.onGameFinished}
          />
        )}
      </OnlineGameWrapper>
    </GameShell>
  );
}

function PoseOffInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<PoseOffState>(createInitialState());
  const [elapsed, setElapsed] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<PoseOffState>(createInitialState());

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
    const initial = createInitialState(6);
    const now = performance.now();
    initial.startTime = now;
    initial.poseStartTime = now;
    setState(initial);
    stateRef.current = initial;

    const landmarker = await getPoseLandmarker();

    const runFrame = () => {
      const video = videoRef.current;
      if (!video) return;

      const now = performance.now();
      setElapsed(now - stateRef.current.startTime);

      const poseResult = landmarker.detectForVideo(video, now);
      const newState = checkPoseMatch(poseResult, stateRef.current, now);
      stateRef.current = newState;
      setState(newState);

      if (newState.finished) {
        setPhase("result");
        const totalSec = (newState.totalTime / 1000).toFixed(1);
        generateShareCard({
          title: "Pose-Off",
          score: `${totalSec}s`,
          subtitle: `${newState.posesCompleted} poses matched`,
          gameUrl: getGameShareUrl("pose-off"),
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
    setElapsed(0);
    setShareImage(null);
  }, []);

  if (phase === "result") {
    const totalSec = (state.totalTime / 1000).toFixed(1);
    return (
      <ShareScreen
        score={`${totalSec}s`}
        numericScore={state.totalTime / 1000}
        higherIsBetter={false}
        subtitle={`${state.posesCompleted} poses in ${totalSec} seconds`}
        shareImage={shareImage}
        gameUrl={getGameShareUrl("pose-off")}
        onPlayAgain={reset}
      />
    );
  }

  const currentPose = getCurrentTargetPose(state);

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          phase === "playing" && currentPose ? (
            <PoseOffOverlay
              poseName={currentPose.name}
              poseDescription={currentPose.description}
              matchProgress={state.matchProgress}
              posesCompleted={state.posesCompleted}
              totalPoses={state.totalPoses}
              elapsed={elapsed}
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
            {modelLoading ? "Loading..." : "Start Pose-Off"}
          </button>
        </div>
      )}
    </>
  );
}

function PoseOffOverlay({
  poseName,
  poseDescription,
  matchProgress,
  posesCompleted,
  totalPoses,
  elapsed,
}: {
  poseName: string;
  poseDescription: string;
  matchProgress: number;
  posesCompleted: number;
  totalPoses: number;
  elapsed: number;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Top: timer and progress */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {(elapsed / 1000).toFixed(1)}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">
          {posesCompleted}/{totalPoses}
        </div>
      </div>

      {/* Center: target pose */}
      <AnimatePresence mode="wait">
        <motion.div
          key={poseName}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="self-center bg-black/70 backdrop-blur-md rounded-3xl p-6 text-center"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-accent">
            {poseName}
          </h2>
          <p className="text-sm text-white/60 mt-1">{poseDescription}</p>

          {/* Match progress bar */}
          <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden w-48 mx-auto">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: matchProgress >= 100 ? "#00ff88" : matchProgress > 50 ? "#ffcc00" : "#ff4444",
              }}
              animate={{ width: `${matchProgress}%` }}
              transition={{ duration: 0.188 }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">{matchProgress}% matched</p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom: pose dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPoses }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < posesCompleted ? "bg-accent" : i === posesCompleted ? "bg-white/50 animate-pulse" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
