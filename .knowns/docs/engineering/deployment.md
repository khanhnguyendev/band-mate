---
title: Deployment
description: Deploy guide — Vercel (web), Railway (API+workers), Supabase (DB+storage), Upstash (Redis), env vars, rollback, troubleshooting
createdAt: '2026-05-01T07:35:24.783Z'
updatedAt: '2026-05-01T07:35:24.783Z'
tags:
  - engineering
  - devops
---

# Deployment Guide

Band Mate deploys across three free-tier cloud services:

| App | Platform | Deploy trigger |
|---|---|---|
| Next.js web | Vercel | Git push to `main` / PR branches |
| NestJS API + workers | Railway (or Render) | Git push to `main` |
| PostgreSQL | Supabase | Managed — no deploy step |
| Redis | Upstash | Managed — no deploy step |
| Audio storage | Supabase Storage | Managed — bucket config only |

---

## Environments

| Environment | Purpose | Branch |
|---|---|---|
| `development` | Local developer machine | any |
| `staging` | QA and pre-release validation | `main` (auto-deploy) |
| `production` | Live learner traffic | release tags `v*.*.*` |

Vercel automatically creates **preview deployments** for every open PR. Use these for feature review without touching staging.

---

## Prerequisites

Before the first deploy:

1. **Supabase project** — create a project at [supabase.com](https://supabase.com). Note the `DATABASE_URL` (direct), `DATABASE_URL_POOLER` (PgBouncer), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Supabase Storage buckets** — create two buckets: `audio-submissions` (private) and `mascot-assets` (public).
3. **Upstash Redis database** — create at [upstash.com](https://upstash.com). Note `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`.
4. **Vercel project** — connect the GitHub repo in the Vercel dashboard. Set root directory to `apps/web`.
5. **Railway project** — connect the GitHub repo. Set root directory to `apps/api`. Add a second Railway service for workers if running them as separate processes.
6. AI provider API key (Anthropic or OpenAI).
7. Whisper transcription API key.
8. Stripe account (required for production top-ups).
9. SMTP credentials for transactional email.

---

## Environment Variables

All required variables are listed in `.env.example`. Key ones:

### Shared

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` \| `staging` \| `production` |

### Database (Supabase)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase direct connection string — used by Prisma migrations |
| `DATABASE_URL_POOLER` | Yes | Supabase PgBouncer URL — used by API at runtime (`?pgbouncer=true`) |

### Redis (Upstash)

| Variable | Required | Description |
|---|---|---|
| `UPSTASH_REDIS_URL` | Yes | `rediss://...` connection URL |
| `UPSTASH_REDIS_TOKEN` | Yes | Upstash REST token (also used by BullMQ via ioredis) |

### Supabase Storage

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key for server-side storage access |
| `SUPABASE_ANON_KEY` | Yes | Anon key for public reads (mascot assets) |
| `STORAGE_AUDIO_BUCKET` | Yes | Name of private audio bucket (e.g. `audio-submissions`) |

### Auth

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |

### AI

| Variable | Required | Description |
|---|---|---|
| `AI_PROVIDER` | Yes | `anthropic` \| `openai` |
| `AI_API_KEY` | Yes | API key for the AI scoring provider |
| `AI_MODEL` | Yes | Model ID (e.g. `claude-sonnet-4-6`) |
| `TRANSCRIPTION_API_KEY` | Yes | Whisper API key |

### Payments and email

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Prod | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Prod | Stripe webhook signing secret |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Public-facing API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (for client-side storage SDK if needed) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key for client-side reads |

### Misc

| Variable | Required | Description |
|---|---|---|
| `BONUS_CREDIT_EXPIRY_DAYS` | No | Days before earned bonus credits expire (default: 90) |

---

## Build

```bash
# Build both apps locally
pnpm build

# Build individual app
pnpm --filter web build
pnpm --filter api build
```

Vercel and Railway both run `pnpm build` automatically on deploy via their detected build commands.

---

## Database Migrations

```bash
# Run pending migrations against Supabase (use direct URL, not pooler)
DATABASE_URL=$DATABASE_URL pnpm --filter api db:migrate:deploy

# Generate a new migration after schema change (development only)
pnpm --filter api db:migrate:dev
```

Migrations are applied automatically in CI before each staging deploy.

> Use the **direct** `DATABASE_URL` (not the pooler URL) for Prisma `migrate deploy` — PgBouncer does not support the advisory locks Prisma uses during migrations.

---

## Deploy

### Next.js → Vercel

Automatic on every push to `main` (staging) and on `v*.*.*` tags (production).

```bash
# Manual deploy via Vercel CLI (optional)
npx vercel --prod
```

### NestJS API + workers → Railway

Automatic on every push to `main`.

```bash
# Manual deploy via Railway CLI (optional)
railway up --service api
railway up --service workers
```

### Staging promotion to production

Tag a release commit:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Both Vercel and Railway can be configured to deploy tagged releases to the production environment.

---

## Health Check

```
GET /health           → { "status": "ok", "db": "ok", "redis": "ok" }
GET /health/workers   → queue depths and worker liveness (admin token required)
```

A deployment is considered successful when `/health` returns `200` with all subsystems `ok`.

Vercel automatically checks the web app root. Railway uses the `/health` endpoint as its health check URL — configure this in the Railway service settings.

---

## Rollback

### Web (Vercel)
Use the Vercel dashboard → Deployments → select a previous deployment → **Promote to Production**.

### API (Railway)
Use the Railway dashboard → Deployments → select a previous deployment → **Rollback**.

### Database
Migrations should be forward-only. If a migration must be reverted:

```bash
pnpm --filter api db:migrate:revert
```

This is a manual step — always take a Supabase database backup (Dashboard → Database → Backups) before a production migration.

---

## Troubleshooting

### Scoring jobs stuck in queue
1. Check `GET /admin/jobs` for error messages.
2. Check Railway worker logs in the Railway dashboard.
3. Common cause: AI API key expired or rate-limited. Rotate key and redeploy.
4. Use `POST /admin/jobs/:id/retry` to requeue stuck jobs.
5. If Upstash free tier command limit is hit, jobs will fail to enqueue — check Upstash dashboard for usage.

### Credits not refunded after failure
1. Check the dead-letter queue in the BullMQ dashboard (or via `GET /admin/jobs?status=dead`).
2. Confirm the `refund` job ran — look for a ledger entry of type `refund`.
3. If missing, manually trigger a refund via the admin console.

### Database migration fails on deploy
1. Ensure `DATABASE_URL` is the **direct** Supabase connection, not the PgBouncer pooler URL.
2. Check for long-running queries in Supabase Dashboard → Database → Query Performance.
3. Supabase free tier pauses inactive projects after 7 days — resume the project in the dashboard before running migrations.

### Audio upload fails
1. Check Supabase Storage bucket CORS policy — must allow PUT from the web app origin (Vercel URL).
2. Pre-signed URLs expire in 5 minutes — the client should re-request a URL if the upload times out.
3. Check that the `audio-submissions` bucket is set to **private** and the service-role key is being used server-side.

### API cold starts (Railway / Render free tier)
Free tier services may sleep after inactivity. Set up an uptime monitor (e.g. Better Uptime free tier) to ping `/health` every 5 minutes, or upgrade to a paid Railway plan before beta launch.
