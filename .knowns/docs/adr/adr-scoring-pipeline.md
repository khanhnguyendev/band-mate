---
title: 'ADR: Scoring Pipeline'
description: 'Decision record: async queue-based AI scoring pipeline'
createdAt: '2026-05-01T07:35:24.829Z'
updatedAt: '2026-05-01T07:35:24.829Z'
tags:
  - adr
---

# ADR 0003: Async Queue-Based AI Scoring Pipeline

**Date:** 2026-05-01
**Status:** Accepted

---

## Context

Writing and Speaking scoring requires calling an LLM API and, for speaking, a transcription API first. These calls can take 5–30 seconds and may fail. Handling them synchronously in the request path would cause HTTP timeouts, prevent retry logic, and make credit refund on failure complex and error-prone.

## Decision

All AI scoring and transcription work runs through a **BullMQ queue backed by Redis**. The API accepts submissions synchronously (returning `202 Accepted`), enqueues a job, and returns a `submissionId`. Clients poll `GET /submissions/:id/status` or subscribe to SSE for completion. Three worker process types run independently: `transcription-worker`, `scoring-worker`, and `notification-worker`.

The pipeline for speaking is:
1. API: validate input, reserve credits, enqueue `transcribe` job.
2. `transcription-worker`: download audio, call Whisper API, store transcript, enqueue `score-speaking` job.
3. `scoring-worker`: call LLM with prompt pack, validate rubric output, persist report, consume credits.
4. `notification-worker`: send in-app / email notification.

For writing, step 1 skips transcription and enqueues directly to `score-writing`.

Credit refund is triggered if any step after reservation throws after exhausting retries. A dead-letter queue captures permanently failed jobs for admin inspection.

## Alternatives Considered

- **Synchronous scoring in request handler** — Simple but causes timeouts for slow AI calls, no retry path, and makes atomic credit refund on partial failure very hard. Ruled out.
- **Polling against the AI provider's async API (e.g. Anthropic Batches)** — Lower cost per token but adds latency of minutes. Acceptable for batch export but too slow for interactive practice feedback. Ruled out for primary flow.
- **Server-Sent Events as the primary delivery mechanism** — SSE is used as an optional faster delivery path alongside polling but cannot be the only mechanism because mobile clients may reconnect frequently.

## Consequences

- Scoring latency is visible to learners as a processing state. This is acceptable; UI shows progress feedback.
- Workers can be scaled independently of the API.
- Dead-letter queue provides admin visibility into failures without data loss.
- BullMQ requires a healthy Redis instance; Redis becomes a critical dependency.
- Each worker step must be idempotent — re-running a completed step must not double-consume credits or double-persist reports.
