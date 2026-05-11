"use client";

import { useCamera, PrivacyMode } from "@/lib/CameraProvider";

const MODES: { value: PrivacyMode; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Full camera feed" },
  { value: "blur", label: "Blur", description: "Heavy blur effect" },
  { value: "silhouette", label: "Silhouette", description: "Colored outline only" },
  { value: "skeleton", label: "Wireframe", description: "Edge detection only" },
];

export default function PrivacySettings() {
  const { privacyMode, setPrivacyMode } = useCamera();

  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setPrivacyMode(mode.value)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            privacyMode === mode.value
              ? "bg-accent text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
          title={mode.description}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
