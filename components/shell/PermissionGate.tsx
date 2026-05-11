"use client";

import { useState, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";

type PermissionState = "idle" | "requesting" | "granted" | "denied";

interface PermissionGateProps {
  children: (stream: MediaStream) => ReactNode;
}

export default function PermissionGate({ children }: PermissionGateProps) {
  const [state, setState] = useState<PermissionState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");

  const requestCamera = useCallback(async () => {
    setState("requesting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setState("granted");
    } catch (err) {
      setState("denied");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please connect a camera and try again.");
        } else {
          setError("Could not access camera. Please try again.");
        }
      } else {
        setError("Could not access camera. Please try again.");
      }
    }
  }, []);

  if (state === "granted" && stream) {
    return <>{children(stream)}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-6 p-8 text-center min-h-[60vh]"
    >
      {/* Camera icon — pulses during "requesting" state to show
          the browser permission prompt is pending.             */}
      <div
        className={`w-20 h-20 rounded-full bg-white/5 flex items-center justify-center ${
          state === "requesting" ? "camera-scanning" : ""
        }`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-accent"
        >
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      {state === "denied" ? (
        <>
          <p className="text-red-400 max-w-sm">{error}</p>
          <button
            onClick={requestCamera}
            className="px-6 py-3 bg-white/10 rounded-2xl text-foreground font-medium hover:bg-white/15 active:scale-[0.97] transition-all duration-300"
          >
            Try Again
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-display)]">
            Camera Required
          </h2>
          <p className="text-white/60 max-w-sm">
            This game uses your webcam. Video never leaves your device — all
            processing happens in your browser.
          </p>
          <button
            onClick={requestCamera}
            disabled={state === "requesting"}
            className="px-6 py-3 bg-accent text-black font-semibold rounded-2xl hover:bg-accent-dim active:scale-[0.97] transition-all duration-300 disabled:opacity-50"
          >
            {state === "requesting" ? "Requesting..." : "Enable Camera"}
          </button>
        </>
      )}
    </motion.div>
  );
}
