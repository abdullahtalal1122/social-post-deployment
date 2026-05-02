# Cross-Poster — Facebook Pages + Instagram

Single-tenant MVP that lets a logged-in user upload an image or video, write a caption, pick which Facebook Pages and Instagram Business accounts to post to, and publish in one click. Includes a history view with per-target success/failure status.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Auth.js v5 with the Facebook provider (handles app login + Meta OAuth in one flow)
- Prisma → Supabase Postgres
- Supabase Storage (public `media` bucket — Instagram needs a public URL)
- Plain `fetch` against the Meta Graph API (no SDK)

## First time? Read SETUP.md first

[`SETUP.md`](./SETUP.md) walks through:

1. Creating the Meta for Developers app and adding testers
2. Linking Instagram Business to a Facebook Page
3. Setting up Supabase (Postgres + Storage)
4. Filling out `.env` and running migrations

## Run locally

```bash
cp .env.example .env
# Fill in every variable — see SETUP.md
npm install
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## How it works

1. **Login** — `/` shows a "Continue with Facebook" button. The Facebook provider requests scopes for Page reads, Page posts, Instagram basic, and Instagram content publish. After OAuth, we exchange the short-lived user token for a long-lived (~60-day) one and store it on the `Account` row.
2. **Sync accounts** — `POST /api/accounts/refresh` calls `GET /me/accounts` for the user's Pages and their `instagram_business_account` link, then upserts a `SocialAccount` row per Page and per linked IG. **The Page's access token is stored on both** — IG publishing uses the parent Page's token.
3. **Upload media** — `POST /api/upload` validates type + size and uploads to Supabase Storage at `{userId}/{uuid}.{ext}` in the public `media` bucket. Returns the public URL.
4. **Publish** — `POST /api/posts` creates a `Post` and one `PostTarget` per selected account, then publishes in parallel via `Promise.allSettled`:
   - **Facebook**: `POST /{page-id}/photos` (image) or `/{page-id}/videos` (video) with the public media URL.
   - **Instagram**: `POST /{ig-id}/media` to create a container, then poll `status_code` for video until `FINISHED` (up to 60s), then `POST /{ig-id}/media_publish`.
   Success/failure is captured per target so one platform failing never blocks the other.
5. **History** — `/dashboard/history` lists all posts with per-target status pills and outbound permalinks.

## Out of scope for this MVP

- Scheduled posts (planned: a separate Render-hosted worker reading from a Postgres-backed queue).
- App Review — we're in dev mode with testers.
- Multi-tenancy, content approvals, analytics, Stories, carousels, other platforms.
- Token encryption at rest — flag as tech debt before non-demo use.

## Useful commands

```bash
npm run dev               # local dev server
npm run build             # next build (also runs prisma generate)
npm run db:studio         # open Prisma Studio against Supabase
npm run db:migrate        # prisma migrate dev
```

## Project structure

```
src/
├── app/
│   ├── page.tsx                       Landing / login
│   ├── dashboard/
│   │   ├── layout.tsx                 Header + auth gate
│   │   ├── page.tsx                   Connected accounts + composer
│   │   └── history/page.tsx           Post history
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── accounts/{route,refresh/route}.ts
│       ├── upload/route.ts
│       └── posts/{route,[id]/route}.ts
├── components/                        UI + shadcn-style primitives
├── lib/
│   ├── auth.ts                        Auth.js config + token exchange
│   ├── db.ts                          Prisma singleton
│   ├── supabase.ts                    Service-role storage client
│   ├── validation.ts                  Zod schemas + media constants
│   └── meta/
│       ├── graph.ts                   Typed Graph API GET/POST helpers
│       ├── tokens.ts                  Long-lived token exchange
│       ├── facebook.ts                publishToPage
│       └── instagram.ts               publishToInstagram (container + poll)
└── prisma/schema.prisma
```
