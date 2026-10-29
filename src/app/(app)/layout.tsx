import { Suspense, type ReactNode } from "react";

import { AppFrame } from "@/modules/shell";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppFrame>{children}</AppFrame>
    </Suspense>
  );
}
