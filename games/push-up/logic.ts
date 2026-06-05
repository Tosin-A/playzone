import { PoseLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;

// Tuned for selfie-on-the-floor phone framing where the chin frequently
// clips at the bottom of a rep and nose travel is a small fraction of
// the frame. Erring lenient — false positives are nicer than the
// counter sitting at 0 the entire game.
const MIN_VISIBILITY = 0.3;
const CALIBRATION_FRAMES = 5;
const MIN_RANGE = 0.02;
// Hysteresis thresholds within the observed range (0 = top, 1 = bottom).
// Gap of 0.15 still defeats sub-pixel jitter without double-counting.
const DOWN_THRESHOLD = 0.55;
const UP_THRESHOLD = 0.40;

export type Phase = "up" | "down" | "unknown";

export interface PushUpState {
  count: number;
  phase: Phase;
  /** Lowest observed nose Y (largest number — Y grows downward). */
  yMin: number;
  /** Highest observed nose Y (smallest number). */
  yMax: number;
  /** Current normalized depth 0 (up) → 1 (down). */
  depth: number;
  framesSeen: number;
  bestStreak: number;
  streak: number;
  /** Tempo in reps/sec over last few reps */
  tempo: number;
  timestamps: number[];
  /** True when we have enough range to confidently count */
  calibrated: boolean;
}

export function createInitialState(): PushUpState {
  return {
    count: 0,
    phase: "unknown",
    yMin: 0,
    yMax: 1,
    depth: 0,
    framesSeen: 0,
    bestStreak: 0,
    streak: 0,
    tempo: 0,
    timestamps: [],
    calibrated: false,
  };
}

function visible(lm: NormalizedLandmark | undefined): boolean {
  return !!lm && (lm.visibility ?? 1) >= MIN_VISIBILITY;
}

/**
 * Track nose vertical position. We pick "nose" because:
 *   - it's visible in every framing (shoulders often clip when phone is
 *     on the floor pointing up at your face)
 *   - it has the largest absolute Y travel during a push-up rep
 *
 * Counting is a 2-state machine with hysteresis to avoid double-counts
 * from camera jitter / sub-pixel noise.
 */
export function processPoseFrame(
  result: PoseLandmarkerResult,
  state: PushUpState,
  now: number,
): PushUpState {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return state;

  const nose = landmarks[NOSE];
  if (!visible(nose)) return state;

  // We also require at least ONE shoulder to be in frame so we're not
  // counting random head bobs in the kitchen.
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];
  const hasUpperBody =
    visible(leftShoulder) || visible(rightShoulder) ||
    visible(leftElbow) || visible(rightElbow);
  if (!hasUpperBody) return state;

  // Track Y range (in MediaPipe, y grows downward: 0 = top of frame).
  const y = nose.y;
  const yMin = Math.max(state.yMin, y); // lowest the nose has been (large y)
  const yMax = Math.min(state.yMax === 1 && state.framesSeen === 0 ? y : state.yMax, y);
  const range = yMin - yMax;

  const framesSeen = state.framesSeen + 1;
  const calibrated = framesSeen >= CALIBRATION_FRAMES && range >= MIN_RANGE;

  // depth = 0 when nose is at its highest point (push-up "up" / arms extended)
  //       = 1 when nose is at its lowest point (chest near floor)
  const depth = range > 0 ? (y - yMax) / range : 0;

  const next: PushUpState = {
    ...state,
    yMin,
    yMax,
    framesSeen,
    depth,
    calibrated,
  };

  if (!calibrated) {
    return next;
  }

  // 2-state machine with hysteresis
  let newPhase: Phase = state.phase;
  if (state.phase !== "down" && depth >= DOWN_THRESHOLD) {
    newPhase = "down";
  } else if (state.phase === "down" && depth <= UP_THRESHOLD) {
    newPhase = "up";
    next.count = state.count + 1;
    next.timestamps = [...state.timestamps.slice(-19), now];
    next.streak = state.streak + 1;
    next.bestStreak = Math.max(state.bestStreak, next.streak);
  } else if (state.phase === "unknown" && depth <= UP_THRESHOLD) {
    newPhase = "up";
  }
  next.phase = newPhase;

  // tempo: reps/sec over the last few
  if (next.timestamps.length >= 2) {
    const recent = next.timestamps.slice(-6);
    const elapsed = (recent[recent.length - 1] - recent[0]) / 1000;
    if (elapsed > 0) {
      next.tempo = Math.round(((recent.length - 1) / elapsed) * 10) / 10;
    }
  }

  return next;
}
