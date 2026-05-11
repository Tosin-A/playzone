import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// Key landmarks for pose comparison (upper body focus)
const COMPARE_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26]; // nose, shoulders, elbows, wrists, hips, knees

export interface NormalizedPose {
  points: { x: number; y: number }[];
}

export function extractNormalizedPose(result: PoseLandmarkerResult): NormalizedPose | null {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return null;

  // Get bounding box for normalization
  const selected = COMPARE_LANDMARKS.map((i) => landmarks[i]).filter(Boolean);
  if (selected.length < 8) return null;

  const xs = selected.map((l) => l.x);
  const ys = selected.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Normalize to 0-1 range
  const points = COMPARE_LANDMARKS.map((i) => {
    const lm = landmarks[i];
    if (!lm) return { x: 0.5, y: 0.5 };
    return {
      x: (lm.x - minX) / rangeX,
      y: (lm.y - minY) / rangeY,
    };
  });

  return { points };
}

export function comparePoses(a: NormalizedPose, b: NormalizedPose): number {
  if (a.points.length !== b.points.length) return 0;

  // Flatten to vectors
  const vecA: number[] = [];
  const vecB: number[] = [];
  for (let i = 0; i < a.points.length; i++) {
    vecA.push(a.points[i].x, a.points[i].y);
    vecB.push(b.points[i].x, b.points[i].y);
  }

  // Cosine similarity
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;

  const similarity = dot / denom;
  // Convert to 0-100 score (cosine sim ranges roughly 0.7-1.0 for reasonable poses)
  return Math.min(100, Math.max(0, Math.round((similarity - 0.7) * 333)));
}

export interface MirrorState {
  phase: "p1-posing" | "capturing" | "p2-matching" | "scoring" | "done";
  targetPose: NormalizedPose | null;
  currentPose: NormalizedPose | null;
  score: number;
  roundScores: number[];
  currentRound: number;
  totalRounds: number;
  countdown: number;
  matchProgress: number;
}

export function createInitialState(rounds: number = 5): MirrorState {
  return {
    phase: "p1-posing",
    targetPose: null,
    currentPose: null,
    score: 0,
    roundScores: [],
    currentRound: 1,
    totalRounds: rounds,
    countdown: 0,
    matchProgress: 0,
  };
}
