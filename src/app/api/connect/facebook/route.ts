import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { buildAuthorizeUrl } from "@/lib/meta/oauth";

const STATE_COOKIE = "fb_oauth_state";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  const appId = process.env.AUTH_FACEBOOK_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "AUTH_FACEBOOK_ID not configured" },
      { status: 500 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = new URL(
    "/api/connect/facebook/callback",
    req.url,
  ).toString();
  const authUrl = buildAuthorizeUrl({ appId, redirectUri, state });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
