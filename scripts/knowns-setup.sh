#!/usr/bin/env bash
# knowns-setup.sh — seed Knowns with Band Mate docs, tasks, and memory
# Run from the repo root: bash scripts/knowns-setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }

# ─────────────────────────────────────────────
# 0. MCP config
# ─────────────────────────────────────────────
step "Writing .mcp.json"
cat > "$ROOT/.mcp.json" <<'EOF'
{
  "mcpServers": {
    "knowns": {
      "command": "knowns",
      "args": ["mcp", "--stdio"]
    }
  }
}
EOF
ok ".mcp.json created"

# ─────────────────────────────────────────────
# 1. Docs
# ─────────────────────────────────────────────
step "Importing docs"

knowns doc create "PRD" \
  -f "product" \
  -d "Full product requirements — vision, goals, personas, modules, acceptance criteria, analytics events" \
  -t "product" -t "requirements" \
  --content "$(cat docs/PRD.md)"
ok "docs/PRD.md"

knowns doc create "Architecture" \
  -f "engineering" \
  -d "System design, component map, data flows (writing + speaking pipeline), infrastructure (Vercel/Railway/Supabase/Upstash), trade-offs" \
  -t "engineering" -t "infrastructure" \
  --content "$(cat docs/ARCHITECTURE.md)"
ok "docs/ARCHITECTURE.md"

knowns doc create "API" \
  -f "engineering" \
  -d "REST API v1 reference — auth, submissions, reports, wallet, quests, plans, admin, rate limits" \
  -t "engineering" -t "api" \
  --content "$(cat docs/API.md)"
ok "docs/API.md"

knowns doc create "Data Model" \
  -f "engineering" \
  -d "Core database entities and relationships — users, wallets, ledger, submissions, reports, quests, prompt packs" \
  -t "engineering" -t "database" \
  --content "$(cat docs/DATA_MODEL.md)"
ok "docs/DATA_MODEL.md"

knowns doc create "Deployment" \
  -f "engineering" \
  -d "Deploy guide — Vercel (web), Railway (API+workers), Supabase (DB+storage), Upstash (Redis), env vars, rollback, troubleshooting" \
  -t "engineering" -t "devops" \
  --content "$(cat docs/DEPLOYMENT.md)"
ok "docs/DEPLOYMENT.md"

knowns doc create "ADR: Stack" \
  -f "adr" \
  -d "Decision record: Next.js + NestJS as core stack" \
  -t "adr" \
  --content "$(cat docs/adr/0002-nextjs-nestjs-stack.md)"
ok "docs/adr/0002-nextjs-nestjs-stack.md"

knowns doc create "ADR: Scoring Pipeline" \
  -f "adr" \
  -d "Decision record: async queue-based AI scoring pipeline" \
  -t "adr" \
  --content "$(cat docs/adr/0003-ai-scoring-pipeline.md)"
ok "docs/adr/0003-ai-scoring-pipeline.md"

knowns doc create "ADR: Credit Wallet" \
  -f "adr" \
  -d "Decision record: reserve/consume/refund credit wallet model" \
  -t "adr" \
  --content "$(cat docs/adr/0004-credit-wallet-model.md)"
ok "docs/adr/0004-credit-wallet-model.md"

# ─────────────────────────────────────────────
# 2. Tasks  (13 PRD modules)
# ─────────────────────────────────────────────
step "Creating tasks"

knowns task create "Module 1: Auth and accounts" \
  -d "Registration, login, logout, password reset. Profile stores target band, study goal, skill preferences. Wallet balance visible after login." \
  --priority high \
  --label "auth" --label "mvp" \
  --ac "User can register, log in, log out, and reset password" \
  --ac "Profile stores target band and skill preference data" \
  --ac "Wallet balance is visible after login"
ok "Task: Module 1 — Auth"

knowns task create "Module 2: Onboarding" \
  -d "Short onboarding flow capturing target band, test date, weak skills, and motivation. Mascot introduces the platform. Free trial credits granted on completion." \
  --priority high \
  --label "onboarding" --label "mvp" \
  --ac "Onboarding completes in under 3 minutes" \
  --ac "User sees recommended first task after completing onboarding" \
  --ac "Free trial credits are granted on completion"
ok "Task: Module 2 — Onboarding"

knowns task create "Module 3: Writing practice" \
  -d "Writing tasks browsable by type, difficulty, and estimated time. Editor with timer and draft state. AI scoring on submit with credit reservation. Report with criterion breakdown and next steps." \
  --priority high \
  --label "writing" --label "mvp" --label "ai-scoring" \
  --ac "User can browse and select a Writing task" \
  --ac "Credits are reserved before scoring begins" \
  --ac "Report includes overall estimated band, criterion breakdown, explanation, and next steps" \
  --ac "Failed score attempts trigger automatic credit refund"
