---
id: wpvqow
title: 'Module 12: Notifications'
status: done
priority: medium
labels:
  - notifications
createdAt: '2026-05-01T07:35:25.101Z'
updatedAt: '2026-05-05T13:54:58.776Z'
timeSpent: 568
assignee: '@me'
---
# Module 12: Notifications

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Email and in-app reminders for streak breaks and unfinished tasks. Report-ready notifications. Mascot-toned copy. User-controllable preferences with timezone support.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can control notification preferences
- [x] #2 Time-sensitive reminders respect the user's timezone
- [x] #3 Report-ready notification is sent when a scoring job completes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Install resend + add env vars
2. Schema: NotificationPreference model + migration
3. NotificationService wrapping Resend
4. NotificationModule
5. Preferences GET/PATCH endpoints
6. Wire report-ready into score workers
7. Streak reminder BullMQ repeatable job
8. Tests for NotificationService
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: NotificationService (Resend, report-ready + streak-reminder emails, mascot-toned copy, no-key suppression), NotificationModule, GET/PATCH /v1/users/me/notifications preferences, NotificationPreference schema model, report-ready hook in score-writing + score-speaking workers, hourly streak-reminder BullMQ repeatable job with timezone offset check. 81 API tests passing (8 new notification tests).
<!-- SECTION:NOTES:END -->

