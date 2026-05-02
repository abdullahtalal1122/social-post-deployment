"use client";

import { ThumbsUp, MessageCircle, Share2, Globe2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FacebookPreview({
  pageName,
  pageImage,
  caption,
  mediaUrl,
  mediaType,
  className,
}: {
  pageName: string;
  pageImage?: string | null;
  caption: string;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncateAt = 280;
  const long = caption.length > truncateAt;
  const visible = !expanded && long ? caption.slice(0, truncateAt) + "…" : caption;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white text-[13px] text-neutral-900 shadow-soft-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
          {pageImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pageImage} alt={pageName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1877F2] text-sm font-semibold text-white">
              {pageName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold leading-tight">
            {pageName}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            Just now <span>·</span> <Globe2 className="h-2.5 w-2.5" />
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
      </div>

      {/* caption */}
      {caption && (
        <div className="px-3 pt-2 pb-3 leading-snug whitespace-pre-wrap">
          <CaptionWithLinks text={visible} />
          {long && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-1 text-neutral-500 hover:underline"
            >
              See more
            </button>
          )}
        </div>
      )}

      {/* media */}
      {mediaUrl && mediaType === "IMAGE" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className="w-full max-h-[480px] object-cover" />
      )}
      {mediaUrl && mediaType === "VIDEO" && (
        <video
          src={mediaUrl}
          className="w-full max-h-[480px] object-cover bg-black"
          controls
          muted
        />
      )}
      {!mediaUrl && (
        <div className="m-3 flex h-44 items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 text-xs text-neutral-400 dark:border-neutral-800">
          Add media to see the preview
        </div>
      )}

      {/* reactions strip */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-1.5 text-[12px] text-neutral-500 dark:border-neutral-800">
        <FbBtn icon={ThumbsUp} label="Like" />
        <FbBtn icon={MessageCircle} label="Comment" />
        <FbBtn icon={Share2} label="Share" />
      </div>
    </div>
  );
}

function FbBtn({ icon: Icon, label }: { icon: typeof ThumbsUp; label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function CaptionWithLinks({ text }: { text: string }) {
  // Highlight #hashtags and @mentions and URLs lightly
  const parts = text.split(/(\s+|#[\w]+|@[\w.]+|https?:\/\/\S+)/g).filter(Boolean);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith("#") || p.startsWith("@") || p.startsWith("http")) {
          return (
            <span key={i} className="text-[#1877F2]">
              {p}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
