---
id: om0z9t
title: 'Module 2: Onboarding'
status: done
priority: high
labels:
  - onboarding
  - mvp
createdAt: '2026-05-01T07:35:24.893Z'
updatedAt: '2026-05-01T12:56:35.209Z'
timeSpent: 655
assignee: '@me'
---
# Module 2: Onboarding

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Short onboarding flow capturing target band, test date, weak skills, and motivation. Mascot introduces the platform. Free trial credits granted on completion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Onboarding completes in under 3 minutes
- [x] #2 User sees recommended first task after completing onboarding
- [x] #3 Free trial credits are granted on completion
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shared: add OnboardingSchema + OnboardingPayload type in packages/shared/src/schemas/onboarding.ts (targetBand, testDate?, weakSkills[], motivation)
2. API: create WalletModule + WalletService with grant(userId, amount, description, idempotencyKey) — serializable transaction, ledger append-only, balance never < 0
3. API: add UsersService.completeOnboarding(userId, dto) — saves profile fields + calls WalletService.grant with idempotency key `onboarding:{userId}` (3 trial credits); add PATCH /v1/users/onboarding endpoint to UsersController
4. Web: /onboarding 4-step wizard — target band → test date → weak skills → motivation; mascot greeting on step 1; calls PATCH /v1/users/onboarding on final step; redirects to /dashboard?welcome=1
5. Web: onboarding gate — dashboard server component fetches /v1/users/me; if onboardingCompletedAt is null redirect to /onboarding; also guard /onboarding to redirect already-onboarded users to /dashboard
6. Web: welcome banner + recommended first task — dashboard shows "Start here" card based on weakSkills[0] when ?welcome=1 query param present
7. Tests: WalletService.grant() unit spec (happy path + idempotency no-op) + UsersController PATCH /onboarding unit spec
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: OnboardingSchema (shared), WalletService.grant() with idempotency, UsersService.completeOnboarding() + PATCH /v1/users/onboarding, 4-step wizard at /onboarding, dashboard onboarding gate + welcome banner. Fixed pre-existing guard spec bugs (clearAllMocks → resetAllMocks, stable request reference). 11/11 tests pass.
<!-- SECTION:NOTES:END -->

