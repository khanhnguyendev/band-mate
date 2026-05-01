---
id: 7yo96p
title: 'Module 1: Auth and accounts'
status: done
priority: high
labels:
  - auth
  - mvp
createdAt: '2026-05-01T07:35:24.873Z'
updatedAt: '2026-05-01T08:01:17.758Z'
timeSpent: 1000
assignee: '@me'
spec: specs/module-1-auth-and-accounts
fulfills:
  - AC-1
  - AC-2
  - AC-3
  - AC-4
  - AC-5
  - AC-6
  - AC-7
  - AC-8
  - AC-9
  - AC-10
---
# Module 1: Auth and accounts

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Registration, login, logout, password reset. Profile stores target band, study goal, skill preferences. Wallet balance visible after login.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can register, log in, log out, and reset password
- [x] #2 Profile stores target band and skill preference data
- [x] #3 Wallet balance is visible after login
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold monorepo — pnpm workspace, apps/web (Next.js 15, App Router, TS, Tailwind), apps/api (NestJS, TS), packages/shared (Zod types). Shared tsconfig + eslint.

2. Supabase Auth config — enable email provider, require email verification, set site URL + redirect URLs for local/staging/prod, configure email templates in Supabase dashboard.

3. Prisma schema + migration — update users table: replace password_hash with supabase_user_id (text UNIQUE NOT NULL), keep name/email/role/target_band/weak_skills/onboarding_completed_at. Seed plans table with Free plan row.

4. NestJS: Supabase JWT guard — SupabaseModule with service-role client, SupabaseAuthGuard extracts Bearer token, calls supabase.auth.getUser(token), checks email_confirmed_at != null (D3 enforcement), attaches user to request. @CurrentUser() decorator. Global guard with @Public() bypass decorator. Returns 401 for missing/expired/invalid/unverified tokens. (Covers AC-2, AC-5, AC-6)

5. NestJS: Users module — UsersService.findOrCreate(supabaseUser) upserts users row keyed on supabase_user_id on first authenticated request. Also creates wallet row (balance: 0, bonus_balance: 0) for new users. GET /users/me endpoint returns current user + wallet balance. (Covers AC-3, AC-4)

6. Next.js: Supabase SSR setup — install @supabase/ssr, create utils/supabase/client.ts (browser), utils/supabase/server.ts (server components), utils/supabase/middleware.ts (session refresh). Root middleware.ts calls updateSession on every request.

7. Next.js: Auth pages — /register (name+email+password → signUp() → check-your-email confirmation), /login (email+password → signInWithPassword(), handles email_not_confirmed error, redirects /dashboard on success), /forgot-password (resetPasswordForEmail()), /reset-password (updateUser() with new password), /auth/callback route handler for Supabase verification + reset redirects. (Covers AC-1, AC-2, AC-3, AC-7, AC-8, AC-9)

8. Next.js: Route protection middleware — redirect /dashboard/** → /login for unauthenticated users. Redirect /login and /register → /dashboard for authenticated users. (Covers AC-10)

9. Tests — unit: SupabaseAuthGuard (valid token, expired token, unverified email → 401). Integration: UsersService.findOrCreate creates row + wallet on first call, is idempotent on second call. E2E: register → check-email page, login with unverified → error message.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: monorepo scaffold (pnpm + Turbo), packages/shared (Zod schemas for auth/user), apps/api (NestJS with SupabaseAuthGuard, UsersModule, PrismaModule, global guard), apps/web (Next.js 15 App Router, @supabase/ssr session helpers, auth pages, route protection middleware). Prisma schema updated: users table uses supabase_user_id instead of password_hash. Tests: guard unit (5 cases), UsersService integration (2 cases).
<!-- SECTION:NOTES:END -->

