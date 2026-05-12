"use client";

import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface PlayerInfo {
  id: string;
  nickname: string;
  joinedAt: number;
}

export interface GameRoomState {
  status: "waiting" | "countdown" | "playing" | "finished";
  players: PlayerInfo[];
  scores: Record<string, number>;
  extras: Record<string, unknown>;
}

// Generate a short random player ID
function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Get or create a persistent player ID
export function getPlayerId(): string {
  if (typeof window === "undefined") return generatePlayerId();
  let id = localStorage.getItem("playzone-player-id");
  if (!id) {
    id = generatePlayerId();
    localStorage.setItem("playzone-player-id", id);
  }
  return id;
}

export function getPlayerNickname(): string {
  if (typeof window === "undefined") return "Player";
  return localStorage.getItem("playzone-nickname") || `Player-${getPlayerId().slice(0, 4)}`;
}

export function setPlayerNickname(name: string) {
  localStorage.setItem("playzone-nickname", name);
}

export type MatchmakingStatus = "idle" | "searching" | "matched" | "error";

export interface MatchmakingResult {
  roomId: string;
  opponent: PlayerInfo;
  isHost: boolean;
}

export class MultiplayerManager {
  private queueChannel: RealtimeChannel | null = null;
  private gameChannel: RealtimeChannel | null = null;
  private playerId: string;
  private nickname: string;
  private gameSlug: string;

  constructor(gameSlug: string) {
    this.playerId = getPlayerId();
    this.nickname = getPlayerNickname();
    this.gameSlug = gameSlug;
  }

  // Join matchmaking queue for a specific game
  async joinQueue(
    onStatusChange: (status: MatchmakingStatus) => void,
    onMatched: (result: MatchmakingResult) => void
  ): Promise<void> {
    onStatusChange("searching");

    const channelName = `matchmaking:${this.gameSlug}`;
    this.queueChannel = supabase.channel(channelName, {
      config: { presence: { key: this.playerId } },
    });

    this.queueChannel
      .on("presence", { event: "sync" }, () => {
        const state = this.queueChannel!.presenceState();
        const players = Object.entries(state).map(([key, presences]) => {
          const p = (presences as unknown as PlayerInfo[])[0];
          return { id: key, nickname: p?.nickname ?? "Player", joinedAt: p?.joinedAt ?? Date.now() };
        });

        // Need at least 2 players to match
        if (players.length >= 2) {
          // Sort by join time, match first two
          players.sort((a, b) => a.joinedAt - b.joinedAt);
          const [first, second] = players;

          // Only the first player (host) initiates the match
          const isMe = first.id === this.playerId || second.id === this.playerId;
          if (!isMe) return;

          const isHost = first.id === this.playerId;
          const opponent = isHost ? second : first;

          // Create deterministic room ID from both player IDs
          const ids = [first.id, second.id].sort();
          const roomId = `${this.gameSlug}:${ids[0]}-${ids[1]}`;

          onStatusChange("matched");
          onMatched({ roomId, opponent, isHost });

          // Leave queue after short delay to let both sides detect
          setTimeout(() => this.leaveQueue(), 500);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await this.queueChannel!.track({
            id: this.playerId,
            nickname: this.nickname,
            joinedAt: Date.now(),
          });
        }
        if (status === "CHANNEL_ERROR") {
          onStatusChange("error");
        }
      });
  }

  leaveQueue() {
    if (this.queueChannel) {
      supabase.removeChannel(this.queueChannel);
      this.queueChannel = null;
    }
  }

  // Join a game room for real-time score/state exchange
  joinRoom(
    roomId: string,
    onOpponentUpdate: (data: { score: number; extras?: Record<string, unknown> }) => void,
    onOpponentFinished: (data: { finalScore: number; extras?: Record<string, unknown> }) => void,
    onCountdown: (count: number) => void
  ): void {
    this.gameChannel = supabase.channel(roomId);

    this.gameChannel
      .on("broadcast", { event: "score_update" }, ({ payload }) => {
        if (payload.playerId !== this.playerId) {
          onOpponentUpdate(payload);
        }
      })
      .on("broadcast", { event: "game_finished" }, ({ payload }) => {
        if (payload.playerId !== this.playerId) {
          onOpponentFinished(payload);
        }
      })
      .on("broadcast", { event: "countdown" }, ({ payload }) => {
        onCountdown(payload.count);
      })
      .subscribe();
  }

  // Send live score update to opponent
  sendScoreUpdate(score: number, extras?: Record<string, unknown>) {
    this.gameChannel?.send({
      type: "broadcast",
      event: "score_update",
      payload: { playerId: this.playerId, score, extras },
    });
  }

  // Signal game finished
  sendGameFinished(finalScore: number, extras?: Record<string, unknown>) {
    this.gameChannel?.send({
      type: "broadcast",
      event: "game_finished",
      payload: { playerId: this.playerId, finalScore, extras },
    });
  }

  // Host sends countdown
  sendCountdown(count: number) {
    this.gameChannel?.send({
      type: "broadcast",
      event: "countdown",
      payload: { count },
    });
  }

  leaveRoom() {
    if (this.gameChannel) {
      supabase.removeChannel(this.gameChannel);
      this.gameChannel = null;
    }
  }

  cleanup() {
    this.leaveQueue();
    this.leaveRoom();
  }

  getPlayerId() {
    return this.playerId;
  }

  getNickname() {
    return this.nickname;
  }
}
