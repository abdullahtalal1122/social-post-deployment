# MVP Build Plan: Facebook + Instagram Cross-Poster

## Goal

Build a demoable web app where a logged-in user can:
1. Connect their Facebook account (which gives access to their Pages and linked Instagram Business accounts)
2. Upload an image or video, write a caption, pick which destinations to post to
3. Click "Post" and have it appear on Facebook Page and/or Instagram within seconds
4. See a history of past posts with success/failure status per platform

This is a **single-tenant MVP** running in **Meta development mode** — no App Review needed. The client and 1–2 of their teammates will be added as app testers.

---

## Architecture

**Single Next.js app on Vercel.** Frontend pages + API routes live in one repo, one deploy. Supabase provides Postgres and file storage. No separate backend service for the MVP.

When scheduled posts are added later, a Node worker on Render will consume from a queue table — but that's explicitly out of scope here.

---

## Tech Stack (use exactly these unless blocked)

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Language/Runtime:** Node.js 20+
- **Database:** Supabase Postgres, accessed via Prisma ORM (Prisma gives better DX than the Supabase JS client for relational work)
- **Auth:** [Auth.js](https://authjs.dev) (NextAuth v5) with the **Facebook provider** — handles BOTH app login and Meta OAuth in a single flow. Do NOT use Supabase Auth here; mixing Supabase Auth with NextAuth's Facebook provider is more friction than it's worth, and we need NextAuth's flexibility around the Meta scopes.
- **File storage:** Supabase Storage (public bucket named `media`) — Instagram needs a public URL to fetch media from, and Supabase public buckets give you exactly that
- **HTTP client for Meta:** Plain `fetch` — Graph API is simple REST, no SDK
- **Styling:** Tailwind CSS + shadcn/ui components
- **Hosting:** Vercel (free tier)
- **Job queue:** **Out of scope for MVP.** Posts publish synchronously on user click. Scheduling will be added later via a Render worker.

**Do NOT** add: Redis, separate backend service, Docker, microservices, GraphQL, Supabase Auth, the Supabase JS client for DB queries (use Prisma).

---

## Why Supabase here

- **One service, two needs:** Postgres + storage + dashboard for inspecting data during dev
- **Free tier is generous:** 500MB database, 1GB storage, 2GB bandwidth — plenty for a single-tenant demo
- **Public bucket URLs work for Instagram** without extra CDN configuration
- **Connection pooling built in:** Supabase provides a pooled connection string (port 6543) that works well with Vercel's serverless functions

---

## Prerequisites the human must do first

The agent should **stop and prompt the human** to complete these — they cannot be automated:

### Meta setup
1. Create a [Meta for Developers](https://developers.facebook.com) account
2. Create a new app — type: **"Business"**
3. Add the **Facebook Login** and **Instagram** products to the app
4. In app settings, note the **App ID** and **App Secret**
5. Set OAuth redirect URI to `http://localhost:3000/api/auth/callback/facebook` (and later the Vercel URL)
6. Add the client (and any other testers) as **App Testers** in Roles → Testers
7. Confirm the client's Instagram account is **converted to a Business or Creator account** and is **linked to a Facebook Page** they admin

### Supabase setup
8. Create a [Supabase](https://supabase.com) account and a new project
9. Note the project URL, anon key, service role key, and the database connection strings (both pooled `6543` and direct `5432`)
10. In Storage, create a bucket named `media` and set it to **Public**
11. Generate a service-role key for the API to use when uploading

The agent should put a `SETUP.md` in the repo with these steps as a numbered checklist with screenshots-or-links where helpful.

---

## Repository structure

```
/
├── PLAN.md                    (this file)
├── SETUP.md                   (human prerequisites checklist)
├── README.md                  (how to run locally)
├── .env.example
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (landing / login)
│   │   ├── dashboard/
│   │   │   ├── page.tsx                (main app — connected accounts + new post)
│   │   │   └── history/page.tsx        (post history)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── accounts/
│   │       │   ├── refresh/route.ts    (sync Pages and IG accounts from Meta)
│   │       │   └── route.ts            (list connected accounts)
│   │       ├── upload/route.ts         (upload to Supabase Storage)
│   │       └── posts/
│   │           ├── route.ts            (POST = create+publish, GET = list)
│   │           └── [id]/route.ts       (GET single post status)
│   ├── components/
│   │   ├── ConnectButton.tsx
│   │   ├── AccountList.tsx
│   │   ├── PostComposer.tsx
│   │   ├── MediaUploader.tsx
│   │   └── PostHistory.tsx
│   ├── lib/
│   │   ├── db.ts                       (Prisma client singleton)
│   │   ├── auth.ts                     (Auth.js config)
│   │   ├── supabase.ts                 (Supabase storage client — server-side only)
│   │   ├── meta/
│   │   │   ├── graph.ts                (typed Graph API wrapper)
│   │   │   ├── facebook.ts             (publishToPage)
│   │   │   ├── instagram.ts            (publishToInstagram with container flow)
│   │   │   └── tokens.ts               (long-lived token exchange)
│   │   └── validation.ts               (zod schemas for media specs)
│   └── types/
└── package.json
```

---

## Database schema (Prisma)

```prisma
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  name           String?
  image          String?
  createdAt      DateTime        @default(now())
  accounts       Account[]
  socialAccounts SocialAccount[]
  posts          Post[]
}

// Auth.js managed
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model SocialAccount {
  id              String        @id @default(cuid())
  userId          String
  platform        Platform      // FACEBOOK_PAGE | INSTAGRAM_BUSINESS
  externalId      String        // Page ID or IG user ID
  name            String        // display name
  pageId          String?       // for IG, the linked FB Page ID
  accessToken     String        @db.Text  // long-lived Page token
  tokenExpiresAt  DateTime?
  profilePicture  String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  postTargets     PostTarget[]
  @@unique([userId, platform, externalId])
}

enum Platform {
  FACEBOOK_PAGE
  INSTAGRAM_BUSINESS
}

model Post {
  id          String       @id @default(cuid())
  userId      String
  caption     String       @db.Text
  mediaUrl    String       // public Supabase Storage URL
  mediaType   MediaType
  scheduledAt DateTime?
  createdAt   DateTime     @default(now())
  user        User         @relation(fields: [userId], references: [id])
  targets     PostTarget[]
}

enum MediaType { IMAGE VIDEO }

model PostTarget {
  id              String        @id @default(cuid())
  postId          String
  socialAccountId String
  status          PostStatus    @default(PENDING)
  externalPostId  String?       // FB post ID or IG media ID
  permalink       String?       // direct link to live post
  errorMessage    String?       @db.Text
  publishedAt     DateTime?
  post            Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id])
}

enum PostStatus { PENDING PUBLISHING SUCCESS FAILED }
```

**Prisma + Supabase note:** Use the **pooled connection string** (`...:6543/postgres?pgbouncer=true`) for `DATABASE_URL` and the **direct connection string** (`...:5432/postgres`) for `DIRECT_URL` in `schema.prisma`. The direct URL is needed for migrations.

---

## Build phases

### Phase 1 — Project skeleton
1. `npx create-next-app@latest` with TS, Tailwind, App Router, src dir
2. Install deps: `prisma @prisma/client next-auth@beta @auth/prisma-adapter zod @supabase/supabase-js`
3. Install shadcn/ui and add: button, card, input, textarea, dialog, toast, badge, checkbox
4. Set up Prisma with the schema above, run `prisma migrate dev` against Supabase
5. Create `.env.example` with all required vars (see below)
6. Create `lib/db.ts` Prisma singleton
7. Create `lib/supabase.ts` server-only Supabase client using the service-role key

**Acceptance:** `npm run dev` boots, hitting `/` shows a placeholder page. `prisma studio` connects to Supabase and shows the empty tables.

### Phase 2 — Auth + Meta OAuth
1. Configure Auth.js with the Facebook provider in `lib/auth.ts`
2. **Critical:** request scopes: `email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management`
3. Use the Prisma adapter so users + accounts persist
4. In the Auth.js `signIn` callback, exchange the short-lived user token for a **long-lived user token** (60-day) by calling `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...`. Store the long-lived token back on the `Account` row.
5. Build landing page with a "Continue with Facebook" button
6. Protect `/dashboard` — redirect to `/` if not signed in

**Acceptance:** User clicks login, sees Meta consent screen with all scopes listed, gets redirected to `/dashboard`. Their `User` and `Account` rows exist in Supabase with the long-lived token.

### Phase 3 — Sync connected Pages and IG accounts
1. Create `POST /api/accounts/refresh` endpoint that:
   - Fetches the user's long-lived token from `Account`
   - Calls `GET /me/accounts?fields=id,name,access_token,picture,instagram_business_account` — this returns Pages with their **Page-level access tokens** (which do NOT expire as long as the user remains a Page admin and the source user token was long-lived)
   - For each Page: upsert a `SocialAccount` row with `platform = FACEBOOK_PAGE`, storing the Page token
   - For each Page that has an `instagram_business_account.id`: fetch IG details with `GET /{ig-id}?fields=id,username,profile_picture_url` and upsert as `INSTAGRAM_BUSINESS`. **Use the parent Page's token for IG operations** — IG publishing uses the Page token.
2. On dashboard mount, call this endpoint automatically
3. Display connected accounts as cards (FB Page name + IG @handle) with platform badges and a manual "Refresh" button

**Acceptance:** After login, the dashboard lists every Page the user admins and every linked IG Business account.

### Phase 4 — Media upload to Supabase Storage
1. Build `POST /api/upload` that:
   - Accepts a `multipart/form-data` request with the file
   - Validates type (jpg/png/mp4/mov) and size (image ≤ 8MB, video ≤ 100MB)
   - Uploads to the `media` bucket using the service-role Supabase client with a path like `{userId}/{uuid}.{ext}`
   - Returns the public URL: `${SUPABASE_URL}/storage/v1/object/public/media/{path}`
2. Build `MediaUploader.tsx`:
   - Drag-drop or file picker
   - Client-side validation with friendly errors
   - Warn (don't block) when image aspect ratio is outside Instagram's 4:5 to 1.91:1 range
   - POST file to `/api/upload`, show preview on success

**Note on alternative:** You could also use Supabase's signed upload URLs to upload from the browser directly. For the MVP, going through the API route is simpler and lets us validate server-side. Switch later if upload speed becomes an issue.

**Acceptance:** User picks a file, sees a preview, and the file is publicly fetchable via the returned URL (test by opening the URL in a private window).

### Phase 5 — Composer + publish (the core)

Build `PostComposer.tsx` with:
- Media uploader (Phase 4 component)
- Caption textarea with live char count, warn at 2200 (IG limit)
- Checkboxes for each connected `SocialAccount` (default all checked)
- "Post now" button (disabled while publishing)

Build `POST /api/posts` that:
1. Creates the `Post` row + `PostTarget` rows (one per selected account, status PENDING)
2. For each target, marks it PUBLISHING and calls the right publisher — **synchronous, parallel via `Promise.allSettled`**
3. Updates each `PostTarget` to SUCCESS (with `externalPostId` and `permalink`) or FAILED (with `errorMessage`)
4. Returns the post with target statuses

**`lib/meta/facebook.ts` — `publishToPage(account, post)`:**
- Image: `POST /v21.0/{page-id}/photos` with body `{ url, caption, access_token }`
- Video: `POST /v21.0/{page-id}/videos` with body `{ file_url, description, access_token }`
- Permalink: response includes `id` like `{pageId}_{postId}`; permalink is `https://facebook.com/{id}`

**`lib/meta/instagram.ts` — `publishToInstagram(account, post)`:**
1. **Create container:**
   - Image: `POST /v21.0/{ig-user-id}/media` with `{ image_url, caption, access_token }` → returns `{id: containerId}`
   - Video/Reel: `POST /v21.0/{ig-user-id}/media` with `{ media_type: 'REELS', video_url, caption, access_token }`
2. **For video, poll status:** `GET /v21.0/{containerId}?fields=status_code&access_token=...` every 3s up to 60s. Wait for `FINISHED`. Bail on `ERROR` or `EXPIRED`.
3. **Publish:** `POST /v21.0/{ig-user-id}/media_publish` with `{ creation_id: containerId, access_token }` → returns the IG media ID
4. **Get permalink:** `GET /v21.0/{media-id}?fields=permalink&access_token=...` and store it

Surface Meta's error messages verbatim to `PostTarget.errorMessage` — they're how you debug aspect ratio rejections, missing permissions, expired tokens, etc.

**Acceptance:** User uploads an image, writes a caption, selects FB Page + IG, clicks Post, and within ~10 seconds sees both posts live on the actual platforms. Failure on one platform doesn't block the other.

### Phase 6 — Post history
1. `GET /api/posts` returns the current user's posts with their targets, ordered newest first
2. `/dashboard/history` page shows a list: thumbnail, caption excerpt, timestamp, per-target status pills (green SUCCESS, red FAILED with hover-to-see-error tooltip, yellow PENDING/PUBLISHING)
3. SUCCESS targets link out to the `permalink` stored on the target

**Acceptance:** Every post the user has made is visible with live links and any error details.

### Phase 7 — Polish for demo
1. Loading states everywhere — buttons disabled during publish, spinners, toasts on success/failure
2. Empty states — "No accounts connected yet" with a refresh CTA, "No posts yet" on history
3. Sign out button in the header
4. Basic error boundary (`error.tsx`)
5. Favicon, page title, OG image
6. Verify mobile layout doesn't break (the client may demo on a phone)

### Phase 8 — Deploy
1. Push to GitHub
2. Connect repo to Vercel
3. Set env vars in Vercel (use the **pooled** Supabase connection string for `DATABASE_URL`)
4. Add the Vercel production URL to the Meta app's OAuth redirect URIs
5. Run a full end-to-end test on production with a real post

---

## Required env vars (`.env.example`)

```
# Database (Supabase Postgres)
DATABASE_URL=postgresql://postgres.xxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:[password]@aws-0-region.pooler.supabase.com:5432/postgres

# NextAuth
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Meta
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
META_GRAPH_VERSION=v21.0

# Supabase Storage
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=media
```

---

## Out of scope for the MVP (intentional)

- **Job queue / scheduled posts** — added later as a Render-hosted worker reading from a Postgres-backed queue (likely `pg-boss`)
- App Review — not needed in dev mode with testers
- Multi-tenancy / customer-of-customer architecture
- Stories (different API path)
- Carousels (multi-image IG)
- Other platforms (LinkedIn, X, TikTok, Threads — all v2)
- Team / collaboration features
- Billing / subscriptions
- Content approval workflows
- Analytics dashboards
- Token encryption at rest (flag as tech debt before any non-demo use)

---

## Important gotchas the agent should know upfront

1. **Page tokens vs User tokens.** A Page access token (obtained from `/me/accounts` after the user has a long-lived user token) does not expire as long as the user remains a Page admin. Store and use the **Page token** for posting to that Page, not the user token. **For Instagram publishing, also use the parent Page's token** — IG operations are authenticated by the Page that owns the IG Business account.

2. **Instagram requires public URLs.** The `image_url`/`video_url` in container creation must be publicly fetchable by Meta's servers. Localhost won't work. Supabase public bucket URLs work out of the box, which is one of the main reasons we chose this stack.

3. **Video on IG is async.** Always poll `status_code` before calling `media_publish`. Skipping this causes mysterious failures.

4. **Aspect ratio matters for IG.** Feed: 4:5 to 1.91:1. Reels: 9:16. Outside these ranges, Meta returns a non-obvious error. Validate before sending.

5. **Dev mode tester acceptance.** Each tester must accept the role invite by visiting `https://www.facebook.com/settings?tab=business_tools`. Tell the client this in SETUP.md.

6. **Pin the Graph API version** in every URL (`/v21.0/...`). Don't use the unversioned endpoint — it floats and silently breaks things.

7. **Supabase connection pooling.** Use the pooled URL (`6543`) for `DATABASE_URL` so Vercel's serverless functions don't exhaust connections. Use the direct URL (`5432`) only for migrations via `DIRECT_URL`.

8. **Service role key is server-only.** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Only use it in API routes (`src/app/api/**`) and server components.

9. **Vercel function timeout.** Default is 10s on the free Hobby plan. Video posts to IG can take longer due to polling — keep polling capped at 60s but be aware that long videos may time out. Pro plan has 60s default. For the MVP, document the limit; if it bites, switch to Pro or extract publishing to a Render worker (which is also where the future job queue lives).

---

## Testing strategy

- Unit test the Graph API wrapper with mocked fetch
- Manual end-to-end checklist per build:
  - [ ] Fresh user can sign in
  - [ ] Pages and IG accounts appear after login
  - [ ] Image post to FB only works
  - [ ] Image post to IG only works
  - [ ] Image post to both works
  - [ ] Video post to FB works
  - [ ] Video post to IG (Reel) works — including the polling step
  - [ ] One platform failing does not prevent the other from posting
  - [ ] History page shows correct status and links
  - [ ] Sign out and back in preserves connected accounts

---

## Demo script for the client meeting

1. Open the app, click "Continue with Facebook"
2. Show the consent screen — point out the requested permissions
3. Land on dashboard — show their Pages and IG accounts auto-populated
4. Upload a sample image, write a caption with a hashtag
5. Check both FB and IG, hit Post
6. Switch to FB and IG in another tab — show the post live on each
7. Open History — show success indicators and direct links
8. (Optional) Demo a video post to show Reels publishing
9. Wrap with: "This is the foundation — from here we can add scheduling (which will live on a Render worker), multi-account management for your customers, analytics, and more platforms like LinkedIn or TikTok."