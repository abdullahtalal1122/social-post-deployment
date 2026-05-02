import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/DashboardClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Facebook } from "lucide-react";
import type { SocialAccountDTO } from "@/components/AccountList";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const conn = await prisma.metaConnection.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!conn) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Crosspost
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect Facebook to start posting to your Pages and Instagram
            Business accounts.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2]">
              <Facebook className="h-8 w-8" />
            </div>
            <div>
              <p className="font-medium">No Facebook connected yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll request permissions to read your Pages and publish
                content. You can revoke access from Facebook settings at any
                time.
              </p>
            </div>
            <Button asChild size="lg" className="bg-[#1877F2] hover:bg-[#1664d9]">
              <Link href="/api/connect/facebook">
                <Facebook className="mr-2 h-4 w-4" />
                Connect Facebook
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: [{ platform: "asc" }, { name: "asc" }],
    select: {
      id: true,
      platform: true,
      externalId: true,
      name: true,
      pageId: true,
      profilePicture: true,
    },
  });

  const dto: SocialAccountDTO[] = accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    externalId: a.externalId,
    name: a.name,
    pageId: a.pageId,
    profilePicture: a.profilePicture,
  }));

  return <DashboardClient initialAccounts={dto} />;
}
