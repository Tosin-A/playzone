import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const NOSE = 0;
// const LEFT_HIP = 23;
// const RIGHT_HIP = 24;

export interface PlayerState {
  punches: number;
  score: number; // power-weighted score
  currentCombo: number;
  bestCombo: number;
  dodges: number;
  speed: number; // punches per second
  punchTimestamps: number[];
  lastPunchHand: "left" | "right" | null;
  prevWristPositions: { leftX: number; leftY: number; rightX: number; rightY: number } | null;
  prevNoseY: number | null;
  lastDodgeTime: number;
}

export interface ShadowBoxingState {
  player1: PlayerState;
  player2: PlayerState;
  duration: number;
}

function createPlayerState(): PlayerState {
  return {
    punches: 0,
    score: 0,
    currentCombo: 0,
    bestCombo: 0,
    dodges: 0,
    speed: 0,
    punchTimestamps: [],
    lastPunchHand: null,
    prevWristPositions: null,
    prevNoseY: null,
    lastDodgeTime: 0,
  };
}

export function createInitialState(): ShadowBoxingState {
  return {
    player1: createPlayerState(),
    player2: createPlayerState(),
    duration: 0,
  };
}

const PUNCH_VELOCITY_THRESHOLD = 0.04; // normalized coords per frame
const PUNCH_POWER_MED = 0.07; // medium power threshold
const PUNCH_POWER_HEAVY = 0.11; // heavy power threshold
const DODGE_THRESHOLD = 0.04; // vertical movement of nose
const DODGE_COOLDOWN_MS = 500;

function getPunchPower(velocity: number): number {
  if (velocity >= PUNCH_POWER_HEAVY) return 3;
  if (velocity >= PUNCH_POWER_MED) return 2;
  return 1;
}

function detectPunchesForPlayer(
  landmarks: { x: number; y: number; z: number }[],
  playerState: PlayerState,
  now: number
): PlayerState {
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const nose = landmarks[NOSE];

  const newState = { ...playerState };

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !nose) {
    return newState;
  }

  const currPositions = {
    leftX: leftWrist.x,
    leftY: leftWrist.y,
    rightX: rightWrist.x,
    rightY: rightWrist.y,
  };

  // Detect punches via wrist velocity
  if (playerState.prevWristPositions) {
    const prev = playerState.prevWristPositions;

    const leftVelX = Math.abs(currPositions.leftX - prev.leftX);
    const leftVelY = Math.abs(currPositions.leftY - prev.leftY);
    const leftVel = Math.sqrt(leftVelX * leftVelX + leftVelY * leftVelY);

    const rightVelX = Math.abs(currPositions.rightX - prev.rightX);
    const rightVelY = Math.abs(currPositions.rightY - prev.rightY);
    const rightVel = Math.sqrt(rightVelX * rightVelX + rightVelY * rightVelY);

    const registerPunch = (hand: "left" | "right", vel: number) => {
      const lastPunchTime = newState.punchTimestamps[newState.punchTimestamps.length - 1] ?? 0;
      if (now - lastPunchTime <= 200) return;

      const power = getPunchPower(vel);
      newState.punches++;
      newState.score += power;
      newState.punchTimestamps = newState.punchTimestamps.length >= 20
        ? [...newState.punchTimestamps.slice(-19), now]
        : [...newState.punchTimestamps, now];

      const opposite = hand === "left" ? "right" : "left";
      if (newState.lastPunchHand === opposite) {
        newState.currentCombo++;
      } else {
        newState.currentCombo = 1;
      }
      newState.lastPunchHand = hand;
    };

    if (leftVel > PUNCH_VELOCITY_THRESHOLD && leftWrist.y < leftShoulder.y + 0.1) {
      registerPunch("left", leftVel);
    }

    if (rightVel > PUNCH_VELOCITY_THRESHOLD && rightWrist.y < rightShoulder.y + 0.1) {
      registerPunch("right", rightVel);
    }
  }

  // Detect dodges via nose vertical movement (with cooldown)
  if (playerState.prevNoseY !== null) {
    const noseDelta = Math.abs(nose.y - playerState.prevNoseY);
    if (noseDelta > DODGE_THRESHOLD && now - playerState.lastDodgeTime > DODGE_COOLDOWN_MS) {
      newState.dodges++;
      newState.lastDodgeTime = now;
    }
  }

  newState.bestCombo = Math.max(newState.bestCombo, newState.currentCombo);

  // Reset combo if no punch for 800ms
  const lastPunch = newState.punchTimestamps[newState.punchTimestamps.length - 1] ?? 0;
  if (now - lastPunch > 800 && newState.currentCombo > 0) {
    newState.currentCombo = 0;
  }

  // Speed calculation
  if (newState.punchTimestamps.length >= 2) {
    const recent = newState.punchTimestamps.slice(-10);
    const elapsed = (recent[recent.length - 1] - recent[0]) / 1000;
    if (elapsed > 0) {
      newState.speed = Math.round(((recent.length - 1) / elapsed) * 10) / 10;
    }
  }

  newState.prevWristPositions = currPositions;
  newState.prevNoseY = nose.y;

  return newState;
}

export function processPoseFrame(
  result: PoseLandmarkerResult,
  state: ShadowBoxingState,
  now: number,
  maxPlayers: 1 | 2 = 2
): ShadowBoxingState {
  const newState = { ...state };

  if (result.landmarks && result.landmarks.length >= 1) {
    newState.player1 = detectPunchesForPlayer(result.landmarks[0], state.player1, now);
  }

  if (maxPlayers >= 2 && result.landmarks && result.landmarks.length >= 2) {
    newState.player2 = detectPunchesForPlayer(result.landmarks[1], state.player2, now);
  }

  return newState;
}
