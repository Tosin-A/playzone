import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PlayZone — Ten games. One webcam.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
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
          background:
            "radial-gradient(ellipse 80% 60% at 8% 95%, rgba(255,138,61,0.30) 0%, transparent 65%), #0c0d10",
          color: "#f4f1ec",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em" }}>PZ</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "#ff8a3d",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff8a3d" }} />
            LIVE NOW
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.86 }}>
          <div
            style={{
              fontSize: 220,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "transparent",
              WebkitTextStroke: "4px #f4f1ec",
            }}
          >
            PLAY
          </div>
          <div
            style={{
              fontSize: 220,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#ff8a3d",
            }}
          >
            ZONE
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(244,241,236,0.55)",
          }}
        >
          <div>Ten games · One webcam · No download</div>
          <div style={{ color: "#ff8a3d" }}>play67.co.uk</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
