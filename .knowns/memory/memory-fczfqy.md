---
id: fczfqy
title: 'Wallet: credits never below zero'
layer: project
category: decision
tags: []
createdAt: '2026-05-01T07:35:25.143Z'
updatedAt: '2026-05-01T07:35:25.143Z'
---

Credits must never go below zero. All deductions must go through WalletService.reserve() inside a serializable transaction — never a direct DB write to the wallet balance.
