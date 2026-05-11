import { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const BLINK_THRESHOLD = 0.4; // eye closed score
const BLINK_MAX_DURATION = 400; // ms - blinks longer than this = fail
const LOOK_AWAY_THRESHOLD = 0.25; // iris off-center threshold
const LOOK_AWAY_DURATION = 500; // ms looking away = fail

export interface Character {
  name: string;
  emoji: string;
  color: string;
  taunts: string[];
}

export const CHARACTERS: Character[] = [
  {
    name: "The Void",
    emoji: "👁️",
    color: "#00ff88",
    taunts: [
      "I can see your soul...",
      "Don't blink.",
      "You're weakening.",
      "I never blink. Ever.",
      "Your eyes are watering.",
      "Just give up already.",
      "I've been doing this for centuries.",
      "Tick tock...",
    ],
  },
  {
    name: "Demon Cat",
    emoji: "🐱",
    color: "#ff6688",
    taunts: [
      "*stares unblinkingly*",
      "Meow. (I will destroy you.)",
      "You dare challenge me?",
      "I invented the stare.",
      "*tail twitches menacingly*",
      "Pathetic human eyes.",
      "I can do this all day.",
      "*purrs aggressively*",
    ],
  },
  {
    name: "Grandma",
    emoji: "👵",
    color: "#ffcc00",
    taunts: [
      "Are you eating enough, dear?",
      "I'm very disappointed in you.",
      "Your cousin would never look away.",
      "I've seen things, child.",
      "Back in my day we stared for hours.",
      "You look tired. Give up.",
      "I made cookies but they're for winners only.",
      "Your mother told me about your grades.",
    ],
  },
];

export interface StareOffState {
  survivalTime: number;
  startTime: number;
  gameOver: boolean;
  failReason: "blink" | "look-away" | null;
  blinkStartTime: number | null;
  lookAwayStartTime: number | null;
  eyeOpenness: number; // 0 = closed, 1 = open
  gazeCenter: number; // 0 = center, 1 = far off
  intensity: number; // 0-1 progressive scare factor
  currentTaunt: string;
  lastTauntTime: number;
  characterIndex: number;
}

export function createInitialState(characterIndex: number): StareOffState {
  return {
    survivalTime: 0,
    startTime: 0,
    gameOver: false,
    failReason: null,
    blinkStartTime: null,
    lookAwayStartTime: null,
    eyeOpenness: 1,
    gazeCenter: 0,
    intensity: 0,
    currentTaunt: "",
    lastTauntTime: 0,
    characterIndex,
  };
}

export function processFrame(
  result: FaceLandmarkerResult,
  state: StareOffState,
  now: number
): StareOffState {
  if (state.gameOver) return state;

  const newState = { ...state };
  newState.survivalTime = now - state.startTime;

  // Progressive intensity (0-1 over 60 seconds)
  newState.intensity = Math.min(1, newState.survivalTime / 60000);

  // Cycle taunts every 3-5 seconds (faster as intensity increases)
  const tauntInterval = 5000 - newState.intensity * 2000;
  if (now - state.lastTauntTime > tauntInterval) {
    const character = CHARACTERS[state.characterIndex];
    const tauntIdx = Math.floor(Math.random() * character.taunts.length);
    newState.currentTaunt = character.taunts[tauntIdx];
    newState.lastTauntTime = now;
  }

  const blendshapes = result.faceBlendshapes?.[0]?.categories;
  if (!blendshapes) return newState;

  // Eye openness (average of both eyes)
  const eyeBlinkLeft = blendshapes.find((b) => b.categoryName === "eyeBlinkLeft")?.score ?? 0;
  const eyeBlinkRight = blendshapes.find((b) => b.categoryName === "eyeBlinkRight")?.score ?? 0;
  const blinkAvg = (eyeBlinkLeft + eyeBlinkRight) / 2;
  newState.eyeOpenness = 1 - blinkAvg;

  // Blink detection
  if (blinkAvg > BLINK_THRESHOLD) {
    if (state.blinkStartTime === null) {
      newState.blinkStartTime = now;
    } else if (now - state.blinkStartTime > BLINK_MAX_DURATION) {
      newState.gameOver = true;
      newState.failReason = "blink";
    }
  } else {
    newState.blinkStartTime = null;
  }

  // Gaze direction (look away detection)
  const eyeLookInLeft = blendshapes.find((b) => b.categoryName === "eyeLookInLeft")?.score ?? 0;
  const eyeLookOutLeft = blendshapes.find((b) => b.categoryName === "eyeLookOutLeft")?.score ?? 0;
  const eyeLookUpLeft = blendshapes.find((b) => b.categoryName === "eyeLookUpLeft")?.score ?? 0;
  const eyeLookDownLeft = blendshapes.find((b) => b.categoryName === "eyeLookDownLeft")?.score ?? 0;

  const gazeOffCenter = Math.max(eyeLookInLeft, eyeLookOutLeft, eyeLookUpLeft, eyeLookDownLeft);
  newState.gazeCenter = gazeOffCenter;

  if (gazeOffCenter > LOOK_AWAY_THRESHOLD) {
    if (state.lookAwayStartTime === null) {
      newState.lookAwayStartTime = now;
    } else if (now - state.lookAwayStartTime > LOOK_AWAY_DURATION) {
      newState.gameOver = true;
      newState.failReason = "look-away";
    }
  } else {
    newState.lookAwayStartTime = null;
  }

  return newState;
}
