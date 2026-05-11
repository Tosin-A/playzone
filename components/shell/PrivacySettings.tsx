"use client";

import { useCamera, PrivacyMode } from "@/lib/CameraProvider";

const MODES: { value: PrivacyMode; label: string }[] = [
  { value: "normal", label: "Off" },
  { value: "silhouette", label: "Silhouette" },
];

export default function PrivacySettings() {
  const { privacyMode, setPrivacyMode } = useCamera();

  return (
    <div className="flex gap-2">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setPrivacyMode(mode.value)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            privacyMode === mode.value
              ? "bg-accent text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
