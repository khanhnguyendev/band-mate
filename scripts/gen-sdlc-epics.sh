#!/usr/bin/env bash
# Generates docs/sdlc/epics/ structure for Band Mate's 13 modules.
# Run from repo root: bash scripts/gen-sdlc-epics.sh

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
EPICS_DIR="$ROOT/docs/sdlc/epics"
PHASES=(plan design test-plan implement review execute-test release monitor doc-sync)

write_status() {
  local dir="$1" phase="$2" status="$3"
  mkdir -p "$dir"
  cat > "$dir/status.json" <<EOF
{
  "phase": "$phase",
  "status": "$status",
  "revision": $([ "$status" = "pending" ] && echo 0 || echo 1),
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
}

write_epic() {
  local key="$1" title="$2" brief="$3" modules="$4"
  local epic_dir="$EPICS_DIR/$key"
  mkdir -p "$epic_dir"
  cat > "$epic_dir/epic.json" <<EOF
{
  "epic_id": "$key",
  "project": "band-mate",
  "title": "$title",
  "brief": "$brief",
  "affected_modules": $modules,
  "owner": "po"
}
EOF
}

# ─── Module 1: Auth and Accounts (done) ───────────────────────────────────────
K="BM-001"
write_epic "$K" \
  "Auth and Accounts" \
  "Users register with email/password via Supabase Auth, verify email, log in, and access a profile with wallet summary. Global JWT guard protects all NestJS routes." \
  '["auth", "users", "wallet"]'

for phase in "${PHASES[@]}"; do
  case "$phase" in
    plan|design|test-plan|implement|review|execute-test|doc-sync)
      write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "done" ;;
    release|monitor)
      write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending" ;;
  esac
done

# ─── Module 2: Onboarding ──────────────────────────────────────────────────────
K="BM-002"
write_epic "$K" \
  "Onboarding" \
  "New users complete a guided onboarding flow: select English level, set weekly study goal, choose target band score, and receive a personalised study plan recommendation." \
  '["onboarding", "users", "plans"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 3: Writing Practice ───────────────────────────────────────────────
K="BM-003"
write_epic "$K" \
  "Writing Practice" \
  "Users submit Task 1 and Task 2 writing responses. The AI scoring pipeline evaluates against official IELTS bands (TR/CC/LR/GRA) and returns detailed feedback within 60 s." \
  '["writing", "submissions", "scoring", "wallet"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 4: Speaking Practice ──────────────────────────────────────────────
K="BM-004"
write_epic "$K" \
  "Speaking Practice" \
  "Users record audio responses to Part 1/2/3 prompts. Audio is transcribed via Whisper then scored by the AI pipeline (Fluency/Coherence, Lexical Resource, Grammar, Pronunciation)." \
  '["speaking", "submissions", "scoring", "storage", "wallet"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 5: Reading Practice ───────────────────────────────────────────────
K="BM-005"
write_epic "$K" \
  "Reading Practice" \
  "Timed reading passages with MCQ, True/False/Not Given, and matching tasks. Auto-graded with explanations. Progress tracked per passage and skill area." \
  '["reading", "exercises", "progress"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 6: Listening Practice ─────────────────────────────────────────────
K="BM-006"
write_epic "$K" \
  "Listening Practice" \
  "Audio-driven exercises for Sections 1-4. Users answer questions while listening; auto-graded with transcript review. Supports form completion, MCQ, and map labelling." \
  '["listening", "exercises", "storage", "progress"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 7: Reports and Improvement Plans ──────────────────────────────────
K="BM-007"
write_epic "$K" \
  "Reports and Improvement Plans" \
  "After each scored submission, generate a structured PDF/web report with band breakdown, error analysis, and a personalised 2-week improvement plan linked to practice exercises." \
  '["reports", "scoring", "exercises"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 8: Dashboard and Progress ─────────────────────────────────────────
K="BM-008"
write_epic "$K" \
  "Dashboard and Progress" \
  "A central dashboard shows band score trend charts, streak calendar, skill radar (R/L/W/S), recent submissions, and quest progress. Data aggregated per user." \
  '["dashboard", "progress", "gamification"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 9: Gamification System ────────────────────────────────────────────
K="BM-009"
write_epic "$K" \
  "Gamification System" \
  "XP, daily/weekly streaks, achievement badges, and a quest system that awards bonus credits. Leaderboard (opt-in). Mascot reactions on milestone events." \
  '["gamification", "quests", "wallet", "notifications"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 10: Mascot and UI Delight ─────────────────────────────────────────
K="BM-010"
write_epic "$K" \
  "Mascot and UI Delight" \
  "Animated mascot character reacts to user actions (submit, streak, level-up). Lottie animations, confetti on achievements, dark mode toggle, smooth page transitions." \
  '["ui", "mascot", "gamification"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 11: Plans, Pricing and Wallet ─────────────────────────────────────
K="BM-011"
write_epic "$K" \
  "Plans, Pricing and Wallet" \
  "Subscription plans (Free/Starter/Pro) with credit allocation. Stripe checkout integration. Wallet balance with reserve/consume/refund ledger. Bonus credit campaigns." \
  '["plans", "wallet", "payments", "ledger"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 12: Notifications ─────────────────────────────────────────────────
K="BM-012"
write_epic "$K" \
  "Notifications" \
  "In-app and email notifications for: scoring complete, streak reminder, quest unlocked, low credit warning, and subscription renewal. User preference controls per channel." \
  '["notifications", "email", "scoring", "gamification"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

# ─── Module 13: Admin Console ─────────────────────────────────────────────────
K="BM-013"
write_epic "$K" \
  "Admin Console" \
  "Internal dashboard for ops: user management, credit adjustments, scoring queue monitor, prompt pack versioning, content moderation flags, and revenue metrics." \
  '["admin", "users", "scoring", "wallet", "content"]'
for phase in "${PHASES[@]}"; do
  write_status "$EPICS_DIR/$K/phases/$phase" "$phase" "pending"
done

echo "✓ Generated $(find "$EPICS_DIR" -name 'epic.json' | wc -l | tr -d ' ') epics with $(find "$EPICS_DIR" -name 'status.json' | wc -l | tr -d ' ') phase status files"
echo "  → $EPICS_DIR"
