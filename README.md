# Crosspost — Facebook Pages + Instagram

Single-tenant MVP that lets a logged-in user upload media, write a caption, pick which Facebook Pages and Instagram Business accounts to post to, and publish in one click. Includes live FB + IG previews, per-target status tracking, retry-on-failure, draft autosave, history with filters, and dark mode.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Auth.js v5** with the **Credentials provider** (email + password, bcrypt hashed) — JWT sessions
- **Prisma** + Supabase Postgres (via the pooler in transaction + session mode)
- **Supabase Storage** for media (public bucket — Instagram needs a public URL)
- Custom OAuth flow against the **Meta Graph API v21** for the post-login "Connect Facebook" step
- `next/font` Inter, custom design system in `globals.css`

## How auth works

App login is **separated** from Meta access:

1. **Sign in / sign up** at `/signin` and `/signup` with email + password. Sessions are JWT.
2. After login, the dashboard nudges you to **Connect Facebook** (`/api/connect/facebook`). That kicks off a custom OAuth dance that exchanges code → short-lived → long-lived (~60-day) token, fetches the FB profile, and stores everything on a `MetaConnection` row keyed to the app user.
3. **Disconnecting** Facebook does not log you out — it just wipes the `MetaConnection` and `SocialAccount` rows.
4. From the connection, `POST /api/accounts/refresh` fetches `/me/accounts` for Pages + `instagram_business_account` link, upserts each as a `SocialAccount`. Page-level tokens are stored on both FB and IG `SocialAccount` rows (IG publishing uses the parent Page's token).

## How publishing works

`POST /api/posts` creates a `Post` plus one `PostTarget` per selected destination, marks them `PUBLISHING`, then runs all targets in parallel via `Promise.allSettled`. Per-target failures don't block other targets.

- **Facebook**: `POST /{page-id}/photos` (image) or `/{page-id}/videos` (video) with the public Supabase URL.
- **Instagram**: `POST /{ig-id}/media` to create a container; for video, poll `status_code` every 3s up to 60s waiting for `FINISHED`; then `POST /{ig-id}/media_publish`.

Both succeeded targets get a `permalink` stored. Failed targets keep the Meta error message verbatim, and `POST /api/posts/[id]/retry` re-runs only the failed ones.

## Run locally

```bash
cp .env.example .env
# Fill in every variable — see SETUP.md
npm install
npx prisma migrate dev
npm run dev
```

## Project structure (highlights)

```
src/
├── app/
│   ├── (auth)/                      Sign in + sign up
│   ├── dashboard/
│   │   ├── page.tsx                 Compose (or onboarding when not connected)
│   │   ├── connections/page.tsx     Manage Facebook + destinations
│   │   └── history/page.tsx         Post history feed
│   └── api/
│       ├── auth/{[...nextauth],signup}
│       ├── connect/facebook/{,callback,disconnect}
│       ├── accounts/{refresh,/route}
│       ├── upload
│       └── posts/{,[id],[id]/retry}
├── components/
│   ├── PostComposer.tsx             Composer with live previews + per-target status
│   ├── preview/{Facebook,Instagram}Preview.tsx
│   ├── ConnectionsClient.tsx        Connection card + destination grid
│   ├── PostHistory.tsx              Filtered feed with retry
│   ├── Onboarding.tsx               First-run guide
│   ├── MobileNav.tsx                Bottom nav for mobile
│   ├── DashboardNav.tsx             Top nav for desktop
│   ├── BrandLogo.tsx, ThemeToggle.tsx, AuthShell.tsx
│   └── ui/                          shadcn-style primitives
├── lib/
│   ├── auth.ts                      Credentials provider + JWT
│   ├── db.ts                        Prisma singleton
│   ├── supabase.ts                  Service-role storage client
│   ├── validation.ts                Zod + media constants
│   └── meta/
│       ├── graph.ts                 Typed Graph API GET/POST
│       ├── oauth.ts                 Custom Meta OAuth (authorize + exchange)
│       ├── facebook.ts              publishToPage
│       └── instagram.ts             publishToInstagram (container + poll)
└── prisma/schema.prisma
```

## Out of scope for the MVP

- Scheduled posts (planned: a separate Render-hosted worker reading from a Postgres-backed queue).
- App Review — running in Meta dev mode with testers only.
- Multi-tenancy, content approvals, analytics, Stories, carousels, other platforms.
- Token encryption at rest — flag as tech debt before non-demo use.
