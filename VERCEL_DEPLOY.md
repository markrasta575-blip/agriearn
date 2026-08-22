# Deploy AgriEarn to Vercel — Step by Step

This guide deploys AgriEarn to Vercel with a free **Vercel Postgres** database.
After deployment, anyone can use your site on mobile/desktop at a public URL.

---

## Prerequisites
- A GitHub account (you already have one: `markrasta575-blip`)
- A Vercel account (free — sign up with GitHub)

---

## Step 1 — Create a Vercel Postgres database

1. Go to **https://vercel.com** → log in with your GitHub account.
2. Click your profile (top-right) → **"Storage"** (or "New Project → Storage").
3. Click **"Create Database"** → choose **"Postgres"** (Neon).
4. Name it `agriearn-db` → click **"Create"**.
5. On the database page, click **".env.local"** tab → copy the `POSTGRES_URL`
   value (starts with `postgres://default:...`).

> This is your production database URL. Keep it handy for Step 3.

---

## Step 2 — Import your GitHub repo into Vercel

1. In Vercel dashboard → click **"Add New"** → **"Project"**.
2. Under "Import Git Repository", find **`markrasta575-blip/agriearn`**.
   - If you don't see it, click "Adjust GitHub App Permissions" and grant access.
3. Click **"Import"** next to the repo.

---

## Step 3 — Configure environment variables

On the "Configure Project" screen, scroll to **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | *(paste the Postgres URL from Step 1)* |

- Click **"Add"**.
- Leave everything else as defaults (Vercel auto-detects Next.js).
- Click **"Deploy"**.

---

## Step 4 — Wait for the build (2-3 minutes)

Vercel will:
1. Run `bun install`
2. Run `prisma generate` (postinstall hook)
3. Run `next build`

When you see **"Congratulations"** with confetti 🎉, your site is live at:
```
https://agriearn-<random>.vercel.app
```

---

## Step 5 — Create the database tables + seed data

Your Postgres database is empty. Run the migration + seed from your local machine:

```bash
# In your local agriearn folder, temporarily set the Postgres URL:
# Windows Command Prompt:
set DATABASE_URL=postgres://default:xxxxx@xxx.region.postgres.vercel.com/agriearn?sslmode=require

# Then push the schema + seed:
bun run db:push
bun run scripts/seed.ts
```

> Replace the URL with the one from Step 1. After seeding, your admin user
> (phone `0990000000` / password `admin123`) and all 3 products exist in
> Postgres.

---

## Step 6 — Open your live site

Go to your Vercel URL (e.g. `https://agriearn.vercel.app`):
- Log in as admin: phone `0990000000` / password `admin123`
- Register new users, buy products, test the full flow
- Share the URL on Telegram / WhatsApp / Facebook — anyone can use it on mobile! 📱

---

## Optional: Custom domain

1. Vercel dashboard → your project → **"Settings" → "Domains"**
2. Add your domain (e.g. `agriearn.com`)
3. Update your domain's DNS to point to Vercel (instructions shown)
4. Vercel auto-provisions HTTPS (Let's Encrypt, free)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails: "prisma generate" error | Ensure `DATABASE_URL` env var is set in Vercel |
| "Database connection error" at runtime | Verify the Postgres URL has `?sslmode=require` |
| 404 on API routes | Make sure `output: "standalone"` is NOT required; Vercel handles it |
| Need to re-seed after deploy | Run `bun run db:push` + `bun run scripts/seed.ts` locally with the prod DATABASE_URL |

For more help, paste the error in the chat.
