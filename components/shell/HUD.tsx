"use client";

import { ReactNode } from "react";

interface HUDProps {
  score?: string | number;
  timer?: number;
  instruction?: string;
  children?: ReactNode;
}

export default function HUD({ score, timer, instruction, children }: HUDProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      <div className="flex justify-between items-start">
        {timer !== undefined && (
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-mono tabular-nums">
            {timer.toFixed(1)}s
          </div>
        )}
        {score !== undefined && (
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-bold text-accent">
            {score}
          </div>
        )}
      </div>

      {instruction && (
        <div className="self-center bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-sm text-center">
          {instruction}
        </div>
      )}

      {children}
    </div>
  );
}
