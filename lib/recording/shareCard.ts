import { drawQR, generateQR } from "./qr";

interface ShareCardOptions {
  title: string;
  score: number | string;
  subtitle?: string;
  gameUrl: string;
  format?: "story" | "feed";
}

/**
 * Brand palette mirrors app/globals.css.
 * Hex equivalents of the oklch tokens (computed once, baked in
 * because canvas2d color parsing rejects oklch in many browsers).
 */
const BRAND = {
  bg: "#0c0d10",
  bgEdge: "#16100a",
  surface: "#191510",
  accent: "#ff8a3d",       // ≈ oklch(0.82 0.22 50)
  accentDim: "#e57632",    // ≈ oklch(0.72 0.22 50)
  ink: "#f4f1ec",
  inkDim: "rgba(244,241,236,0.55)",
  inkFaint: "rgba(244,241,236,0.30)",
};

export async function generateShareCard(options: ShareCardOptions): Promise<Blob> {
  const { title, score, subtitle, gameUrl, format = "story" } = options;

  const width = 1080;
  const height = format === "story" ? 1920 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // ── Background: deep base with orange bloom in lower-left ──
  ctx.fillStyle = BRAND.bg;
  ctx.fillRect(0, 0, width, height);

  // Radial bloom matching landing hero
  const bloom = ctx.createRadialGradient(
    width * 0.08, height * 0.78, 50,
    width * 0.08, height * 0.78, width * 0.9,
  );
  bloom.addColorStop(0, "rgba(255, 138, 61, 0.22)");
  bloom.addColorStop(0.45, "rgba(255, 138, 61, 0.05)");
  bloom.addColorStop(1, "rgba(255, 138, 61, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);

  // Subtle vignette
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.4,
    width / 2, height / 2, height * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // ── Dot grid texture ──
  ctx.fillStyle = "rgba(244,241,236,0.06)";
  const dotSpacing = 56;
  for (let y = dotSpacing; y < height; y += dotSpacing) {
    for (let x = dotSpacing; x < width; x += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Top bar: PZ wordmark + LIVE pill ──
  ctx.fillStyle = BRAND.ink;
  ctx.font = "900 64px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("PZ", 80, 140);

  // Live dot
  ctx.fillStyle = BRAND.accent;
  ctx.beginPath();
  ctx.arc(width - 230, 124, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = BRAND.accent;
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "700 22px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("PLAYZONE · LIVE", width - 210, 132);

  // ── Game title (small caps top label) ──
  ctx.fillStyle = BRAND.inkDim;
  ctx.font = "700 32px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "0.3em";
  const upper = title.toUpperCase();
  ctx.fillText(spaced(upper), width / 2, 360);

  // ── Big score ──
  const scoreStr = String(score);
  ctx.fillStyle = BRAND.accent;
  // Auto-fit: shrink font for long score strings
  const baseScoreSize = scoreStr.length > 6 ? 360 : 480;
  ctx.font = `900 ${baseScoreSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.shadowColor = "rgba(255, 138, 61, 0.45)";
  ctx.shadowBlur = 80;
  ctx.fillText(scoreStr, width / 2, 360 + 80 + baseScoreSize * 0.78);
  ctx.shadowBlur = 0;

  // ── Subtitle ──
  if (subtitle) {
    ctx.fillStyle = BRAND.ink;
    ctx.font = "500 40px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillText(subtitle, width / 2, 360 + 80 + baseScoreSize * 0.78 + 90);
  }

  // ── Bottom block: CTA + QR + URL ──
  const bottomY = height - 380;

  // Headline CTA
  ctx.fillStyle = BRAND.ink;
  ctx.font = "900 64px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("CAN YOU BEAT ME?", width / 2, bottomY);

  // Sub CTA
  ctx.fillStyle = BRAND.inkDim;
  ctx.font = "500 32px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("Camera-based mini-game · Plays in your browser", width / 2, bottomY + 60);

  // ── QR ──
  const qrSize = 220;
  const qrX = (width - qrSize) / 2;
  const qrY = height - 260;
  // White bg with rounded look (clip)
  ctx.fillStyle = BRAND.ink;
  roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 18);
  ctx.fill();
  try {
    const matrix = generateQR(gameUrl);
    drawQR(ctx, matrix, qrX, qrY, qrSize, BRAND.bg, BRAND.ink);
  } catch {
    // URL too long for v1-10 — fall back to printing it as text
  }

  // URL printed below QR (small)
  ctx.fillStyle = BRAND.accent;
  ctx.font = "700 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText(stripProtocol(gameUrl), width / 2, height - 50);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

// ── helpers ──────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function spaced(s: string): string {
  // Approximate letter-spacing for canvas2d (which lacks native control)
  return s.split("").join(" ");
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
