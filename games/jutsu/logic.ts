import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const NOSE = 0;

export type JutsuType = "rasengan" | "chidori" | "fireball" | "shadow-clone" | "summoning";

export interface JutsuMove {
  type: JutsuType;
  name: string;
  description: string;
  chakraColor: string;
  points: number;
}

export const JUTSUS: JutsuMove[] = [
  {
    type: "rasengan",
    name: "Rasengan",
    description: "Push one hand forward with force",
    chakraColor: "#00aaff",
    points: 10,
  },
  {
    type: "chidori",
    name: "Chidori",
    description: "Thrust arm down and forward like lightning",
    chakraColor: "#ffffff",
    points: 15,
  },
  {
    type: "fireball",
    name: "Fire Style: Fireball",
    description: "Both hands together near face, then push out",
    chakraColor: "#ff4400",
    points: 20,
  },
  {
    type: "shadow-clone",
    name: "Shadow Clone Jutsu",
    description: "Cross arms in front of chest",
    chakraColor: "#8844ff",
    points: 12,
  },
  {
    type: "summoning",
    name: "Summoning Jutsu",
    description: "Slam one hand down low",
    chakraColor: "#44ff88",
    points: 25,
  },
];

interface WristHistory {
  x: number;
  y: number;
  time: number;
}

export interface JutsuState {
  score: number;
  combo: number;
  bestCombo: number;
  lastJutsu: JutsuType | null;
  activeEffects: ActiveEffect[];
  jutsuCounts: Record<JutsuType, number>;
  leftWristHistory: WristHistory[];
  rightWristHistory: WristHistory[];
  cooldownUntil: number; // prevent double-fire
  startTime: number;
  totalJutsus: number;
}

export interface ActiveEffect {
  id: number;
  type: JutsuType;
  x: number;
  y: number;
  startTime: number;
}

let effectId = 0;

export function createInitialState(): JutsuState {
  return {
    score: 0,
    combo: 0,
    bestCombo: 0,
    lastJutsu: null,
    activeEffects: [],
    jutsuCounts: { rasengan: 0, chidori: 0, fireball: 0, "shadow-clone": 0, summoning: 0 },
    leftWristHistory: [],
    rightWristHistory: [],
    cooldownUntil: 0,
    startTime: 0,
    totalJutsus: 0,
  };
}

