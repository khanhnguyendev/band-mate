# Contributing Guide

Thank you for taking the time to contribute to Band Mate. This document covers how to report bugs, suggest features, and submit pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Workflow](#development-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Code Style](#code-style)
- [Domain Rules](#domain-rules)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## Reporting Bugs

Before filing a bug report:

1. Search [existing issues](../../issues) to avoid duplicates.
2. Try to reproduce on the latest version of `main`.

When filing, use the **Bug Report** issue template and include:

- A clear, descriptive title
- Steps to reproduce (minimal reproduction preferred)
- Expected vs. actual behaviour
- Environment details (OS, Node version, browser)
- For scoring bugs: submission ID and report ID if available

---

## Suggesting Features

1. Check [existing issues](../../issues) and [discussions](../../discussions) first.
2. Open an issue using the **Feature Request** template.
3. Describe the problem you are trying to solve, not just the solution.

Large changes (new skill modules, new wallet behaviour, prompt pack changes) should be discussed and have an ADR before any code is written.

---

## Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/band-mate.git
cd band-mate

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Fill in DATABASE_URL (pooler), DIRECT_URL (direct), REDIS_URL, and AI_API_KEY at minimum

# 4. Link and push the database schema
supabase link --project-ref <your-project-ref>
pnpm db:push

# 5. Start development servers
pnpm dev
# Web → http://localhost:3000
# API → http://localhost:4000

# 6. Run tests before pushing
pnpm test
```

---

## Pull Request Guidelines

- **One concern per PR.** A PR that fixes a bug AND adds a feature is harder to review and revert.
- **Reference the related issue** using `Closes #123` or `Fixes #123`.
- **Keep the diff small.** Multiple small PRs beat one large one.
- **Wallet and scoring changes require extra review.** Tag a maintainer for any change that touches `WalletService`, `ScoringWorker`, or `LedgerRepository`.
- **Update documentation** if your change affects API contracts, data model, or deployment steps.
- **All CI checks must pass** before requesting a review.
- **Do not force-push** after a review has started.

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

Scopes: `auth`, `wallet`, `scoring`, `speaking`, `writing`, `reading`, `listening`, `quests`, `admin`, `web`, `api`, `workers`, `db`.

Examples:

```
feat(scoring): add criterion-level explanation to writing reports
fix(wallet): prevent double-consume on scoring worker retry
docs(api): add pre-signed upload endpoint to API reference
test(wallet): add integration test for concurrent reservation race condition
```

---

## Code Style

- Run `pnpm lint` and `pnpm format` before committing.
- Follow the conventions already present — consistency over personal preference.
- Keep service methods focused on a single responsibility.
- No comments that explain what the code does — only add one when explaining a non-obvious constraint or workaround.

---

## Domain Rules

These rules must not be broken in any contribution:

1. **Credits must never go below zero.** All wallet deductions must go through `WalletService.reserve()`, never direct DB writes.
2. **Ledger entries are append-only.** Never update or delete a `ledger_entries` row.
3. **Prompt pack changes require a new version row.** Never edit an active prompt pack in-place.
4. **AI scores must be presented as estimates.** All UI and API responses must include the disclaimer that scores are AI-estimated practice scores, not official IELTS results.
5. **Wallet operations must use idempotency keys.** Every ledger write must supply a stable `idempotency_key` to prevent double-processing on worker retry.
