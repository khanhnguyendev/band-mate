# Data Model

Core entities and their relationships. All tables use UUID primary keys and include `created_at` / `updated_at` timestamps unless noted.

---

## Entity Map

```
users ──────────┬── subscriptions ── plans
                ├── wallets
                │     └── ledger_entries
                ├── submissions ──── scoring_jobs
                │     └── score_reports
                │           └── criterion_rows
                │           └── improvement_tasks
                ├── sessions (auth)
                ├── streaks
                ├── xp_events
                ├── badges_earned
                └── quest_completions

question_sets ── questions
prompt_packs
rubric_versions
ai_usage_logs
audit_logs
```

---

## Core Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text UNIQUE | |
| `password_hash` | text | |
| `name` | text | |
| `role` | enum | `learner` \| `admin` |
| `target_band` | decimal(2,1) | e.g. `6.5` |
| `test_date` | date | nullable |
| `weak_skills` | text[] | `writing`, `speaking`, etc. |
| `motivation` | text | onboarding value |
| `onboarding_completed_at` | timestamptz | nullable |

---

### `plans`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | `free` \| `starter` \| `pro` |
| `monthly_credit_grant` | int | Credits issued at cycle start |
| `writing_credit_cost` | int | Per submission |
| `speaking_credit_cost` | int | Per submission |
| `is_active` | boolean | |

---

### `subscriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `plan_id` | uuid FK → plans | |
| `status` | enum | `active` \| `cancelled` \| `past_due` |
| `current_period_start` | timestamptz | |
| `current_period_end` | timestamptz | |
| `stripe_subscription_id` | text | nullable |

---

### `wallets`

One row per user. All mutations use serializable transactions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK UNIQUE | |
| `balance` | int | Standard credits (never < 0) |
| `bonus_balance` | int | Earned bonus credits |
| `bonus_expires_at` | timestamptz | nullable |

---

### `ledger_entries`

Append-only. Never update or delete rows.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `wallet_id` | uuid FK | |
| `type` | enum | `reserve` \| `consume` \| `refund` \| `grant` \| `topup` \| `expire` |
| `amount` | int | Negative for deductions |
| `balance_after` | int | Snapshot for auditability |
| `description` | text | Human-readable reason |
| `reference_id` | uuid | nullable — links to submission, topup, etc. |
| `idempotency_key` | text UNIQUE | Prevents double-processing |

---

### `question_sets`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `skill` | enum | `writing` \| `speaking` \| `reading` \| `listening` |
| `title` | text | |
| `task_type` | text | e.g. `task1`, `task2`, `part1` |
| `difficulty` | enum | `band5` \| `band6` \| `band7` \| `band8` |
| `estimated_minutes` | int | |
| `is_published` | boolean | |

---

### `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `set_id` | uuid FK → question_sets | |
| `prompt` | text | The question text |
| `media_url` | text | nullable — for listening/speaking |
| `answer_key` | jsonb | nullable — for reading/listening |
| `order` | int | position within set |

---

### `submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `question_id` | uuid FK | |
| `skill` | enum | |
| `status` | enum | `queued` \| `transcribing` \| `scoring` \| `completed` \| `failed` |
| `input_text` | text | nullable — writing essay |
| `audio_key` | text | nullable — object storage key |
| `transcript` | text | nullable — populated after transcription |
| `credit_cost` | int | Cost deducted on success |
| `reservation_id` | uuid | FK → ledger_entries (reserve entry) |

---

### `scoring_jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `submission_id` | uuid FK | |
| `type` | enum | `transcription` \| `scoring` |
| `status` | enum | `pending` \| `running` \| `completed` \| `failed` \| `dead` |
| `attempts` | int | |
| `last_error` | text | nullable |
| `prompt_pack_id` | uuid FK | Version used for this job |
| `ai_tokens_used` | int | nullable — populated on completion |
| `ai_cost_usd` | decimal(10,6) | nullable |

---

### `score_reports`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `submission_id` | uuid FK UNIQUE | |
| `user_id` | uuid FK | |
| `skill` | enum | |
| `overall_band` | decimal(2,1) | AI-estimated, clamped to 0–9 |
| `rubric_version_id` | uuid FK | |
| `raw_ai_response` | jsonb | Stored for debugging |
| `is_estimate` | boolean | Always true in v1 |

---

### `criterion_rows`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `report_id` | uuid FK | |
| `criterion_name` | text | e.g. `Task Response` |
| `band` | decimal(2,1) | |
| `explanation` | text | |
| `strengths` | text[] | |
| `weaknesses` | text[] | |

---

### `improvement_tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `report_id` | uuid FK | |
| `user_id` | uuid FK | |
| `description` | text | |
| `skill` | enum | |
| `criterion` | text | nullable |
| `status` | enum | `pending` \| `completed` |
| `completed_at` | timestamptz | nullable |

---

### `prompt_packs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `skill` | enum | |
| `version` | text | semver, e.g. `1.2.0` |
| `system_prompt` | text | |
| `user_prompt_template` | text | Handlebars / Mustache template |
| `rubric_schema` | jsonb | Expected output schema |
| `is_active` | boolean | Only one active per skill |
| `created_by` | uuid FK → users | Admin who published it |

---

### `ai_usage_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `scoring_job_id` | uuid FK | |
| `user_id` | uuid FK | |
| `plan_id` | uuid FK | nullable |
| `model` | text | e.g. `claude-sonnet-4-6` |
| `input_tokens` | int | |
| `output_tokens` | int | |
| `cost_usd` | decimal(10,6) | |

---

### `audit_logs`

Append-only. Tracks admin mutations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `actor_id` | uuid FK | Admin user |
| `action` | text | e.g. `prompt_pack.publish` |
| `target_type` | text | Entity type |
| `target_id` | uuid | |
| `diff` | jsonb | Before/after snapshot |

---

### `streaks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK UNIQUE | |
| `current_streak` | int | |
| `longest_streak` | int | |
| `last_activity_date` | date | |

---

### `quest_completions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `quest_id` | uuid FK → quests | |
| `completed_at` | timestamptz | |
| `reward_granted` | boolean | False until reward job settles |

A `(user_id, quest_id, date_bucket)` unique constraint prevents double-rewarding daily quests.

---

## Key Constraints

- `wallets.balance` and `wallets.bonus_balance` must never go below 0 — enforced by a DB check constraint and application-level serializable transactions.
- `ledger_entries.idempotency_key` is unique — prevents double-processing of wallet events.
- `prompt_packs`: only one row per skill may have `is_active = true` — enforced by a partial unique index.
- `score_reports.overall_band` is checked to be between `0` and `9`.
