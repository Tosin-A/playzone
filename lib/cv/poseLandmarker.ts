import {
  PoseLandmarker,
  FilesetResolver,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

let instance: PoseLandmarker | null = null;
let loading: Promise<PoseLandmarker> | null = null;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);

    // Try GPU first (faster on capable devices), fall back to CPU on
    // failure. WebGL2 isn't available in workers on some iOS Safari
    // and older Android Chrome builds, so the GPU delegate throws.
    try {
      instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 2,
      });
      return instance;
    } catch (gpuErr) {
      console.warn("[PoseLandmarker] GPU delegate failed, falling back to CPU", gpuErr);
      instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 2,
      });
      return instance;
    }
  })();

  return loading;
}

export type { PoseLandmarkerResult };
