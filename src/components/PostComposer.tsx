"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MediaUploader, type UploadedMedia } from "@/components/MediaUploader";
import type { SocialAccountDTO } from "@/components/AccountList";
import { IG_CAPTION_LIMIT } from "@/lib/validation";
import { Send } from "lucide-react";

export function PostComposer({ accounts }: { accounts: SocialAccountDTO[] }) {
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a.id)),
  );
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const overLimit = caption.length > IG_CAPTION_LIMIT;
  const canPost =
    !!media && selected.size > 0 && !submitting && !overLimit;

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
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
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
        post: { targets: { status: string; errorMessage: string | null }[] };
      };
      const succeeded = data.post.targets.filter((t) => t.status === "SUCCESS").length;
      const failed = data.post.targets.filter((t) => t.status === "FAILED");
      if (failed.length === 0) {
        toast({
          title: "Posted",
          description: `Live on ${succeeded} destination${succeeded === 1 ? "" : "s"}.`,
          variant: "success",
        });
      } else {
        toast({
          title: succeeded > 0 ? "Partially posted" : "Posting failed",
          description:
            failed
              .map((f) => f.errorMessage)
              .filter(Boolean)
              .join(" · ") || "Some destinations failed",
          variant: "error",
        });
      }
      setMedia(null);
      setCaption("");
    } catch (e) {
      toast({
        title: "Failed to publish",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <MediaUploader value={media} onChange={setMedia} />

        <div>
          <Textarea
            placeholder="Write a caption…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
          />
          <div
            className={
              "mt-1 text-right text-xs " +
              (overLimit ? "text-destructive" : "text-muted-foreground")
            }
          >
            {caption.length} / {IG_CAPTION_LIMIT}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Post to</div>
          {sortedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Connect a Page first — see Connected accounts above.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sortedAccounts.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
                >
                  <Checkbox
                    checked={selected.has(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <Badge
                      variant={a.platform === "FACEBOOK_PAGE" ? "default" : "secondary"}
                      className="mt-0.5"
                    >
                      {a.platform === "FACEBOOK_PAGE" ? "Facebook Page" : "Instagram"}
                    </Badge>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={!canPost} size="lg">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Posting…" : "Post now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
