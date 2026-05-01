---
title: 'Module 1: Auth and Accounts'
description: Specification for authentication and account management — Supabase Auth, email/password, email verification required
createdAt: '2026-05-01T07:43:23.995Z'
updatedAt: '2026-05-01T07:43:23.995Z'
tags:
  - spec
  - draft
  - auth
  - mvp
---

## Overview

Authentication and account management for Band Mate learners. Users register with email and password, verify their email before accessing the platform, and can log in, log out, and reset their password. Supabase Auth handles token issuance and session management. The NestJS API validates Supabase JWTs on every protected request. A user profile row is created in the app database on first successful login.

## Locked Decisions

- D1: **Supabase Auth** — Supabase issues and validates tokens. NestJS verifies the Supabase JWT on each protected request using the Supabase JWT secret. Passwords are never stored in the app database.
- D2: **Email/password only** — No social login (Google, GitHub, etc.) in MVP. Deferred to a later phase.
- D3: **Email verification required** — Unverified users cannot access protected routes. Supabase sends the verification email automatically on registration.

## Requirements

### Functional Requirements

- FR-1: User can register with name, email, and password
- FR-2: Registration triggers a Supabase-sent email verification link
- FR-3: Unverified users who attempt to log in receive a clear "please verify your email" message and cannot proceed
- FR-4: Verified user can log in with email and password and receives a Supabase session (access token + refresh token)
- FR-5: On first successful login, the API creates a `users` row in the app DB if one does not already exist (name, email, role: learner)
- FR-6: User can log out, which invalidates the Supabase session
- FR-7: User can request a password reset email from the login page
- FR-8: User can set a new password via the link in the reset email
- FR-9: Every NestJS protected route validates the Supabase JWT and rejects missing, expired, or invalid tokens with 401
- FR-10: User profile stores: name, email, target band, study goal, weak skills (editable after onboarding)

### Non-Functional Requirements

- NFR-1: Register and login pages are server-rendered (Next.js SSR) — accessible without JavaScript
- NFR-2: Rate limiting on `/auth/register` and `/auth/login` — 10 requests per minute per IP
- NFR-3: Passwords are never stored or logged in the app database or API logs
- NFR-4: Auth pages redirect authenticated users to the dashboard

## Acceptance Criteria

- [ ] AC-1: User can register with name, email, and password and receives a verification email
- [ ] AC-2: Unverified user attempting to log in sees "Please verify your email before logging in" and cannot reach the dashboard
- [ ] AC-3: Verified user can log in and is redirected to the dashboard
- [ ] AC-4: On first login, a `users` row is created in the app DB with name, email, and role `learner`
- [ ] AC-5: Protected API routes return `401 Unauthorized` for requests with no token
- [ ] AC-6: Protected API routes return `401 Unauthorized` for requests with an expired or invalid token
- [ ] AC-7: User can request a password reset and receives an email with a reset link
- [ ] AC-8: User can set a new password via the reset link and then log in with the new password
- [ ] AC-9: Logged-out user's token is invalidated — subsequent requests with that token return `401`
- [ ] AC-10: Register and login pages redirect to dashboard if the user is already authenticated

## Scenarios

### Scenario 1: New user registers and logs in (happy path)
**Given** a visitor on the register page
**When** they submit name, email, and password
**Then** they see a "Check your email to verify your account" confirmation page
**And** they receive a verification email from Supabase

**When** they click the verification link
**Then** their email is marked verified in Supabase

**When** they log in with their credentials
**Then** they are redirected to the dashboard
**And** a `users` row exists in the app DB

### Scenario 2: Unverified user tries to log in
**Given** a user who registered but has not verified their email
**When** they attempt to log in
**Then** they see "Please verify your email before logging in"
**And** they are not redirected to the dashboard

### Scenario 3: Wrong password
**Given** a registered verified user
**When** they log in with an incorrect password
**Then** they see "Invalid email or password" (no hint about which field is wrong)

### Scenario 4: Password reset
**Given** a verified user who forgot their password
**When** they enter their email on the password reset page
**Then** they receive a reset email
**When** they click the link and submit a new password
**Then** they can log in with the new password

### Scenario 5: Expired token on API call
**Given** an authenticated user whose access token has expired
**When** the Next.js client makes an API call
**Then** the client silently refreshes the token using the Supabase refresh token
**And** the API call succeeds

### Scenario 6: Already authenticated user visits login page
**Given** a user who is already logged in
**When** they navigate to `/login` or `/register`
**Then** they are immediately redirected to `/dashboard`

## Technical Notes

- Use `@supabase/ssr` package for Next.js App Router cookie-based session management
- NestJS guard reads the `Authorization: Bearer <supabase_access_token>` header and verifies it using `SUPABASE_JWT_SECRET`
- The `users` table in the app DB is keyed on `supabase_user_id` (UUID from Supabase Auth), not a separate generated ID
- Session refresh is handled client-side by the Supabase JS SDK automatically
- Password reset and email verification emails are configured in the Supabase dashboard (template and redirect URLs)

## Open Questions

- [ ] What is the minimum password length/complexity rule? (Supabase default is 6 chars — do we want stricter?)
- [ ] Should we resend verification email on request, or direct users to Supabase's default resend flow?
