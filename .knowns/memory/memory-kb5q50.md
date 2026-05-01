---
id: kb5q50
title: 'Auth: Supabase JWT guard pattern'
layer: project
category: pattern
tags: []
createdAt: '2026-05-01T08:01:31.467Z'
updatedAt: '2026-05-01T08:01:31.467Z'
---

SupabaseAuthGuard (apps/api/src/common/guards/supabase-auth.guard.ts) is the global NestJS auth guard. It calls supabase.auth.getUser(token) and checks email_confirmed_at != null. Use @Public() decorator to bypass it. Use @CurrentUser() to inject the Supabase user object into any controller. All future modules must use these — do not create separate auth logic.
