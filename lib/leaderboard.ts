import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface LeaderboardEntry {
  id: string;
  game_slug: string;
  player_name: string;
  score: number;
  score_display: string;
  higher_is_better: boolean;
  created_at: string;
}

export async function submitScore({
  gameSlug,
  playerName,
  score,
  scoreDisplay,
  higherIsBetter = true,
}: {
  gameSlug: string;
  playerName: string;
  score: number;
  scoreDisplay: string;
  higherIsBetter?: boolean;
}): Promise<void> {
  await supabase.from("leaderboard_entries").insert({
    game_slug: gameSlug,
    player_name: playerName.trim() || "Anonymous",
    score,
    score_display: scoreDisplay,
    higher_is_better: higherIsBetter,
  });
}

export async function getTopScores(
  gameSlug: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  // We need to know higher_is_better to sort correctly — fetch one entry first
  const { data: sample } = await supabase
    .from("leaderboard_entries")
    .select("higher_is_better")
    .eq("game_slug", gameSlug)
    .limit(1);

  const higherIsBetter = sample?.[0]?.higher_is_better ?? true;

  const { data } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("game_slug", gameSlug)
    .order("score", { ascending: !higherIsBetter })
    .limit(limit);

  return data ?? [];
}

export async function getPlayerRank(
  gameSlug: string,
  score: number,
  higherIsBetter = true
): Promise<number> {
  const { count } = await supabase
    .from("leaderboard_entries")
    .select("*", { count: "exact", head: true })
    .eq("game_slug", gameSlug)
    .filter("score", higherIsBetter ? "gt" : "lt", score);

  return (count ?? 0) + 1;
}

export async function getAllGamesTopScore(): Promise<
  Record<string, LeaderboardEntry | null>
> {
  // Fetch top 1 per game for the landing page summary
  const { data } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return {};

  const byGame: Record<string, LeaderboardEntry[]> = {};
  for (const entry of data) {
    if (!byGame[entry.game_slug]) byGame[entry.game_slug] = [];
    byGame[entry.game_slug].push(entry);
  }

  const result: Record<string, LeaderboardEntry | null> = {};
  for (const [slug, entries] of Object.entries(byGame)) {
    const hib = entries[0]?.higher_is_better ?? true;
    entries.sort((a, b) =>
      hib ? b.score - a.score : a.score - b.score
    );
    result[slug] = entries[0] ?? null;
  }
  return result;
}
