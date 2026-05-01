---
title: 'ADR: Stack'
description: 'Decision record: Next.js + NestJS as core stack'
createdAt: '2026-05-01T07:35:24.806Z'
updatedAt: '2026-05-01T07:35:24.806Z'
tags:
  - adr
---

# ADR 0002: Next.js + NestJS as Core Stack

**Date:** 2026-05-01
**Status:** Accepted

---

## Context

Band Mate requires a web frontend with server-side rendering for dashboard and report pages, a client-side audio recorder for speaking submissions, and a backend that orchestrates async AI scoring, a credit wallet, and queue workers. The platform targets desktop and mobile web only in v1.

## Decision

Use **Next.js** (App Router) for the frontend and **NestJS** as the backend API and worker host. Both in TypeScript. The two apps live in a monorepo managed by pnpm workspaces, sharing a `packages/shared` library for types and validation schemas.

## Alternatives Considered

- **Full Next.js with Route Handlers only** — Next.js Route Handlers can handle simple API calls, but they are not well-suited for long-running queue workers, background job orchestration, or complex service layering required by the wallet and scoring pipeline. Ruling out.
- **Express instead of NestJS** — Express is lower ceremony but lacks built-in module structure, DI, and decorator-based validation. NestJS conventions reduce architectural drift across a growing team. Ruling out.
- **Remix + Fastify** — Viable, but the team has more Next.js and NestJS experience. Switching would slow initial delivery without a clear technical advantage. Ruling out.
- **SvelteKit + Hono** — Smaller bundle, faster runtime, but steeper learning curve and a smaller ecosystem of IELTS/education UI libraries. Ruling out for v1.

## Consequences

- TypeScript end-to-end reduces runtime type mismatches between frontend and backend.
- NestJS DI and module system makes the wallet, scoring, and entitlement services independently testable.
- Next.js App Router server components allow dashboard and report pages to be rendered on the server, reducing client-side JavaScript.
- Monorepo with pnpm workspaces simplifies shared type management but adds some CI pipeline complexity.
- Both frameworks have large ecosystems; hiring and onboarding are easier.
