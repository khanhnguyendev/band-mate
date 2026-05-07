Design the complete UI/UX for **BandMate** — an AI-powered IELTS preparation web app built with Next.js 16 + Tailwind CSS.

---

## Brand Identity

- **App name:** BandMate
- **Mascot:** Bandy — a friendly owl character that coaches learners
- **Personality:** Encouraging, smart, gamified, but not childish
- **Primary color:** Indigo (#4f46e5)
- **Accent color:** Violet (#7c3aed)
- **Success:** Emerald (#10b981)
- **Warning:** Amber (#f59e0b)
- **Neutral:** Slate gray scale
- **Font style:** Clean, modern, readable (Inter or equivalent)
- **Mood:** Motivational study app — think Duolingo meets a serious test-prep platform

---

## Tech Stack Constraints

- Next.js App Router (no pages dir)
- Tailwind CSS only — no external component libraries
- React Server Components where possible
- Mobile-first responsive layouts

---

## Global UI Patterns

- **Sidebar nav** (desktop): logo + Bandy icon at top, nav links with icons, user avatar + name at bottom
- **Bottom nav** (mobile): icons only for main 5 sections
- **Bandy mascot** appears on: onboarding (large), dashboard greeting (medium), empty states (small with speech bubble)
- **Skill color coding:** Writing = Indigo (#4f46e5), Speaking = Violet (#7c3aed), Reading = Teal (#0d9488), Listening = Amber (#f59e0b)
- **Band score badges:** color scale from red (4.0–5.0) → yellow (5.5–6.5) → green (7.0+)
- **Credit chips:** coin icon with count, yellow/gold color
- **Streak badge:** flame icon, orange gradient
- **Loading states:** skeleton loaders (not spinners)
- **Empty states:** Bandy mascot + encouraging message + CTA button
- **Toast notifications:** success (emerald), error (red), info (blue) — top-right corner
- **Difficulty badges:** Band 4–5 (gray), Band 5–6 (blue), Band 6–7 (violet), Band 7+ (gold)

---

## Page Flow Connections

```
/ → /register → /onboarding → /dashboard
/ → /login → /dashboard (if already onboarded)
/pricing → /register (free plan) or /wallet/topup (paid plan)
/invite/[code] → /register (code pre-filled) → /onboarding → /dashboard
/referral → copy link → share → /invite/[code]
/dashboard → /wallet (low credits warning)
/wallet → /wallet/topup → Stripe → /wallet/success or /wallet/cancel
/writing/[id] submit → processing state → /reports/[id]
/speaking/[id] submit → processing state → /reports/[id]
/reading/[id] submit → /reports/[id]
/listening/[id] submit → /reports/[id]
/admin/login → /admin (role-gated, 403 if not admin)
```

---

## Design Priorities

1. Make Bandy the emotional core — he should appear in key moments to motivate
2. Dashboard must feel like a game HUD — progress, streaks, and next action clearly visible
3. Practice editors need distraction-free focus mode feel
4. Score reports should feel like a professional assessment, not a grade card
5. Admin should be utilitarian but clean — data density over decoration
6. Pricing and referral pages should drive conversion — clear value props, no clutter

---

## Complete Screen Inventory (87 screens)

### AUTH (4 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 1 | `/login` | Login | Email input, password input, "Remember me" checkbox, Google OAuth button, "Forgot password?" link, "Create account" link, error state (wrong password / account not found) |
| 2 | `/register` | Register | Name input, email input, password input, confirm password input, Google OAuth button, "Already have account?" link, error state (email taken) |
| 3 | `/forgot-password` | Forgot Password | Email input, submit button, success state ("Check your email") |
| 4 | `/reset-password` | Reset Password | New password input, confirm password input, submit button, success state ("Password changed! Go to login") |

---

### ONBOARDING (4 screens — step wizard)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 5 | `/onboarding` step 1 | Onboarding — Welcome | Bandy large center, "Hi! I'm Bandy" greeting, band score picker grid (4.0–9.0 in 0.5 steps, selected = indigo highlight), step indicator "Step 1 of 4", Next button |
| 6 | `/onboarding` step 2 | Onboarding — Test Date | "When is your IELTS test?" heading, date picker calendar, "I don't have a date yet" skip option, Back + Next buttons, step indicator |
| 7 | `/onboarding` step 3 | Onboarding — Weak Skills | "Which skills do you want to improve?" heading, 4 large skill checkboxes with icons (Writing/Speaking/Reading/Listening), each with skill color, Back + Next buttons, disabled Next if none selected |
| 8 | `/onboarding` step 4 | Onboarding — Motivation | "What's your main motivation?" heading, large textarea with placeholder examples, Back + Submit button, loading state ("Setting up your plan..."), completion animation (Bandy celebrates + confetti + "3 credits added!") |

---

### LANDING (1 screen)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 9 | `/` | Landing Page | Hero: Bandy large + tagline "Ace your IELTS with AI coaching" + CTA buttons (Get Started Free / Login); Feature section: 4 skill cards with icons and descriptions; How it works: 3-step (Practice → AI Scores → Improve); Band score showcase: sample report preview; Social proof: user count / average improvement stat; Footer: links to Pricing, Login, Register |

---

### PRICING (1 screen)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 10 | `/pricing` | Pricing | Plan comparison table (Free vs Pro vs Premium): monthly credits, writing credit cost, speaking credit cost, reading/listening cost; toggle monthly/annual billing; CTA per plan (Get Started Free / Upgrade); FAQ accordion (What are credits? Do credits roll over? Cancel anytime?); link to referral for free credits |

---

### MAIN APP — LEARNER (12 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 11 | `/dashboard` | Dashboard | Bandy greeting ("Good morning, [name]!"), credit balance chip + bonus credits chip, streak badge (🔥 N days), "Next recommended action" card (skill + CTA), 4-skill submission count grid (Writing/Speaking/Reading/Listening with color badges), recent score reports list (last 3: skill badge + band score + date + View link), quest panel (active quests, progress bars, reward chips) |
| 12 | `/writing` | Writing Hub | Page header, question card grid: each card shows task type badge (Task 1 / Task 2), topic title, difficulty badge, credit cost chip, Start button; filter bar (All / Task 1 / Task 2, difficulty filter) |
| 13 | `/writing/[id]` | Writing Editor | Full-page focus layout: question prompt panel (task type, topic, instructions), large rich textarea, live word count (min 150 / min 250 highlighted), credit cost badge, Submit button (disabled until min words met), back link |
| 14 | `/speaking` | Speaking Hub | Question card grid: each card shows part badge (Part 1 / Part 2 / Part 3), topic title, difficulty badge, credit cost chip, Start button; filter bar (All / Part 1 / Part 2 / Part 3) |
| 15 | `/speaking/[id]` | Speaking Editor | Question prompt at top, large circular Record button (idle / recording / processing states), waveform visualization area, timer (max duration), recorded audio playback bar, Re-record button, credit cost badge, Submit button |
| 16 | `/reading` | Reading Hub | Set card grid: each card shows passage title, question count badge, difficulty badge, estimated time, credit cost chip, Start button |
| 17 | `/reading/[id]` | Reading Exercise | Two-column layout: passage text left (scrollable, highlighted on hover), question panel right (numbered questions, MCQ / T-F-NG / fill-blank), progress indicator (Q N of M), timer top-right, Submit button |
| 18 | `/listening` | Listening Hub | Set card grid: each card shows audio title, question count badge, difficulty badge, estimated duration, credit cost chip, Start button |
| 19 | `/listening/[id]` | Listening Exercise | Audio player top (play/pause, scrub bar, speed control), transcript toggle button, question panel below (same types as reading), progress indicator, Submit button |
| 20 | `/reports` | Reports List | Filter tabs (All / Writing / Speaking / Reading / Listening), reports table: skill color badge, overall band score badge, submission date, status (completed/pending/failed), View link; pagination |
| 21 | `/wallet` | Wallet | Balance card: main credits (large number) + bonus credits + bonus expiry warning; current plan badge + plan details (monthly credits, per-skill cost); Upgrade CTA if on free plan; transaction ledger table (type badge grant/spend/bonus, amount ±, description, date); empty ledger state |
| 22 | `/settings` | Settings | Section: Notifications — "Report ready" email toggle, "Streak reminder" email toggle, reminder hour picker (0–23), timezone search/select; Section: Account — display name edit, email (read-only), change password link; Section: Danger Zone — Delete account button (red, confirm dialog) |

---

### PROGRESS & ANALYTICS (1 screen)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 23 | `/progress` | Progress & Analytics | Band score trend line chart per skill (Writing/Speaking/Reading/Listening — toggleable), date range selector (Last 30 / 90 / All time), streak calendar heatmap (GitHub-style), total submissions count per skill, best band score per skill cards |

---

### PROFILE (1 screen)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 24 | `/profile` | Profile | Avatar (upload or initials), display name edit inline, email (read-only), member since date, current plan badge, link to /settings, link to /referral |

---

### REPORT DETAIL — 4 SKILL VARIANTS (same route, 4 layouts)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 25 | `/reports/[id]` | Report — Writing | Overall band score hero (large number, color-coded), 4 sub-score bars (Task Achievement / Coherence & Cohesion / Lexical Resource / Grammatical Range & Accuracy — each 0–9 with fill bar), AI feedback section per criterion (expandable), Strengths list (green checkmarks), Improvement tips list (amber bullets), submission date + back link |
| 26 | `/reports/[id]` | Report — Speaking | Overall band score hero, 4 sub-score bars (Fluency & Coherence / Lexical Resource / Grammatical Range & Accuracy / Pronunciation), audio playback bar (original recording), transcript panel (expandable), AI feedback sections, Strengths + tips |
| 27 | `/reports/[id]` | Report — Reading | Overall band score hero, score chip (X / Y correct, percentage), time taken chip, per-question result table (Q number, question text truncated, correct answer, user answer, ✓ green / ✗ red), back link |
| 28 | `/reports/[id]` | Report — Listening | Same layout as Reading variant: overall band, score chip, time taken, per-question result table |

---

### EMPTY STATES — BANDY VARIANTS (5 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 29 | `/reports` empty | Empty — Reports | Bandy medium + speech bubble "No submissions yet. Pick a skill to start!", 4 skill CTA buttons in skill colors |
| 30 | `/wallet` ledger empty | Empty — Wallet Ledger | Bandy small + "No transactions yet. Complete a practice to see your history." |
| 31 | `/writing` empty | Empty — Writing List | Bandy + "No writing questions available yet. Check back soon!" |
| 32 | `/speaking` empty | Empty — Speaking List | Bandy + "No speaking topics available yet. Check back soon!" |
| 33 | `/reading` or `/listening` empty | Empty — Reading/Listening List | Bandy + "No sets available yet. Check back soon!" |

---

### REFERRAL PROGRAM — LEARNER (4 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 34 | `/referral` | Referral Hub | Hero: "Give 3 credits, get 3 credits" headline, Bandy holding gift; unique referral link with copy button; share buttons (WhatsApp, Email, Copy link); stats section: total invited count, pending vs claimed count, total credits earned from referrals |
| 35 | `/referral` stats section | Referral Stats (variant) | Referral table: invitee email (masked), status badge (pending/registered/completed onboarding), credits earned, date sent |
| 36 | `/invite/[code]` | Invite Landing | "Your friend invited you to BandMate" headline, inviter name/avatar, Bandy welcome, feature highlights (3 bullet points), Register CTA with referral code pre-filled, Login link if already have account |
| 37 | `/referral/success` | Referral Claimed | Bandy celebration large + confetti, "You earned 3 credits!" heading, credit balance updated chip, CTA "Start practicing now" → /dashboard |

---

### PAYMENT FLOW (3 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 38 | `/wallet/topup` | Top-up / Upgrade | Credit package picker (e.g. 10 / 30 / 100 credits or plan upgrade cards), selected state highlight, price per credit shown, Stripe Checkout CTA, back to wallet link |
| 39 | `/wallet/success` | Payment Success | Bandy celebration + confetti, "Payment successful!" heading, credits added summary, updated balance chip, CTA "Start practicing" |
| 40 | `/wallet/cancel` | Payment Cancelled | Bandy sad expression, "Payment was cancelled" heading, "No charges were made", back to wallet CTA, try again CTA |

---

### PROCESSING / LOADING STATES (3 screens)

| # | Context | Screen Name | Key Elements |
|---|---------|-------------|--------------|
| 41 | After writing submit | Processing — Writing | Full-screen overlay: Bandy animated (thinking pose), "Bandy is scoring your essay..." message, animated progress bar, estimated wait time ("Usually takes 30–60 seconds"), cancel not available notice |
| 42 | After speaking submit | Processing — Speaking | Same layout: Bandy listening pose, "Bandy is listening to your response...", animated waveform decoration |
| 43 | Any page initial load | Skeleton Loader | Page-specific skeleton: gray animated blocks matching layout of target page (dashboard skeleton, reports table skeleton, etc.) |

---

### ERROR PAGES (3 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 44 | `404` | Not Found | Bandy confused expression + magnifying glass, "Oops! Page not found", back to dashboard CTA |
| 45 | `500` | Server Error | Bandy apologetic expression, "Something went wrong on our end", retry button, back to dashboard link |
| 46 | Submit failed | Submission Failed | Bandy sad, "Submission failed — your credits were not deducted", error detail (collapsed), retry button, back to hub link |

---

### NOTIFICATION CENTER (2 screens)

| # | Route | Screen Name | Key Elements |
|---|---------|-------------|--------------|
| 47 | Header dropdown | Notification Bell Dropdown | Bell icon with unread count badge, dropdown list: notification items (icon + message + time ago), mark all read, "View all" link; notification types: Report ready (green), Streak at risk (amber), Credits low (red), Referral claimed (violet) |
| 48 | `/notifications` | Notification History | Full page list of all past notifications, filter by type, mark read/unread toggle, pagination |

---

### MODALS & OVERLAYS (5 screens)

| # | Context | Screen Name | Key Elements |
|---|---------|-------------|--------------|
| 49 | Delete exercise / account | Confirm Delete Modal | Warning icon, "Are you sure?" heading, item name highlighted, Cancel + Delete (red) buttons |
| 50 | Grant credits | Grant Credits Modal | Amount input, reason textarea, target user name shown, Cancel + Confirm buttons |
| 51 | `/wallet` | Upgrade Plan Modal | Plan comparison mini-table, current plan highlighted, target plan CTA, "View full pricing" link |
| 52 | Streak milestone | Streak Milestone Overlay | Bandy celebration large + confetti, "🔥 7-day streak!" heading, motivational message, "Keep it up!" dismiss button |
| 53 | Onboarding complete | Onboarding Complete Overlay | Bandy celebration, confetti, "You're all set!", credits granted chip, "Let's start!" CTA → /dashboard |

---

### NAVIGATION STATES (2 variants)

| # | Context | Screen Name | Key Elements |
|---|---------|-------------|--------------|
| 54 | Desktop sidebar expanded | Sidebar Nav — Expanded | Logo + Bandy icon, nav items (icon + label): Dashboard, Writing, Speaking, Reading, Listening, Reports, Wallet, Progress, Referral; user avatar + name + plan badge at bottom; active item = indigo highlight |
| 55 | Desktop sidebar collapsed | Sidebar Nav — Collapsed | Icons only, tooltips on hover, same active state; toggle arrow |

---

### ADMIN AUTH (2 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 56 | `/admin/login` | Admin Login | Email + password only (no Google OAuth), "Admin Portal" label, role check error state |
| 57 | `/admin` unauthorized | Admin 403 | "Admin access only" message, back to app link |

---

### ADMIN CORE (8 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 58 | `/admin` | Admin Dashboard | KPI cards (Total Users, Total Submissions, Total Reports, MRR), submissions per day line chart, skill breakdown donut chart, recent activity feed |
| 59 | `/admin/users` | Users List | Search input, filter (plan, onboarding status), table: avatar + email, name, plan badge, credit balance, onboarding badge (complete/pending), joined date, View link; bulk actions dropdown |
| 60 | `/admin/users/[id]` | User Detail | Profile card (avatar, name, email, joined), wallet section (balance, bonus, plan, subscription dates), manual credit grant button → modal, submissions list (last 10), reports list (last 10) |
| 61 | `/admin/submissions` | Submissions List | Filter (skill, status, date range), table: user email, skill color badge, status badge (pending/completed/failed/processing), created date, View link; pagination |
| 62 | `/admin/submissions/[id]` | Submission Detail | User info card, skill badge, status timeline (submitted → processing → scored), raw submission content panel (text or audio player), linked report card with View link |
| 63 | `/admin/reports` | Reports List (Admin) | Filter (skill, band range), table: user email, skill badge, overall band badge (color-coded), sub-scores preview chips, created date, View link |
| 64 | `/admin/plans` | Plans Management | Plan cards in grid: name, monthly credits, writing cost, speaking cost, reading cost, listening cost, active users count; Edit inline per field; Add new plan CTA |
| 65 | `/admin/wallet` | Wallet Operations | "Grant Monthly Credits" action card with last run date + user count + confirm button; manual bulk grant section; recent grants log table (date, users affected, credits granted) |

---

### ADMIN EXERCISE MANAGEMENT (13 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 66 | `/admin/exercises` | Exercises Overview | 4 skill tabs (Writing / Speaking / Reading / Listening), each tab shows count (active / draft), "New Exercise" CTA per tab |
| 67 | `/admin/exercises/writing` | Writing Exercises List | Table: title, task type badge (Task 1 / Task 2), difficulty badge, status toggle (active/draft), edit icon, delete icon; search input; New button |
| 68 | `/admin/exercises/writing/new` | Writing Exercise — New | Title input, task type select (Task 1 / Task 2), rich text prompt editor, word limit hint input, difficulty picker (4 badge options), status toggle (draft/published), Preview button, Save button |
| 69 | `/admin/exercises/writing/[id]` | Writing Exercise — Edit | Same form as new, pre-filled; Delete button (red, triggers confirm modal); last updated timestamp |
| 70 | `/admin/exercises/speaking` | Speaking Exercises List | Table: topic, part badge (Part 1/2/3), difficulty badge, status toggle, edit/delete; New button |
| 71 | `/admin/exercises/speaking/new` | Speaking Exercise — New | Topic input, part select (Part 1/2/3), question text input, follow-up questions (dynamic add/remove rows), difficulty picker, status toggle, Save button |
| 72 | `/admin/exercises/speaking/[id]` | Speaking Exercise — Edit | Same form pre-filled + delete button |
| 73 | `/admin/exercises/reading` | Reading Exercises List | Table: passage title, question count chip, difficulty badge, status toggle, edit/delete; New button |
| 74 | `/admin/exercises/reading/new` | Reading Exercise — New | Passage title input, rich text passage editor, question builder (dynamic rows: question text + answer type select MCQ/fill-blank/T-F-NG + correct answer input + drag handle to reorder), difficulty picker, status toggle, Preview button, Save button |
| 75 | `/admin/exercises/reading/[id]` | Reading Exercise — Edit | Same form pre-filled + delete button |
| 76 | `/admin/exercises/listening` | Listening Exercises List | Table: audio title, question count chip, difficulty badge, status toggle, edit/delete; New button |
| 77 | `/admin/exercises/listening/new` | Listening Exercise — New | Audio file upload dropzone (mp3/wav, max size shown), audio preview player, transcript textarea, question builder (same as reading), difficulty picker, status toggle, Save button |
| 78 | `/admin/exercises/listening/[id]` | Listening Exercise — Edit | Same form pre-filled + replace audio option + delete button |

---

### ADMIN REFERRAL MANAGEMENT (2 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 79 | `/admin/referrals` | Referral Overview | KPI cards (total invites sent, conversion rate %, total credits granted); referral table: referrer email, referee email (or "pending"), status badge (pending/registered/completed), credits granted, date; export CSV button |
| 80 | `/admin/referrals/settings` | Referral Settings | Credits per successful referral (number input), max referrals per user (number input), referral expiry days (number input), enable/disable toggle (affects new referrals only), Save button |

---

### GAMIFICATION (2 screens)

| # | Route | Screen Name | Key Elements |
|---|-------|-------------|--------------|
| 81 | `/dashboard` quest panel | Quest Panel | Active quests list: quest name, description, progress bar (N/M), reward chip (credits), "Complete" badge when done; locked quests preview (blurred) |
| 82 | Dashboard overlay | Streak Milestone Overlay | Already listed as #52 — reuse: Bandy celebration, "🔥 7-day streak!", motivational message, dismiss |

---

### MOBILE-FIRST VARIANTS (key screens, 5 designs)

| # | Context | Screen Name | Key Elements |
|---|---------|-------------|--------------|
| 83 | Mobile | Dashboard — Mobile | Bottom nav bar (5 icons: Home/Writing/Speaking/Reports/Wallet), stacked single-column layout, stats as horizontal scroll chips |
| 84 | Mobile | Writing Editor — Mobile | Full-screen textarea, sticky bottom bar (word count + Submit button), collapsible prompt panel |
| 85 | Mobile | Reading Exercise — Mobile | Passage and questions stacked vertically, sticky tab switcher ("Passage" / "Questions"), passage scrolls independently |
| 86 | Mobile | Report Detail — Mobile | Single column, sub-score bars full width, feedback sections accordion-collapsed by default |
| 87 | Mobile | Admin Users List — Mobile | Card list instead of table, each card: avatar + name + plan badge + credits + View button |

---

## Summary

| Group | Count |
|-------|-------|
| Auth | 4 |
| Onboarding | 4 |
| Landing | 1 |
| Pricing | 1 |
| Main App — Learner | 12 |
| Progress & Analytics | 1 |
| Profile | 1 |
| Report Detail Variants | 4 |
| Empty States | 5 |
| Referral — Learner | 4 |
| Payment Flow | 3 |
| Processing / Loading | 3 |
| Error Pages | 3 |
| Notification Center | 2 |
| Modals & Overlays | 5 |
| Navigation States | 2 |
| Admin Auth | 2 |
| Admin Core | 8 |
| Admin Exercise Management | 13 |
| Admin Referral Management | 2 |
| Gamification | 2 |
| Mobile Variants | 5 |
| **Total** | **87** |
