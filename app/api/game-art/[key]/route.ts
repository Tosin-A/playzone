import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";

const ART_PATHS: Record<string, string> = {
  "pose-off":
    "/Users/ayanfex/.cursor/projects/Users-ayanfex-Desktop-Projects-VISION/assets/image-c2bdd54a-7e45-4e62-9975-242f8054bbef.png",
  shadowbox:
    "/Users/ayanfex/.cursor/projects/Users-ayanfex-Desktop-Projects-VISION/assets/Screenshot_2026-05-11_at_01.24.40-4dc500c2-4d61-43c2-a607-e3437db21ae9.png",
};

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  const imagePath = ART_PATHS[key];

  if (!imagePath) {
    return new Response("Image not found", { status: 404 });
  }

  try {
    const imageBuffer = await readFile(imagePath);
    return new Response(imageBuffer, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to read preview art", error);
    return new Response("Unable to load image", { status: 500 });
  }
}
