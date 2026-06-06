import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// Target poses defined as normalized joint angle relationships
export interface TargetPose {
  name: string;
  description: string;
  /** Path under /public — the orange stickman the player should mimic. */
  image: string;
  // Key landmarks that must be in specific positions relative to each other
  conditions: PoseCondition[];
  /**
   * Optional per-pose override of the global PASS_RATIO. Useful for poses
   * that have left/right mirror conditions where only one side is reliable
   * (e.g. a squat captured side-on: the back leg's landmarks land near the
   * front leg's and can't both be trusted).
   */
  passRatio?: number;
}

interface PoseCondition {
  // Which landmark must be above/below/left/right of another
  landmark: number;
  relativeTo: number;
  direction: "above" | "below" | "left" | "right";
  threshold: number; // minimum distance in normalized coords
}

// MediaPipe landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const NOSE = 0;

// Thresholds tuned for a selfie phone frame — arms can't extend as far
// off-screen as on a desktop full-body shot, so the bars are lower than
// strict anatomical correctness would require. Pair with the partial
// match rule below (see PASS_RATIO).
export const TARGET_POSES: TargetPose[] = [
  {
    name: "T-Pose",
    description: "Arms straight out to the sides",
    image: "/games/poses/t-pose.png",
    // MediaPipe sees the un-mirrored frame, and LEFT_* are anatomical-left
    // landmarks — so the anatomical left wrist lives on the image's RIGHT
    // (high x) when extended sideways. The directional check has to mirror
    // that, not the user's on-screen view.
    conditions: [
      { landmark: LEFT_WRIST, relativeTo: LEFT_SHOULDER, direction: "right", threshold: 0.08 },
      { landmark: RIGHT_WRIST, relativeTo: RIGHT_SHOULDER, direction: "left", threshold: 0.08 },
      { landmark: LEFT_WRIST, relativeTo: LEFT_SHOULDER, direction: "above", threshold: -0.12 },
      { landmark: RIGHT_WRIST, relativeTo: RIGHT_SHOULDER, direction: "above", threshold: -0.12 },
    ],
  },
  {
    name: "Hands Up",
    description: "Both hands above your head",
    image: "/games/poses/hands-up.png",
    conditions: [
      { landmark: LEFT_WRIST, relativeTo: NOSE, direction: "above", threshold: 0.02 },
      { landmark: RIGHT_WRIST, relativeTo: NOSE, direction: "above", threshold: 0.02 },
    ],
  },
  {
    name: "Squat",
    description: "Bend your knees",
    image: "/games/poses/squat.png",
    // A real squat brings the hip DOWN toward knee height. In screen
    // coords y grows downward, so the squat predicate is "HIP.y is at or
    // below KNEE.y - 0.12" — written as HIP "below" KNEE with -0.12 slack
    // (i.e. HIP.y - KNEE.y > -0.12). The previous "above" form was
    // satisfied by a standing pose, so the old squat triggered instantly.
    //
    // passRatio: 0.5 lets a single leg satisfy the pose. When the player
    // turns side-on, the back leg's landmarks overlap the front leg's and
    // their visibility tanks — but the camera-facing leg's hip→knee
    // relationship still cleanly reflects the squat.
    conditions: [
      { landmark: LEFT_HIP, relativeTo: LEFT_KNEE, direction: "below", threshold: -0.12 },
      { landmark: RIGHT_HIP, relativeTo: RIGHT_KNEE, direction: "below", threshold: -0.12 },
    ],
    passRatio: 0.5,
  },
  {
    name: "Right Arm Up",
    description: "Right arm straight up",
    image: "/games/poses/right-arm-up.jpg",
    conditions: [
      { landmark: RIGHT_WRIST, relativeTo: NOSE, direction: "above", threshold: 0.02 },
      { landmark: LEFT_WRIST, relativeTo: LEFT_SHOULDER, direction: "below", threshold: -0.05 },
    ],
  },
  {
    name: "Left Arm Up",
    description: "Left arm straight up",
    image: "/games/poses/left-arm-up.png",
    conditions: [
      { landmark: LEFT_WRIST, relativeTo: NOSE, direction: "above", threshold: 0.02 },
      { landmark: RIGHT_WRIST, relativeTo: RIGHT_SHOULDER, direction: "below", threshold: -0.05 },
    ],
  },
  {
    name: "Arms Crossed",
    description: "Cross your arms over your chest",
    image: "/games/poses/arms-crossed.png",
    conditions: [
      { landmark: LEFT_WRIST, relativeTo: RIGHT_SHOULDER, direction: "right", threshold: -0.10 },
      { landmark: RIGHT_WRIST, relativeTo: LEFT_SHOULDER, direction: "left", threshold: -0.10 },
    ],
  },
  {
    name: "Wide Stance",
    description: "Legs wide, arms on hips",
    image: "/games/poses/wide-stance.png",
    conditions: [
      { landmark: LEFT_WRIST, relativeTo: LEFT_HIP, direction: "above", threshold: -0.12 },
      { landmark: RIGHT_WRIST, relativeTo: RIGHT_HIP, direction: "above", threshold: -0.12 },
    ],
  },
];