ok "Task: Module 3 — Writing"

knowns task create "Module 4: Speaking practice" \
  -d "Speaking prompts by part (1/2/3). Audio record or upload. Transcription before scoring. Speaking-specific report covering fluency, pronunciation, lexical, and grammar." \
  --priority high \
  --label "speaking" --label "mvp" --label "ai-scoring" \
  --ac "User can complete a full speaking attempt via record or upload" \
  --ac "Audio is stored in Supabase Storage and transcribed before scoring" \
  --ac "Report covers fluency, pronunciation, lexical resource, and grammar" \
  --ac "Transcription or scoring failure is handled safely with credit refund"
ok "Task: Module 4 — Speaking"

knowns task create "Module 5: Reading practice" \
  -d "Reading sets with questions and answer keys. Instant auto-scoring on submit. Eligible completions earn small bonus credits. Phase 2 — gated behind feature flag in MVP." \
  --priority medium \
  --label "reading" --label "phase-2" \
  --ac "User can complete a Reading set end to end" \
  --ac "Score is instant" \
  --ac "User can earn small bonus credits from validated completion"
ok "Task: Module 5 — Reading"

knowns task create "Module 6: Listening practice" \
  -d "Listening tasks with audio media and questions. Instant auto-scoring. Completions can trigger daily quest rewards. Phase 2 — gated behind feature flag in MVP." \
  --priority medium \
  --label "listening" --label "phase-2" \
  --ac "User can play media, answer questions, and receive results" \
  --ac "Completion can trigger quest rewards when eligible"
ok "Task: Module 6 — Listening"

knowns task create "Module 7: Reports and improvement plans" \
  -d "Every scored submission creates a report. Reports show overall band, criterion detail, evidence-based explanation, strengths, weaknesses, and improvement tasks. Historical comparison supported." \
  --priority high \
  --label "reports" --label "mvp" \
  --ac "User can reopen any past report" \
  --ac "User can compare current vs previous report for the same skill" \
  --ac "Recommendations can be converted to personal improvement tasks"
ok "Task: Module 7 — Reports"

knowns task create "Module 8: Dashboard and progress" \
  -d "Shows skill activity, latest reports, streak, XP, badges, quests, and credit balance. Learning trend and weak-area analysis. Weakest skill and next recommended action above the fold." \
  --priority high \
  --label "dashboard" --label "mvp" \
  --ac "Dashboard loads key stats for the authenticated user" \
  --ac "Weakest skill and next recommended action are visible above the fold" \
  --ac "Streak, XP, and credit balance are accurate and real-time"
ok "Task: Module 8 — Dashboard"

knowns task create "Module 9: Gamification system" \
  -d "XP for broad learning activity. Credits earnable from low-cost validated actions (Reading, Listening, report review, drills). Daily quests, weekly challenges, streaks, badges, milestones. Daily and weekly earn caps. Anti-abuse rules." \
  --priority high \
  --label "gamification" --label "mvp" \
  --ac "User sees daily quests and weekly challenge with progress" \
  --ac "Daily and weekly credit earning caps are enforced" \
  --ac "Only validated completions trigger rewards" \
  --ac "Admin can change reward values without redeploying"
ok "Task: Module 9 — Gamification"

knowns task create "Module 10: Mascot and UI delight" \
  -d "Friendly coach mascot with 6-8 emotional states. Appears in onboarding, quest completion, streak reminders, report summaries, and empty states. Optional sound design with silent exam mode." \
  --priority medium \
  --label "ux" --label "mascot" \
  --ac "User can disable sound effects" \
  --ac "Sound never plays during Writing or Speaking exam flow" \
  --ac "Mascot only appears in purposeful, contextually appropriate moments"
ok "Task: Module 10 — Mascot"

knowns task create "Module 11: Plans, pricing, and wallet" \
  -d "Free / Starter / Pro plans with monthly credit grants. Credit top-ups via Stripe. Reserve/consume/refund wallet model backed by append-only ledger. Bonus credits with expiry. Credit cost shown before each premium action." \
  --priority high \
  --label "billing" --label "wallet" --label "mvp" \
  --ac "Credit cost is shown to the user before each premium action" \
  --ac "Credits cannot go below zero" \
  --ac "Failed scoring jobs trigger automatic refund" \
  --ac "Bonus credits expire after the configured window"
