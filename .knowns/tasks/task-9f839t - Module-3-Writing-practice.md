---
id: 9f839t
title: 'Module 3: Writing practice'
status: done
priority: high
labels:
  - writing
  - mvp
  - ai-scoring
createdAt: '2026-05-01T07:35:24.914Z'
updatedAt: '2026-05-01T23:56:45.919Z'
timeSpent: 37132
assignee: '@me'
---
# Module 3: Writing practice

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Writing tasks browsable by type, difficulty, and estimated time. Editor with timer and draft state. AI scoring on submit with credit reservation. Report with criterion breakdown and next steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can browse and select a Writing task
- [x] #2 Credits are reserved before scoring begins
- [x] #3 Report includes overall estimated band, criterion breakdown, explanation, and next steps
- [x] #4 Failed score attempts trigger automatic credit refund
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prisma: add QuestionSet, Question, Submission, ScoringJob, ScoreReport, CriterionRow, ImprovementTask, PromptPack models to schema; seed 3 writing questions (Task 1 + Task 2) and one active PromptPack
2. WalletService: add reserve(userId, amount, desc, idempotencyKey) — atomic deduction in serializable tx, throws 402 if insufficient; add refund(walletId, amount, reservationLedgerEntryId, idempotencyKey) — restores balance via grant-type ledger entry
3. API: QuestionsModule — GET /v1/questions/writing?type=task1|task2&difficulty=band5..band8 returns question sets with first question prompt; no credit cost
4. API: SubmissionsModule — POST /v1/submissions/writing validates text length (≥50 chars), reserves credits via WalletService.reserve(), creates Submission row (status=queued), enqueues BullMQ score-writing job, returns 202 + submissionId; GET /v1/submissions/:id/status polls row status
5. API: BullMQ scoring worker (apps/api/src/workers/score-writing.worker.ts) — loads active PromptPack, calls Anthropic API, validates/clamps output (0–9 band), persists ScoreReport + CriterionRow rows + ImprovementTask rows, calls WalletService.consume(); on max-retries failure calls WalletService.refund() and sets submission status=failed; idempotent via ScoringJob status check
6. API: ReportsModule — GET /v1/reports/:id returns full report (overallBand, disclaimer, criteria[], improvementTasks[])
7. Web: /writing — question browser page (cards: task type, difficulty, estimated time); writing editor page with countdown timer + word count + localStorage draft autosave; submit → poll GET /submissions/:id/status every 3s → redirect to /reports/:id on completion
8. Tests: WalletService.reserve() unit spec (happy path + insufficient credits); WalletService.refund() spec; SubmissionsService unit spec (reserve → enqueue flow); scoring worker unit spec (happy path + failure/refund path)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
All 10 tests pass: WalletService.reserve (happy path, 402 on insufficient, idempotency), WalletService.refund (happy path, idempotency), SubmissionsService.submitWriting (reserve→enqueue, NotFoundException), ScoreWritingWorker (happy path, idempotency, failure+refund). Fixed: resetAllMocks() clears mock implementations — wallet mocks must be re-stubbed in beforeEach.
<!-- SECTION:NOTES:END -->

