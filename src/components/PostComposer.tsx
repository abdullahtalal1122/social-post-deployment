"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MediaUploader, type UploadedMedia } from "@/components/MediaUploader";
import { FacebookPreview } from "@/components/preview/FacebookPreview";
import { InstagramPreview } from "@/components/preview/InstagramPreview";
import type { SocialAccountDTO } from "@/components/AccountList";
import { IG_CAPTION_LIMIT } from "@/lib/validation";
import {
  Send,
  Facebook,
  Instagram,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PerTargetStatus =
  | "PENDING"
  | "PUBLISHING"
  | "SUCCESS"
  | "FAILED";

type PublishedTarget = {
  id: string;
  socialAccountId: string;
  status: PerTargetStatus;
  permalink: string | null;
  errorMessage: string | null;
};

const DRAFT_KEY = "crosspost.draft.v1";
const FB_LIMIT = 63206; // soft

export function PostComposer({ accounts }: { accounts: SocialAccountDTO[] }) {
  const { toast } = useToast();

  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [useSeparateCaptions, setUseSeparateCaptions] = useState(false);
  const [igCaption, setIgCaption] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a.id)),
  );

  const [submitting, setSubmitting] = useState(false);
  const [publishedTargets, setPublishedTargets] =
    useState<PublishedTarget[] | null>(null);
  const [previewAccountId, setPreviewAccountId] = useState<string | null>(
    () => accounts[0]?.id ?? null,
  );

  // Drafts: load + autosave
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        caption?: string;
        igCaption?: string;
        useSeparateCaptions?: boolean;
        media?: UploadedMedia | null;
        selected?: string[];
      };
      if (draft.caption) setCaption(draft.caption);
      if (draft.igCaption) setIgCaption(draft.igCaption);
      if (draft.useSeparateCaptions !== undefined)
        setUseSeparateCaptions(draft.useSeparateCaptions);
      if (draft.media) setMedia(draft.media);
      if (draft.selected) setSelected(new Set(draft.selected));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const draft = {
      caption,
      igCaption,
      useSeparateCaptions,
      media,
      selected: Array.from(selected),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [caption, igCaption, useSeparateCaptions, media, selected]);

  const overFb = caption.length > FB_LIMIT;
  const overIg =
    (useSeparateCaptions ? igCaption : caption).length > IG_CAPTION_LIMIT;
  const canPost =
    !!media && selected.size > 0 && !submitting && !overFb && !overIg;

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        if (a.platform !== b.platform) {
          return a.platform === "FACEBOOK_PAGE" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
    [accounts],
  );

  // pick an account for the preview pane based on the current selection
  const previewAccount = useMemo(() => {
    const candidate =
      sortedAccounts.find((a) => a.id === previewAccountId) ??
      sortedAccounts.find((a) => selected.has(a.id)) ??
      sortedAccounts[0] ??
      null;
    return candidate;
  }, [sortedAccounts, previewAccountId, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!media) return;
    setSubmitting(true);
    setPublishedTargets(
      Array.from(selected).map((id) => ({
        id,
        socialAccountId: id,
        status: "PUBLISHING" as PerTargetStatus,
        permalink: null,
        errorMessage: null,
      })),
    );

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          igCaption: useSeparateCaptions ? igCaption : undefined,
          mediaUrl: media.url,
          mediaType: media.type,
          socialAccountIds: Array.from(selected),
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text || res.statusText;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const data = JSON.parse(text) as {
        post: {
          targets: PublishedTarget[];
        };
      };
      setPublishedTargets(data.post.targets);

      const ok = data.post.targets.filter((t) => t.status === "SUCCESS").length;
      const fail = data.post.targets.filter((t) => t.status === "FAILED");
      if (fail.length === 0) {
        toast({
          title: "🎉 Posted",
          description: `Live on ${ok} destination${ok === 1 ? "" : "s"}`,
          variant: "success",
        });
        // clear draft on full success
        setMedia(null);
        setCaption("");
        setIgCaption("");
        localStorage.removeItem(DRAFT_KEY);
      } else {
        toast({
          title: ok > 0 ? "Partially posted" : "Posting failed",
          description:
            fail
              .map((f) => f.errorMessage)
              .filter(Boolean)
              .join(" · ") || "Some destinations failed",
          variant: "error",
        });
      }
    } catch (e) {
      toast({
        title: "Failed to publish",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "error",
      });
      setPublishedTargets(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_minmax(380px,_440px)]">
      {/* Left: composer */}
      <Card className="h-fit">
        <CardContent className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Media</label>
            <MediaUploader value={media} onChange={setMedia} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="caption">
                Caption
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={useSeparateCaptions}
                  onCheckedChange={(v) => setUseSeparateCaptions(!!v)}
                />
                Separate Instagram caption
              </label>
            </div>
            <Textarea
              id="caption"
              placeholder={
                useSeparateCaptions
                  ? "Caption for Facebook…"
                  : "Write a caption…"
              }
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
            />
            <CharCounter
              value={caption.length}
              limit={useSeparateCaptions ? FB_LIMIT : IG_CAPTION_LIMIT}
              labelLeft={useSeparateCaptions ? "Facebook" : "Caption"}
            />
            {useSeparateCaptions && (
              <div className="mt-3">
                <label
                  htmlFor="igCaption"
                  className="mb-2 flex items-center gap-2 text-sm font-medium"
                >
                  <Instagram className="h-3.5 w-3.5" /> Instagram caption
                </label>
                <Textarea
                  id="igCaption"
                  placeholder="A tighter caption with hashtags…"
                  value={igCaption}
                  onChange={(e) => setIgCaption(e.target.value)}
                  rows={4}
                />
                <CharCounter
                  value={igCaption.length}
                  limit={IG_CAPTION_LIMIT}
                  labelLeft="Instagram"
                />
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Post to</span>
              <span className="text-xs text-muted-foreground">
                {selected.size} of {sortedAccounts.length} selected
              </span>
            </div>
            {sortedAccounts.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Connect a Facebook Page first — see Connections.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sortedAccounts.map((a) => {
                  const isSelected = selected.has(a.id);
                  const isPreview = previewAccount?.id === a.id;
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        "group relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-accent/50",
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(a.id)}
                      />
                      {a.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.profilePicture}
                          alt={a.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          {a.platform === "FACEBOOK_PAGE" ? (
                            <Facebook className="h-4 w-4 text-[#1877F2]" />
                          ) : (
                            <Instagram className="h-4 w-4 text-[#E1306C]" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {a.name}
                        </div>
                        <Badge
                          variant={
                            a.platform === "FACEBOOK_PAGE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {a.platform === "FACEBOOK_PAGE"
                            ? "Facebook"
                            : "Instagram"}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        title="Preview this account"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewAccountId(a.id);
                        }}
                        className={cn(
                          "rounded-md p-1.5 text-muted-foreground transition opacity-0 group-hover:opacity-100",
                          isPreview && "opacity-100 text-primary",
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-target status while/after publishing */}
          {publishedTargets && (
            <PublishStatus
              accounts={accounts}
              targets={publishedTargets}
              submitting={submitting}
            />
          )}

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div className="text-xs text-muted-foreground">
              {media ? (
                <span>
                  Draft auto-saved.{" "}
                  <button
                    onClick={() => {
                      setMedia(null);
                      setCaption("");
                      setIgCaption("");
                      setUseSeparateCaptions(false);
                      localStorage.removeItem(DRAFT_KEY);
                    }}
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                </span>
              ) : (
                <span>Drag a file in to start composing.</span>
              )}
            </div>
            <Button
              variant="brand"
              onClick={submit}
              disabled={!canPost}
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: live preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Live preview
        </div>
        {previewAccount ? (
          previewAccount.platform === "FACEBOOK_PAGE" ? (
            <FacebookPreview
              pageName={previewAccount.name}
              pageImage={previewAccount.profilePicture}
              caption={caption}
              mediaUrl={media?.url ?? null}
              mediaType={media?.type ?? null}
            />
          ) : (
            <InstagramPreview
              handle={previewAccount.name}
              pageImage={previewAccount.profilePicture}
              caption={useSeparateCaptions ? igCaption : caption}
              mediaUrl={media?.url ?? null}
              mediaType={media?.type ?? null}
            />
          )
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Select a destination to see a preview.
            </CardContent>
          </Card>
        )}
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          Previews are best-effort. Real rendering depends on each platform.
        </div>
      </div>
    </div>
  );
}

function CharCounter({
  value,
  limit,
  labelLeft,
}: {
  value: number;
  limit: number;
  labelLeft: string;
}) {
  const ratio = value / limit;
  const over = value > limit;
  const near = ratio > 0.9 && !over;
  const color = over
    ? "text-destructive"
    : near
      ? "text-warning-foreground"
      : "text-muted-foreground";
  return (
    <div className={cn("mt-1 flex items-center justify-between text-xs", color)}>
      <span>{labelLeft}</span>
      <span>
        {value.toLocaleString()} / {limit.toLocaleString()}
      </span>
    </div>
  );
}

function PublishStatus({
  accounts,
  targets,
  submitting,
}: {
  accounts: SocialAccountDTO[];
  targets: PublishedTarget[];
  submitting: boolean;
}) {
  const map = new Map(accounts.map((a) => [a.id, a]));
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {submitting ? "Publishing…" : "Last publish"}
      </div>
      {targets.map((t) => {
        const a = map.get(t.socialAccountId);
        if (!a) return null;
        return (
          <div key={t.id} className="flex items-center gap-3 text-sm">
            <StatusDot status={t.status} />
            {a.platform === "FACEBOOK_PAGE" ? (
              <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
            ) : (
              <Instagram className="h-3.5 w-3.5 text-[#E1306C]" />
            )}
            <span className="truncate font-medium">{a.name}</span>
            {t.status === "FAILED" && t.errorMessage && (
              <span
                className="ml-auto truncate text-xs text-destructive"
                title={t.errorMessage}
              >
                {t.errorMessage}
              </span>
            )}
            {t.status === "SUCCESS" && t.permalink && (
              <a
                href={t.permalink}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs text-primary hover:underline"
              >
                View
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: PerTargetStatus }) {
  if (status === "SUCCESS") {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (status === "FAILED") {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  if (status === "PUBLISHING") {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />;
}
