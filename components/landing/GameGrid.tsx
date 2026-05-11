"use client";

import { GAMES } from "@/lib/games";
import GameCard from "./GameCard";

export default function GameGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {GAMES.map((game, i) => (
        <GameCard key={game.slug} game={game} index={i} />
      ))}
    </div>
  );
}
