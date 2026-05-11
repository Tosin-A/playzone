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
    gradient: "from-emerald-500 to-cyan-500",
    available: true,
  },
  {
    slug: "six-seven",
    title: "6/7",
    description: "Alternate hand raises — how many in 30 seconds?",
    gradient: "from-orange-500 to-red-500",
    available: true,
  },
  {
    slug: "shadow-boxing",
    title: "Shadow Boxing",
    description: "2-player punch battle — most hits wins",
    gradient: "from-red-600 to-rose-500",
    available: true,
  },
  {
    slug: "pose-off",
    title: "Pose-Off",
    description: "Match all poses as fast as possible",
    gradient: "from-violet-500 to-indigo-500",
    available: true,
  },
  {
    slug: "dont-smile",
    title: "Don't Smile",
    description: "Keep a straight face while we try to break you",
    gradient: "from-yellow-500 to-orange-500",
    available: true,
  },
  {
    slug: "hadouken",
    title: "Hadouken",
    description: "Throw fireballs with your hands",
    gradient: "from-blue-500 to-purple-600",
    available: false,
  },
  {
    slug: "mirror",
    title: "Mirror Match",
    description: "Copy each other's poses for points",
    gradient: "from-pink-500 to-rose-500",
    available: false,
  },
  {
    slug: "freeze",
    title: "Freeze",
    description: "Musical statues — AI catches you moving",
    gradient: "from-indigo-500 to-blue-500",
    available: false,
  },
  {
    slug: "air-drums",
    title: "Air Drums",
    description: "Play a drum kit in thin air",
    gradient: "from-red-500 to-orange-500",
    available: false,
  },
  {
    slug: "stare-off",
    title: "Stare Off",
    description: "Hold eye contact as long as you can",
    gradient: "from-violet-500 to-purple-600",
    available: true,
  },
  {
    slug: "posture",
    title: "Posture Police",
    description: "Get roasted every time you slouch",
    gradient: "from-teal-500 to-green-500",
    available: false,
  },
  {
    slug: "subway-run",
    title: "Subway Run",
    description: "Endless runner controlled by your body",
    gradient: "from-fuchsia-500 to-pink-500",
    available: false,
  },
];
