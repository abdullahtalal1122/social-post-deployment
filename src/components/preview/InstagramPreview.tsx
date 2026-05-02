"use client";

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function InstagramPreview({
  handle,
  pageImage,
  caption,
  mediaUrl,
  mediaType,
  className,
}: {
  handle: string;
  pageImage?: string | null;
  caption: string;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncateAt = 130;
  const long = caption.length > truncateAt;
  const visible = !expanded && long ? caption.slice(0, truncateAt) + "…" : caption;
  const handleClean = handle.startsWith("@") ? handle.slice(1) : handle;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white text-[13px] text-neutral-900 shadow-soft-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="rounded-full bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#DD2A7B] p-[1.5px]">
          <div className="rounded-full bg-white p-[1.5px] dark:bg-neutral-900">
            <div className="h-7 w-7 overflow-hidden rounded-full bg-neutral-200">
              {pageImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pageImage} alt={handleClean} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#DD2A7B] text-[10px] font-semibold text-white">
                  {handleClean.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight">
          {handleClean}
        </div>
        <MoreHorizontal className="h-4 w-4" />
      </div>

      {/* media (square) */}
      <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
        {mediaUrl && mediaType === "IMAGE" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {mediaUrl && mediaType === "VIDEO" && (
          <video
            src={mediaUrl}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            muted
          />
        )}
        {!mediaUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
            Add media to see the preview
          </div>
        )}
      </div>

      {/* action row */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
        </div>
        <Bookmark className="h-5 w-5" />
      </div>

      {/* caption */}
      {caption && (
        <div className="px-3 py-2 leading-snug whitespace-pre-wrap text-[13px]">
          <span className="font-semibold">{handleClean}</span>{" "}
          <CaptionWithLinks text={visible} />
          {long && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-1 text-neutral-500 hover:underline"
            >
              more
            </button>
          )}
        </div>
      )}
      <div className="px-3 pb-3 text-[11px] uppercase text-neutral-400">Just now</div>
    </div>
  );
}

function CaptionWithLinks({ text }: { text: string }) {
  const parts = text.split(/(\s+|#[\w]+|@[\w.]+|https?:\/\/\S+)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("#") || p.startsWith("@") || p.startsWith("http")) {
          return (
            <span key={i} className="text-[#385898] dark:text-[#7F9CCB]">
              {p}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
