import { graphGet, graphPost } from "./graph";

type PhotoResponse = { id: string; post_id?: string };
type VideoResponse = { id: string };

export type PublishResult = {
  externalPostId: string;
  permalink: string | null;
};

/**
 * Publish a photo or video to a Facebook Page.
 * Uses the Page-level access token (not the user token).
 */
export async function publishToPage(input: {
  pageId: string;
  pageAccessToken: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string;
}): Promise<PublishResult> {
  const { pageId, pageAccessToken, mediaUrl, mediaType, caption } = input;

  if (mediaType === "IMAGE") {
    const resp = await graphPost<PhotoResponse>(`/${pageId}/photos`, {
      url: mediaUrl,
      caption,
      access_token: pageAccessToken,
    });
    // For photos, the linked post id is preferred for permalinks
    const externalPostId = resp.post_id ?? resp.id;
    const permalink = await tryFetchPermalink(externalPostId, pageAccessToken);
    return { externalPostId, permalink };
  }

  // VIDEO
  const resp = await graphPost<VideoResponse>(`/${pageId}/videos`, {
    file_url: mediaUrl,
    description: caption,
    access_token: pageAccessToken,
  });
  // Videos don't return a post id immediately; fall back to a watch URL.
  return {
    externalPostId: resp.id,
    permalink: `https://www.facebook.com/watch/?v=${resp.id}`,
  };
}

async function tryFetchPermalink(
  postId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const r = await graphGet<{ permalink_url?: string }>(`/${postId}`, {
      fields: "permalink_url",
      access_token: accessToken,
    });
    if (r.permalink_url) {
      return r.permalink_url.startsWith("http")
        ? r.permalink_url
        : `https://www.facebook.com${r.permalink_url}`;
    }
  } catch {
    // ignore — permalink is best-effort
  }
  return `https://www.facebook.com/${postId}`;
}
