---
id: kmra68
title: 'Wallet: ledger is append-only'
layer: project
category: decision
tags: []
createdAt: '2026-05-01T07:35:25.165Z'
updatedAt: '2026-05-01T07:35:25.165Z'
---

The ledger_entries table is append-only. Never update or delete a ledger row. Reconstruct wallet state by replaying the ledger if needed.
