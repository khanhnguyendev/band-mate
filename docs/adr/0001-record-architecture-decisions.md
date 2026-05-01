# ADR 0001: Record Architecture Decisions

**Date:** 2026-04-27
**Status:** Accepted

---

## Context

As the project grows, it becomes difficult to remember why certain technical decisions were made. New contributors have no context for constraints that shaped the design. Without records, the same debates are relitigated repeatedly.

## Decision

We will use Architecture Decision Records (ADRs), stored as Markdown files in `docs/adr/`, to document significant decisions about the architecture of this project.

## Alternatives Considered

- **Wiki pages** — editable by anyone, but prone to drift and deletion. ADRs are immutable by convention.
- **Comments in code** — too local; architectural decisions span multiple files and systems.
- **Nothing** — the default, but leads to knowledge silos and repeated debates.

## Consequences

- Every significant architectural decision must have an ADR before (or immediately after) implementation.
- ADRs are never deleted. Superseded ADRs are updated with a "Superseded by ADR XXXX" note.
- The index in `docs/adr/README.md` must be kept up-to-date.
