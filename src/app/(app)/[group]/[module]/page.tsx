import { Suspense } from "react";

import { FinanceModulePage } from "@/modules/finance";

export default function ModuleRoutePage() {
  return (
    <Suspense fallback={null}>
      <FinanceModulePage />
    </Suspense>
  );
}
