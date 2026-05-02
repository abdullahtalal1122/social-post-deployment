import NextAuth, { type NextAuthConfig } from "next-auth";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { exchangeForLongLivedToken } from "@/lib/meta/tokens";

const META_SCOPES = [
  "email",
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      authorization: {
        params: {
          scope: META_SCOPES,
          // Force a fresh consent every login so scope changes apply
          auth_type: "rerequest",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async linkAccount({ account }) {
      // Exchange the short-lived user token for a long-lived (~60d) one.
      // The PrismaAdapter has just persisted the row; update it in place.
      if (account.provider !== "facebook" || !account.access_token) return;
      try {
        const long = await exchangeForLongLivedToken(account.access_token);
        const expiresAt = long.expires_in
          ? Math.floor(Date.now() / 1000) + long.expires_in
          : null;
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: {
            access_token: long.access_token,
            ...(expiresAt !== null ? { expires_at: expiresAt } : {}),
          },
        });
      } catch (e) {
        console.error("Failed to exchange long-lived FB token", e);
      }
    },
    async signIn({ user, account }) {
      // On every login, refresh the long-lived token if we got a new short-lived one.
      if (!account || account.provider !== "facebook" || !account.access_token) return;
      if (!user?.id) return;
      try {
        const long = await exchangeForLongLivedToken(account.access_token);
        const expiresAt = long.expires_in
          ? Math.floor(Date.now() / 1000) + long.expires_in
          : null;
        await prisma.account.updateMany({
          where: {
            userId: user.id,
            provider: "facebook",
            providerAccountId: account.providerAccountId,
          },
          data: {
            access_token: long.access_token,
            ...(expiresAt !== null ? { expires_at: expiresAt } : {}),
          },
        });
      } catch (e) {
        console.error("Failed to refresh long-lived FB token on signIn", e);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
