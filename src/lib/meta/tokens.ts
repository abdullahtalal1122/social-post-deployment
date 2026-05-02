import { graphGet } from "./graph";

type LongLivedTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

/**
 * Exchange a short-lived user access token for a long-lived (~60 day) one.
 * Docs: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<LongLivedTokenResponse> {
  const clientId = process.env.AUTH_FACEBOOK_ID;
  const clientSecret = process.env.AUTH_FACEBOOK_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET not configured");
  }
  return graphGet<LongLivedTokenResponse>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  });
}
