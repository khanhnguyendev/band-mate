---
id: 838fsp
title: 'Module 7: Reports and improvement plans'
status: done
priority: high
labels:
  - reports
  - mvp
createdAt: '2026-05-01T07:35:24.996Z'
updatedAt: '2026-05-04T12:23:53.766Z'
timeSpent: 241
assignee: '@me'
---
# Module 7: Reports and improvement plans

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every scored submission creates a report. Reports show overall band, criterion detail, evidence-based explanation, strengths, weaknesses, and improvement tasks. Historical comparison supported.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can reopen any past report
- [x] #2 User can compare current vs previous report for the same skill
- [x] #3 Recommendations can be converted to personal improvement tasks
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. API — ReportsService.compare(reportId, userId): fetch current report + find most recent prior report for same skill → return { current: { band, criteria[] }, previous: { band, criteria[] } | null }; add GET /v1/reports/:id/compare endpoint
2. API — ReportsService.acceptTask(reportId, taskId, userId): guard ownership, set ImprovementTask.status → 'active'; add POST /v1/reports/:reportId/tasks/:taskId/accept endpoint
3. Web — /reports list page: fetch GET /v1/reports, render card per report (skill badge, band, date, link to /reports/[id]); auth guard + redirect
4. Web — /reports/[id] improvements: make skill-agnostic title/back-link; add "Compare with previous" section (fetch /compare, show band delta); add "Add to my tasks" button per improvement task (calls POST .../accept, toggles to accepted state)
5. Tests — ReportsService unit spec: findById (returns report), listByUser (returns list), compare (with/without prior), acceptTask (ownership guard)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered: ReportsService.compare() + acceptTask(), GET /reports/:id/compare, POST /reports/:reportId/tasks/:taskId/accept, /reports list page, ReportView client component (skill-agnostic, compare panel, accept button), /reports/[id] rewritten as server+client split. 10 new tests, 54/54 full suite green.
<!-- SECTION:NOTES:END -->

