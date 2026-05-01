---
title: Architecture
description: System design, component map, data flows (writing + speaking pipeline), infrastructure (Vercel/Railway/Supabase/Upstash), trade-offs
createdAt: '2026-05-01T07:35:24.711Z'
updatedAt: '2026-05-01T07:35:24.711Z'
tags:
  - engineering
  - infrastructure
---

# Architecture Overview

Band Mate is a web platform with a Next.js frontend and a NestJS backend API. AI scoring, transcription, and wallet settlement are handled asynchronously via a queue worker to isolate latency and cost from the request path.

---

## System Design

```
┌───────────────────────────────────────────────────────┐
│                     Browser / PWA                     │
│              Next.js  (App Router, SSR)               │
│              Deployed on  Vercel                      │
└────────────────────────┬──────────────────────────────┘
                         │ HTTPS / REST + SSE
┌────────────────────────▼──────────────────────────────┐
│                   NestJS API Server                   │
│  Auth · Users · Wallet · Submissions · Reports        │
│  Quests · Plans · Admin                               │
│  Deployed on  Railway / Render (free tier)            │
└──────┬──────────────────────────┬─────────────────────┘
       │ Prisma ORM               │ BullMQ jobs
┌──────▼──────────┐       ┌───────▼──────────────────────┐
│ Supabase        │       │      Queue Workers            │
│ PostgreSQL      │       │  transcription-worker         │
│ (managed DB)    │       │  scoring-worker               │
└─────────────────┘       │  notification-worker          │
                          └──────┬───────────────────────┘
                                 │
              ┌──────────────────┼──────────────────────┐
              │                  │                       │
       ┌──────▼──────┐  ┌────────▼──────┐  ┌────────────▼────┐
       │  AI LLM API │  │  Whisper API  │  │  Upstash Redis  │
       │  (scoring)  │  │(transcription)│  │ (BullMQ + cache)│
       └─────────────┘  └───────────────┘  └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │ Supabase Storage│
                       │  (audio files)  │
                       └─────────────────┘
```

---

## Infrastructure at a Glance

