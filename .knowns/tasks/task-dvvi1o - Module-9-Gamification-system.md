---
id: dvvi1o
title: 'Module 9: Gamification system'
status: done
priority: high
labels:
  - gamification
  - mvp
createdAt: '2026-05-01T07:35:25.038Z'
updatedAt: '2026-05-04T12:45:14.336Z'
timeSpent: 430
assignee: '@me'
---
# Module 9: Gamification system

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
XP for broad learning activity. Credits earnable from low-cost validated actions (Reading, Listening, report review, drills). Daily quests, weekly challenges, streaks, badges, milestones. Daily and weekly earn caps. Anti-abuse rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User sees daily quests and weekly challenge with progress
- [x] #2 Daily and weekly credit earning caps are enforced
- [x] #3 Only validated completions trigger rewards
- [x] #4 Admin can change reward values without redeploying
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prisma schema — add QuestDefinition (id, title, description, skill?, action, requiredCount, rewardCredits, period: daily/weekly, isActive) and GameConfig (key, value key-value store); seed 3 daily quests + 1 weekly challenge + earn cap config values (daily_earn_cap=5, weekly_earn_cap=20, reading_reward=1, listening_reward=1)
2. GamificationService — award(userId, credits, description, idempotencyKey): reads daily/weekly caps from GameConfig, counts bonus LedgerEntry rows in current period, only calls wallet.grant() if under cap; getQuestsForUser(userId): for each active QuestDefinition, counts matching submissions/reports in the period, returns { quest, progress, required, claimed, reward }
3. GamificationController + GamificationModule — GET /v1/quests returns daily quests + weekly challenge with per-user progress; module exports GamificationService; import into AppModule
4. Update Reading + Listening — swap wallet.grant() → gamification.award() in both services; swap WalletModule → GamificationModule in both module imports; update both test files to mock gamification.award instead of wallet.grant
5. Web — fetch GET /v1/quests in dashboard page; add QuestPanel client component showing quest cards with progress bars and reward badges; pass quests as prop to panel alongside existing stats
6. Tests — GamificationService unit spec: award() respects daily/weekly cap, award() calls wallet.grant() when under cap, getQuestsForUser() computes progress, getQuestsForUser() marks quest claimed when LedgerEntry idempotency key exists
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered: QuestDefinition + GameConfig schema models, seed (3 daily + 1 weekly quest + caps), GamificationService (award() with daily/weekly cap, getQuestsForUser()), GamificationController GET /v1/quests, Reading + Listening swapped to gamification.award(), QuestPanel web component, dashboard fetches /v1/quests. 8 new gamification tests; 68/68 full suite green.
<!-- SECTION:NOTES:END -->

