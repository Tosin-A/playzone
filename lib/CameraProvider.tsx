"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type PrivacyMode = "normal" | "face-blur";
export type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "error";

interface CameraContextValue {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string;
  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => void;
  /** Lazily request camera. Returns the stream (resolves immediately if already granted). */
  requestCamera: () => Promise<MediaStream | null>;
  /** Tear down the active stream. Used when leaving a game / on app close. */
  releaseCamera: () => void;
}

const CameraContext = createContext<CameraContextValue>({
  stream: null,
  status: "idle",
  error: "",
  privacyMode: "normal",
  setPrivacyMode: () => {},
  requestCamera: async () => null,
  releaseCamera: () => {},
});

export function CameraProvider({ children }: { children: ReactNode }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(() => {
    if (typeof window === "undefined") return "normal";
    const saved = localStorage.getItem("playzone-privacy");
    return saved === "face-blur" ? "face-blur" : "normal";
  });

  // Dedup concurrent requests
  const pendingRef = useRef<Promise<MediaStream | null> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current) return streamRef.current;
    if (pendingRef.current) return pendingRef.current;

    setStatus("requesting");
    setError("");

    pendingRef.current = (async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
          },
          audio: false,
        });

        // OS-level revocation (device unplug, browser settings change) drops
        // us back to denied so the gate can re-render and offer Try Again.
        mediaStream.getTracks().forEach((track) => {
          track.onended = () => {
            if (streamRef.current === mediaStream) {
              streamRef.current = null;
              setStream(null);
              setStatus("denied");
              setError("Camera was disconnected. Try again.");
            }
          };
        });

        setStream(mediaStream);
        setStatus("granted");
        return mediaStream;
      } catch (err) {
        setStatus("denied");
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setError("Camera access was denied. Allow camera access in your browser settings and try again.");
          } else if (err.name === "NotFoundError") {
            setError("No camera found. Connect a camera and try again.");
          } else {
            setError("Could not access camera. Try again.");
          }
        } else {
          setError("Could not access camera. Try again.");
        }
        return null;
      } finally {
        pendingRef.current = null;
      }
    })();

    return pendingRef.current;
  }, []);

  const releaseCamera = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      setStream(null);
      setStatus("idle");
    }
  }, []);

  // Release the webcam when the provider unmounts (route change away from
  // /play/*, tab close). Without this the camera LED stays on indefinitely.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const handleSetPrivacyMode = useCallback((mode: PrivacyMode) => {
    setPrivacyMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("playzone-privacy", mode);
    }
  }, []);

  return (
    <CameraContext.Provider
      value={{
        stream,
        status,
        error,
        privacyMode,
        setPrivacyMode: handleSetPrivacyMode,
        requestCamera,
        releaseCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  return useContext(CameraContext);
}
