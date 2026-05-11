"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type PrivacyMode = "normal" | "silhouette" | "skeleton" | "blur";

interface CameraContextValue {
  stream: MediaStream | null;
  status: "requesting" | "granted" | "denied" | "error";
  error: string;
  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => void;
}

const CameraContext = createContext<CameraContextValue>({
  stream: null,
  status: "requesting",
  error: "",
  privacyMode: "normal",
  setPrivacyMode: () => {},
});

export function CameraProvider({ children }: { children: ReactNode }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraContextValue["status"]>("requesting");
  const [error, setError] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(() => {
    if (typeof window === "undefined") return "normal";
    const saved = localStorage.getItem("playzone-privacy");
    return saved && ["normal", "silhouette", "skeleton", "blur"].includes(saved)
      ? (saved as PrivacyMode)
      : "normal";
  });

  useEffect(() => {
    let cancelled = false;

    async function requestCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
          },
          audio: false,
        });
        if (!cancelled) {
          setStream(mediaStream);
          setStatus("granted");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("denied");
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
    }

    requestCamera();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSetPrivacyMode = useCallback((mode: PrivacyMode) => {
    setPrivacyMode(mode);
    localStorage.setItem("playzone-privacy", mode);
  }, []);

  return (
    <CameraContext.Provider
      value={{ stream, status, error, privacyMode, setPrivacyMode: handleSetPrivacyMode }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  return useContext(CameraContext);
}
