"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Facebook, Instagram, ExternalLink } from "lucide-react";

export type TargetDTO = {
  id: string;
  status: "PENDING" | "PUBLISHING" | "SUCCESS" | "FAILED";
  permalink: string | null;
  errorMessage: string | null;
  publishedAt: string | null;
  socialAccount: {
    id: string;
    name: string;
    platform: "FACEBOOK_PAGE" | "INSTAGRAM_BUSINESS";
  };
};

export type PostDTO = {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  createdAt: string;
  targets: TargetDTO[];
};

function StatusBadge({ status }: { status: TargetDTO["status"] }) {
  switch (status) {
    case "SUCCESS":
      return <Badge variant="success">Success</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "PUBLISHING":
      return <Badge variant="warning">Publishing</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}

export function PostHistory({ posts }: { posts: PostDTO[] }) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No posts yet. Head back to the dashboard to publish your first one.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-md border bg-black sm:w-40">
              {p.mediaType === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.mediaUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  src={p.mediaUrl}
                  className="h-full w-full object-cover"
                  muted
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-3 text-sm">
                  {p.caption || (
                    <span className="italic text-muted-foreground">
                      (no caption)
                    </span>
                  )}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.targets.map((t) => (
                  <div
                    key={t.id}
                    title={t.errorMessage ?? undefined}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 text-xs"
                  >
                    {t.socialAccount.platform === "FACEBOOK_PAGE" ? (
                      <Facebook className="h-3.5 w-3.5" />
                    ) : (
                      <Instagram className="h-3.5 w-3.5" />
                    )}
                    <span className="max-w-[140px] truncate">
                      {t.socialAccount.name}
                    </span>
                    <StatusBadge status={t.status} />
                    {t.status === "SUCCESS" && t.permalink && (
                      <a
                        href={t.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