| Service | Provider | Free tier |
|---|---|---|
| Web app (Next.js) | [Vercel](https://vercel.com) | Hobby — unlimited deploys, 100 GB bandwidth/month |
| API + workers (NestJS) | [Railway](https://railway.app) or [Render](https://render.com) | ~500 hours/month free |
| PostgreSQL | [Supabase](https://supabase.com) | 500 MB database, 2 projects |
| Redis (BullMQ + cache) | [Upstash](https://upstash.com) | 10,000 commands/day, 256 MB |
| Object storage (audio) | [Supabase Storage](https://supabase.com/storage) | 1 GB included with free project |
| AI scoring | Anthropic / OpenAI | Pay-per-token |
| Transcription | OpenAI Whisper API | Pay-per-minute |

---

## Key Components

### apps/web (Next.js → Vercel)
Learner-facing UI and admin console. Uses App Router with server components for dashboard and report pages. Client components handle the writing editor, audio recorder, and real-time job status polling via SSE. Deployed to Vercel via Git push; preview deployments on every PR branch.

### apps/api (NestJS → Railway / Render)
Core business logic. Exposes a REST API consumed by the web app. Responsible for auth, credit wallet, submission intake, quest evaluation, plan entitlements, and admin operations. Deployed as a long-running Node.js service (not serverless) because BullMQ workers need persistent connections.

### Queue workers (same process, Railway / Render)
Three worker types run as separate processes (or separate Railway services) consuming from BullMQ queues backed by Upstash Redis:

| Worker | Responsibility |
|---|---|
| `transcription-worker` | Downloads audio from Supabase Storage, calls Whisper API, stores transcript |
| `scoring-worker` | Calls AI LLM with a versioned prompt pack + rubric, validates output, persists report, settles credits |
| `notification-worker` | Sends in-app and email notifications when a report is ready or a quest triggers |

### Supabase PostgreSQL
Primary relational datastore. Accessed via Prisma ORM. All wallet mutations run in serializable transactions to prevent race conditions on credit balances. Connection pooling uses Supabase's built-in PgBouncer (`?pgbouncer=true` in the pooler connection string for the API, direct connection string for Prisma migrations).

### Upstash Redis
Dual role: BullMQ job queue backend, and short-lived cache for session data, rate-limit counters, and leaderboard snapshots. Upstash is serverless Redis — connect via standard `ioredis` using the `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`.

### Supabase Storage
Stores learner audio uploads. Pre-signed URLs are issued by the API (via the Supabase Storage SDK); the browser uploads directly to Supabase Storage. Workers download audio using the service-role key. Buckets: `audio-submissions` (private) and `mascot-assets` (public).

---

## Data Flow

### Writing submission
1. Learner submits essay text via POST `/submissions/writing`.
2. API validates input, calls `WalletService.reserve(userId, cost)` in a transaction.
3. API enqueues a `score-writing` BullMQ job and returns `{ submissionId, status: "queued" }`.
4. `scoring-worker` picks up the job: calls AI with prompt pack + rubric.
5. Worker validates AI response schema, normalises scores, persists `ScoreReport` + `CriterionRow[]`.
6. Worker calls `WalletService.consume(reservationId)` to settle credits.
7. Worker enqueues `notify-report-ready` job.
8. Learner's UI polls `GET /submissions/:id/status` or receives SSE event; loads report on completion.

### Speaking submission
Same as Writing, with an additional step between 2 and 3: the API enqueues a `transcribe-audio` job first. The `transcription-worker` completes transcription and then enqueues the `score-speaking` job, passing the transcript.

### Failure path
If any worker step throws after reservation, the worker calls `WalletService.refund(reservationId)` before exhausting retries. A dead-letter queue captures jobs that exhaust retries for admin inspection.

---

## Technology Decisions

| Decision | Rationale | ADR |
|---|---|---|
| Next.js + NestJS | Typed, full-stack, strong ecosystem; separate deployment units | [ADR 0002](adr/0002-nextjs-nestjs-stack.md) |
| BullMQ + Upstash Redis | AI scoring is slow and expensive; async isolation prevents timeout and enables retry. Upstash is serverless Redis with a generous free tier | [ADR 0003](adr/0003-ai-scoring-pipeline.md) |
| Credit reserve/consume/refund model | Prevents AI cost overruns; idempotent settlement protects wallet integrity | [ADR 0004](adr/0004-credit-wallet-model.md) |
| Supabase (DB + Storage) | Managed PostgreSQL + S3-compatible object storage in one free-tier project; built-in auth helpers and row-level security available if needed later | — |
| Vercel for Next.js | Zero-config Git deploys, preview environments per PR, global CDN, integrates natively with Next.js | — |
| Railway / Render for NestJS | Supports long-running Node.js processes (required for BullMQ workers); free tier sufficient for beta | — |
| Versioned prompt packs in DB | Allows rubric iteration without redeployment; admin-editable | — |
| PostgreSQL serializable transactions for wallet | Prevents double-spend on concurrent submissions | — |

---

## Known Constraints and Trade-offs

- **No native mobile apps in v1.** The web app is responsive but there is no React Native shell. PWA support is planned but not in scope for the first release.
- **AI score latency is visible.** Scoring is async; learners see a "processing" state. This is intentional — it removes timeout pressure and allows retry logic.
- **Upstash free tier has command limits.** 10,000 Redis commands/day on the free plan. Each BullMQ job uses ~5–10 commands. At 1,000 scoring jobs/day this is tight — upgrade to Upstash Pay-as-you-go early if beta traffic is strong.
- **Supabase Storage free tier is 1 GB.** Audio files average ~2–5 MB each. At ~200–500 speaking submissions this fills up. Enable lifecycle deletion of old audio after transcription is confirmed, or upgrade early.
- **Railway / Render free services sleep after inactivity.** Configure a health-check ping or upgrade to a paid plan before launch to prevent cold starts on the API.
- **Prompt packs are not open-sourced.** AI scoring quality depends on rubric prompts. They live in the database, accessible only to admins.
- **Reading and Listening are phase 2.** The MVP ships Writing and Speaking only. Reading/Listening modules are scaffolded but gated behind a feature flag.
- **No live tutoring in v1.** The platform is self-serve AI feedback only.
