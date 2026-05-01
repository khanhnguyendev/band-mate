# Agent Instructions

This file provides guidance for AI agents (Claude, Gemini, Copilot, Cursor, etc.) working on this repository. Read this before making any changes.

---

## Repository Purpose

Band Mate is an AI-assisted IELTS exam preparation platform. Learners practice Writing, Speaking, Reading, and Listening, receive AI-estimated scores with criterion-level feedback, track progress, and earn gamified rewards. The backend orchestrates async AI scoring jobs, a credit wallet, and a queue-based pipeline. The frontend is a Next.js web app serving both the learner experience and an admin console.

---

## Tech Stack

| Layer | Technology | Provider |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | Vercel |
| Backend API + workers | NestJS, TypeScript | Railway or Render |
| Database | PostgreSQL via Prisma | Supabase |
| Queue + cache | BullMQ on Redis | Upstash Redis |
| Object storage | Supabase Storage (S3-compatible) | Supabase |
| AI scoring | LLM API (e.g. Claude or GPT-4o) via prompt packs | Anthropic / OpenAI |
| Transcription | Whisper API | OpenAI |

---

## Priority Rules

1. **Read before writing.** Explore the existing code structure before adding or modifying anything.
2. **Match the conventions already in use.** Naming, file structure, formatting — follow what is there.
3. **Small, focused changes.** One concern per commit. Do not refactor unrelated code while fixing a bug.
4. **Do not remove or alter this file** unless explicitly instructed by a human maintainer.
5. **Never commit secrets, tokens, or credentials.** Use `.env` and the vault.

---

## Domain Concepts Agents Must Understand

### Credit wallet
Every Writing and Speaking AI-scored submission costs credits. The flow is **reserve → score → consume** (or **reserve → fail → refund**). Credits must never go below zero. Wallet operations must be idempotent.

### Scoring pipeline
Submissions enter a BullMQ queue. Workers: (1) reserve credits, (2) transcribe audio if needed, (3) call AI scoring with a versioned prompt pack, (4) validate and normalise the rubric output, (5) persist the report, (6) settle credits, (7) dispatch notification. Each step has a retry budget. Failure at any step after reservation triggers a refund job.

### Rubrics and prompt packs
Prompt packs are versioned records in the database (not in code). AI criteria for Writing are: task response, coherence and cohesion, lexical resource, grammatical range and accuracy. For Speaking: fluency and coherence, lexical resource, grammatical range and accuracy, pronunciation. The scoring output must always be validated against the rubric schema before persisting.

### Gamification
XP is earned from most learning actions and drives levels and badges. Credits can be earned from validated low-cost actions (Reading/Listening completions, report reviews, grammar drills) subject to daily and weekly earning caps. XP and credit earning must enforce anti-abuse rules — only validated completions, minimum time/effort thresholds, no repeat rewards for identical content within the cap window.

### Plans and entitlements
Users are on one of: Free, Starter, Pro. Each plan grants a monthly credit allocation. Users can buy credit top-ups. Bonus credits (earned via gamification) expire after a configured window. The entitlement service is the source of truth for what a user can do.

---

## Docs to Fill / Maintain

| File | Fill when |
|---|---|
| `docs/ARCHITECTURE.md` | After exploring top-level modules and understanding their connections |
| `docs/API.md` | After reading all public endpoints and their shapes |
| `docs/DATA_MODEL.md` | After reading the database schema and migrations |
| `docs/DEPLOYMENT.md` | After understanding the CI/CD pipeline and environment config |
| `docs/adr/` | When a significant design decision is made — use the ADR template |

---

## Testing

- Run the full test suite before marking any task complete: `pnpm test`.
- Do not delete or skip existing tests to make the suite pass.
- Integration tests for the wallet must use a real database transaction — do not mock wallet settlement.
- If a test is failing due to a pre-existing unrelated issue, note it explicitly in your output.

---

## What to Avoid

- Do not commit secrets, tokens, or credentials.
- Do not add unbounded AI calls — every scoring invocation must be gated by a credit reservation.
- Do not introduce direct database calls inside queue workers without going through the service layer.
- Do not use `TODO` comments as a substitute for solving the problem.
- Do not add dependencies without checking whether the existing codebase already provides equivalent functionality.
- Do not update `CHANGELOG.md` unless explicitly asked — that is a human-curated file.
- Do not present AI scores as official IELTS band scores in UI copy or API responses.

---

## Asking for Clarification

If a task is ambiguous or requires a decision with significant architectural implications, pause and ask the human rather than making assumptions. Key uncertain areas to escalate: prompt pack changes, pricing or entitlement rule changes, credit cap adjustments, and any AI provider switch.
