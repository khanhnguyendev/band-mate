---
id: dovj52
title: BullMQ workers must be idempotent
layer: project
category: pattern
tags: []
createdAt: '2026-05-01T07:35:25.358Z'
updatedAt: '2026-05-01T07:35:25.358Z'
---

Every queue worker step must be idempotent. Re-running a completed step must not double-consume credits, double-persist reports, or double-send notifications. Use idempotency keys and check-before-write patterns.
