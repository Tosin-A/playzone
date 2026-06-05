import { PoseLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

// Minimum landmark visibility (0..1) to trust a coordinate
const MIN_VISIBILITY = 0.5;

// Hands count as "alternating" when one wrist is at least this far above
// the other in normalized image coords. Tuned so a chest-level pump
// triggers but jitter on a held pose doesn't.
const HAND_SEPARATION = 0.06;

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
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];

  // We only need both wrists. The gesture is relative — one hand higher
  // than the other — so it works at any body height (head, chest, waist).
  if (!leftWrist || !rightWrist) {
    return { ...state, detectionQuality: "none" };
  }

  // Track framing quality just for the UI hint, not for gating reps.
  const quality: DetectionQuality =
    visible(leftShoulder) && visible(rightShoulder)
      ? "full-body"
      : visible(nose)
      ? "head-only"
      : "none";

  // A hand is "up" when it sits meaningfully above the other hand.
  // This counts any alternating arm pump, not just hands above the head.
  const dy = leftWrist.y - rightWrist.y; // negative => left higher
  const leftUp = dy < -HAND_SEPARATION;
  const rightUp = dy > HAND_SEPARATION;

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
