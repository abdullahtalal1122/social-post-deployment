import { graphGet, graphPost, sleep, MetaGraphError } from "./graph";
import type { PublishResult } from "./facebook";

type ContainerResponse = { id: string };
type StatusResponse = { status_code: string };
type PublishResponse = { id: string };
type PermalinkResponse = { permalink?: string };

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Publish a photo or video/Reel to an Instagram Business account.
 * Authenticated with the parent Page's access token.
 */
export async function publishToInstagram(input: {
  igUserId: string;
  pageAccessToken: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string;
}): Promise<PublishResult> {
  const { igUserId, pageAccessToken, mediaUrl, mediaType, caption } = input;

  // 1. Create container
  const containerBody: Record<string, string> = {
    caption,
    access_token: pageAccessToken,
  };
  if (mediaType === "IMAGE") {
    containerBody.image_url = mediaUrl;
  } else {
    containerBody.media_type = "REELS";
    containerBody.video_url = mediaUrl;
  }
  const container = await graphPost<ContainerResponse>(
    `/${igUserId}/media`,
    containerBody,
  );
  const containerId = container.id;

  // 2. For video, poll until FINISHED
  if (mediaType === "VIDEO") {
    await waitForContainerReady(containerId, pageAccessToken);
  }

  // 3. Publish
  const published = await graphPost<PublishResponse>(
    `/${igUserId}/media_publish`,
    {
      creation_id: containerId,
      access_token: pageAccessToken,
    },
  );

  // 4. Permalink (best-effort)
  let permalink: string | null = null;
  try {
    const r = await graphGet<PermalinkResponse>(`/${published.id}`, {
      fields: "permalink",
      access_token: pageAccessToken,
    });
    permalink = r.permalink ?? null;
  } catch {
    // ignore
  }

  return { externalPostId: published.id, permalink };
}

async function waitForContainerReady(
  containerId: string,
  accessToken: string,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const s = await graphGet<StatusResponse>(`/${containerId}`, {
      fields: "status_code",
      access_token: accessToken,
    });
    const code = s.status_code;
    if (code === "FINISHED") return;
    if (code === "ERROR" || code === "EXPIRED") {
      throw new MetaGraphError(
        `Instagram container ${code.toLowerCase()} during processing`,
        500,
        s,
      );
    }
    // IN_PROGRESS / PUBLISHED / other — keep polling
    await sleep(POLL_INTERVAL_MS);
  }
  throw new MetaGraphError(
    "Instagram container did not finish processing within 60s",
    504,
    { containerId },
  );
}
