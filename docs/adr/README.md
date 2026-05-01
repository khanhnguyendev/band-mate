# Architecture Decision Records

This folder contains Architecture Decision Records (ADRs) for Band Mate.

An ADR documents a significant architectural decision: what was decided, why, and what alternatives were considered. They are written at decision time and never deleted — superseded decisions are marked as such.

## How to Create a New ADR

1. Copy `0000-template.md` to a new file: `NNNN-short-title.md` (e.g. `0005-use-stripe.md`).
2. Increment the number from the last ADR in this folder.
3. Fill in all sections honestly — especially **Alternatives Considered** and **Consequences**.
4. Open a PR for review before the decision is finalised, when possible.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-nextjs-nestjs-stack.md) | Next.js + NestJS as core stack | Accepted |
| [0003](0003-ai-scoring-pipeline.md) | Async queue-based AI scoring pipeline | Accepted |
| [0004](0004-credit-wallet-model.md) | Reserve/consume/refund credit wallet model | Accepted |
