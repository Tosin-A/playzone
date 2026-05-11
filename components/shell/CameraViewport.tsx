"use client";

import { useRef, useEffect, ReactNode } from "react";
import { useCamera } from "@/lib/CameraProvider";

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
  const { privacyMode } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Privacy filter rendering
  useEffect(() => {
    if (privacyMode === "normal") return;

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

      if (privacyMode === "blur") {
        ctx.filter = "blur(20px)";
        ctx.drawImage(video, 0, 0);
        ctx.filter = "none";
      } else if (privacyMode === "silhouette") {
        // Draw video to extract shape, then fill with solid color
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Convert to silhouette: dark pixels become accent, light becomes background
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness < 180) {
            // Person (darker area) → accent green
            data[i] = 0;
            data[i + 1] = 255;
            data[i + 2] = 136;
            data[i + 3] = 255;
          } else {
            // Background → dark
            data[i] = 10;
            data[i + 1] = 10;
            data[i + 2] = 10;
            data[i + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (privacyMode === "skeleton") {
        // Simple edge detection for wireframe look
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const out = new Uint8ClampedArray(data.length);
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const idxLeft = (y * w + (x - 1)) * 4;
            const idxRight = (y * w + (x + 1)) * 4;
            const idxUp = ((y - 1) * w + x) * 4;
            const idxDown = ((y + 1) * w + x) * 4;

            const gx = Math.abs(
              (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) -
              (data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2])
            );
            const gy = Math.abs(
              (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) -
              (data[idxUp] + data[idxUp + 1] + data[idxUp + 2])
            );
            const edge = Math.min(255, gx + gy);

            out[idx] = 0;
            out[idx + 1] = edge > 30 ? Math.min(255, edge * 2) : 0;
            out[idx + 2] = edge > 30 ? Math.min(136, edge) : 0;
            out[idx + 3] = 255;
          }
        }
        ctx.putImageData(new ImageData(out, w, canvas.height), 0, 0);
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [privacyMode]);

  const showCanvas = privacyMode !== "normal";

  return (
    <div className="relative w-full aspect-[9/16] md:aspect-video max-h-[70vh] rounded-3xl overflow-hidden bg-black">
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
      {overlay && (
        <div className="absolute inset-0 pointer-events-none">{overlay}</div>
      )}
    </div>
  );
}
