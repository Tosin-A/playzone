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
  surface: "#191510",
  accent: "#ff8a3d",       // ≈ oklch(0.82 0.22 50)
  accentDim: "#e57632",    // ≈ oklch(0.72 0.22 50)
  ink: "#f4f1ec",
  inkDim: "rgba(244,241,236,0.55)",
  inkFaint: "rgba(244,241,236,0.30)",
  inkGhost: "rgba(244,241,236,0.12)",
} as const;

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Layout rhythm — every gap is a multiple of these so spacing reads as
// intentional rather than ad-hoc.
const PAD = 88;
const GAP_LG = 72;
const GAP_MD = 36;
const GAP_SM = 20;

export async function generateShareCard(options: ShareCardOptions): Promise<Blob> {
  const { title, score, subtitle, gameUrl, format = "story" } = options;

  const width = 1080;
  const height = format === "story" ? 1920 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  drawBackground(ctx, width, height);
  drawCornerAccents(ctx, width, height);

  const headerCenterY = drawHeader(ctx, width);
  const footerTopY = drawFooter(ctx, width, height, gameUrl);

  const blockTop = headerCenterY + GAP_LG;
  const blockBottom = footerTopY - GAP_LG;
  drawScoreBlock(ctx, width, blockTop, blockBottom, title, score, subtitle);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

// ── Background ───────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BRAND.bg;
  ctx.fillRect(0, 0, w, h);

  // Orange bloom in lower-left, mirrors landing hero
  const bloom = ctx.createRadialGradient(
    w * 0.1, h * 0.82, 40,
    w * 0.1, h * 0.82, w * 0.95,
  );
  bloom.addColorStop(0, "rgba(255, 138, 61, 0.22)");
  bloom.addColorStop(0.45, "rgba(255, 138, 61, 0.05)");
  bloom.addColorStop(1, "rgba(255, 138, 61, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, h * 0.4,
    w / 2, h / 2, h * 0.9,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Dot grid — softer than before so it sits behind content
  ctx.fillStyle = "rgba(244,241,236,0.04)";
  const dotSpacing = 56;
  for (let y = dotSpacing; y < h; y += dotSpacing) {
    for (let x = dotSpacing; x < w; x += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Corner accents (L-brackets) ──────────────────────────────────

function drawCornerAccents(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const inset = PAD - 28;
  const len = 56;
  const thickness = 3;

  ctx.fillStyle = "rgba(255, 138, 61, 0.55)";
  // Top-left
  ctx.fillRect(inset, inset, len, thickness);
  ctx.fillRect(inset, inset, thickness, len);
  // Top-right
  ctx.fillRect(w - inset - len, inset, len, thickness);
  ctx.fillRect(w - inset - thickness, inset, thickness, len);
  // Bottom-left
  ctx.fillRect(inset, h - inset - thickness, len, thickness);
  ctx.fillRect(inset, h - inset - len, thickness, len);
  // Bottom-right
  ctx.fillRect(w - inset - len, h - inset - thickness, len, thickness);
  ctx.fillRect(w - inset - thickness, h - inset - len, thickness, len);
}

// ── Header (PLAYZONE wordmark + LIVE pill) ───────────────────────

function drawHeader(ctx: CanvasRenderingContext2D, w: number): number {
  const headerY = PAD + 28;

  // Wordmark — left
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = BRAND.ink;
  ctx.font = `900 52px ${FONT_STACK}`;
  ctx.fillText("PLAYZONE", PAD, headerY);

  // LIVE pill — right
  const pillH = 56;
  const pillPadX = 26;
  const dotR = 7;
  const dotGap = 14;
  const labelFont = `800 24px ${FONT_STACK}`;
  ctx.font = labelFont;
  const labelW = ctx.measureText("LIVE").width;
  const pillW = pillPadX * 2 + dotR * 2 + dotGap + labelW;
  const pillX = w - PAD - pillW;
  const pillY = headerY - pillH / 2;

  ctx.fillStyle = "rgba(255, 138, 61, 0.12)";
  ctx.strokeStyle = "rgba(255, 138, 61, 0.38)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();

  // Live dot with glow
  ctx.fillStyle = BRAND.accent;
  ctx.shadowColor = BRAND.accent;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(pillX + pillPadX + dotR, headerY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Live label
  ctx.fillStyle = BRAND.accent;
  ctx.font = labelFont;
  ctx.textAlign = "left";
  ctx.fillText("LIVE", pillX + pillPadX + dotR * 2 + dotGap, headerY);

  return headerY + pillH / 2;
}

// ── Footer (CTA + sub + QR + URL stacked upward from bottom) ─────

function drawFooter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gameUrl: string,
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // URL — bottom-most
  const urlSize = 26;
  const urlY = h - PAD - urlSize / 2;
  ctx.fillStyle = BRAND.accent;
  ctx.font = `700 ${urlSize}px ${FONT_STACK}`;
  ctx.fillText(stripProtocol(gameUrl), w / 2, urlY);

  // QR card
  const qrSize = 240;
  const qrPad = 24;
  const qrCardSize = qrSize + qrPad * 2;
  const qrCardX = (w - qrCardSize) / 2;
  const qrCardY = urlY - urlSize / 2 - GAP_MD - qrCardSize;

  // QR shadow
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = BRAND.ink;
  roundRect(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  try {
    const matrix = generateQR(gameUrl);
    drawQR(ctx, matrix, qrCardX + qrPad, qrCardY + qrPad, qrSize, BRAND.bg, BRAND.ink);
  } catch {
    // URL too long — silent fallback (URL is printed below anyway)
  }

  // Sub-CTA
  const subSize = 30;
  const subY = qrCardY - GAP_MD - subSize / 2;
  ctx.fillStyle = BRAND.inkDim;
  ctx.font = `500 ${subSize}px ${FONT_STACK}`;
  ctx.fillText("Camera-based mini-game · Plays in your browser", w / 2, subY);

  // Main CTA
  const ctaSize = 68;
  const ctaY = subY - subSize / 2 - GAP_SM - ctaSize / 2;
  ctx.fillStyle = BRAND.ink;
  ctx.font = `900 ${ctaSize}px ${FONT_STACK}`;
  ctx.fillText("CAN YOU BEAT ME?", w / 2, ctaY);

  return ctaY - ctaSize / 2;
}

// ── Score block (centered between header and footer) ────────────

function drawScoreBlock(
  ctx: CanvasRenderingContext2D,
  w: number,
  blockTop: number,
  blockBottom: number,
  title: string,
  score: number | string,
  subtitle: string | undefined,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const eyebrowSize = 30;
  const subtitleSize = 42;

  // Score auto-sizes by character count so 3-digit and 8-char strings
  // both anchor cleanly on the same vertical center.
  const scoreStr = String(score);
  const scoreSize =
    scoreStr.length > 6 ? 300 :
    scoreStr.length > 4 ? 380 :
    480;

  // Stack heights — gaps stay constant regardless of score size.
  const gapEyebrowToScore = GAP_MD + 20;
  const gapScoreToSubtitle = GAP_MD;

  const stackH =
    eyebrowSize +
    gapEyebrowToScore +
    scoreSize +
    (subtitle ? gapScoreToSubtitle + subtitleSize : 0);

  const blockCenter = (blockTop + blockBottom) / 2;
  const stackTop = blockCenter - stackH / 2;

  // Eyebrow (game title in spaced caps)
  const eyebrowY = stackTop + eyebrowSize / 2;
  ctx.fillStyle = BRAND.inkDim;
  ctx.font = `700 ${eyebrowSize}px ${FONT_STACK}`;
  ctx.fillText(spaced(title.toUpperCase()), w / 2, eyebrowY);

  // Thin accent rule under eyebrow — adds structure between the label
  // and the score without screaming
  const ruleY = eyebrowY + eyebrowSize / 2 + 18;
  const ruleW = 80;
  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(w / 2 - ruleW / 2, ruleY, ruleW, 3);

  // Score
  const scoreY = stackTop + eyebrowSize + gapEyebrowToScore + scoreSize / 2;
  ctx.fillStyle = BRAND.accent;
  ctx.font = `900 ${scoreSize}px ${FONT_STACK}`;
  ctx.shadowColor = "rgba(255, 138, 61, 0.5)";
  ctx.shadowBlur = 100;
  ctx.fillText(scoreStr, w / 2, scoreY);
  ctx.shadowBlur = 0;

  if (subtitle) {
    const subY =
      stackTop + eyebrowSize + gapEyebrowToScore + scoreSize +
      gapScoreToSubtitle + subtitleSize / 2;
    ctx.fillStyle = BRAND.ink;
    ctx.font = `500 ${subtitleSize}px ${FONT_STACK}`;
    ctx.fillText(subtitle, w / 2, subY);
  }
}

// ── helpers ─────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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
  // Approximate letter-spacing for canvas2d (which lacks native control).
  return s.split("").join(" ");
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
