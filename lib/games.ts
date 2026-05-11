export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  gradient: string;
  available: boolean;
}

export const GAMES: GameMeta[] = [
  {
    slug: "rizz",
    title: "Rizz Rater",
    description: "AI rates your charisma from 0 to 100",
    // Warm rose→amber: confidence, attraction, "golden hour" energy
    gradient: "from-rose-400 via-orange-400 to-amber-300",
    available: true,
  },
  {
    slug: "six-seven",
    title: "6/7",
    description: "Alternate hand raises — how many in 30 seconds?",
    // Hot orange→red: urgency, speed, competition
    gradient: "from-orange-400 to-red-600",
    available: true,
  },
  {
    slug: "shadow-boxing",
    title: "Shadow Boxing",
    description: "2-player punch battle — most hits wins",
    // Deep red→rose: fighting game energy, intensity
    gradient: "from-red-500 to-rose-800",
    available: true,
  },
  {
    slug: "pose-off",
    title: "Pose-Off",
    description: "Match all poses as fast as possible",
    // Vivid violet→deep indigo: stylish, dancer energy
    gradient: "from-violet-400 to-indigo-700",
    available: true,
  },
  {
    slug: "dont-smile",
    title: "Don't Smile",
    description: "Keep a straight face while we try to break you",
    // Bright yellow→orange: comedy, mischief, sunshine energy
    gradient: "from-yellow-300 to-orange-500",
    available: true,
  },
  {
    slug: "jutsu",
    title: "Jutsu",
    description: "Perform Naruto-style jutsus with your body",
    // Electric blue→dark violet: chakra energy, ninja
    gradient: "from-blue-400 to-violet-900",
    available: true,
  },
  {
    slug: "mirror",
    title: "Mirror Match",
    description: "Copy each other's poses for points",
    // Fuchsia→purple: mirror/symmetry, pop energy
    gradient: "from-fuchsia-400 to-purple-700",
    available: true,
  },
  {
    slug: "freeze",
    title: "Freeze",
    description: "Musical statues — AI catches you moving",
    // Icy cyan→deep blue: cold, stillness, frozen
    gradient: "from-cyan-300 to-blue-800",
    available: false,
  },
  {
    slug: "air-drums",
    title: "Air Drums",
    description: "Play a drum kit in thin air",
    // Amber→deep red: warm percussion, stage lights
    gradient: "from-amber-400 to-red-700",
    available: false,
  },
  {
    slug: "stare-off",
    title: "Stare Off",
    description: "Hold eye contact as long as you can",
    // Dark slate→violet: intense, hypnotic, uncomfortable
    gradient: "from-slate-600 to-violet-900",
    available: true,
  },
  {
    slug: "posture",
    title: "Posture Police",
    description: "Get roasted every time you slouch",
    // Emerald→teal: health, authority, crisp
    gradient: "from-emerald-400 to-teal-700",
    available: false,
  },
  {
    slug: "subway-run",
    title: "Subway Run",
    description: "Endless runner controlled by your body",
    // Lime→green: speed, city, go
    gradient: "from-lime-300 to-emerald-600",
    available: true,
  },
];
