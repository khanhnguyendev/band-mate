---
id: bhe0o7
title: 'Wallet: idempotency keys required'
layer: project
category: decision
tags: []
createdAt: '2026-05-01T07:35:25.187Z'
updatedAt: '2026-05-01T07:35:25.187Z'
---

Every ledger write must supply a stable idempotency_key (derived from submissionId + event type) to prevent double-processing when a worker retries.
