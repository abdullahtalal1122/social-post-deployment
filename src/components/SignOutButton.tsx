"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => action())}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
