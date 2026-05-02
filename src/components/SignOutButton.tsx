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
      title="Sign out"
    >
      <LogOut className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">{pending ? "Signing out…" : "Sign out"}</span>
    </Button>
  );
}
