import { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

export type Lane = 0 | 1 | 2; // left, center, right
export type PlayerAction = "run" | "jump" | "crouch";

export interface Obstacle {
  id: number;
  x: number; // distance ahead
  lane: Lane;
  type: "barrier" | "overhead" | "gap";
  width: number;
  height: number;
}

export interface SubwayRunState {
  distance: number;
  speed: number;
  lane: Lane;
  action: PlayerAction;
  jumping: boolean;
  jumpY: number;
  crouching: boolean;
  alive: boolean;
  obstacles: Obstacle[];
  nextObstacleId: number;
  lastObstacleSpawn: number;
  // Player pose calibration
  baseHipY: number | null;
  baseShoulderMidX: number | null;
  // Input smoothing
  rawLane: number;
  rawJump: number;
  rawCrouch: number;
}

export function createInitialState(): SubwayRunState {
  return {
    distance: 0,
    speed: 5, // pixels per frame
    lane: 1,
    action: "run",
    jumping: false,
    jumpY: 0,
    crouching: false,
    alive: true,
    obstacles: [],
    nextObstacleId: 0,
    lastObstacleSpawn: 0,
    baseHipY: null,
    baseShoulderMidX: null,
    rawLane: 1,
    rawJump: 0,
    rawCrouch: 0,
  };
}

const LANE_THRESHOLD = 0.06; // shoulder midpoint offset for lane change
const JUMP_THRESHOLD = 0.05; // hip rise threshold
const CROUCH_THRESHOLD = 0.06; // hip drop threshold
const OBSTACLE_SPACING = 180; // min distance between obstacles
const LANE_WIDTH = 80;

export function processInput(
  result: PoseLandmarkerResult,
  state: SubwayRunState
): SubwayRunState {
  const landmarks = result.landmarks?.[0];
  if (!landmarks) return state;

  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return state;

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;

  const newState = { ...state };

  // Calibrate on first frame
  if (state.baseHipY === null) {
    newState.baseHipY = hipMidY;
    newState.baseShoulderMidX = shoulderMidX;
    return newState;
  }

  // Lane detection via horizontal shoulder shift
  const xOffset = shoulderMidX - (state.baseShoulderMidX ?? shoulderMidX);
  if (xOffset < -LANE_THRESHOLD) {
    newState.lane = 0; // lean left = left lane
  } else if (xOffset > LANE_THRESHOLD) {
    newState.lane = 2; // lean right = right lane
  } else {
    newState.lane = 1;
  }

  // Jump detection: hips higher than base
  const hipDelta = (state.baseHipY ?? hipMidY) - hipMidY;
  if (hipDelta > JUMP_THRESHOLD && !state.jumping) {
    newState.jumping = true;
    newState.action = "jump";
  }

  // Crouch detection: hips lower than base
  if (hipDelta < -CROUCH_THRESHOLD) {
    newState.crouching = true;
    newState.action = "crouch";
  } else {
    newState.crouching = false;
    if (!newState.jumping) {
      newState.action = "run";
    }
  }

  return newState;
}

export function gameStep(state: SubwayRunState, now: number): SubwayRunState {
  if (!state.alive) return state;

  const newState = { ...state };

  // Increase speed over time
  newState.speed = 5 + Math.floor(state.distance / 500) * 0.5;
  newState.distance = state.distance + newState.speed;

  // Jump arc
  if (state.jumping) {
    newState.jumpY = state.jumpY + 4;
    if (newState.jumpY >= 60) {
      newState.jumpY = 60;
    }
    // Come back down after peak
    if (state.jumpY >= 60) {
      newState.jumpY = state.jumpY - 4;
      if (newState.jumpY <= 0) {
        newState.jumpY = 0;
        newState.jumping = false;
        newState.action = "run";
      }
    }
  }

  // Move obstacles toward player
  newState.obstacles = state.obstacles
    .map((o) => ({ ...o, x: o.x - newState.speed }))
    .filter((o) => o.x > -100);

  // Spawn new obstacles
  if (now - state.lastObstacleSpawn > (OBSTACLE_SPACING / newState.speed) * 16) {
    const lane = Math.floor(Math.random() * 3) as Lane;
    const types: Obstacle["type"][] = ["barrier", "overhead", "gap"];
    const type = types[Math.floor(Math.random() * types.length)];
    newState.obstacles = [
      ...newState.obstacles,
      {
        id: state.nextObstacleId,
        x: 600,
        lane,
        type,
        width: 60,
        height: type === "overhead" ? 30 : 50,
      },
    ];
    newState.nextObstacleId = state.nextObstacleId + 1;
    newState.lastObstacleSpawn = now;
  }

  // Collision detection
  const playerX = 80 + state.lane * LANE_WIDTH;
  const playerBottom = state.jumpY;

  for (const obs of newState.obstacles) {
    const obsX = obs.x;
    const obsLaneX = 80 + obs.lane * LANE_WIDTH;

    // Check if in same lane and overlapping x position
    if (Math.abs(playerX - obsLaneX) < 40 && obsX > 40 && obsX < 120) {
      if (obs.type === "barrier" && playerBottom < obs.height) {
        // Hit barrier (need to jump over)
        newState.alive = false;
      } else if (obs.type === "overhead" && !state.crouching && playerBottom < 40) {
        // Hit overhead (need to crouch)
        newState.alive = false;
      }
      // "gap" type: need to jump, handled by barrier logic
    }
  }

  return newState;
}

export function getScore(state: SubwayRunState): number {
  return Math.floor(state.distance / 10);
}
