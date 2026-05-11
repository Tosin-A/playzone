"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "@/lib/cv/faceLandmarker";
import { computeRizzScore, RizzScore, computeLiveScores, LiveScores } from "./logic";
import RizzOverlay from "./overlay";
import GameShell from "@/components/shell/GameShell";
import CameraViewport from "@/components/shell/CameraViewport";
import ShareScreen from "@/components/shell/ShareScreen";
import { generateShareCard } from "@/lib/recording/shareCard";
import { useCamera } from "@/lib/CameraProvider";

type GamePhase = "ready" | "scanning" | "result";

const SCAN_DURATION = 5000;

export default function RizzGame() {
  const { stream, status } = useCamera();

  if (status === "denied" || status === "error") {
    return (
      <GameShell
        title="Rizz Rater"
        howToPlay="Look at the camera and give your best look. The AI will rate your charisma from 0 to 100."
      >
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
          <p className="text-red-400">Camera access required to play. Enable it in browser settings.</p>
        </div>
      </GameShell>
    );
  }

  if (!stream) {
    return (
      <GameShell
        title="Rizz Rater"
        howToPlay="Look at the camera and give your best look. The AI will rate your charisma from 0 to 100."
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Rizz Rater"
      howToPlay="Look at the camera and give your best look. The AI will rate your charisma from 0 to 100 based on your smile, eye contact, head tilt, and jawline."
    >
      <RizzGameInner stream={stream} />
    </GameShell>
  );
}

function RizzGameInner({ stream }: { stream: MediaStream }) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [progress, setProgress] = useState(0);
  const [liveScores, setLiveScores] = useState<LiveScores>({ smile: 0, eyeContact: 0, headTilt: 0, jawline: 0 });
  const [result, setResult] = useState<RizzScore | null>(null);
  const [shareImage, setShareImage] = useState<Blob | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const framesRef = useRef<FaceLandmarkerResult[]>([]);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const startScan = useCallback(async () => {
    setModelLoading(true);
    const landmarker = await getFaceLandmarker();
    setModelLoading(false);

    setPhase("scanning");
    setProgress(0);
    setLiveScores({ smile: 0, eyeContact: 0, headTilt: 0, jawline: 0 });
    framesRef.current = [];
    startTimeRef.current = performance.now();

    const runFrame = () => {
      const video = videoRef.current;
      if (!video) return;

      const elapsed = performance.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / SCAN_DURATION) * 100);
      setProgress(pct);

      if (elapsed >= SCAN_DURATION) {
        const score = computeRizzScore(framesRef.current);
        setResult(score);
        setPhase("result");

        generateShareCard({
          title: "Rizz Rater",
          score: score.total,
          subtitle: score.oneLiner,
          gameUrl: "https://playzone-omega.vercel.app/play/rizz",
        }).then(setShareImage);
        return;
      }

      const faceResult = landmarker.detectForVideo(video, performance.now());
      if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
        framesRef.current.push(faceResult);
        // Update live scores
        const live = computeLiveScores(framesRef.current);
        setLiveScores(live);
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
    setProgress(0);
    setResult(null);
    setShareImage(null);
    setLiveScores({ smile: 0, eyeContact: 0, headTilt: 0, jawline: 0 });
  }, []);

  if (phase === "result" && result) {
    return (
      <ShareScreen
        score={result.total}
        subtitle={result.oneLiner}
        shareImage={shareImage}
        gameUrl="https://playzone-omega.vercel.app/play/rizz"
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
          phase === "scanning" ? (
            <RizzOverlay phase="scanning" progress={progress} liveScores={liveScores} />
          ) : undefined
        }
      />

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startScan}
            disabled={modelLoading}
            className="px-8 py-3.5 bg-accent text-black font-semibold rounded-2xl text-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {modelLoading ? "Loading model..." : "Rate My Rizz"}
          </button>
        </div>
      )}
    </>
  );
}
