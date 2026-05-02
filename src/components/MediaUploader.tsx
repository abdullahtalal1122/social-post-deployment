"use client";

import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
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
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-md border">
          {value.type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="upload preview" className="max-h-72 w-full object-contain bg-black" />
          ) : (
            <video src={value.url} controls className="max-h-72 w-full bg-black" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Remove media"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {value.warnings.length > 0 && (
          <ul className="text-xs text-amber-600">
            {value.warnings.map((w, i) => (
              <li key={i}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center"
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">
        Drop an image or video here, or
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Choose file"}
      </Button>
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
      <p className="text-xs text-muted-foreground">
        JPG/PNG up to 8 MB, MP4/MOV up to 100 MB.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
