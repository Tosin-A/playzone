"use client";

import { GAMES } from "@/lib/games";
import GameCard from "./GameCard";

export default function GameGrid() {
  return (
    // On desktop this grid lives inside the 56vw right panel,
    // so we cap at 4 columns instead of the old full-width 5.
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {GAMES.map((game, i) => (
        <GameCard key={game.slug} game={game} index={i} />
      ))}
    </div>
  );
}
