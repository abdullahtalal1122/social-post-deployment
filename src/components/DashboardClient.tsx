"use client";

import { useState } from "react";
import { AccountList, type SocialAccountDTO } from "@/components/AccountList";
import { PostComposer } from "@/components/PostComposer";

export function DashboardClient({
  initialAccounts,
}: {
  initialAccounts: SocialAccountDTO[];
}) {
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>(initialAccounts);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <AccountList initial={initialAccounts} onChange={setAccounts} />
      </div>
      <div>
        <PostComposer accounts={accounts} />
      </div>
    </div>
  );
}
