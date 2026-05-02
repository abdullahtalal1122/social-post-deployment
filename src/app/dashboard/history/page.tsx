import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostHistory, type PostDTO } from "@/components/PostHistory";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const posts = await prisma.post.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      targets: {
        include: {
          socialAccount: {
            select: { id: true, name: true, platform: true },
          },
        },
      },
    },
  });

  const dto: PostDTO[] = posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    mediaUrl: p.mediaUrl,
    mediaType: p.mediaType,
    createdAt: p.createdAt.toISOString(),
    targets: p.targets.map((t) => ({
      id: t.id,
      status: t.status,
      permalink: t.permalink,
      errorMessage: t.errorMessage,
      publishedAt: t.publishedAt?.toISOString() ?? null,
      socialAccount: t.socialAccount,
    })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Post history</h1>
      <PostHistory posts={dto} />
    </div>
  );
}
