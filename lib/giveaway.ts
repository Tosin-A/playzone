import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type SocialPlatform = "tiktok" | "instagram" | "x" | "other";

export interface SubmitEntryInput {
  gameSlug: string;
  playerName: string;
  email: string;
  socialUrl?: string;
  socialPlatform?: SocialPlatform;
  score: number | null;
  scoreDisplay: string;
  faceShown: boolean;
  ageConfirmed: boolean;
  consentConfirmed: boolean;
}

export interface SubmitEntryResult {
  ok: boolean;
  error?: string;
}

export async function submitGiveawayEntry(
  input: SubmitEntryInput
): Promise<SubmitEntryResult> {
  if (!input.ageConfirmed || !input.consentConfirmed) {
    return { ok: false, error: "You must confirm age and consent to enter." };
  }
  if (!input.email.trim() || !input.playerName.trim()) {
    return { ok: false, error: "Email and handle are required." };
  }

  const { error } = await supabase.from("giveaway_entries").insert({
    game_slug: input.gameSlug,
    player_name: input.playerName.trim().slice(0, 40),
    email: input.email.trim().toLowerCase(),
    social_url: input.socialUrl?.trim() || null,
    social_platform: input.socialPlatform ?? null,
    score: input.score,
    score_display: input.scoreDisplay,
    face_shown: input.faceShown,
    age_confirmed: input.ageConfirmed,
    consent_confirmed: input.consentConfirmed,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
