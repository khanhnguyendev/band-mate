---
id: bjthky
title: 'Module 5: Reading practice'
status: done
priority: medium
labels:
  - reading
  - phase-2
createdAt: '2026-05-01T07:35:24.956Z'
updatedAt: '2026-05-04T11:58:49.594Z'
timeSpent: 205053
assignee: '@me'
---
# Module 5: Reading practice

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reading sets with questions and answer keys. Instant auto-scoring on submit. Eligible completions earn small bonus credits. Phase 2 — gated behind feature flag in MVP.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can complete a Reading set end to end
- [x] #2 Score is instant
- [x] #3 User can earn small bonus credits from validated completion
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prisma seed: add 1 reading question set (Academic passage + 5 True/False/Not Given questions) with `answerKey: { answer: '...' }` on each Question; questions seeded as part of the set
2. QuestionsService.findReading() + GET /v1/questions/reading: same pattern as findWriting/findSpeaking; route throws ForbiddenException if FEATURE_READING env var is not 'true'
3. ReadingService.submitReading(userId, setId, answers): loads all questions for the set with answer keys, scores synchronously (case-insensitive compare), creates Submission (status=completed, skill=reading, inputText=JSON.stringify(answers)), grants 1 bonus credit via WalletService.grant() with idempotency key `reading-bonus:{userId}:{setId}` (first completion only); returns { score, total, percentage, breakdown[] } immediately — no queue, no AI
4. ReadingController + ReadingModule: wire service + controller; feature flag guard (ForbiddenException if FEATURE_READING !== 'true'); import into AppModule
5. Web: /reading page (feature-flag check → redirect to dashboard if disabled; otherwise show set cards); /reading/[setId] page with passage text, question list, answer form; on submit calls POST /v1/submissions/reading and shows inline results (score banner + per-question breakdown)
6. Tests: ReadingService spec — full correct answers, partial score, bonus credit grant, idempotent double-submit (second submit doesn't double-grant); NotFoundException for unknown set
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: seed (1 academic reading set, 5 T/F/NG questions, passage stored in mediaUrl), QuestionsService.findReading(), ReadingService (sync scoring, case-insensitive, bonus grant via idempotency key), ReadingController (GET /reading/sets, POST /reading/sets/:setId/submit), ReadingModule, FEATURE_READING flag guard, /reading browser page, /reading/[setId] server+client split (ReadingQuiz component). 37/37 tests pass.
<!-- SECTION:NOTES:END -->