/**
 * Fraction of a pose's conditions that must be true for it to count as
 * matched. Anything less than 1.0 lets you complete a pose even if one
 * limb is slightly off-frame or the model's confidence wobbles for a
 * single landmark — which is the dominant failure mode on mobile.
 */
const PASS_RATIO = 0.55;

/**
 * Global leniency knob. We subtract this from every per-condition
 * threshold during comparison: positive thresholds (must-be-this-far-in-
 * direction) shrink, negative thresholds (allowed slack in the wrong
 * direction) grow. One number to dial difficulty up or down later.
 */
const RELAX = 0.04;

/** Total round length. Pose pool cycles continuously until time's up. */
export const GAME_DURATION_MS = 15000;

export interface PoseOffState {
  currentPoseIndex: number;
  /** Score = number of poses matched in the round. Higher is better. */
  posesCompleted: number;
  /** Shuffled order through the pool; loops modulo length on each match. */
  poseOrder: number[];
  matchProgress: number; // 0-100, how close to matching
  startTime: number;
  poseStartTime: number;
  poseTimes: number[]; // time taken per pose in ms
  finished: boolean;
  /** Total round duration captured at finish — always GAME_DURATION_MS. */
  totalTime: number;
}

export function createInitialState(): PoseOffState {
  // Shuffle the whole pool so cycling order varies between rounds.
  const shuffled = [...Array(TARGET_POSES.length).keys()]
    .sort(() => Math.random() - 0.5);

  return {
    currentPoseIndex: 0,
    posesCompleted: 0,
    poseOrder: shuffled,
    matchProgress: 0,
    startTime: 0,
    poseStartTime: 0,
    poseTimes: [],
    finished: false,
    totalTime: 0,
  };
}

export function checkPoseMatch(
  result: PoseLandmarkerResult,
  state: PoseOffState,
  now: number
): PoseOffState {
  if (state.finished) return state;

  const landmarks = result.landmarks?.[0];
  if (!landmarks) return { ...state, matchProgress: 0 };

  const currentPose = TARGET_POSES[state.poseOrder[state.currentPoseIndex]];
  if (!currentPose) return state;

  // Check how many conditions are met
  let conditionsMet = 0;
  for (const cond of currentPose.conditions) {
    const lm = landmarks[cond.landmark];
    const rel = landmarks[cond.relativeTo];
    if (!lm || !rel) continue;

    const t = cond.threshold - RELAX;
    let met = false;
    switch (cond.direction) {
      case "above":
        met = rel.y - lm.y > t;
        break;
      case "below":
        met = lm.y - rel.y > t;
        break;
      case "left":
        met = rel.x - lm.x > t;
        break;
      case "right":
        met = lm.x - rel.x > t;
        break;
    }
    if (met) conditionsMet++;
  }

  const progress = Math.round((conditionsMet / currentPose.conditions.length) * 100);
  const newState = { ...state, matchProgress: progress };

  // Pose matched when we hit the pass ratio. A single flickery landmark
  // shouldn't gate the whole pose. Per-pose passRatio wins over the
  // global default — see Squat for why.
  const ratio = currentPose.passRatio ?? PASS_RATIO;
  const required = Math.max(1, Math.ceil(currentPose.conditions.length * ratio));
  if (conditionsMet >= required) {
    const poseTime = now - state.poseStartTime;
    newState.poseTimes = [...state.poseTimes, poseTime];
    newState.posesCompleted = state.posesCompleted + 1;
    // Cycle through the pool — when we hit the end, wrap to the start.
    // Round only ends when the timer runs out (handled in the game loop).
    newState.currentPoseIndex = (state.currentPoseIndex + 1) % state.poseOrder.length;
    newState.poseStartTime = now;
    newState.matchProgress = 0;
  }

  return newState;
}

/** Force-finish the round — called when the game loop sees time's up. */
export function finishRound(state: PoseOffState, now: number): PoseOffState {
  if (state.finished) return state;
  return {
    ...state,
    finished: true,
    totalTime: now - state.startTime,
  };
}

export function getCurrentTargetPose(state: PoseOffState): TargetPose | null {
  if (state.finished) return null;
  const idx = state.poseOrder[state.currentPoseIndex];
  return TARGET_POSES[idx] ?? null;
}
