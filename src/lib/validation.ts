import { z } from "zod";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime"] as const;
export const ALLOWED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const IG_CAPTION_LIMIT = 2200;

// Instagram feed aspect ratio: 4:5 (0.8) to 1.91:1 (1.91)
export const IG_ASPECT_MIN = 0.8;
export const IG_ASPECT_MAX = 1.91;

export function isImageMime(m: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(m);
}

export function isVideoMime(m: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(m);
}

export function extForMime(m: string): string {
  switch (m) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return "bin";
  }
}

export const createPostSchema = z.object({
  caption: z.string().max(63206, "Caption too long").default(""),
  // Optional separate IG caption — falls back to `caption` if omitted.
  igCaption: z
    .string()
    .max(IG_CAPTION_LIMIT, "Instagram caption too long")
    .optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  socialAccountIds: z.array(z.string().min(1)).min(1, "Pick at least one destination"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
