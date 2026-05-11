import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

// MediaPipe Pose landmark indices
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const NOSE = 0;
// const LEFT_HIP = 23;
// const RIGHT_HIP = 24;

interface PunchEvent {
  time: number;
  hand: "left" | "right";
  player: 1 | 2;
}

interface DodgeEvent {
  time: number;
  player: 1 | 2;
}

export interface PlayerState {
  punches: number;
  combos: number;
  currentCombo: number;
  bestCombo: number;
  dodges: number;
  speed: number; // punches per second
  punchTimestamps: number[];
  lastPunchHand: "left" | "right" | null;
  prevWristPositions: { leftX: number; leftY: number; rightX: number; rightY: number } | null;
  prevNoseY: number | null;
}

export interface ShadowBoxingState {
  player1: PlayerState;
  player2: PlayerState;
  duration: number;
  events: (PunchEvent | DodgeEvent)[];
}

function createPlayerState(): PlayerState {
  return {
    punches: 0,
    combos: 0,
    currentCombo: 0,
    bestCombo: 0,
    dodges: 0,
    speed: 0,
    punchTimestamps: [],
    lastPunchHand: null,
    prevWristPositions: null,
    prevNoseY: null,
  };
}

export function createInitialState(): ShadowBoxingState {
  return {
    player1: createPlayerState(),
    player2: createPlayerState(),
    duration: 0,
    events: [],
  };
}

const PUNCH_VELOCITY_THRESHOLD = 0.04; // normalized coords per frame
const DODGE_THRESHOLD = 0.03; // vertical movement of nose

function detectPunchesForPlayer(
  landmarks: { x: number; y: number; z: number }[],
  playerState: PlayerState,
  now: number,
  playerNum: 1 | 2
): { state: PlayerState; newPunches: PunchEvent[]; newDodges: DodgeEvent[] } {
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const nose = landmarks[NOSE];

  const newPunches: PunchEvent[] = [];
  const newDodges: DodgeEvent[] = [];
  const newState = { ...playerState };

  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !nose) {
    return { state: newState, newPunches, newDodges };
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

    // Left punch: high velocity + wrist extended forward (past shoulder on z-axis roughly)
    if (leftVel > PUNCH_VELOCITY_THRESHOLD && leftWrist.y < leftShoulder.y + 0.1) {
      // Debounce: don't count if same hand punched within 200ms
      const lastPunchTime = playerState.punchTimestamps[playerState.punchTimestamps.length - 1] ?? 0;
      if (now - lastPunchTime > 200) {
        newState.punches++;
        newState.punchTimestamps = [...playerState.punchTimestamps.slice(-19), now];
        newPunches.push({ time: now, hand: "left", player: playerNum });

        if (playerState.lastPunchHand === "right") {
          newState.currentCombo++;
        } else {
          newState.currentCombo = 1;
        }
        newState.lastPunchHand = "left";
      }
    }

    if (rightVel > PUNCH_VELOCITY_THRESHOLD && rightWrist.y < rightShoulder.y + 0.1) {
      const lastPunchTime = playerState.punchTimestamps[playerState.punchTimestamps.length - 1] ?? 0;
      if (now - lastPunchTime > 200) {
        newState.punches++;
        newState.punchTimestamps = [...playerState.punchTimestamps.slice(-19), now];
        newPunches.push({ time: now, hand: "right", player: playerNum });

        if (playerState.lastPunchHand === "left") {
          newState.currentCombo++;
        } else {
          newState.currentCombo = 1;
        }
        newState.lastPunchHand = "right";
      }
    }
  }

  // Detect dodges via nose vertical movement
  if (playerState.prevNoseY !== null) {
    const noseDelta = Math.abs(nose.y - playerState.prevNoseY);
    if (noseDelta > DODGE_THRESHOLD) {
      newState.dodges++;
      newDodges.push({ time: now, player: playerNum });
    }
  }

  // Update combo tracking
  if (newState.currentCombo >= 3 && newState.currentCombo > playerState.currentCombo) {
    newState.combos = Math.floor(newState.currentCombo / 3);
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

  return { state: newState, newPunches, newDodges };
}

export function processPoseFrame(
  result: PoseLandmarkerResult,
  state: ShadowBoxingState,
  now: number
): ShadowBoxingState {
  const newState = { ...state };

  // Player 1 is the first detected pose, Player 2 is the second
  if (result.landmarks && result.landmarks.length >= 1) {
    const { state: p1State, newPunches, newDodges } = detectPunchesForPlayer(
      result.landmarks[0],
      state.player1,
      now,
      1
    );
    newState.player1 = p1State;
    newState.events = [...state.events, ...newPunches, ...newDodges];
  }

  if (result.landmarks && result.landmarks.length >= 2) {
    const { state: p2State, newPunches, newDodges } = detectPunchesForPlayer(
      result.landmarks[1],
      state.player2,
      now,
      2
    );
    newState.player2 = p2State;
    newState.events = [...newState.events, ...newPunches, ...newDodges];
  }

  return newState;
}
