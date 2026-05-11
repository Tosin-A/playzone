interface ShareCardOptions {
  title: string;
  score: number | string;
  subtitle?: string;
  gameUrl: string;
  format?: "story" | "feed";
}

export async function generateShareCard(options: ShareCardOptions): Promise<Blob> {
  const { title, score, subtitle, gameUrl, format = "story" } = options;

  const width = 1080;
  const height = format === "story" ? 1920 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0a0a");
  gradient.addColorStop(0.5, "#0d1f15");
  gradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative circle
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.4, 200, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff8840";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, height * 0.4, 220, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff8820";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score
  ctx.fillStyle = "#00ff88";
  ctx.font = "bold 180px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(score), width / 2, height * 0.4);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText(title, width / 2, height * 0.58);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = "#ffffffb0";
    ctx.font = "36px sans-serif";
    ctx.fillText(`"${subtitle}"`, width / 2, height * 0.65);
  }

  // Logo / brand
  ctx.fillStyle = "#00ff88";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText("PLAYZONE", width / 2, height * 0.82);

  // URL
  ctx.fillStyle = "#ffffff80";
  ctx.font = "28px sans-serif";
  ctx.fillText(gameUrl, width / 2, height * 0.87);

  // CTA
  ctx.fillStyle = "#ffffff60";
  ctx.font = "32px sans-serif";
  ctx.fillText("Can you beat my score?", width / 2, height * 0.92);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
