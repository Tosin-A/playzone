interface PlayZoneLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
} as const;

export default function PlayZoneLogo({ size = "md", className = "" }: PlayZoneLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center font-[family-name:var(--font-display)] font-bold uppercase tracking-[0.04em] leading-none select-none ${SIZE_MAP[size]} ${className}`}
      aria-label="PlayZone"
    >
      <span
        className="italic"
        style={{
          color: "white",
          textShadow: "0 1px 0 rgba(0,0,0,0.4), 0 0 18px rgba(255,255,255,0.08)",
          transform: "skewX(-8deg)",
          display: "inline-block",
        }}
      >
        PLAY
      </span>
      <span
        className="italic ml-1"
        style={{
          color: "var(--accent)",
          textShadow: "0 1px 0 rgba(0,0,0,0.5), 0 0 22px color-mix(in oklch, var(--accent) 55%, transparent)",
          transform: "skewX(-8deg)",
          display: "inline-block",
        }}
      >
        ZONE
      </span>
      <span
        aria-hidden
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-[55%] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklch, var(--accent) 80%, transparent), transparent)",
        }}
      />
    </div>
  );
}
