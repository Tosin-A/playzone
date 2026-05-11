// Re-export what we need from the main logic
export { extractNormalizedPose, comparePoses } from "./logic";
export type { NormalizedPose } from "./logic";
import type { NormalizedPose } from "./logic";

// Predefined target poses for online mode (both players match the same targets)
export interface OnlineTargetPose {
  name: string;
  description: string;
  pose: NormalizedPose;
}

// These are approximate normalized poses that represent common body positions
export const TARGET_POSES_ONLINE: OnlineTargetPose[] = [
  {
    name: "T-Pose",
    description: "Arms straight out to the sides",
    pose: {
      points: [
        { x: 0.5, y: 0.1 },   // nose
        { x: 0.35, y: 0.3 },  // left shoulder
        { x: 0.65, y: 0.3 },  // right shoulder
        { x: 0.15, y: 0.3 },  // left elbow
        { x: 0.85, y: 0.3 },  // right elbow
        { x: 0.0, y: 0.3 },   // left wrist
        { x: 1.0, y: 0.3 },   // right wrist
        { x: 0.4, y: 0.6 },   // left hip
        { x: 0.6, y: 0.6 },   // right hip
        { x: 0.4, y: 0.85 },  // left knee
        { x: 0.6, y: 0.85 },  // right knee
      ],
    },
  },
  {
    name: "Hands Up",
    description: "Both hands above your head",
    pose: {
      points: [
        { x: 0.5, y: 0.15 },
        { x: 0.35, y: 0.3 },
        { x: 0.65, y: 0.3 },
        { x: 0.35, y: 0.15 },
        { x: 0.65, y: 0.15 },
        { x: 0.4, y: 0.0 },
        { x: 0.6, y: 0.0 },
        { x: 0.4, y: 0.6 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.85 },
        { x: 0.6, y: 0.85 },
      ],
    },
  },
  {
    name: "Right Salute",
    description: "Right hand to forehead",
    pose: {
      points: [
        { x: 0.5, y: 0.12 },
        { x: 0.35, y: 0.3 },
        { x: 0.65, y: 0.3 },
        { x: 0.25, y: 0.45 },
        { x: 0.65, y: 0.2 },
        { x: 0.2, y: 0.55 },
        { x: 0.55, y: 0.12 },
        { x: 0.4, y: 0.6 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.85 },
        { x: 0.6, y: 0.85 },
      ],
    },
  },
  {
    name: "Wide Arms Low",
    description: "Arms spread low, like wings",
    pose: {
      points: [
        { x: 0.5, y: 0.1 },
        { x: 0.35, y: 0.3 },
        { x: 0.65, y: 0.3 },
        { x: 0.15, y: 0.45 },
        { x: 0.85, y: 0.45 },
        { x: 0.0, y: 0.55 },
        { x: 1.0, y: 0.55 },
        { x: 0.4, y: 0.6 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.85 },
        { x: 0.6, y: 0.85 },
      ],
    },
  },
  {
    name: "Crossed Arms",
    description: "Arms crossed over chest",
    pose: {
      points: [
        { x: 0.5, y: 0.1 },
        { x: 0.35, y: 0.3 },
        { x: 0.65, y: 0.3 },
        { x: 0.55, y: 0.38 },
        { x: 0.45, y: 0.38 },
        { x: 0.65, y: 0.35 },
        { x: 0.35, y: 0.35 },
        { x: 0.4, y: 0.6 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.85 },
        { x: 0.6, y: 0.85 },
      ],
    },
  },
];
