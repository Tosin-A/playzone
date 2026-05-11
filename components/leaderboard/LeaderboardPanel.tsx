"use client";

import { useState, useEffect, useCallback } from "react";
import { GAMES } from "@/lib/games";
import { getTopScores, LeaderboardEntry } from "@/lib/leaderboard";

const AVAILABLE_GAMES = GAMES.filter((g) => g.available);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LeaderboardPanel() {
  const [activeSlug, setActiveSlug] = useState(AVAILABLE_GAMES[0]?.slug ?? "");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (slug: string) => {
    setLoading(true);
    const data = await getTopScores(slug, 10);
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeSlug) load(activeSlug);
  }, [activeSlug, load]);

  const activeGame = AVAILABLE_GAMES.find((g) => g.slug === activeSlug);

  return (
    <section className="mt-10">
      {/* Section label */}
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span
          className="font-[family-name:var(--font-display)] text-muted"
          style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase" }}
        >
          Top Scores
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {AVAILABLE_GAMES.map((game) => (
          <button
            key={game.slug}
            onClick={() => setActiveSlug(game.slug)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeSlug === game.slug
                ? "bg-white/15 text-white"
                : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60"
            }`}
          >
            {game.title}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02]">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-white/30 text-xs font-medium">#</span>
          <span className="text-white/30 text-xs font-medium">Player</span>
          <span className="text-white/30 text-xs font-medium text-right">Score</span>
          <span className="text-white/30 text-xs font-medium text-right">When</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-white/30 text-sm">No scores yet</p>
            <p className="text-white/20 text-xs">Be the first to play {activeGame?.title}</p>
          </div>
        ) : (
          <ol>
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className={`grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-4 py-3 items-center transition-colors ${
                  i < entries.length - 1 ? "border-b border-white/[0.05]" : ""
                } ${i === 0 ? "bg-white/[0.03]" : ""}`}
              >
                {/* Rank */}
                <span
                  className={`text-sm font-bold tabular-nums ${
                    i === 0
                      ? "text-accent"
                      : i === 1
                      ? "text-white/60"
                      : i === 2
                      ? "text-orange-400/70"
                      : "text-white/25"
                  }`}
                >
                  {i === 0 ? "①" : i === 1 ? "②" : i === 2 ? "③" : `${i + 1}`}
                </span>

                {/* Name */}
                <span className="text-sm text-white/80 truncate font-medium">
                  {entry.player_name}
                </span>

                {/* Score */}
                <span className="text-sm font-bold tabular-nums text-right text-white/90">
                  {entry.score_display}
                </span>

                {/* Time */}
                <span className="text-xs text-white/25 text-right whitespace-nowrap">
                  {timeAgo(entry.created_at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
