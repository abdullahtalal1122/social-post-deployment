import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Delete both the user-level connection and all the per-Page/IG SocialAccounts
  await prisma.$transaction([
    prisma.socialAccount.deleteMany({ where: { userId } }),
    prisma.metaConnection.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
