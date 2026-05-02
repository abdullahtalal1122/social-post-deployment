import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { graphGet, MetaGraphError } from "@/lib/meta/graph";

type FbPagePicture = { data?: { url?: string } };

type FbPage = {
  id: string;
  name: string;
  access_token: string;
  picture?: FbPagePicture;
  instagram_business_account?: { id: string };
};

type FbPagesResponse = {
  data: FbPage[];
  paging?: { next?: string };
};

type IgAccount = {
  id: string;
  username?: string;
  profile_picture_url?: string;
};

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Fetch the user's long-lived FB user token from their MetaConnection.
  const conn = await prisma.metaConnection.findUnique({
    where: { userId },
  });
  if (!conn?.accessToken) {
    return NextResponse.json(
      { error: "Facebook is not connected — connect it from Connections." },
      { status: 400 },
    );
  }
  const userToken = conn.accessToken;

  // 1) List Pages the user admins
  let pages: FbPage[];
  try {
    const resp = await graphGet<FbPagesResponse>("/me/accounts", {
      fields: "id,name,access_token,picture,instagram_business_account",
      access_token: userToken,
      limit: 100,
    });
    pages = resp.data ?? [];
  } catch (e) {
    if (e instanceof MetaGraphError) {
      return NextResponse.json(
        { error: `Failed to fetch Pages: ${e.message}` },
        { status: 502 },
      );
    }
    throw e;
  }

  const seenIds = new Set<string>();

  // 2) Upsert FB Page rows + linked IG Business rows
  for (const page of pages) {
    const pictureUrl = page.picture?.data?.url ?? null;

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_externalId: {
          userId,
          platform: "FACEBOOK_PAGE",
          externalId: page.id,
        },
      },
      create: {
        userId,
        platform: "FACEBOOK_PAGE",
        externalId: page.id,
        name: page.name,
        accessToken: page.access_token,
        profilePicture: pictureUrl,
      },
      update: {
        name: page.name,
        accessToken: page.access_token,
        profilePicture: pictureUrl,
      },
    });
    seenIds.add(`FACEBOOK_PAGE:${page.id}`);

    const igId = page.instagram_business_account?.id;
    if (!igId) continue;

    let igDetails: IgAccount | null = null;
    try {
      igDetails = await graphGet<IgAccount>(`/${igId}`, {
        fields: "id,username,profile_picture_url",
        access_token: page.access_token,
      });
    } catch (e) {
      // Don't blow up the whole refresh if a single IG lookup fails.
      console.error("IG details fetch failed", igId, e);
    }
    const igName = igDetails?.username
      ? `@${igDetails.username}`
      : `Instagram ${igId}`;

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_externalId: {
          userId,
          platform: "INSTAGRAM_BUSINESS",
          externalId: igId,
        },
      },
      create: {
        userId,
        platform: "INSTAGRAM_BUSINESS",
        externalId: igId,
        name: igName,
        pageId: page.id,
        accessToken: page.access_token,
        profilePicture: igDetails?.profile_picture_url ?? null,
      },
      update: {
        name: igName,
        pageId: page.id,
        accessToken: page.access_token,
        profilePicture: igDetails?.profile_picture_url ?? null,
      },
    });
    seenIds.add(`INSTAGRAM_BUSINESS:${igId}`);
  }

  // Return the fresh list
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: [{ platform: "asc" }, { name: "asc" }],
    select: {
      id: true,
      platform: true,
      externalId: true,
      name: true,
      pageId: true,
      profilePicture: true,
    },
  });

  return NextResponse.json({ accounts });
}
