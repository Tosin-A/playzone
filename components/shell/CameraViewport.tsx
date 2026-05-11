"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { useCamera } from "@/lib/CameraProvider";
import { getFaceLandmarker } from "@/lib/cv/faceLandmarker";
import { getPoseLandmarker } from "@/lib/cv/poseLandmarker";

interface CameraViewportProps {
  stream: MediaStream;
  overlay?: ReactNode;
  mirrored?: boolean;
  onVideoReady?: (video: HTMLVideoElement) => void;
}

export default function CameraViewport({
  stream,
  overlay,
  mirrored = true,
  onVideoReady,
}: CameraViewportProps) {
  const { privacyMode, setPrivacyMode } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  const [debugMode] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug")
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.onloadeddata = () => {
      video.play();
      onVideoReady?.(video);
    };
    return () => {
      video.srcObject = null;
    };
  }, [stream, onVideoReady]);

  // Silhouette rendering (orange theme)
  useEffect(() => {
    if (privacyMode !== "silhouette") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animFrame: number;

    const render = () => {
      if (!video.videoWidth) {
        animFrame = requestAnimationFrame(render);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 180) {
          // Person → orange (#f97316)
          data[i] = 249;
          data[i + 1] = 115;
          data[i + 2] = 22;
          data[i + 3] = 255;
        } else {
          // Background → near-black
          data[i] = 10;
          data[i + 1] = 10;
          data[i + 2] = 10;
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [privacyMode]);

  // Debug landmark overlay (?debug=1 in URL)
  useEffect(() => {
    if (!debugMode) return;

    const video = videoRef.current;
    const canvas = debugCanvasRef.current;
    if (!video || !canvas) return;

    let animFrame: number;
    let faceDetector: Awaited<ReturnType<typeof getFaceLandmarker>> | null = null;
    let poseDetector: Awaited<ReturnType<typeof getPoseLandmarker>> | null = null;

    getFaceLandmarker().then((fl) => { faceDetector = fl; });
    getPoseLandmarker().then((pl) => { poseDetector = pl; });

    const draw = () => {
      if (!video.videoWidth) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const now = performance.now();

      if (faceDetector) {
        try {
          const result = faceDetector.detectForVideo(video, now);
          ctx.fillStyle = "#00ff88";
          for (const face of result.faceLandmarks ?? []) {
            for (const lm of face) {
              ctx.beginPath();
              ctx.arc(lm.x * w, lm.y * h, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } catch { /* timestamp conflict with game loop — skip frame */ }
      }

      if (poseDetector) {
        try {
          const result = poseDetector.detectForVideo(video, now + 0.05);
          ctx.fillStyle = "#ff6b35";
          for (const pose of result.landmarks ?? []) {
            for (const lm of pose) {
              ctx.beginPath();
              ctx.arc(lm.x * w, lm.y * h, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } catch { /* skip frame */ }
      }

      ctx.fillStyle = "rgba(0,255,136,0.7)";
      ctx.font = "bold 12px monospace";
      ctx.fillText("DEBUG: landmarks", 8, 18);

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, [debugMode]);

  const showCanvas = privacyMode === "silhouette";

  return (
    <div className="relative w-full max-w-[1200px] aspect-[3/4] sm:aspect-[4/5] md:aspect-video max-h-[80vh] rounded-3xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""} ${showCanvas ? "invisible" : ""}`}
      />
      {showCanvas && (
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""}`}
        />
      )}
      {debugMode && (
        <canvas
          ref={debugCanvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${mirrored ? "scale-x-[-1]" : ""}`}
        />
      )}
      {overlay && (
        <div className="absolute inset-0 pointer-events-none">{overlay}</div>
      )}

      {/* Privacy toggle — always accessible in the viewport corner */}
      <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
        <button
          onClick={() => setPrivacyMode("normal")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm ${
            privacyMode === "normal"
              ? "bg-white/20 text-white"
              : "bg-black/30 text-white/50 hover:bg-black/50 hover:text-white/70"
          }`}
        >
          Off
        </button>
        <button
          onClick={() => setPrivacyMode("silhouette")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm ${
            privacyMode === "silhouette"
              ? "bg-orange-500/80 text-white"
              : "bg-black/30 text-white/50 hover:bg-black/50 hover:text-white/70"
          }`}
        >
          Silhouette
        </button>
      </div>
    </div>
  );
}
