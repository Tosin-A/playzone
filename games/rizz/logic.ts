import { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const RIZZLINES: Record<string, string[]> = {
  high: [
    "Certified menace",
    "Main character energy",
    "They're not ready for you",
    "Dangerously smooth",
    "Built different",
  ],
  mid: [
    "Mid energy detected",
    "Room temperature rizz",
    "You aight I guess",
    "Could be worse tbh",
    "Solid 5/10 vibes",
  ],
  low: [
    "Touch grass immediately",
    "The camera is scared",
    "Negative aura detected",
    "Download a personality",
    "Alexa play Despacito",
  ],
};

export interface LiveScores {
  smile: number;
  eyeContact: number;
  headTilt: number;
  jawline: number;
}

export function computeLiveScores(results: FaceLandmarkerResult[]): LiveScores {
  if (results.length === 0) return { smile: 0, eyeContact: 0, headTilt: 0, jawline: 0 };

  const avgBlendshapes = averageBlendshapes(results);

  const smileLeft = avgBlendshapes["mouthSmileLeft"] ?? 0;
  const smileRight = avgBlendshapes["mouthSmileRight"] ?? 0;
  const smile = Math.min(100, Math.round(((smileLeft + smileRight) / 2) * 140));

  const eyeLookDown = avgBlendshapes["eyeLookDownLeft"] ?? 0;
  const eyeLookUp = avgBlendshapes["eyeLookUpLeft"] ?? 0;
  const lookStraight = 1 - Math.min(1, eyeLookDown + eyeLookUp);
  const eyeContact = Math.min(100, Math.round(lookStraight * 120));

  const headLeft = avgBlendshapes["headTiltLeft"] ?? 0;
  const headRight = avgBlendshapes["headTiltRight"] ?? 0;
  const tilt = (headLeft + headRight) / 2;
  const tiltGoodness = tilt > 0.05 && tilt < 0.4 ? 1 - Math.abs(tilt - 0.2) * 3 : 0.2;
  const headTilt = Math.min(100, Math.round(tiltGoodness * 100));

  const jawOpen = avgBlendshapes["jawOpen"] ?? 0;
  const jawline = jawOpen < 0.05 ? 72 : jawOpen < 0.15 ? 100 : jawOpen < 0.4 ? 60 : 20;

  return { smile, eyeContact, headTilt, jawline };
}

export interface RizzScore {
  total: number;
  smileScore: number;
  eyeContactScore: number;
  headTiltScore: number;
  jawlineScore: number;
  oneLiner: string;
}

export function computeRizzScore(results: FaceLandmarkerResult[]): RizzScore {
  if (results.length === 0) {
    return { total: 0, smileScore: 0, eyeContactScore: 0, headTiltScore: 0, jawlineScore: 0, oneLiner: "No face detected" };
  }

  // Average blendshapes across frames
  const avgBlendshapes = averageBlendshapes(results);

  // Smile score (0-25): mouth smile left + right
  const smileLeft = avgBlendshapes["mouthSmileLeft"] ?? 0;
  const smileRight = avgBlendshapes["mouthSmileRight"] ?? 0;
  const smileScore = Math.min(25, Math.round(((smileLeft + smileRight) / 2) * 35));

  // Eye contact (0-25): low eye squint means eyes are open and looking at camera
  const eyeLookDown = avgBlendshapes["eyeLookDownLeft"] ?? 0;
  const eyeLookUp = avgBlendshapes["eyeLookUpLeft"] ?? 0;
  const lookStraight = 1 - Math.min(1, eyeLookDown + eyeLookUp);
  const eyeContactScore = Math.min(25, Math.round(lookStraight * 30));

  // Head tilt (0-25): slight tilt is good, too much is bad
  const headLeft = avgBlendshapes["headTiltLeft"] ?? 0;
  const headRight = avgBlendshapes["headTiltRight"] ?? 0;
  const tilt = (headLeft + headRight) / 2;
  // Sweet spot is around 0.1-0.3
  const tiltGoodness = tilt > 0.05 && tilt < 0.4 ? 1 - Math.abs(tilt - 0.2) * 3 : 0.2;
  const headTiltScore = Math.min(25, Math.round(tiltGoodness * 25));

  // Jawline (0-25): jaw open slightly = confident, too much = goofy
  const jawOpen = avgBlendshapes["jawOpen"] ?? 0;
  const jawScore = jawOpen < 0.05 ? 18 : jawOpen < 0.15 ? 25 : jawOpen < 0.4 ? 15 : 5;
  const jawlineScore = Math.min(25, jawScore);

  const total = Math.min(100, smileScore + eyeContactScore + headTiltScore + jawlineScore);

  // Pick a one-liner
  const tier = total >= 70 ? "high" : total >= 40 ? "mid" : "low";
  const lines = RIZZLINES[tier];
  const oneLiner = lines[Math.floor(Math.random() * lines.length)];

  return { total, smileScore, eyeContactScore, headTiltScore, jawlineScore, oneLiner };
}

function averageBlendshapes(results: FaceLandmarkerResult[]): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const result of results) {
    const shapes = result.faceBlendshapes?.[0]?.categories;
    if (!shapes) continue;
    for (const shape of shapes) {
      sums[shape.categoryName] = (sums[shape.categoryName] ?? 0) + shape.score;
      counts[shape.categoryName] = (counts[shape.categoryName] ?? 0) + 1;
    }
  }

  const avg: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    avg[key] = sums[key] / counts[key];
  }
  return avg;
}
