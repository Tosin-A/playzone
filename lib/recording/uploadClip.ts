import { supabase } from "@/lib/supabase";

const BUCKET = "gameplay-clips";

export interface UploadClipParams {
  blob: Blob;
  gameSlug: string;
  /** "mp4" | "webm" — should mirror useGameplayRecorder().mimeExt. */
  ext: string;
  /** Optional name the player typed in for the leaderboard. */
  playerName?: string;
  /** Numeric score for sorting/filtering later. */
  score?: number;
  /** Score formatted as displayed (e.g. "01:23"). */
  scoreDisplay?: string;
  /** True iff the user opted in to having their face visible in the clip. */
  faceShown?: boolean;
}

export interface UploadedClip {
  /** Storage path inside the bucket. */
  path: string;
  /** Public URL (only meaningful if the bucket is public). */
  publicUrl: string;
}

/**
 * Persists a gameplay clip to Supabase Storage. Consent is the caller's
 * responsibility — by the time this runs, the user must have explicitly
 * approved sharing the clip with PlayZone.
 */
export async function uploadClip(params: UploadClipParams): Promise<UploadedClip> {
  const { blob, gameSlug, ext, playerName, score, scoreDisplay, faceShown } = params;

  // Path shape: gameSlug/yyyy-mm/uuid.ext  — keeps storage browsable by
  // game and month without scanning the whole bucket.
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${gameSlug}/${month}/${id}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: blob.type || (ext === "mp4" ? "video/mp4" : "video/webm"),
      cacheControl: "31536000",
      upsert: false,
      // Sidecar metadata travels with the object so reviewers can sort
      // and filter without joining against an extra table.
      metadata: {
        gameSlug,
        playerName: playerName ?? "",
        score: score != null ? String(score) : "",
        scoreDisplay: scoreDisplay ?? "",
        faceShown: faceShown ? "1" : "0",
        ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
        capturedAt: now.toISOString(),
      },
    });

  if (error) {
    // Surface the real cause — most common failures here are "Bucket not
    // found" (bucket missing) and "new row violates row-level security
    // policy" (RLS blocks anon insert). Logging the structured error
    // makes it obvious which one we're hitting.
    console.error("[uploadClip] Supabase storage upload failed", {
      bucket: BUCKET,
      path,
      blobSize: blob.size,
      blobType: blob.type,
      error,
    });
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
