"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Facebook,
  Instagram,
  RefreshCw,
  Unplug,
  Plug,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
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

  const fbCount = accounts.filter((a) => a.platform === "FACEBOOK_PAGE").length;
  const igCount = accounts.filter((a) => a.platform === "INSTAGRAM_BUSINESS").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Facebook account so Crosspost can publish to your Pages
          and linked Instagram Business accounts.
        </p>
      </div>

      {/* Connection card */}
      <Card className="overflow-hidden">
        <div className="brand-glow border-b">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-soft">
                  <Facebook className="h-7 w-7" />
                </div>
                {connection && daysUntilExpiry != null && daysUntilExpiry > 0 && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white shadow-soft-sm">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-base font-semibold">
                  Facebook
                  {connection ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not connected</Badge>
                  )}
                </div>
                {connection ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    <span>
                      Connected as{" "}
                      <span className="font-medium text-foreground">
                        {connection.profileName ?? "Facebook user"}
                      </span>
                    </span>
                    {daysUntilExpiry !== null && (
                      <>
                        <span aria-hidden>·</span>
                        {daysUntilExpiry > 14 ? (
                          <Badge variant="success">
                            Token good ({daysUntilExpiry}d left)
                          </Badge>
                        ) : daysUntilExpiry > 0 ? (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3" />
                            Expires in {daysUntilExpiry}d
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Token expired</Badge>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    Connect to import your Pages and Instagram Business accounts.
                  </div>
                )}
              </div>
            </div>
            {connection ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => refresh(false)}
                  disabled={pending}
                >
                  <RefreshCw
                    className={"mr-2 h-4 w-4 " + (pending ? "animate-spin" : "")}
                  />
                  Sync
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "/api/connect/facebook")
                  }
                  disabled={pending}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Reconnect
                </Button>
                <Button
                  variant="ghost"
                  onClick={disconnect}
                  disabled={pending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
        </div>
        {connection && accounts.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-6 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Facebook className="h-3 w-3 text-[#1877F2]" />
                {fbCount} Page{fbCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Instagram className="h-3 w-3 text-[#E1306C]" />
                {igCount} Instagram
              </span>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Compose now
              </Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Destinations */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Destinations</h2>
            <p className="text-sm text-muted-foreground">
              Pages and Instagram Business accounts you can post to.
            </p>
          </div>
        </div>

        {!connection ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Connect Facebook above to see your Pages and Instagram Business
              accounts here.
            </CardContent>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-12 text-center text-sm text-muted-foreground">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No destinations found
                </p>
                <p className="mt-1">
                  Make sure your Instagram is a Business or Creator account
                  linked to a Facebook Page you admin, then click Sync.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => refresh(false)}
                disabled={pending}
              >
                <RefreshCw
                  className={"mr-2 h-4 w-4 " + (pending ? "animate-spin" : "")}
                />
                Sync
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <DestinationCard key={a.id} account={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DestinationCard({ account }: { account: SocialAccountDTO }) {
  const isFb = account.platform === "FACEBOOK_PAGE";
  return (
    <Card className="overflow-hidden">
      <div
        className={
          "h-2 w-full " +
          (isFb
            ? "bg-[#1877F2]"
            : "bg-gradient-to-r from-[#FEDA77] via-[#F58529] to-[#DD2A7B]")
        }
      />
      <CardContent className="flex items-center gap-3 p-4">
        {account.profilePicture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.profilePicture}
            alt={account.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {isFb ? (
              <Facebook className="h-5 w-5 text-[#1877F2]" />
            ) : (
              <Instagram className="h-5 w-5 text-[#E1306C]" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{account.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {isFb ? (
              <>
                <Facebook className="h-3 w-3 text-[#1877F2]" /> Facebook Page
              </>
            ) : (
              <>
                <Instagram className="h-3 w-3 text-[#E1306C]" /> Instagram Business
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
