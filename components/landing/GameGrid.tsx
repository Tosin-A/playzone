"use client";

import { useMemo, useState } from "react";
import { GAMES } from "@/lib/games";
import GameCard from "./GameCard";
import GamePreviewModal from "./GamePreviewModal";

export default function GameGrid() {
  const [selectedGameSlug, setSelectedGameSlug] = useState<string | null>(null);
  const selectedGame = selectedGameSlug
    ? GAMES.find((game) => game.slug === selectedGameSlug) ?? null
    : null;

  // Sort: available first, coming-soon last. First impression is "all playable".
  const sortedGames = useMemo(
    () => [...GAMES].sort((a, b) => Number(b.available) - Number(a.available)),
    [],
  );

  return (
    <>
      {/* On desktop this grid lives inside the 56vw right panel,
          so we cap at 4 columns instead of the old full-width 5. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedGames.map((game, i) => (
          <GameCard
            key={game.slug}
            game={game}
            index={i}
            onSelectGame={(selected) => {
              if (!selected.available) return;
              setSelectedGameSlug(selected.slug);
            }}
          />
        ))}
      </div>

      <GamePreviewModal
        game={selectedGame}
        onClose={() => setSelectedGameSlug(null)}
      />
    </>
  );
}
