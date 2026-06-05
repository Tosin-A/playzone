"use client";

import { ReactNode } from "react";
import { CameraProvider } from "@/lib/CameraProvider";
import PermissionGate from "./PermissionGate";

export default function PlayShell({ children }: { children: ReactNode }) {
  return (
    <CameraProvider>
      <PermissionGate>{children}</PermissionGate>
    </CameraProvider>
  );
}
