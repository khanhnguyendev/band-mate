---
id: bsrznd
title: 'Module 11: Plans, pricing, and wallet'
status: done
priority: high
labels:
  - billing
  - wallet
  - mvp
createdAt: '2026-05-01T07:35:25.080Z'
updatedAt: '2026-05-05T12:44:56.653Z'
timeSpent: 393
assignee: '@me'
---
# Module 11: Plans, pricing, and wallet

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Free / Starter / Pro plans with monthly credit grants. Credit top-ups via Stripe. Reserve/consume/refund wallet model backed by append-only ledger. Bonus credits with expiry. Credit cost shown before each premium action.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Credit cost is shown to the user before each premium action
- [x] #2 Credits cannot go below zero
- [x] #3 Failed scoring jobs trigger automatic refund
- [x] #4 Bonus credits expire after the configured window
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `users.service.ts completeOnboarding()` — after wallet.grant(), upsert a Subscription row for the Free plan (currentPeriodStart: now, currentPeriodEnd: now + 30 days). AC-2/AC-4 foundation.
2. Add `getWallet(userId)` to `users.service.ts` — fetches wallet + subscription + plan + last 10 ledger entries; applies lazy bonus expiry (if bonusExpiresAt < now: zero bonusBalance in DB + response). Returns: { balance, bonusBalance, bonusExpiresAt, plan: { name, writingCreditCost, speakingCreditCost, monthlyCredits }, ledger[] }. Also update getStats() to apply same expiry.
3. Add `GET /v1/users/me/wallet` to `users.controller.ts` — calls getWallet(). Exposes plan credit costs to the frontend. (AC-1, AC-4)
4. Credit cost display on writing page — fetch wallet before showing submit; display "Cost: N credits" badge; show "Insufficient credits — Top up" message + link if balance < cost. Handle 402 from reserve(). (AC-1)
5. Credit cost display on speaking page — same pattern as step 4. (AC-1)
6. Wallet page `apps/web/src/app/wallet/page.tsx` — server component fetching GET /v1/users/me/wallet. Cards: credit balance, bonus balance (with expiry date), plan name, monthly grant. Ledger table: last 10 entries with type/amount/date.
7. Admin monthly grant endpoint `POST /v1/admin/monthly-grant` — iterates all active Subscriptions, calls wallet.grant() with monthly credit amount from Plan. Guard: @Roles('admin') check via user.role.
8. Tests: unit test getWallet() bonus expiry logic (bonusExpiresAt in past → zeroed in response); test completeOnboarding() creates subscription row.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: getWallet() with lazy bonus expiry, GET /v1/users/me/wallet, Free plan subscription on onboarding, credit cost display on writing/speaking pages, /wallet page, admin monthly-grant endpoint. AC-2 and AC-3 were already enforced by reserve() and worker refund hooks. All 73 API tests pass.
<!-- SECTION:NOTES:END -->

