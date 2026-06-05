import { ReactNode } from "react";
import PlayShell from "@/components/shell/PlayShell";

export default function PlayLayout({ children }: { children: ReactNode }) {
  return <PlayShell>{children}</PlayShell>;
}
