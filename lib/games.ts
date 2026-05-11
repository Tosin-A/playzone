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
    slug: "dont-smile",
    title: "Don't Smile",
    description: "Keep a straight face while we try to break you",
    // Bright yellow→orange: comedy, mischief, sunshine energy
    gradient: "from-yellow-300 to-orange-500",
    available: true,
    thumbnail: "/games/dont-smile.png",
    previewFrames: ["Laugh bait", "Blink test", "Composure"],
    immersive: {
      subtitle: "Poker Face Gauntlet",
      setting: "Comedy club meets chaos carnival",
      mission: "Stay stone-faced while absurd attacks try to break your focus.",
      signatureMove: "Deadpan Shield",
      aura: "oklch(0.84 0.22 80)",
      kanji: "忍",
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
    slug: "freeze",
    title: "Freeze",
    description: "Musical statues — AI catches you moving",
    // Icy cyan→deep blue: cold, stillness, frozen
    gradient: "from-cyan-300 to-blue-800",
    available: false,
    previewFrames: ["Freeze cue", "Motion trap", "Stillness"],
    immersive: {
      subtitle: "Cold Frame Chronicle",
      setting: "Icy metro tunnel with strobe alarms",
      mission: "Become absolutely still when the freeze siren snaps on.",
      signatureMove: "Zero-Motion Domain",
      aura: "oklch(0.74 0.15 230)",
      kanji: "凍",
    },
  },
  {
    slug: "air-drums",
    title: "Air Drums",
    description: "Play a drum kit in thin air",
    // Amber→deep red: warm percussion, stage lights
    gradient: "from-amber-400 to-red-700",
    available: false,
    previewFrames: ["Snare swing", "Kick hit", "Crowd meter"],
    immersive: {
      subtitle: "Rhythm Riot Arc",
      setting: "Packed live stage with molten spotlights",
      mission: "Air-drum clean patterns and ignite the crowd heat bar.",
      signatureMove: "Thunder Fill Break",
      aura: "oklch(0.72 0.20 38)",
      kanji: "鼓",
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
  {
    slug: "posture",
    title: "Posture Police",
    description: "Get roasted every time you slouch",
    // Emerald→teal: health, authority, crisp
    gradient: "from-emerald-400 to-teal-700",
    available: false,
    previewFrames: ["Spine check", "Slouch alarm", "Reset"],
    immersive: {
      subtitle: "Form Guardian Program",
      setting: "Cyber clinic with strict AI instructors",
      mission: "Maintain perfect posture and survive the roast detector.",
      signatureMove: "Iron Spine Lock",
      aura: "oklch(0.74 0.16 170)",
      kanji: "勢",
    },
  },
  {
    slug: "subway-run",
    title: "Subway Run",
    description: "Endless runner controlled by your body",
    // Lime→green: speed, city, go
    gradient: "from-lime-300 to-emerald-600",
    available: false,
    previewFrames: ["Jump lane", "Duck lane", "Dash chain"],
    immersive: {
      subtitle: "Metro Velocity Run",
      setting: "Endless neon rails above sleeping districts",
      mission: "Use your body to dodge hazards and keep speed maxed.",
      signatureMove: "Phantom Rail Sprint",
      aura: "oklch(0.76 0.19 145)",
      kanji: "走",
    },
  },
];
