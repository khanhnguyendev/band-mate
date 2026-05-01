---
title: 'ADR: Credit Wallet'
description: 'Decision record: reserve/consume/refund credit wallet model'
createdAt: '2026-05-01T07:35:24.853Z'
updatedAt: '2026-05-01T07:35:24.853Z'
tags:
  - adr
---

# ADR 0004: Reserve/Consume/Refund Credit Wallet Model

**Date:** 2026-05-01
**Status:** Accepted

---

## Context

Writing and Speaking AI scoring is the main cost center. Each scored submission triggers an LLM API call that costs real money. If credits are only deducted after scoring succeeds, a user could exploit a race condition to submit more jobs than their balance allows. If credits are deducted before scoring and the job fails, users lose credits unfairly.

The wallet must also support multiple credit pools (plan-granted credits, purchased top-ups, gamification-earned bonus credits with expiry), and all mutations must be auditable.

## Decision

Use a **reserve → consume → refund** model implemented with an append-only ledger:

1. **Reserve:** Before enqueuing a scoring job, create a `reserve` ledger entry and reduce available balance. If balance is insufficient, return `402` immediately — no job is created.
2. **Consume:** After the scoring job succeeds, create a `consume` ledger entry converting the reservation to a permanent deduction.
3. **Refund:** If the scoring job fails after exhausting retries, create a `refund` ledger entry restoring the reserved amount.

All ledger writes use a unique `idempotency_key` (derived from `submissionId + type`) to prevent double-processing if a worker retries.

All wallet mutations run inside PostgreSQL **serializable transactions** to prevent two concurrent submissions from both seeing sufficient balance when only one can be allowed.

Bonus credits (earned via gamification) are tracked in a separate `bonus_balance` column and have an expiry date. They are consumed first.

## Alternatives Considered

- **Deduct only on success** — Simple but vulnerable to concurrent over-spend; a user with 2 credits could submit 10 jobs simultaneously. Ruled out.
- **Optimistic locking on wallet row** — Requires retry logic at the application layer; more complex than serializable transactions and prone to starvation under high concurrency. Ruled out.
- **External payment-style escrow** — Overkill for in-app credits; adds latency. Ruled out.
- **Simple counter with DB constraint (balance >= 0)** — Does not support the idempotency and auditability requirements. Does not cleanly model the reserve/refund lifecycle. Ruled out.

## Consequences

- Users see an accurate real-time balance including reserved (in-flight) credits.
- Credit over-spend is impossible at the database level.
- Every credit event is auditable via the ledger; admin can reconstruct wallet state at any point in time.
- Serializable transactions add some write latency under high concurrency, but submission rates per user are low enough that this is not a bottleneck.
- Refund logic must be tested thoroughly — it is the failure path that protects user trust.
