"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Facebook,
  Instagram,
  ExternalLink,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type Filter = "all" | "facebook" | "instagram" | "failed";

export function PostHistory({ posts: initial }: { posts: PostDTO[] }) {
  const [posts, setPosts] = useState<PostDTO[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (q && !p.caption.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "failed")
        return p.targets.some((t) => t.status === "FAILED");
      if (filter === "facebook")
        return p.targets.some((t) => t.socialAccount.platform === "FACEBOOK_PAGE");
      if (filter === "instagram")
        return p.targets.some(
          (t) => t.socialAccount.platform === "INSTAGRAM_BUSINESS",
        );
      return true;
    });
  }, [posts, filter, query]);

  function handleUpdate(id: string, next: PostDTO) {
    setPosts((prev) => prev.map((p) => (p.id === id ? next : p)));
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No posts yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Head back to the composer to publish your first post — it&apos;ll
            show up here with platform-by-platform status.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          <FilterChip
            active={filter === "facebook"}
            onClick={() => setFilter("facebook")}
            icon={<Facebook className="h-3 w-3" />}
          >
            Facebook
          </FilterChip>
          <FilterChip
            active={filter === "instagram"}
            onClick={() => setFilter("instagram")}
            icon={<Instagram className="h-3 w-3" />}
          >
            Instagram
          </FilterChip>
          <FilterChip
            active={filter === "failed"}
            onClick={() => setFilter("failed")}
            icon={<AlertTriangle className="h-3 w-3" />}
          >
            With failures
          </FilterChip>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search captions…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No posts match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition focus-ring",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function PostCard({
  post,
  onUpdate,
}: {
  post: PostDTO;
  onUpdate: (id: string, next: PostDTO) => void;
}) {
  const { toast } = useToast();
  const [retrying, startRetry] = useTransition();

  const failedCount = post.targets.filter((t) => t.status === "FAILED").length;
  const successCount = post.targets.filter((t) => t.status === "SUCCESS").length;

  function retry() {
    startRetry(async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/retry`, {
          method: "POST",
        });
        const text = await res.text();
        if (!res.ok) {
          let msg = text;
          try {
            const j = JSON.parse(text);
            if (j.error) msg = j.error;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }
        const data = JSON.parse(text) as { post: PostDTO };
        onUpdate(post.id, {
          ...post,
          targets: data.post.targets,
        });
        const stillFailed = data.post.targets.filter(
          (t) => t.status === "FAILED",
        ).length;
        toast({
          title: stillFailed === 0 ? "🎉 Retry succeeded" : "Some retries failed",
          variant: stillFailed === 0 ? "success" : "error",
        });
      } catch (e) {
        toast({
          title: "Retry failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "error",
        });
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
        {/* media */}
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg border bg-black sm:h-32 sm:w-32 lg:h-36 lg:w-36">
          {post.mediaType === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <video src={post.mediaUrl} className="h-full w-full object-cover" muted />
          )}
        </div>

        {/* body */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-3 text-sm">
              {post.caption || (
                <span className="italic text-muted-foreground">
                  (no caption)
                </span>
              )}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelative(post.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {post.targets.map((t) => (
              <TargetPill key={t.id} target={t} />
            ))}
          </div>

          {failedCount > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {failedCount} target{failedCount === 1 ? "" : "s"} failed
                  {successCount > 0 && `, ${successCount} succeeded`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={retry}
                disabled={retrying}
              >
                <RefreshCw
                  className={
                    "mr-1.5 h-3 w-3 " + (retrying ? "animate-spin" : "")
                  }
                />
                Retry failed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TargetPill({ target }: { target: TargetDTO }) {
  const Icon =
    target.socialAccount.platform === "FACEBOOK_PAGE" ? Facebook : Instagram;
  const platformColor =
    target.socialAccount.platform === "FACEBOOK_PAGE"
      ? "text-[#1877F2]"
      : "text-[#E1306C]";

  const status = target.status;
  return (
    <div
      className={cn(
        "flex max-w-full items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-xs",
        status === "FAILED" && "border-destructive/30 bg-destructive/5",
        status === "SUCCESS" && "border-success/30 bg-success/5",
      )}
      title={target.errorMessage ?? undefined}
    >
      <Icon className={cn("h-3 w-3 shrink-0", platformColor)} />
      <span className="max-w-[160px] truncate">{target.socialAccount.name}</span>
      <span className="shrink-0">
        {status === "SUCCESS" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        )}
        {status === "FAILED" && (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        )}
        {status === "PUBLISHING" && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        )}
        {status === "PENDING" && (
          <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
        )}
      </span>
      {status === "SUCCESS" && target.permalink && (
        <a
          href={target.permalink}
          target="_blank"
          rel="noreferrer"
          className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
        >
          View
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
