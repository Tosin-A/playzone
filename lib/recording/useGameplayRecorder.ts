"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DrawOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedMs: number,
) => void;

interface RecorderOptions {
  /** Video element to composite from. Required; the recording is locked to this element. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /**
   * Optional canvas to use instead of video — e.g. when face-blur mode is on
   * and the visible pixels live on a canvas rather than the raw video.
   */
  sourceCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /**
   * Optional callback that draws a HUD onto the recording canvas each frame.
   * Mirrors what the player sees so the captured clip carries score/timer
   * info without us having to rasterize the React DOM at 30fps.
   */
  drawOverlay?: DrawOverlay;
  /** Mirror the source horizontally — selfie cam default. */
  mirrored?: boolean;
  /** Recording FPS. Default 30. */
  fps?: number;
}

/**
 * Pick the best MediaRecorder mime type the current browser supports.
 * Order matters: MP4 first because iOS Safari only emits MP4, and when both
 * are supported MP4 plays back natively on every platform without re-encoding.
 */
function pickMimeType(): { type: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates: { type: string; ext: "mp4" | "webm" }[] = [
    { type: "video/mp4;codecs=h264,aac", ext: "mp4" },
    { type: "video/mp4;codecs=avc1.42E01E", ext: "mp4" },
    { type: "video/mp4", ext: "mp4" },
    { type: "video/webm;codecs=vp9", ext: "webm" },
    { type: "video/webm;codecs=vp8", ext: "webm" },
    { type: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.type)) return c;
  }
  return null;
}

export function useGameplayRecorder(opts: RecorderOptions) {
  const { videoRef, sourceCanvasRef, drawOverlay, mirrored = true, fps = 30 } = opts;

  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeExt, setMimeExt] = useState<"mp4" | "webm">("mp4");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  // drawOverlay is intentionally read through a ref so callers don't have to
  // memoize it — otherwise every render restarts the rAF loop.
  const drawOverlayRef = useRef(drawOverlay);
  useEffect(() => { drawOverlayRef.current = drawOverlay; }, [drawOverlay]);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    setError(null);
    setBlob(null);

    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("video-not-ready");
      return;
    }

    const mime = pickMimeType();
    if (!mime) {
      setError("recorder-unsupported");
      return;
    }
    setMimeExt(mime.ext);

    // Lock recording dimensions to the video's intrinsic size so the
    // captured aspect matches what the camera actually sees, regardless of
    // CSS object-fit cropping on the visible <video> element.
    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setError("canvas-unavailable");
      return;
    }

    // Composite loop: video frame → optional HUD callback → captured stream.
    // We render at the requested fps via a setInterval-style throttle on
    // rAF so the recorder doesn't capture stale frames when the tab is
    // backgrounded (rAF pauses, captureStream just stops emitting frames).
    const frameInterval = 1000 / fps;
    let lastDrawAt = 0;
    startTimeRef.current = performance.now();

    const draw = (now: number) => {
      if (!recorderRef.current) return;
      if (now - lastDrawAt >= frameInterval) {
        lastDrawAt = now;
        const elapsed = now - startTimeRef.current;
        ctx.save();
        if (mirrored) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        const sourceCanvas = sourceCanvasRef?.current;
        if (sourceCanvas && sourceCanvas.width > 0) {
          ctx.drawImage(sourceCanvas, 0, 0, w, h);
        } else {
          ctx.drawImage(video, 0, 0, w, h);
        }
        ctx.restore();
        // Overlay is drawn UN-mirrored — text/HUD must read normally even
        // though the camera image is mirrored.
        drawOverlayRef.current?.(ctx, w, h, elapsed);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: mime.type,
      videoBitsPerSecond: 4_000_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const finalBlob = new Blob(chunksRef.current, { type: mime.type });
      setBlob(finalBlob);
      setIsRecording(false);
      chunksRef.current = [];
      cancelAnimationFrame(rafRef.current);
      recorderRef.current = null;
      canvasRef.current = null;
    };

    recorderRef.current = recorder;
    recorder.start(1000); // 1s timeslices keep memory bounded for long games.
    setIsRecording(true);
    rafRef.current = requestAnimationFrame(draw);
  }, [videoRef, sourceCanvasRef, mirrored, fps]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "inactive") recorder.stop();
  }, []);

  // Tear down on unmount so a leftover recorder doesn't keep the camera
  // stream alive after navigating away.
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop, blob, isRecording, error, mimeExt };
}
