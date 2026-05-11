import { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const SMILE_THRESHOLD = 0.35; // blendshape score threshold for a smile
const NO_FACE_TIMEOUT = 3000; // ms without face = auto-fail

export interface DontSmileState {
  survivalTime: number; // ms survived
  smileDetected: boolean;
  noFaceDetected: boolean;
  lastFaceTime: number;
  smileIntensity: number; // 0-1 current smile level
  startTime: number;
  gameOver: boolean;
  failReason: "smile" | "no-face" | null;
}

export function createInitialState(): DontSmileState {
  return {
    survivalTime: 0,
    smileDetected: false,
    noFaceDetected: false,
    lastFaceTime: 0,
    smileIntensity: 0,
    startTime: 0,
    gameOver: false,
    failReason: null,
  };
}

export function processFrame(
  result: FaceLandmarkerResult,
  state: DontSmileState,
  now: number
): DontSmileState {
  if (state.gameOver) return state;

  const newState = { ...state };
  newState.survivalTime = now - state.startTime;

  const blendshapes = result.faceBlendshapes?.[0]?.categories;

  if (!blendshapes || blendshapes.length === 0) {
    // No face detected
    if (now - state.lastFaceTime > NO_FACE_TIMEOUT && state.lastFaceTime > 0) {
      newState.gameOver = true;
      newState.noFaceDetected = true;
      newState.failReason = "no-face";
    }
    return newState;
  }

  newState.lastFaceTime = now;

  // Get smile scores
  const smileLeft = blendshapes.find((b) => b.categoryName === "mouthSmileLeft")?.score ?? 0;
  const smileRight = blendshapes.find((b) => b.categoryName === "mouthSmileRight")?.score ?? 0;
  const smileAvg = (smileLeft + smileRight) / 2;

  newState.smileIntensity = smileAvg;

  if (smileAvg > SMILE_THRESHOLD) {
    newState.smileDetected = true;
    newState.gameOver = true;
    newState.failReason = "smile";
  }

  return newState;
}
