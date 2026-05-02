import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publishToPage, type PublishResult } from "@/lib/meta/facebook";
import { publishToInstagram } from "@/lib/meta/instagram";
import { MetaGraphError } from "@/lib/meta/graph";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      targets: {
        include: { socialAccount: true },
      },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const failed = post.targets.filter((t) => t.status === "FAILED");
  if (failed.length === 0) {
    return NextResponse.json({ error: "No failed targets to retry" }, {
      status: 400,
    });
  }

  // Mark them PUBLISHING again
  await Promise.all(
    failed.map((t) =>
      prisma.postTarget.update({
        where: { id: t.id },
        data: { status: "PUBLISHING", errorMessage: null },
      }),
    ),
  );

  await Promise.allSettled(
    failed.map(async (target) => {
      const account = target.socialAccount;
      try {
        let result: PublishResult;
        if (account.platform === "FACEBOOK_PAGE") {
          result = await publishToPage({
            pageId: account.externalId,
            pageAccessToken: account.accessToken,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            caption: post.caption,
          });
        } else {
          result = await publishToInstagram({
            igUserId: account.externalId,
            pageAccessToken: account.accessToken,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            caption: post.caption,
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
          data: { status: "FAILED", errorMessage: msg },
        });
      }
    }),
  );

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
