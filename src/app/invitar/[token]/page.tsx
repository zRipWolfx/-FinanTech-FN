import { Suspense } from "react";

import { InviteActivateScreen } from "@/modules/auth/components/InviteActivateScreen";

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteActivateScreen />
    </Suspense>
  );
}
