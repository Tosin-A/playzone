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

    let cancelled = false;
    let readySignalled = false;
    const signalReady = () => {
      if (cancelled || readySignalled) return;
      // Require non-zero dimensions — MediaPipe throws on a video
      // that exists but hasn't decoded its first frame yet.
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        readySignalled = true;
        onVideoReady?.(video);
      }
    };

    video.srcObject = stream;
    // iOS Safari quirk: for MediaStream srcObjects, `loadeddata` fires
    // unreliably and often only AFTER play() resolves — exactly the
    // chicken-and-egg we used to have. `loadedmetadata` + `playing` +
    // a one-frame polling fallback covers every mobile browser.
    video.addEventListener("loadedmetadata", signalReady);
    video.addEventListener("loadeddata", signalReady);
    video.addEventListener("playing", signalReady);

    // Try to play. The promise can reject on iOS if autoplay is
    // restricted; we ignore the rejection because the user gesture
    // that triggered the game start already satisfies autoplay policy.
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // If autoplay was blocked, the user gesture will fire it.
      });
    }

    // Belt-and-braces polling fallback: every 100ms check dimensions
    // and signal ready when we get them. Stops as soon as we succeed.
    const pollId = window.setInterval(signalReady, 100);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      video.removeEventListener("loadedmetadata", signalReady);
      video.removeEventListener("loadeddata", signalReady);
      video.removeEventListener("playing", signalReady);
      video.srcObject = null;
    };
  }, [stream, onVideoReady]);

  // Face-blur rendering: detect face bbox via shared MediaPipe singleton
  // and mosaic that region. While the detector is warming up (or in a
  // timestamp-conflict frame), the whole frame is blurred so the face
  // never shows unblurred. lastBbox is cached so a single missed frame
  // doesn't reveal anything.
  useEffect(() => {
    if (privacyMode !== "face-blur") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let cancelled = false;
    let detector: Awaited<ReturnType<typeof getFaceLandmarker>> | null = null;
    let lastBbox: { x: number; y: number; w: number; h: number } | null = null;
    let frameCount = 0;

    const mosaic = document.createElement("canvas");
    const mosaicCtx = mosaic.getContext("2d");

    getFaceLandmarker().then((d) => { if (!cancelled) detector = d; });

    const render = () => {
      if (!video.videoWidth) {
        animFrame = requestAnimationFrame(render);
        return;
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;

      // Detect every 2nd frame to reduce contention with the game's own
      // face-landmark consumer (shared MediaPipe instance throws on
      // timestamp collision).
      if (detector && frameCount % 2 === 0) {
        try {
          const result = detector.detectForVideo(video, performance.now());
          const face = result.faceLandmarks?.[0];
          if (face && face.length > 0) {
            let minX = 1, minY = 1, maxX = 0, maxY = 0;
            for (const lm of face) {
              if (lm.x < minX) minX = lm.x;
              if (lm.x > maxX) maxX = lm.x;
              if (lm.y < minY) minY = lm.y;
              if (lm.y > maxY) maxY = lm.y;
            }
            // Asymmetric padding: face landmarker bbox is just the skin
            // region. Hairline (top), ears (sides), jaw shape (bottom)
            // all leak identity, so we pad generously and bias the top
            // to swallow hair.
            const fw = (maxX - minX) * w;
            const fh = (maxY - minY) * h;
            const padX = fw * 0.5;
            const padTop = fh * 0.85;
            const padBot = fh * 0.45;
            const x = Math.max(0, minX * w - padX);
            const y = Math.max(0, minY * h - padTop);
            lastBbox = {
              x,
              y,
              w: Math.min(w - x, fw + padX * 2),
              h: Math.min(h - y, fh + padTop + padBot),
            };
          }
        } catch { /* timestamp conflict with game loop — keep last bbox */ }
      }
      frameCount++;

      if (lastBbox && mosaicCtx) {
        // Targeted obfuscation: draw raw video, then chunky-mosaic the
        // face bbox AND smear the mosaic with a blur filter so identifying
        // structure (eye spacing, jaw angle, hair edge) can't be recovered.
        ctx.filter = "none";
        ctx.drawImage(video, 0, 0, w, h);
        const { x, y, w: bw, h: bh } = lastBbox;
        // ~40x downsample for chunky pixels resistant to upscale-deblur.
        const scale = 0.025;
        const tw = Math.max(1, Math.floor(bw * scale));
        const th = Math.max(1, Math.floor(bh * scale));
        mosaic.width = tw;
        mosaic.height = th;
        mosaicCtx.drawImage(video, x, y, bw, bh, 0, 0, tw, th);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.filter = "blur(16px)";
        ctx.drawImage(mosaic, 0, 0, tw, th, x, y, bw, bh);
        ctx.restore();
      } else {
        // Detector hasn't seeded a bbox yet — blur the whole frame so
        // the face is never exposed during warm-up.
        ctx.filter = "blur(40px)";
        ctx.drawImage(video, 0, 0, w, h);
        ctx.filter = "none";
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrame);
    };
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

  const showCanvas = privacyMode === "face-blur";

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
          onClick={() => setPrivacyMode("face-blur")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm ${
            privacyMode === "face-blur"
              ? "bg-white/30 text-white"
              : "bg-black/30 text-white/50 hover:bg-black/50 hover:text-white/70"
          }`}
        >
          Blur
        </button>
      </div>
    </div>
  );
}
