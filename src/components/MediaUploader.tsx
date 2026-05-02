"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, X, AlertTriangle, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  ALLOWED_MIME_TYPES,
  IG_ASPECT_MAX,
  IG_ASPECT_MIN,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  isImageMime,
  isVideoMime,
} from "@/lib/validation";

export type UploadedMedia = {
  url: string;
  type: "IMAGE" | "VIDEO";
  warnings: string[];
};

export function MediaUploader({
  value,
  onChange,
}: {
  value: UploadedMedia | null;
  onChange: (m: UploadedMedia | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function clientValidate(f: File): string | null {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.type)) {
      return `Unsupported file type: ${f.type || "unknown"}. Use JPG, PNG, MP4, or MOV.`;
    }
    if (isImageMime(f.type) && f.size > MAX_IMAGE_BYTES) {
      return `Image too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 8 MB.`;
    }
    if (isVideoMime(f.type) && f.size > MAX_VIDEO_BYTES) {
      return `Video too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 100 MB.`;
    }
    return null;
  }

  async function readImageAspect(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.naturalWidth / img.naturalHeight);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  async function handleFile(file: File) {
    setError(null);
    const v = clientValidate(file);
    if (v) {
      setError(v);
      return;
    }
    const warnings: string[] = [];
    if (isImageMime(file.type)) {
      const aspect = await readImageAspect(file);
      if (aspect !== null && (aspect < IG_ASPECT_MIN || aspect > IG_ASPECT_MAX)) {
        warnings.push(
          `Aspect ratio ${aspect.toFixed(2)} is outside Instagram feed range (0.80–1.91). IG may reject this.`,
        );
      }
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await res.text();
      if (!res.ok) {
        let msg = text || res.statusText;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          // text already
        }
        throw new Error(msg);
      }
      const data = JSON.parse(text) as { url: string; type: "IMAGE" | "VIDEO" };
      onChange({ url: data.url, type: data.type, warnings });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          {value.type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.url}
              alt="upload preview"
              className="max-h-72 w-full bg-black object-contain"
            />
          ) : (
            <video src={value.url} controls className="max-h-72 w-full bg-black" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white shadow transition hover:bg-black"
            aria-label="Remove media"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {value.warnings.length > 0 && (
          <ul className="space-y-1">
            {value.warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning-foreground"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      className={
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors " +
        (dragOver
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:bg-muted/50")
      }
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-soft-sm">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="text-sm">
        <span className="font-medium">Drop a file</span>
        <span className="text-muted-foreground"> or </span>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="font-medium text-primary hover:underline focus-ring rounded"
        >
          browse
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        JPG/PNG up to 8 MB · MP4/MOV up to 100 MB
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
