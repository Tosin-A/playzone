import type { GameMeta } from "./games";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://playzone.live";

/**
 * Long-form SEO copy per game.
 * Crafted for SERP snippets (~150-160 chars) — leads with the verb,
 * names the camera mechanic so Google understands the genre, ends
 * with a frictionless CTA.
 */
const GAME_SEO: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  rizz: {
    title: "Rizz Rater — AI rates your charisma 0 to 100",
    description:
      "Free webcam game: hold eye contact, land your best expressions, and let AI score your rizz from 0 to 100. No download, plays in your browser.",
    keywords: ["rizz game", "rizz rater", "ai rizz score", "webcam game", "browser game", "charisma test"],
  },
  "six-seven": {
    title: "6/7 — The viral arm-speed challenge",
    description:
      "Race the clock with the 6/7 arm-speed challenge. Alternate hand raises for 30 seconds and beat the leaderboard. Plays in any browser, no app, no signup.",
    keywords: ["6/7 game", "67 speed", "arm speed test", "webcam fitness game", "tiktok challenge game"],
  },
  "shadow-boxing": {
    title: "Shadow Boxing — 2-player webcam punch battle",
    description:
      "Throw punches at your friend through the webcam. Most hits in 30 seconds wins. Free, in-browser, two-player on one camera.",
    keywords: ["shadow boxing game", "webcam boxing", "two player webcam game", "punch counter game"],
  },
  "pose-off": {
    title: "Pose-Off — Match every pose before the timer drops",
    description:
      "Copy the silhouette before it disappears. Webcam pose-matching speed game powered by on-device AI. Free to play in your browser.",
    keywords: ["pose off", "pose matching game", "webcam pose game", "mediapipe game"],
  },
  "dont-smile": {
    title: "Don't Smile — Keep a straight face or you lose",
    description:
      "We try to break you. You try not to crack. Webcam reads your expression in real time — last one to smile wins. Browser, no signup.",
    keywords: ["don't smile game", "straight face game", "smile detection game", "webcam game"],
  },
  jutsu: {
    title: "Jutsu — Anime-style hand signs through your camera",
    description:
      "Chain Naruto-style hand seals with your body to summon jutsu effects. Free webcam game, plays in any browser.",
    keywords: ["jutsu game", "naruto hand signs game", "anime webcam game", "pose detection game"],
  },
  mirror: {
    title: "Mirror Match — Copy your partner's pose for points",
    description:
      "Two-player webcam game: read your partner instantly and mirror every pose for combo multipliers. Free, no signup.",
    keywords: ["mirror game", "pose mirror game", "two player webcam game", "couple game online"],
  },
  "stare-off": {
    title: "Stare Off — Hold eye contact longer than your rival",
    description:
      "Webcam stare-off: blink and you lose. Pure intensity, no signup, plays in your browser.",
    keywords: ["stare off game", "eye contact game", "blink game", "webcam game"],
  },
  "subway-run": {
    title: "Subway Run — Endless runner controlled by your body",
    description:
      "Jump, duck, lean — your body controls the runner. Free webcam endless runner that plays in your browser.",
    keywords: ["body controlled game", "webcam endless runner", "subway runner webcam"],
  },
};

export function getGameSeo(game: GameMeta) {
  return (
    GAME_SEO[game.slug] ?? {
      title: `${game.title} — PlayZone`,
      description: game.description,
      keywords: [game.title.toLowerCase(), "webcam game", "browser game"],
    }
  );
}

export function getSiteUrl() {
  return SITE_URL;
}

export function getCanonical(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
