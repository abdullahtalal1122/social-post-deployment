import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/DashboardClient";
import type { SocialAccountDTO } from "@/components/AccountList";

export default async function DashboardPage() {
  const session = await auth();
  // layout already redirected, but narrow the type
  if (!session?.user) return null;

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
