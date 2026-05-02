import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import {
  getBucketName,
  getSupabaseAdmin,
  publicUrlFor,
} from "@/lib/supabase";
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  extForMime,
  isImageMime,
  isVideoMime,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 },
    );
  }
  if (isImageMime(file.type) && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds 8 MB limit" },
      { status: 400 },
    );
  }
  if (isVideoMime(file.type) && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: "Video exceeds 100 MB limit" },
      { status: 400 },
    );
  }

  const ext = extForMime(file.type);
  const path = `${session.user.id}/${randomUUID()}.${ext}`;
  const bucket = getBucketName();

  const buf = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    url: publicUrlFor(path),
    type: isImageMime(file.type) ? "IMAGE" : "VIDEO",
    path,
    size: file.size,
  });
}
