"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";
import { createInitialState, extractNormalizedPose, comparePoses, MirrorState, NormalizedPose } from "./logic";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import PrivacySettings from "@/components/shell/PrivacySettings";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";
import { motion } from "framer-motion";
import OnlineGameWrapper from "@/components/shell/OnlineGameWrapper";
import MirrorOnline from "./online";

type GamePhase = "ready" | "p1-pose" | "p1-countdown" | "p2-match" | "round-result" | "final-result";
const MATCH_DURATION = 3000; // 3 seconds to match

export default function MirrorGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || !stream) {
    return (
      <GameShell title="Mirror Match" howToPlay="Player 1 strikes a pose, Player 2 copies it. Score based on similarity!">
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
    <GameShell title="Mirror Match" howToPlay="Player 1: strike a pose and hold it. Player 2: you have 3 seconds to copy the pose as closely as possible. 5 rounds, highest total score wins!">
      <OnlineGameWrapper
        gameSlug="mirror"
        gameName="Mirror Match"
        unit="%"
        renderSoloGame={() => <MirrorInner stream={stream} />}
      >
        {(props) => (
          <MirrorOnline
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

function MirrorInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [state, setState] = useState<MirrorState>(createInitialState());
  const [countdown, setCountdown] = useState(3);
  const [matchTimeLeft, setMatchTimeLeft] = useState(3);
  const [roundScore, setRoundScore] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [shareImage, setShareImage] = useState<Blob | null>(null);
  const [liveMatch, setLiveMatch] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const targetPoseRef = useRef<NormalizedPose | null>(null);
  const stateRef = useRef<MirrorState>(createInitialState());

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startGame = useCallback(async () => {
    setModelLoading(true);
    await getPoseLandmarker();
    setModelLoading(false);

    const initial = createInitialState(5);
    setState(initial);
    stateRef.current = initial;
    setPhase("p1-pose");
  }, []);

  const captureP1Pose = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Countdown before capture
    setPhase("p1-countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Capture pose
    const landmarker = await getPoseLandmarker();
    const result = landmarker.detectForVideo(video, performance.now());
    const pose = extractNormalizedPose(result);

    if (!pose) {
      // No pose detected, retry
      setPhase("p1-pose");
      return;
    }

    targetPoseRef.current = pose;
    stateRef.current = { ...stateRef.current, targetPose: pose };
    setState(stateRef.current);

    // Now P2 matches
    setPhase("p2-match");
    setLiveMatch(0);
    const matchStart = performance.now();

    const runMatch = () => {
      const now = performance.now();
      const elapsed = now - matchStart;
      setMatchTimeLeft(Math.max(0, Math.ceil((MATCH_DURATION - elapsed) / 1000)));

      if (elapsed >= MATCH_DURATION) {
        // Score final pose
        const finalResult = landmarker.detectForVideo(video, now);
        const finalPose = extractNormalizedPose(finalResult);
        const score = finalPose && targetPoseRef.current ? comparePoses(targetPoseRef.current, finalPose) : 0;

        setRoundScore(score);
        const newScores = [...stateRef.current.roundScores, score];
        stateRef.current = {
          ...stateRef.current,
          roundScores: newScores,
          score: newScores.reduce((a, b) => a + b, 0),
          currentRound: stateRef.current.currentRound + 1,
        };
        setState(stateRef.current);
        setPhase("round-result");
        return;
      }

      // Live matching feedback
      const liveResult = landmarker.detectForVideo(video, now);
      const livePose = extractNormalizedPose(liveResult);
      if (livePose && targetPoseRef.current) {
        const liveSimilarity = comparePoses(targetPoseRef.current, livePose);
        setLiveMatch(liveSimilarity);
      }

      animFrameRef.current = requestAnimationFrame(runMatch);
    };

    animFrameRef.current = requestAnimationFrame(runMatch);
  }, []);

  const nextRound = useCallback(() => {
    if (stateRef.current.currentRound > stateRef.current.totalRounds) {
      setPhase("final-result");
      const totalScore = stateRef.current.score;
      const avg = Math.round(totalScore / stateRef.current.totalRounds);
      generateShareCard({
        title: "Mirror Match",
        score: totalScore,
        subtitle: `${avg}/100 avg across ${stateRef.current.totalRounds} rounds`,
        gameUrl: "playzone.app/play/mirror",
      }).then(setShareImage);
    } else {
      setPhase("p1-pose");
      targetPoseRef.current = null;
      setLiveMatch(0);
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("ready");
    setState(createInitialState());
    stateRef.current = createInitialState();
    targetPoseRef.current = null;
    setShareImage(null);
    setLiveMatch(0);
    setRoundScore(0);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (phase === "final-result") {
    const avg = Math.round(state.score / state.totalRounds);
    return (
      <ShareScreen
        score={state.score}
        subtitle={`${avg}/100 average similarity`}
        shareImage={shareImage}
        gameUrl="https://playzone.app/play/mirror"
        onPlayAgain={reset}
      />
    );
  }

  return (
    <>
      <CameraViewport
        stream={stream}
        onVideoReady={handleVideoReady}
        overlay={
          phase === "p2-match" ? (
            <MatchOverlay timeLeft={matchTimeLeft} matchProgress={liveMatch} round={state.currentRound} totalRounds={state.totalRounds} />
          ) : phase === "p1-countdown" ? (
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
          ) : phase === "round-result" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/70 backdrop-blur-md rounded-3xl p-8 text-center"
              >
                <div className="text-5xl font-bold font-[family-name:var(--font-display)] text-accent">{roundScore}</div>
                <div className="text-sm text-white/50 mt-2">/ 100 similarity</div>
              </motion.div>
            </div>
          ) : undefined
        }
      />

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-white/50 text-center max-w-xs">
            Two players, one camera. Take turns posing and copying!
          </p>
          <button
            onClick={startGame}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading..." : "Start Match"}
          </button>
          <PrivacySettings />
        </div>
      )}

      {phase === "p1-pose" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-white/70">
            <span className="text-accent font-bold">Player 1:</span> Strike a pose and hold it!
          </p>
          <p className="text-xs text-white/40">Round {state.currentRound} of {state.totalRounds}</p>
          <button
            onClick={captureP1Pose}
            className="px-6 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim transition-colors"
          >
            Capture Pose
          </button>
        </div>
      )}

      {phase === "round-result" && (
        <button
          onClick={nextRound}
          className="px-6 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim transition-colors"
        >
          {state.currentRound > state.totalRounds ? "See Results" : "Next Round"}
        </button>
      )}
    </>
  );
}

function MatchOverlay({ timeLeft, matchProgress, round, totalRounds }: { timeLeft: number; matchProgress: number; round: number; totalRounds: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
          {timeLeft}s
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm">
          Round {round}/{totalRounds}
        </div>
      </div>

      <div className="self-center bg-black/70 backdrop-blur-md rounded-2xl p-5 text-center">
        <p className="text-sm text-white/60 mb-2">Player 2: Copy the pose!</p>
        <div className="text-4xl font-bold font-[family-name:var(--font-display)] text-accent">
          {matchProgress}%
        </div>
        <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden w-40 mx-auto">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${matchProgress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      <div />
    </div>
  );
}
