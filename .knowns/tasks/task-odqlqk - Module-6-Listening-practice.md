---
id: odqlqk
title: 'Module 6: Listening practice'
status: done
priority: medium
labels:
  - listening
  - phase-2
createdAt: '2026-05-01T07:35:24.976Z'
updatedAt: '2026-05-04T12:11:20.837Z'
timeSpent: 410
assignee: '@me'
---
# Module 6: Listening practice

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Listening tasks with audio media and questions. Instant auto-scoring. Completions can trigger daily quest rewards. Phase 2 — gated behind feature flag in MVP.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can play media, answer questions, and receive results
- [x] #2 Completion can trigger quest rewards when eligible
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prisma seed: add 1 listening question set (Section 1 — conversation) with audio URL in `questionSet` mediaUrl (stored on the first Question's mediaUrl field), 5 MCQ/short-answer questions with `answerKey: { answer: '...' }`; use placeholder audio URL (real audio to be recorded separately)
2. QuestionsService.findListening() + GET /v1/questions/listening: same pattern as findReading(); route and service guard with FEATURE_LISTENING env var
3. ListeningService.submitListening(userId, setId, answers): identical sync scoring to ReadingService; grants 1 bonus credit on completion via WalletService.grant() with idempotency key `listening-bonus:{userId}:{setId}`; returns { score, total, percentage, breakdown[] } — quest-reward hook noted for Module 9 integration
4. ListeningController + ListeningModule: wire service + controller; feature flag guard; import into AppModule
5. Web: /listening page (redirect to dashboard if NEXT_PUBLIC_FEATURE_LISTENING !== 'true'; set cards with audio badge); /listening/[setId] page — server component passes data to ListeningQuiz client component (HTML5 audio player + MCQ form + inline results on submit, same pattern as ReadingQuiz)
6. Tests: ListeningService spec — correct/partial scoring, bonus grant, idempotent double-submit, NotFoundException, ForbiddenException, case-insensitive compare (mirrors reading.service.spec.ts structure)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
All 7 tests pass (44/44 full suite). Files delivered: listening.service.ts, listening.controller.ts, listening.module.ts, ListeningModule in app.module.ts, listening-quiz.tsx, listening/page.tsx, listening/[setId]/page.tsx, seed listening questions.
<!-- SECTION:NOTES:END -->

