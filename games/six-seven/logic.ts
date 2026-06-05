import { PoseLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const NOSE = 0;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

// Minimum landmark visibility (0..1) to trust a coordinate
const MIN_VISIBILITY = 0.5;

export type DetectionQuality = "none" | "head-only" | "full-body";

export interface SixSevenState {
  count: number;
  lastHand: "left" | "right" | null;
  isLeftUp: boolean;
  isRightUp: boolean;
  streak: number;
  bestStreak: number;
  tempo: number; // reps per second
  timestamps: number[];
  detectionQuality: DetectionQuality;
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
    detectionQuality: "none",
  };
}

function visible(lm: NormalizedLandmark | undefined): boolean {
  return !!lm && (lm.visibility ?? 1) >= MIN_VISIBILITY;
}

export function processPoseFrame(
  result: PoseLandmarkerResult,
  state: SixSevenState,
  now: number
): SixSevenState {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return { ...state, detectionQuality: "none" };

  const nose = landmarks[NOSE];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];

  // Need at least head + both wrists to attempt detection
  if (!visible(nose) || !leftWrist || !rightWrist) {
    return { ...state, detectionQuality: "none" };
  }

  // Pick a reference Y for "up" — prefer shoulders (real upper-body
  // framing), fall back to ears/nose (selfie framing). On a phone held
  // close, shoulders are usually off-frame.
  let leftRefY: number;
  let rightRefY: number;
  let quality: DetectionQuality;

  if (visible(leftShoulder) && visible(rightShoulder)) {
    // Full body — hand counts as "up" when wrist is above the shoulder
    leftRefY = leftShoulder.y - 0.04;
    rightRefY = rightShoulder.y - 0.04;
    quality = "full-body";
  } else {
    // Head-only fallback — hand counts as "up" when wrist is roughly
    // at ear/nose height (i.e. you raised your arm up by your face).
    // We compare to a Y line slightly *below* the nose so a hand by
    // the cheek still registers.
    const earY = visible(leftEar) && visible(rightEar)
      ? (leftEar.y + rightEar.y) / 2
      : nose.y;
    const headLine = earY + 0.05;
    leftRefY = headLine;
    rightRefY = headLine;
    quality = "head-only";
  }

  const leftUp = leftWrist.y < leftRefY;
  const rightUp = rightWrist.y < rightRefY;

  const newState = {
    ...state,
    isLeftUp: leftUp,
    isRightUp: rightUp,
    detectionQuality: quality,
  };

  // A valid rep is one hand up, the other down, and the hand that's
  // up is the OPPOSITE of the last counted hand (forces alternation).
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

  // Tempo: reps per second over last few reps
  if (newState.timestamps.length >= 2) {
    const recent = newState.timestamps.slice(-6);
    const elapsed = (recent[recent.length - 1] - recent[0]) / 1000;
    if (elapsed > 0) {
      newState.tempo = Math.round(((recent.length - 1) / elapsed) * 10) / 10;
    }
  }

  return newState;
}
