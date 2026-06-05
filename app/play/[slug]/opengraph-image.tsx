import { ImageResponse } from "next/og";
import { GAMES } from "@/lib/games";
import { getGameSeo } from "@/lib/seo";

export const runtime = "edge";
export const alt = "PlayZone game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-game color palette. Two hex stops per slug — Satori (Next/OG)
 * doesn't reliably parse Tailwind or oklch, so we bake in hex.
 * Stops chosen to mirror the gradient in lib/games.ts.
 */
const PALETTE: Record<string, { from: string; to: string; accent: string }> = {
  rizz:           { from: "#fb7185", to: "#fcd34d", accent: "#ff8a3d" },
  "six-seven":    { from: "#fb923c", to: "#dc2626", accent: "#ff8a3d" },
  "shadow-boxing":{ from: "#ef4444", to: "#9f1239", accent: "#ff8a3d" },
  "pose-off":     { from: "#a78bfa", to: "#3730a3", accent: "#ff8a3d" },
  "dont-smile":   { from: "#fde047", to: "#f97316", accent: "#ff8a3d" },
  jutsu:          { from: "#60a5fa", to: "#4c1d95", accent: "#ff8a3d" },
  mirror:         { from: "#e879f9", to: "#6d28d9", accent: "#ff8a3d" },
  "stare-off":    { from: "#475569", to: "#4c1d95", accent: "#ff8a3d" },
  "subway-run":   { from: "#bef264", to: "#059669", accent: "#ff8a3d" },
  "push-up":      { from: "#ef4444", to: "#f59e0b", accent: "#ff8a3d" },
};

export default async function OG({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) {
    return new ImageResponse(<div>PlayZone</div>, { ...size });
  }

  const seo = getGameSeo(game);
  const palette = PALETTE[slug] ?? { from: "#ff8a3d", to: "#dc2626", accent: "#ff8a3d" };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Dark scrim so text reads on bright gradients */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 100%)",
            display: "flex",
          }}
        />

        {/* Top row: PZ + LIVE pill */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.04em" }}>
            PZ · PLAYZONE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.16em",
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.35)",
              color: "#ffffff",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: palette.accent }} />
            LIVE
          </div>
        </div>

        {/* Game title (large) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 0.92,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 16,
            }}
          >
            {game.immersive.subtitle}
          </div>
          <div
            style={{
              fontSize: game.title.length > 12 ? 140 : 180,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#ffffff",
            }}
          >
            {game.title}
          </div>
        </div>

        {/* Bottom: description + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              maxWidth: "70%",
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {seo.description.split(".")[0]}.
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#ffffff",
            }}
          >
            playzone.live
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
