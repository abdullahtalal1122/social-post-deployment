"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Facebook, Instagram, RefreshCw, Unplug, Plug } from "lucide-react";
import type { SocialAccountDTO } from "@/components/AccountList";

type Connection = {
  profileName: string | null;
  profileImage: string | null;
  tokenExpiresAt: string | null;
  connectedAt: string;
};

export function ConnectionsClient({
  connection,
  initialAccounts,
  flash,
}: {
  connection: Connection | null;
  initialAccounts: SocialAccountDTO[];
  flash: { connected: boolean; error: string | null };
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>(initialAccounts);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (flash.connected) {
      toast({ title: "Facebook connected", variant: "success" });
      router.replace("/dashboard/connections");
      // also kick off a refresh once
      void refresh(true);
    } else if (flash.error) {
      toast({
        title: "Connection failed",
        description: flash.error,
        variant: "error",
      });
      router.replace("/dashboard/connections");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh(silent = false) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const res = await fetch("/api/accounts/refresh", { method: "POST" });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as { accounts: SocialAccountDTO[] };
          setAccounts(data.accounts);
          if (!silent) {
            toast({
              title: "Synced",
              description: `${data.accounts.length} destination${data.accounts.length === 1 ? "" : "s"} found`,
              variant: "success",
            });
          }
        } catch (e) {
          toast({
            title: "Sync failed",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "error",
          });
        } finally {
          resolve();
        }
      });
    });
  }

  function disconnect() {
    if (
      !confirm(
        "Disconnect Facebook? This removes all linked Pages and Instagram accounts from this app.",
      )
    )
      return;
    startTransition(async () => {
      const res = await fetch("/api/connect/facebook/disconnect", {
        method: "POST",
      });
      if (!res.ok) {
        toast({ title: "Disconnect failed", variant: "error" });
        return;
      }
      toast({ title: "Facebook disconnected", variant: "success" });
      setAccounts([]);
      router.refresh();
    });
  }

  const tokenExpiresAt = connection?.tokenExpiresAt
    ? new Date(connection.tokenExpiresAt)
    : null;
  const daysUntilExpiry = tokenExpiresAt
    ? Math.round((tokenExpiresAt.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Facebook account to give Crosspost permission to publish
          to your Pages and linked Instagram Business accounts.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2]">
              <Facebook className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium">Facebook</div>
              {connection ? (
                <div className="text-sm text-muted-foreground">
                  Connected as{" "}
                  <span className="font-medium text-foreground">
                    {connection.profileName ?? "Facebook user"}
                  </span>
                  {daysUntilExpiry !== null && (
                    <>
                      {" · "}
                      {daysUntilExpiry > 14 ? (
                        <Badge variant="success">
                          Token good ({daysUntilExpiry}d left)
                        </Badge>
                      ) : daysUntilExpiry > 0 ? (
                        <Badge variant="warning">
                          Expires in {daysUntilExpiry}d
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Token expired</Badge>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Not connected</div>
              )}
            </div>
          </div>
          {connection ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refresh(false)}
                disabled={pending}
              >
                <RefreshCw
                  className={
                    "mr-2 h-4 w-4 " + (pending ? "animate-spin" : "")
                  }
                />
                Sync
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/api/connect/facebook")}
                disabled={pending}
              >
                <Plug className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
              <Button
                variant="destructive"
                onClick={disconnect}
                disabled={pending}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => (window.location.href = "/api/connect/facebook")}
              className="bg-[#1877F2] text-white hover:bg-[#1664d9]"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Connect Facebook
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Destinations</h2>
        {!connection ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Connect Facebook above to see your Pages and Instagram Business
              accounts.
            </CardContent>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
              <p>No destinations yet.</p>
              <p>
                Make sure your Instagram is a Business or Creator account linked
                to a Facebook Page you admin, then click Sync.
              </p>
              <Button
                variant="outline"
                onClick={() => refresh(false)}
                disabled={pending}
              >
                <RefreshCw
                  className={
                    "mr-2 h-4 w-4 " + (pending ? "animate-spin" : "")
                  }
                />
                Sync
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
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
                    <Badge
                      variant={
                        a.platform === "FACEBOOK_PAGE" ? "default" : "secondary"
                      }
                      className="mt-0.5"
                    >
                      {a.platform === "FACEBOOK_PAGE"
                        ? "Facebook Page"
                        : "Instagram"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
