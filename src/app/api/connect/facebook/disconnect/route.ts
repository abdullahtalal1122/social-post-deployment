import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Drop the MetaConnection only. SocialAccount rows are referenced by past
  // PostTarget rows (post history), so we keep them — without an active
  // MetaConnection the dashboard treats the user as not connected, and a
  // future reconnect will refresh tokens via upsert in /api/accounts/refresh.
  await prisma.metaConnection.deleteMany({ where: { userId } });

  return NextResponse.json({ ok: true });
}
