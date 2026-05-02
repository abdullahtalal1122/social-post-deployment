# SETUP.md — one-time human prerequisites

This MVP runs in **Meta development mode** — no App Review, but only people added as **App Testers** in the Meta dashboard can use the app. Complete every numbered step below before running `npm run dev`.

## 1. Meta for Developers — create the app

1. Go to https://developers.facebook.com and create or sign in to a developer account.
2. Click **My Apps → Create App**.
3. Use case: **"Other"** → **App type: Business** → continue.
4. Once the app is created, in the left sidebar add these products:
   - **Facebook Login** → set up
   - **Instagram** (or "Instagram API with Instagram Login" depending on what's available)
5. Under **Settings → Basic**, copy:
   - **App ID** → goes in `.env` as `AUTH_FACEBOOK_ID`
   - **App Secret** → goes in `.env` as `AUTH_FACEBOOK_SECRET`
6. Under **Facebook Login → Settings**, add these **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/auth/callback/facebook`
   - (later) `https://YOUR-VERCEL-DOMAIN/api/auth/callback/facebook`
7. Under **App Roles → Roles → Testers**, click **Add Testers** and invite:
   - The client's Facebook account
   - Any teammates who'll demo the app
   Each tester must accept the invite at https://www.facebook.com/settings?tab=business_tools.

## 2. Verify the client's Instagram is publishable

Instagram publishing only works when:
- The client's Instagram account is **Business** or **Creator** (not Personal). Convert in the IG mobile app: Settings → Account → Switch to Professional Account.
- The Instagram account is **linked to a Facebook Page** the client admins. Link in the IG app: Settings → Business → Connect to a Facebook Page.

If both aren't true, the dashboard will only show Facebook Pages with no Instagram options.

## 3. Supabase — database + storage

1. Go to https://supabase.com and create a new project. Pick a region close to you. Save the database password.
2. Once the project is up, in **Project Settings → Database** find both connection strings:
   - **Connection pooling** (port `6543`, mode "Transaction") → `DATABASE_URL`
     - End it with `?pgbouncer=true`
   - **Direct connection** (port `5432`) → `DIRECT_URL`
3. In **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` key** (NOT the anon key) → `SUPABASE_SERVICE_ROLE_KEY`
   - This key is server-only — never expose it to the browser.
4. In **Storage**, click **Create new bucket**:
   - Name: `media`
   - **Public**: ON
   - Save.
5. (Optional) In **Storage → Policies**, the default Public bucket policy is fine. We use the service-role key from the server, which bypasses RLS anyway.

## 4. Local environment

```bash
cp .env.example .env
# Fill in every variable from steps 1 + 3
openssl rand -base64 32   # paste the output as AUTH_SECRET
```

Then:

```bash
npm install
npx prisma migrate dev --name init   # creates the schema in Supabase
npm run dev
```

Open http://localhost:3000 and click "Continue with Facebook".

## 5. Production (Vercel)

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel **Settings → Environment Variables**, paste all `.env` values. Use the **pooled** connection string (`6543`) for `DATABASE_URL`.
4. Note the production URL Vercel assigns. Add it to:
   - Meta app → Facebook Login → Valid OAuth Redirect URIs:
     `https://YOUR-VERCEL-DOMAIN/api/auth/callback/facebook`
   - `NEXTAUTH_URL` env var in Vercel = `https://YOUR-VERCEL-DOMAIN`
5. Re-deploy and run a real end-to-end post.

## Common gotchas

- **Tester invite not accepted** → Login fails silently or "App not active". The tester must accept at facebook.com/settings?tab=business_tools.
- **IG account not Business** → No Instagram options appear in the dashboard. Convert in the mobile IG app.
- **Aspect ratio rejected** → Instagram feed accepts ratios from 4:5 (0.8) to 1.91:1. Reels need 9:16. Outside these ranges, Meta returns a non-obvious error.
- **Localhost media fails on IG** → IG needs a publicly reachable URL. The Supabase public bucket gives you that — don't try to use a local file URL.
- **Vercel free-tier 10s timeout** → Long video posts may exceed it. Upgrade to Pro (60s) if it bites.
