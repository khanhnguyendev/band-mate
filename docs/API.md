# API Reference

Base URL: `https://api.bandmate.app/v1` (production) · `http://localhost:4000/v1` (development)

All endpoints return JSON. Authentication uses short-lived JWT access tokens passed as `Authorization: Bearer <token>`. Refresh tokens are httpOnly cookies.

---

## Authentication

### `POST /auth/register`

Register a new learner account.

**Request:**

| Name | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 8 characters |
| `name` | string | Yes | Display name |

**Response `201`:**
```json
{ "userId": "uuid", "email": "...", "accessToken": "..." }
```

---

### `POST /auth/login`

**Request:** `{ email, password }`

**Response `200`:**
```json
{ "accessToken": "...", "expiresIn": 900 }
```

---

### `POST /auth/refresh`

Uses the httpOnly refresh-token cookie. Returns a new access token.

**Response `200`:** `{ "accessToken": "..." }`

---

### `POST /auth/logout`

Invalidates the refresh token.

---

## Onboarding

### `POST /onboarding`

Save onboarding answers and grant starter credits.

**Request:**

| Name | Type | Required | Description |
|---|---|---|---|
| `targetBand` | number | Yes | e.g. `6.5` |
| `testDate` | string (ISO) | No | Planned exam date |
| `weakSkills` | string[] | Yes | e.g. `["writing","speaking"]` |
| `motivation` | string | Yes | `university` \| `immigration` \| `career` \| `other` |

**Response `200`:** `{ "creditsGranted": 3, "nextTask": { ... } }`

---

## Submissions

### `POST /submissions/writing`

Submit a writing attempt for AI scoring.

**Request:**

| Name | Type | Required | Description |
|---|---|---|---|
| `questionId` | string | Yes | ID of the writing prompt |
| `text` | string | Yes | Learner's essay |
| `taskType` | string | Yes | `task1` \| `task2` |

**Response `202`:**
```json
{
  "submissionId": "uuid",
  "status": "queued",
  "creditCost": 2,
  "reservationId": "uuid"
}
```

**Errors:**

| Code | Meaning |
|---|---|
| 402 | Insufficient credits |
| 422 | Text too short or question not found |

---

### `POST /submissions/speaking`

Submit a speaking attempt. Audio must first be uploaded via the signed-URL flow (see Object Storage section).

**Request:**

| Name | Type | Required | Description |
|---|---|---|---|
| `questionId` | string | Yes | Speaking prompt ID |
| `audioKey` | string | Yes | Object storage key from pre-signed upload |
| `part` | number | Yes | `1` \| `2` \| `3` |

**Response `202`:** Same shape as Writing submission.

---

### `GET /submissions/:id/status`

Poll submission processing status.

**Response `200`:**
```json
{
  "submissionId": "uuid",
  "status": "queued" | "transcribing" | "scoring" | "completed" | "failed",
  "reportId": "uuid | null"
}
```

---

### `GET /submissions`

List the authenticated user's submissions. Supports `?skill=writing&limit=20&cursor=...`.

---

## Reports

### `GET /reports/:id`

Fetch a completed score report.

**Response `200`:**
```json
{
  "reportId": "uuid",
  "submissionId": "uuid",
  "skill": "writing",
  "overallBand": 6.5,
  "disclaimer": "This is an AI-estimated practice score, not an official IELTS result.",
  "criteria": [
    {
      "name": "Task Response",
      "band": 6.0,
      "explanation": "...",
      "strengths": ["..."],
      "weaknesses": ["..."]
    }
  ],
  "improvementTasks": [
    { "taskId": "uuid", "description": "...", "skill": "writing", "criterion": "Task Response" }
  ],
  "createdAt": "ISO timestamp"
}
```

---

### `GET /reports`

List the authenticated user's reports. Supports `?skill=speaking&limit=20&cursor=...`.

---

### `GET /reports/compare?a=:idA&b=:idB`

Compare two reports for the same skill. Returns criterion deltas.

---

## Wallet

### `GET /wallet`

**Response `200`:**
```json
{
  "balance": 12,
  "bonusBalance": 3,
  "bonusExpiresAt": "ISO timestamp | null",
  "planCreditsRemainingThisCycle": 8
}
```

---

### `POST /wallet/topup`

Initiate a credit top-up purchase. Returns a payment session URL.

**Request:** `{ "packageId": "string" }`

**Response `200`:** `{ "checkoutUrl": "..." }`

---

### `GET /wallet/ledger`

Paginated transaction history. Each entry has `type` (`reserve` | `consume` | `refund` | `grant` | `topup`), `amount`, `description`, `createdAt`.

---

## Quests and Gamification

### `GET /quests`

Returns today's daily quests and the current weekly challenge for the authenticated user.

**Response `200`:**
```json
{
  "daily": [
    {
      "questId": "uuid",
      "title": "Complete one Reading mini-set",
      "reward": { "type": "credit", "amount": 1 },
      "completed": false,
      "progress": { "current": 0, "required": 1 }
    }
  ],
  "weekly": { ... }
}
```

---

### `GET /progress`

Returns XP, level, streak, earned badges, and weak-skill analysis.

**Response `200`:**
```json
{
  "xp": 420,
  "level": 5,
  "streakDays": 4,
  "badges": [{ "badgeId": "...", "name": "First Writing", "earnedAt": "..." }],
  "weakestSkill": "speaking",
  "nextRecommendedAction": { "type": "practice", "skill": "speaking", "questionId": "..." }
}
```

---

## Plans

### `GET /plans`

Returns all available subscription plans and the user's current plan.

---

### `POST /plans/subscribe`

**Request:** `{ "planId": "string" }`

**Response `200`:** `{ "subscriptionId": "uuid", "status": "active", "nextBillingDate": "..." }`

---

## Object Storage (Audio Upload)

### `POST /uploads/audio/presign`

Issues a pre-signed PUT URL for direct browser-to-storage upload.

**Request:** `{ "filename": "speaking-attempt.webm", "contentType": "audio/webm" }`

**Response `200`:**
```json
{
  "uploadUrl": "https://...",
  "key": "audio/userId/uuid.webm",
  "expiresIn": 300
}
```

After the browser PUT succeeds, pass `key` in the `POST /submissions/speaking` request.

---

## Admin Endpoints

All admin endpoints require a JWT with `role: admin`.

### `GET /admin/jobs` — list scoring/transcription jobs with status
### `POST /admin/jobs/:id/retry` — retry a failed job
### `GET /admin/cost-summary` — AI cost aggregated by day/plan/user
### `GET /admin/prompt-packs` — list versioned prompt packs
### `POST /admin/prompt-packs` — create a new prompt pack version
### `PATCH /admin/quests/:id` — edit quest reward values
### `GET /admin/users` — paginated user list with plan/credit info

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| Auth endpoints | 10 req / min per IP |
| Submission endpoints | 5 req / min per user |
| Report reads | 60 req / min per user |
| Admin endpoints | 120 req / min per admin token |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Error Shape

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "text is required and must be at least 50 characters"
}
```

---

## Changelog

| Version | Change |
|---|---|
| v1 | Initial API — Writing, Speaking, Wallet, Quests, Auth |
