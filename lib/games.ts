export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  gradient: string;
  available: boolean;
  thumbnail?: string; // path under /public, e.g. "/games/shadow-boxing.jpg"
  previewFrames: [string, string, string];
  immersive: {
    subtitle: string;
    setting: string;
    mission: string;
    signatureMove: string;
    aura: string;
    kanji: string;
  };
}

export const GAMES: GameMeta[] = [
  {
    slug: "rizz",
    title: "Rizz Rater",
    description: "AI rates your charisma from 0 to 100",
    // Warm rose→amber: confidence, attraction, "golden hour" energy
    gradient: "from-rose-400 via-orange-400 to-amber-300",
    available: true,
    thumbnail: "/games/rizz.png",
    previewFrames: ["Flirt combo", "Face lock", "Aura check"],
    immersive: {
      subtitle: "The Charisma Trial",
      setting: "Neon rooftop after rain, Tokyo midnight",
      mission: "Hold eye contact and land clean expressions before the timer drops.",
      signatureMove: "Golden Wink Finisher",
      aura: "oklch(0.80 0.20 35)",
      kanji: "魅",
    },
  },
  {
    slug: "six-seven",
    title: "6/7",
    description: "Alternate hand raises — how many in 30 seconds?",
    // Hot orange→red: urgency, speed, competition
    gradient: "from-orange-400 to-red-600",
    available: true,
    thumbnail: "/games/six-seven.png",
    previewFrames: ["Left up", "Right up", "Speed burst"],
    immersive: {
      subtitle: "Tempo Discipline Arc",
      setting: "Training hall lit by ember lanterns",
      mission: "Alternate hand raises without breaking rhythm for 30 seconds.",
      signatureMove: "Metronome Barrage",
      aura: "oklch(0.78 0.19 45)",
      kanji: "拍",
    },
  },
  {
    slug: "shadow-boxing",
    title: "Shadow Boxing",
    description: "2-player punch battle — most hits wins",
    // Deep red→rose: fighting game energy, intensity
    gradient: "from-red-500 to-rose-800",
    available: true,
    thumbnail: "/games/shadow-boxing.png",
    previewFrames: ["Guard stance", "Punch chain", "Hit confirm"],
    immersive: {
      subtitle: "Street Duel Protocol",
      setting: "Underground ring with cracked LED boards",
      mission: "Out-punch your rival and keep your combo meter alive.",
      signatureMove: "Crimson Counter Rush",
      aura: "oklch(0.67 0.23 24)",
      kanji: "拳",
    },
  },
  {
    slug: "pose-off",
    title: "Pose-Off",
    description: "Match all poses as fast as possible",
    // Vivid violet→deep indigo: stylish, dancer energy
    gradient: "from-violet-400 to-indigo-700",
    available: true,
    thumbnail: "/games/pose-off.png",
    previewFrames: ["Pose lock", "Mirror read", "Time attack"],
    immersive: {
      subtitle: "Pose Memory Saga",
      setting: "Holographic stage with floating cue cards",
      mission: "Copy every shape before the reference ghost disappears.",
      signatureMove: "Perfect Silhouette Snap",
      aura: "oklch(0.68 0.21 295)",
      kanji: "型",
    },
  },
  {
    slug: "push-up",
    title: "Push-Up Test",
    description: "How many push-ups can you do in 30 seconds?",
    // Fiery red→amber: pure effort, gym lighting
    gradient: "from-red-500 via-orange-500 to-amber-400",
    available: true,
    thumbnail: "/games/push-up.png",
    previewFrames: ["Down", "Lock out", "Counter"],
    immersive: {
      subtitle: "30-Second Burn",
      setting: "Empty gym at 5am with a single floor light",
      mission: "Drop chest, lock arms back out, count clean reps for 30 seconds.",
      signatureMove: "Pump Streak Multiplier",
      aura: "oklch(0.74 0.21 38)",
      kanji: "押",
    },
  },
  {
    slug: "jutsu",
    title: "Jutsu",
    description: "Perform Naruto-style jutsus with your body",
    // Electric blue→dark violet: chakra energy, ninja
    gradient: "from-blue-400 to-violet-900",
    available: true,
    thumbnail: "/games/jutsu.png",
    previewFrames: ["Seal prep", "Body glyph", "Chakra sync"],
    immersive: {
      subtitle: "Forbidden Hand-Sign Exam",
      setting: "Moonlit dojo with moving ink sigils",
      mission: "Chain body signs in order to summon full-technique effects.",
      signatureMove: "Nine-Seal Cyclone",
      aura: "oklch(0.66 0.22 275)",
      kanji: "術",
    },
  },
  {
    slug: "mirror",
    title: "Mirror Match",
    description: "Copy each other's poses for points",
    // Fuchsia→purple: mirror/symmetry, pop energy
    gradient: "from-fuchsia-400 to-purple-700",
    available: true,
    thumbnail: "/games/mirror.png",
    previewFrames: ["Dual lock", "Symmetry", "Sync bonus"],
    immersive: {
      subtitle: "Twin Soul Sync",
      setting: "Crystal mirror chamber with split horizons",
      mission: "Read your partner instantly and match every pose for multipliers.",
      signatureMove: "Parallel Echo Burst",
      aura: "oklch(0.70 0.25 330)",
      kanji: "鏡",
    },
  },
  {
    slug: "stare-off",
    title: "Stare Off",
    description: "Hold eye contact as long as you can",
    // Dark slate→violet: intense, hypnotic, uncomfortable
    gradient: "from-slate-600 to-violet-900",
    available: true,
    thumbnail: "/games/stare-off.png",
    previewFrames: ["Eye lock", "Blink bait", "Nerve test"],
    immersive: {
      subtitle: "Unbroken Gaze Pact",
      setting: "Silent alley under one violet sign",
      mission: "Hold eye contact longer than your opponent without flinching.",
      signatureMove: "Void Stare Crush",
      aura: "oklch(0.63 0.16 285)",
      kanji: "眼",
    },
  },
];
