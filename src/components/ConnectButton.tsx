"use client";

import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { useState, useTransition } from "react";

export function ConnectButton({
  action,
  label = "Continue with Facebook",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        size="lg"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await action();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed");
            }
          });
        }}
        className="bg-[#1877F2] text-white hover:bg-[#1664d9]"
      >
        <Facebook className="mr-2 h-4 w-4" />
        {isPending ? "Redirecting…" : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
