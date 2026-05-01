---
id: n6lumh
title: 'DB connection strings: direct vs pooler'
layer: project
category: convention
tags: []
createdAt: '2026-05-01T07:35:25.272Z'
updatedAt: '2026-05-01T07:35:25.272Z'
---

Use DATABASE_URL (Supabase direct connection) for Prisma migrate deploy. Use DATABASE_URL_POOLER (PgBouncer) for API runtime. Never use the pooler URL for migrations — Prisma uses advisory locks that PgBouncer does not support.
