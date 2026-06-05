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

// Get or create a per-tab player ID.
// Using sessionStorage avoids two tabs sharing the same matchmaking identity.
export function getPlayerId(): string {
  if (typeof window === "undefined") return generatePlayerId();
  try {
    let id = sessionStorage.getItem("playzone-player-id");
    if (!id) {
      id = generatePlayerId();
      sessionStorage.setItem("playzone-player-id", id);
    }
    return id;
  } catch {
    // Fallback for restricted storage environments.
    // This still allows realtime matching in the current page session.
    const globalKey = "__playzoneEphemeralPlayerId";
    const g = globalThis as typeof globalThis & { [key: string]: string | undefined };
    if (!g[globalKey]) {
      g[globalKey] = generatePlayerId();
    }
    return g[globalKey]!;
  }
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
    let hasMatched = false;

    const channelName = `matchmaking:${this.gameSlug}`;
    this.queueChannel = supabase.channel(channelName, {
      config: { presence: { key: this.playerId } },
    });

    this.queueChannel
      .on("presence", { event: "sync" }, () => {
        if (hasMatched || !this.queueChannel) return;

        const state = this.queueChannel!.presenceState();
        const playersById = new Map<string, PlayerInfo>();

        // Supabase presence keys are not guaranteed to equal tracked player IDs.
        // Always read IDs from tracked presence payload and de-dupe by ID.
        Object.values(state).forEach((presences) => {
          const metas = presences as unknown as Array<Partial<PlayerInfo>>;
          metas.forEach((meta) => {
            const playerId = typeof meta.id === "string" && meta.id.length > 0 ? meta.id : null;
            if (!playerId) return;

            const existing = playersById.get(playerId);
            const joinedAt = typeof meta.joinedAt === "number" ? meta.joinedAt : Date.now();
            if (!existing || joinedAt < existing.joinedAt) {
              playersById.set(playerId, {
                id: playerId,
                nickname: meta.nickname ?? "Player",
                joinedAt,
              });
            }
          });
        });
        const players = Array.from(playersById.values());

        // Need at least 2 players to match.
        // Pair deterministically in queue order: (0,1), (2,3), ...
        // This prevents starvation when 3+ players are waiting.
        if (players.length >= 2) {
          players.sort((a, b) => a.joinedAt - b.joinedAt);

          for (let i = 0; i < players.length - 1; i += 2) {
            const first = players[i];
            const second = players[i + 1];
            const isMe = first.id === this.playerId || second.id === this.playerId;
            if (!isMe) continue;

            const isHost = first.id === this.playerId;
            const opponent = isHost ? second : first;

            // Create deterministic room ID from both player IDs
            const ids = [first.id, second.id].sort();
            const roomId = `${this.gameSlug}:${ids[0]}-${ids[1]}`;

            hasMatched = true;
            onStatusChange("matched");
            onMatched({ roomId, opponent, isHost });

            // Leave queue after short delay to let both sides detect
            setTimeout(() => this.leaveQueue(), 500);
            break;
          }
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
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
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
