import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  return NextResponse.json({ accounts });
}
