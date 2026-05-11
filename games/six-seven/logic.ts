import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmarks indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;

export interface SixSevenState {
  count: number;
  lastHand: "left" | "right" | null;
  isLeftUp: boolean;
  isRightUp: boolean;
  streak: number;
  bestStreak: number;
  tempo: number; // reps per second
  timestamps: number[];
}

export function createInitialState(): SixSevenState {
  return {
    count: 0,
    lastHand: null,
    isLeftUp: false,
    isRightUp: false,
    streak: 0,
    bestStreak: 0,
    tempo: 0,
    timestamps: [],
  };
}

export function processPoseFrame(
  result: PoseLandmarkerResult,
  state: SixSevenState,
  now: number
): SixSevenState {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return state;

  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return state;

  // Hand is "up" if wrist is above shoulder level (y decreases going up in normalized coords)
  const leftUp = leftWrist.y < leftShoulder.y - 0.05;
  const rightUp = rightWrist.y < rightShoulder.y - 0.05;

  const newState = { ...state, isLeftUp: leftUp, isRightUp: rightUp };

  // Detect a valid rep: one hand up while the other is down, alternating
  if (leftUp && !rightUp && state.lastHand !== "left") {
    newState.count = state.count + 1;
    newState.lastHand = "left";
    newState.timestamps = [...state.timestamps.slice(-19), now];
    newState.streak = state.lastHand === "right" || state.lastHand === null ? state.streak + 1 : 1;
  } else if (rightUp && !leftUp && state.lastHand !== "right") {
    newState.count = state.count + 1;
    newState.lastHand = "right";
    newState.timestamps = [...state.timestamps.slice(-19), now];
    newState.streak = state.lastHand === "left" || state.lastHand === null ? state.streak + 1 : 1;
  }

  newState.bestStreak = Math.max(newState.bestStreak, newState.streak);

  // Calculate tempo (reps per second over last few reps)
  if (newState.timestamps.length >= 2) {
    const recent = newState.timestamps.slice(-6);
    const elapsed = (recent[recent.length - 1] - recent[0]) / 1000;
    if (elapsed > 0) {
      newState.tempo = Math.round(((recent.length - 1) / elapsed) * 10) / 10;
    }
  }

  return newState;
}
