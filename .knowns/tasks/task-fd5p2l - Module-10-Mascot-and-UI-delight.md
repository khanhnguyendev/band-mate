---
id: fd5p2l
title: 'Module 10: Mascot and UI delight'
status: done
priority: medium
labels:
  - ux
  - mascot
createdAt: '2026-05-01T07:35:25.059Z'
updatedAt: '2026-05-05T11:49:27.448Z'
timeSpent: 3167
assignee: '@me'
---
# Module 10: Mascot and UI delight

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Friendly coach mascot with 6-8 emotional states. Appears in onboarding, quest completion, streak reminders, report summaries, and empty states. Optional sound design with silent exam mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can disable sound effects
- [x] #2 Sound never plays during Writing or Speaking exam flow
- [x] #3 Mascot only appears in purposeful, contextually appropriate moments
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create `apps/web/src/components/mascot/mascot.tsx` — Mascot component with 8 moods (happy, encouraging, celebrating, worried, neutral, focused, thinking, proud) mapped to emojis + optional caption. Props: mood, size (sm/md/lg), message override.
2. Create `apps/web/src/hooks/use-sound-preference.ts` — localStorage-backed hook returning { soundEnabled, toggleSound }; isSilentRoute helper that checks pathname against /writing and /speaking.
3. Create `apps/web/src/components/mascot/sound-toggle.tsx` — small client button that calls toggleSound, hidden on silent routes.
4. Replace inline emoji in onboarding-wizard.tsx step 1 with `<Mascot mood="happy" size="lg" />`.
5. Add mascot to dashboard: empty state (0 total submissions → encouraging), streak > 0 → proud badge near streak stat.
6. Add mascot to QuestPanel: show `<Mascot mood="celebrating" />` inline when any quest is claimed.
7. Add SoundToggle to dashboard header area (between heading and "My Reports" link).
8. Tests: unit test useSoundPreference (localStorage read/write, isSilentRoute detection).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: Mascot component (8 moods, 3 sizes), useSoundPreference hook with isSilentRoute, SoundToggle client component. Integrated into onboarding step 1, dashboard empty state + streak, QuestPanel claimed state. tsconfig updated to exclude test files. API tests still pass (22).
<!-- SECTION:NOTES:END -->