export function processFrame(
  result: PoseLandmarkerResult,
  state: JutsuState,
  now: number
): JutsuState {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return state;

  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const nose = landmarks[NOSE];

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !nose) return state;

  const newState = { ...state };

  // Update wrist histories (keep last 8 frames)
  newState.leftWristHistory = [...state.leftWristHistory.slice(-7), { x: leftWrist.x, y: leftWrist.y, time: now }];
  newState.rightWristHistory = [...state.rightWristHistory.slice(-7), { x: rightWrist.x, y: rightWrist.y, time: now }];

  // Remove expired effects (older than 1.5s)
  newState.activeEffects = state.activeEffects.filter((e) => now - e.startTime < 1500);

  // In cooldown
  if (now < state.cooldownUntil) return newState;

  // Calculate velocities
  const leftVel = getVelocity(newState.leftWristHistory);
  const rightVel = getVelocity(newState.rightWristHistory);

  let detected: JutsuType | null = null;
  let effectX = 0.5;
  let effectY = 0.5;

  // RASENGAN: one hand thrust forward fast (high velocity, wrist ahead of elbow)
  if (rightVel.speed > 0.06 && rightWrist.z < (rightElbow?.z ?? 0) - 0.05) {
    detected = "rasengan";
    effectX = rightWrist.x;
    effectY = rightWrist.y;
  } else if (leftVel.speed > 0.06 && leftWrist.z < (leftElbow?.z ?? 0) - 0.05) {
    detected = "rasengan";
    effectX = leftWrist.x;
    effectY = leftWrist.y;
  }

  // CHIDORI: arm thrust downward fast (high downward velocity)
  if (!detected && (rightVel.vy > 0.05 || leftVel.vy > 0.05)) {
    const hand = rightVel.vy > leftVel.vy ? "right" : "left";
    const wrist = hand === "right" ? rightWrist : leftWrist;
    detected = "chidori";
    effectX = wrist.x;
    effectY = wrist.y;
  }

  // FIREBALL: both hands near face then push out (both wrists were near nose, now far)
  if (!detected && newState.leftWristHistory.length >= 4 && newState.rightWristHistory.length >= 4) {
    const oldLeft = newState.leftWristHistory[0];
    const oldRight = newState.rightWristHistory[0];
    const wasNearFace = Math.abs(oldLeft.y - nose.y) < 0.12 && Math.abs(oldRight.y - nose.y) < 0.12;
    const nowFarFromFace = Math.abs(leftWrist.y - nose.y) > 0.15 || Math.abs(rightWrist.x - leftWrist.x) > 0.3;
    if (wasNearFace && nowFarFromFace && (leftVel.speed > 0.03 || rightVel.speed > 0.03)) {
      detected = "fireball";
      effectX = (leftWrist.x + rightWrist.x) / 2;
      effectY = (leftWrist.y + rightWrist.y) / 2;
    }
  }

  // SHADOW CLONE: arms crossed over chest
  if (!detected) {
    const leftCrossedRight = leftWrist.x > rightShoulder.x;
    const rightCrossedLeft = rightWrist.x < leftShoulder.x;
    const atChestLevel = Math.abs(leftWrist.y - leftShoulder.y) < 0.15 && Math.abs(rightWrist.y - rightShoulder.y) < 0.15;
    if (leftCrossedRight && rightCrossedLeft && atChestLevel) {
      detected = "shadow-clone";
      effectX = 0.5;
      effectY = leftShoulder.y;
    }
  }

  // SUMMONING: one hand slammed low (wrist below hip level with downward velocity)
  if (!detected) {
    const hipY = 0.65; // approximate hip level in normalized coords
    if ((rightWrist.y > hipY && rightVel.vy > 0.04) || (leftWrist.y > hipY && leftVel.vy > 0.04)) {
      detected = "summoning";
      const wrist = rightWrist.y > leftWrist.y ? rightWrist : leftWrist;
      effectX = wrist.x;
      effectY = wrist.y;
    }
  }

  if (detected) {
    const jutsu = JUTSUS.find((j) => j.type === detected)!;
    const comboMultiplier = state.lastJutsu !== detected ? Math.min(3, 1 + state.combo * 0.5) : 1;

    newState.score = state.score + Math.round(jutsu.points * comboMultiplier);
    newState.combo = state.lastJutsu !== null && state.lastJutsu !== detected ? state.combo + 1 : 1;
    newState.bestCombo = Math.max(newState.bestCombo, newState.combo);
    newState.lastJutsu = detected;
    newState.totalJutsus = state.totalJutsus + 1;
    newState.jutsuCounts = { ...state.jutsuCounts, [detected]: state.jutsuCounts[detected] + 1 };
    newState.cooldownUntil = now + 600; // 600ms cooldown between moves
    newState.activeEffects = [
      ...newState.activeEffects,
      { id: effectId++, type: detected, x: effectX, y: effectY, startTime: now },
    ];
  }

  return newState;
}

function getVelocity(history: WristHistory[]): { speed: number; vx: number; vy: number } {
  if (history.length < 3) return { speed: 0, vx: 0, vy: 0 };
  const recent = history[history.length - 1];
  const old = history[history.length - 3];
  const dt = recent.time - old.time;
  if (dt === 0) return { speed: 0, vx: 0, vy: 0 };
  const vx = (recent.x - old.x);
  const vy = (recent.y - old.y);
  return { speed: Math.sqrt(vx * vx + vy * vy), vx, vy };
}
