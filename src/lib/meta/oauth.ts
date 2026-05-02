import { GRAPH_VERSION, graphGet, MetaGraphError } from "./graph";

const META_SCOPES = [
  "email",
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
];

export function getMetaScopes(): string[] {
  return META_SCOPES.slice();
}

export function buildAuthorizeUrl(input: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const u = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", input.appId);
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("scope", META_SCOPES.join(","));
  u.searchParams.set("state", input.state);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("auth_type", "rerequest");
  return u.toString();
}

export async function exchangeCodeForToken(input: {
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const clientId = process.env.AUTH_FACEBOOK_ID;
  const clientSecret = process.env.AUTH_FACEBOOK_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET not configured");
  }
  return graphGet<{ access_token: string; expires_in?: number }>(
    "/oauth/access_token",
    {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      code: input.code,
    },
  );
}

export async function exchangeForLongLived(shortLivedToken: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const clientId = process.env.AUTH_FACEBOOK_ID;
  const clientSecret = process.env.AUTH_FACEBOOK_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET not configured");
  }
  return graphGet<{ access_token: string; expires_in?: number }>(
    "/oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortLivedToken,
    },
  );
}

export async function fetchMetaProfile(token: string): Promise<{
  id: string;
  name?: string;
  picture?: { data?: { url?: string } };
}> {
  return graphGet("/me", {
    fields: "id,name,picture",
    access_token: token,
  });
}

export { MetaGraphError };
