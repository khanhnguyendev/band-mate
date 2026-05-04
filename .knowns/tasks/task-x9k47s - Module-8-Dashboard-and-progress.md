---
id: x9k47s
title: 'Module 8: Dashboard and progress'
status: done
priority: high
labels:
  - dashboard
  - mvp
createdAt: '2026-05-01T07:35:25.017Z'
updatedAt: '2026-05-04T12:36:35.483Z'
timeSpent: 233
assignee: '@me'
---
# Module 8: Dashboard and progress

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Shows skill activity, latest reports, streak, XP, badges, quests, and credit balance. Learning trend and weak-area analysis. Weakest skill and next recommended action above the fold.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dashboard loads key stats for the authenticated user
- [x] #2 Weakest skill and next recommended action are visible above the fold
- [x] #3 Streak, XP, and credit balance are accurate and real-time
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. API — UsersService.getStats(userId): query scoreReports (last 10, grouped by skill → weakest avg band), submissions (count per skill + streak from consecutive days), wallet (balance + bonusBalance); return { submissionCounts, recentReports, weakestSkill, nextAction, streak, creditBalance, bonusBalance }; wire GET /v1/users/me/stats
2. Web — dashboard page: fetch /v1/users/me (existing) + /v1/users/me/stats in parallel; render: (a) above-the-fold hero card with weakest skill + next recommended action; (b) stats strip: streak days, credit balance, total submissions; (c) recent reports cards (last 3, skill badge + band + date + link); (d) skill activity row (submission count per skill with quick-start links)
3. Tests — UsersService stats unit spec: streak computation (consecutive days), weakest skill derivation (lowest avg band), empty state (new user with no submissions)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered: UsersService.getStats() + GET /v1/users/me/stats (streak, weakest skill, submission counts, recent reports, credit balance). Dashboard rewritten with above-fold focus card, stats strip, skill activity grid, recent reports. 6 new getStats tests; 60/60 full suite green.
<!-- SECTION:NOTES:END -->

