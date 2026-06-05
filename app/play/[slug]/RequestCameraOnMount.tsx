"use client";

import { useEffect } from "react";
import { useCamera } from "@/lib/CameraProvider";

/**
 * Triggers camera permission only after the user has expressed
 * intent by navigating to a game page. Landing visitors never see
 * a permission prompt, which is critical for first-impression on
 * mobile traffic from TikTok/iMessage.
 */
export default function RequestCameraOnMount() {
  const { requestCamera } = useCamera();
  useEffect(() => {
    requestCamera();
  }, [requestCamera]);
  return null;
}
