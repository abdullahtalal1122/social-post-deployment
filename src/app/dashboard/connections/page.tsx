import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ConnectionsClient } from "@/components/ConnectionsClient";
import type { SocialAccountDTO } from "@/components/AccountList";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const session = await auth();
  if (!session?.user) return null;

  const conn = await prisma.metaConnection.findUnique({
    where: { userId: session.user.id },
    select: {
      profileName: true,
      profileImage: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });
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

  return (
    <ConnectionsClient
      connection={
        conn
          ? {
              profileName: conn.profileName,
              profileImage: conn.profileImage,
              tokenExpiresAt: conn.tokenExpiresAt?.toISOString() ?? null,
              connectedAt: conn.createdAt.toISOString(),
            }
          : null
      }
      initialAccounts={dto}
      flash={{
        connected: searchParams.connected === "1",
        error: searchParams.error ?? null,
      }}
    />
  );
}
