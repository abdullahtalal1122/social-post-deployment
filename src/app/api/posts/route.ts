import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPostSchema } from "@/lib/validation";
import { publishToPage, type PublishResult } from "@/lib/meta/facebook";
import { publishToInstagram } from "@/lib/meta/instagram";
import { MetaGraphError } from "@/lib/meta/graph";
import type { SocialAccount } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Validate the chosen targets belong to this user
  const targetAccounts = await prisma.socialAccount.findMany({
    where: { userId, id: { in: input.socialAccountIds } },
  });
  if (targetAccounts.length !== input.socialAccountIds.length) {
    return NextResponse.json(
      { error: "One or more selected accounts are invalid" },
      { status: 400 },
    );
  }

  // Create the Post + PostTarget rows up front
  const post = await prisma.post.create({
    data: {
      userId,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      targets: {
        create: targetAccounts.map((a) => ({
          socialAccountId: a.id,
          status: "PENDING",
        })),
      },
    },
    include: { targets: true },
  });

  // Mark all PUBLISHING (best-effort, parallel updates)
  await Promise.all(
    post.targets.map((t) =>
      prisma.postTarget.update({
        where: { id: t.id },
        data: { status: "PUBLISHING" },
      }),
    ),
  );

  // Publish in parallel
  const accountById = new Map<string, SocialAccount>(
    targetAccounts.map((a) => [a.id, a]),
  );

  const igCaption = input.igCaption ?? input.caption;

  await Promise.allSettled(
    post.targets.map(async (target) => {
      const account = accountById.get(target.socialAccountId);
      if (!account) return;
      try {
        let result: PublishResult;
        if (account.platform === "FACEBOOK_PAGE") {
          result = await publishToPage({
            pageId: account.externalId,
            pageAccessToken: account.accessToken,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            caption: input.caption,
          });
        } else {
          // INSTAGRAM_BUSINESS — uses parent Page's token (we stored it above)
          result = await publishToInstagram({
            igUserId: account.externalId,
            pageAccessToken: account.accessToken,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            caption: igCaption,
          });
        }
        await prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: "SUCCESS",
            externalPostId: result.externalPostId,
            permalink: result.permalink,
            publishedAt: new Date(),
            errorMessage: null,
          },
        });
      } catch (err) {
        const msg =
          err instanceof MetaGraphError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown error";
        await prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: "FAILED",
            errorMessage: msg,
          },
        });
      }
    }),
  );

  // Re-fetch with current statuses
  const final = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      targets: {
        include: {
          socialAccount: { select: { id: true, name: true, platform: true } },
        },
      },
    },
  });

  return NextResponse.json({ post: final });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await prisma.post.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      targets: {
        include: {
          socialAccount: { select: { id: true, name: true, platform: true } },
        },
      },
    },
  });
  return NextResponse.json({ posts });
}
