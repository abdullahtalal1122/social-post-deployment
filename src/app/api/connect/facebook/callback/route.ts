import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  exchangeCodeForToken,
  exchangeForLongLived,
  fetchMetaProfile,
} from "@/lib/meta/oauth";

const STATE_COOKIE = "fb_oauth_state";

function err(req: Request, message: string) {
  const url = new URL("/dashboard/connections", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  const userId = session.user.id;
  const url = new URL(req.url);

  const oauthError = url.searchParams.get("error_description");
  if (oauthError) return err(req, oauthError);

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code || !stateParam) {
    return err(req, "Missing OAuth code or state");
  }
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  if (!cookieState || cookieState !== stateParam) {
    return err(req, "OAuth state mismatch — please try again");
  }

  const redirectUri = new URL(
    "/api/connect/facebook/callback",
    req.url,
  ).toString();

  try {
    const shortLived = await exchangeCodeForToken({ code, redirectUri });
    const longLived = await exchangeForLongLived(shortLived.access_token);
    const profile = await fetchMetaProfile(longLived.access_token);

    const expiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000)
      : null;

    await prisma.metaConnection.upsert({
      where: { userId },
      create: {
        userId,
        facebookUserId: profile.id,
        accessToken: longLived.access_token,
        tokenExpiresAt: expiresAt,
        profileName: profile.name ?? null,
        profileImage: profile.picture?.data?.url ?? null,
      },
      update: {
        facebookUserId: profile.id,
        accessToken: longLived.access_token,
        tokenExpiresAt: expiresAt,
        profileName: profile.name ?? null,
        profileImage: profile.picture?.data?.url ?? null,
      },
    });
  } catch (e) {
    return err(req, e instanceof Error ? e.message : "Connection failed");
  }

  const success = NextResponse.redirect(
    new URL("/dashboard/connections?connected=1", req.url),
  );
  success.cookies.delete(STATE_COOKIE);
  return success;
}
