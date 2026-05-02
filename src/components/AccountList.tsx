"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Facebook, Instagram, RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export type SocialAccountDTO = {
  id: string;
  platform: "FACEBOOK_PAGE" | "INSTAGRAM_BUSINESS";
  externalId: string;
  name: string;
  pageId: string | null;
  profilePicture: string | null;
};

export function AccountList({
  initial,
  onChange,
}: {
  initial: SocialAccountDTO[];
  onChange?: (accounts: SocialAccountDTO[]) => void;
}) {
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>(initial);
  const [pending, startTransition] = useTransition();
  const [didAutoRefresh, setDidAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    onChange?.(accounts);
  }, [accounts, onChange]);

  function refresh(silent = false) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/accounts/refresh", { method: "POST" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { accounts: SocialAccountDTO[] };
        setAccounts(data.accounts);
        if (!silent) {
          toast({
            title: "Accounts synced",
            description: `${data.accounts.length} connected`,
            variant: "success",
          });
        }
      } catch (e) {
        toast({
          title: "Failed to sync accounts",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "error",
        });
      }
    });
  }

  useEffect(() => {
    if (!didAutoRefresh) {
      setDidAutoRefresh(true);
      refresh(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connected accounts</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh(false)}
          disabled={pending}
        >
          <RefreshCw className={"mr-2 h-3.5 w-3.5 " + (pending ? "animate-spin" : "")} />
          {pending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No Pages or Instagram accounts found yet. Make sure your Instagram
            account is a Business or Creator account linked to a Facebook Page
            you admin, then click Refresh.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 py-4">
                {a.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.profilePicture}
                    alt={a.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {a.platform === "FACEBOOK_PAGE" ? (
                      <Facebook className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Instagram className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="mt-0.5">
                    <Badge variant={a.platform === "FACEBOOK_PAGE" ? "default" : "secondary"}>
                      {a.platform === "FACEBOOK_PAGE" ? "Facebook Page" : "Instagram"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