ok "Task: Module 11 — Plans and wallet"

knowns task create "Module 12: Notifications" \
  -d "Email and in-app reminders for streak breaks and unfinished tasks. Report-ready notifications. Mascot-toned copy. User-controllable preferences with timezone support." \
  --priority medium \
  --label "notifications" \
  --ac "User can control notification preferences" \
  --ac "Time-sensitive reminders respect the user's timezone" \
  --ac "Report-ready notification is sent when a scoring job completes"
ok "Task: Module 12 — Notifications"

knowns task create "Module 13: Admin console" \
  -d "Manage question content and prompt packs. View AI usage, costs, failures, and refunds. Configure quest reward values and plan pricing. Inspect and retry scoring jobs." \
  --priority high \
  --label "admin" --label "mvp" \
  --ac "Admin can inspect scoring job states (queued, running, failed, dead)" \
  --ac "Admin can retry failed jobs" \
  --ac "Admin can edit active quest reward values" \
  --ac "Admin can publish a new prompt pack version without redeploying"
ok "Task: Module 13 — Admin console"

# ─────────────────────────────────────────────
# 3. Memory
# ─────────────────────────────────────────────
step "Seeding project memory"

knowns memory create "Wallet: credits never below zero" \
  --category decision --layer project \
  --content "Credits must never go below zero. All deductions must go through WalletService.reserve() inside a serializable transaction — never a direct DB write to the wallet balance."
ok "Memory: wallet floor"

knowns memory create "Wallet: ledger is append-only" \
  --category decision --layer project \
  --content "The ledger_entries table is append-only. Never update or delete a ledger row. Reconstruct wallet state by replaying the ledger if needed."
ok "Memory: ledger append-only"

knowns memory create "Wallet: idempotency keys required" \
  --category decision --layer project \
  --content "Every ledger write must supply a stable idempotency_key (derived from submissionId + event type) to prevent double-processing when a worker retries."
ok "Memory: idempotency keys"

knowns memory create "Scoring: always gate with credit reservation" \
  --category decision --layer project \
  --content "No AI scoring call may be made without a prior successful WalletService.reserve(). The reserve → score → consume (or refund) flow is mandatory for every Writing and Speaking submission."
ok "Memory: scoring gate"

knowns memory create "Prompt packs: versioned, never edited in-place" \
  --category decision --layer project \
  --content "Prompt packs are versioned rows in the database. To update a rubric or prompt, create a new version row and mark it active. Never edit an active prompt pack in-place."
ok "Memory: prompt pack versioning"

knowns memory create "AI scores are estimates only" \
  --category convention --layer project \
  --content "All AI-generated scores must be presented as estimated practice scores, not official IELTS results. Every score response must include the disclaimer field is_estimate: true and UI must show the disclaimer."
ok "Memory: score disclaimer"

knowns memory create "DB connection strings: direct vs pooler" \
  --category convention --layer project \
  --content "Use DATABASE_URL (Supabase direct connection) for Prisma migrate deploy. Use DATABASE_URL_POOLER (PgBouncer) for API runtime. Never use the pooler URL for migrations — Prisma uses advisory locks that PgBouncer does not support."
ok "Memory: DB connection strings"

knowns memory create "Infrastructure stack" \
  --category decision --layer project \
  --content "Next.js on Vercel. NestJS API + BullMQ workers on Railway (or Render). PostgreSQL on Supabase. Redis (BullMQ + cache) on Upstash. Audio file storage on Supabase Storage. Free tier for all infra during beta."
ok "Memory: infrastructure"

knowns memory create "Reading and Listening are Phase 2" \
  --category decision --layer project \
  --content "Reading and Listening modules are Phase 2. They are scaffolded in the codebase but must stay behind FEATURE_READING and FEATURE_LISTENING feature flags for the MVP release."
ok "Memory: phase 2 flags"

knowns memory create "BullMQ workers must be idempotent" \
  --category pattern --layer project \
  --content "Every queue worker step must be idempotent. Re-running a completed step must not double-consume credits, double-persist reports, or double-send notifications. Use idempotency keys and check-before-write patterns."
ok "Memory: worker idempotency"

# ─────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Knowns setup complete for Band Mate${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Docs imported : 8"
echo "  Tasks created : 13"
echo "  Memory entries: 10"
echo ""
echo "  Next steps:"
echo "  1. Restart Claude Code to pick up .mcp.json"
echo "  2. Run: /kn-init"
echo "  3. Pick a task: knowns task list --plain"
echo "  4. Run: /kn-plan <task-id>"
echo ""
