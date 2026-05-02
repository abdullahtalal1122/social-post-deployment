"use client";

import Link from "next/link";
import { PostComposer } from "@/components/PostComposer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SocialAccountDTO } from "@/components/AccountList";
import { Facebook, Instagram, Settings2 } from "lucide-react";

export function DashboardClient({
  initialAccounts,
}: {
  initialAccounts: SocialAccountDTO[];
}) {
  if (initialAccounts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t find any Pages or Instagram Business accounts under
            your Facebook connection yet.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-medium">No destinations yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Make sure your Instagram is a Business or Creator account linked to
              a Facebook Page you admin, then sync from the Connections page.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/connections">
                <Settings2 className="mr-2 h-4 w-4" />
                Manage connections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fb = initialAccounts.filter((a) => a.platform === "FACEBOOK_PAGE").length;
  const ig = initialAccounts.filter(
    (a) => a.platform === "INSTAGRAM_BUSINESS",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write once, post to all your channels.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Facebook className="h-3 w-3 text-[#1877F2]" />
            {fb} Page{fb === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Instagram className="h-3 w-3 text-[#E1306C]" />
            {ig} Instagram
          </span>
          <Link
            href="/dashboard/connections"
            className="text-xs font-medium text-primary hover:underline"
          >
            Manage
          </Link>
        </div>
      </div>
      <PostComposer accounts={initialAccounts} />
    </div>
  );
}
