---
title: PRD
description: Full product requirements — vision, goals, personas, modules, acceptance criteria, analytics events
createdAt: '2026-05-01T07:35:24.685Z'
updatedAt: '2026-05-01T07:35:24.685Z'
tags:
  - product
  - requirements
---

# Product Requirements Document — Band Mate

> **Related docs:** [Architecture](ARCHITECTURE.md) · [API Reference](API.md) · [Data Model](DATA_MODEL.md) · [Deployment](DEPLOYMENT.md) · [ADRs](adr/)

## Document status

| Field | Value |
|---|---|
| Product name | Band Mate |
| Version | 1.0 |
| Stage | Pre-build |
| Type | Web platform |
| Primary platforms | Desktop web, mobile web |
| Core stack | Next.js + NestJS |
| Date | 2026-05-01 |

## Product overview
The IELTS Training Platform is an AI-assisted exam preparation product for learners who want to improve Reading, Listening, Speaking, and Writing skills through structured practice, AI-estimated scoring, detailed reports, and guided improvement plans. The initial commercial value centers on Writing and Speaking because AI-evaluated feedback is the strongest premium feature in current IELTS-related offerings, while also being the main source of cost pressure that must be controlled through pricing and entitlements.[1][2][3][4]

The product should be positioned as a smart practice and progress platform, not as an official IELTS examiner or certification authority. Existing IELTS products often package practice tests, analytics, and AI-assisted feedback together, which supports a market position focused on guided preparation rather than only static content.[5][6][7][8]

## Product vision
Help learners prepare for IELTS with affordable, motivating, feedback-rich practice that feels more personal than self-study and more scalable than one-to-one tutoring.

## Product mission
Make high-quality IELTS preparation more accessible by combining AI scoring, progress coaching, and gamified engagement into one web platform.

## Problem statement
IELTS learners often face three problems:
- Practice without meaningful feedback, especially in Writing and Speaking.
- High tutoring cost and inconsistent study discipline.
- Difficulty understanding what to improve next after each exercise.

For the business, the hardest problem is economic: Writing and Speaking feedback require AI inference and sometimes transcription, which creates variable cost per use. Market examples suggest that pricing must be aligned with evaluation-heavy actions through monthly packages, bundles, or usage-based controls rather than unbounded access from day one.[2][4][9][1]

## Goals
### User goals
- Let learners practice all four IELTS skills in one place.
- Give fast, structured, useful feedback for Writing and Speaking.
- Show clear progress over time.
- Make practice engaging enough to sustain consistent weekly use.

### Business goals
- Launch a private beta that attracts early users and generates actionable feedback.
- Achieve positive or controllable unit economics for AI scoring.
- Build a conversion path from free users to paid plans.
- Create a scalable content and scoring architecture.

### Product goals
- Deliver strong MVP value with Writing and Speaking.
- Add Reading and Listening as low-cost retention loops.
- Use gamified tasks to reward study effort with limited extra credits.
- Build a distinctive UI/UX identity through a mascot and lightweight sound design.

## Non-goals
The first version will not include:
- Official IELTS certification.
- Native iOS or Android apps.
- Live tutoring marketplace.
- Full social network features.
- Unlimited AI scoring across all plans.
- Enterprise LMS features as a first priority.

## Target users
### Primary segments
1. Students preparing for university admissions or scholarships.
2. Working professionals needing IELTS for immigration, jobs, or promotion.
3. Self-study learners who want lower-cost alternatives to private coaching.

### Secondary segments
1. Tutors who want a structured feedback tool.
2. Small IELTS centers that may later adopt team dashboards.

## User personas
### Persona A: Goal-oriented student
- Age: 18–24
- Motivation: Reach band 6.5–7.0 for study abroad
- Pain points: Unsure how Writing and Speaking are judged; lacks disciplined plan
- Behavior: Uses mobile and laptop, likes streaks and rewards

### Persona B: Busy professional
- Age: 24–35
- Motivation: Reach required score with efficient practice
- Pain points: Limited time, wants fast diagnosis and next-step guidance
- Behavior: Prefers dashboard clarity over playful complexity

### Persona C: Budget self-learner
- Age: 18–30
- Motivation: Improve with low monthly spend
- Pain points: Cannot afford constant tutor feedback
- Behavior: Engages more if credits can be earned through learning tasks

## Value proposition
The product should combine four kinds of value:
- AI-estimated Writing and Speaking scoring with criterion-level feedback.[3][4]
- Reading and Listening practice with lower-cost auto-scoring loops.[6][7]
- Progress reports and improvement tasks, which are common and expected features in modern IELTS prep experiences.[7][5][6]
- Gamified incentives, streaks, and internal rewards that can improve engagement and repeated usage when tied to meaningful study actions.[10][11][12][13][14][15]

## Positioning
### Positioning statement
For IELTS learners who need structured, affordable, motivating practice, this platform provides AI-assisted scoring, skill practice, progress insights, and gamified learning rewards in one place.

### Core promise
Practice, get scored, know what to improve, stay motivated, and earn opportunities for extra progress.

## Success metrics
### Acquisition
- Sign-up conversion rate.
- Activation rate after onboarding.
- Cost per acquired beta user.

### Engagement
- Daily active learners.
- Weekly active learners.
- Average sessions per week.
- Daily quest completion rate.
- Streak participation rate.
- Percentage of users who return after first score report.

### Learning usage
- Average Reading/Listening completions per week.
- Average Writing/Speaking scored submissions per active user.
- Report open rate.
- Improvement-task completion rate.

### Monetization
- Free-to-paid conversion.
- Top-up purchase rate.
- Credit earn to credit spend ratio.
- Gross margin per paid user.
- AI cost per scored submission.

### Quality
- Writing score generation success rate.
- Speaking score generation success rate.
- Transcription failure rate.
- Average report latency.
- User satisfaction on usefulness of reports.

## Product principles
- Make feedback actionable, not merely descriptive.
- Reward learning behavior, not random repetition.
- Keep serious exam flows calm and trustworthy.
- Use delight sparingly so credibility remains high.
- Protect unit economics through explicit entitlement logic.
- Never present scores as official IELTS certification.

## Scope strategy
### MVP scope
The MVP should prioritize Writing and Speaking because these features are the clearest premium value and the strongest differentiator, while Reading and Listening can later reinforce retention and daily practice at lower operational cost.[4][1][2]

### MVP in scope
- Authentication and learner profiles.
- Writing practice and AI-estimated scoring.
- Speaking practice with audio recording/upload and AI-estimated scoring.
- Detailed reports and improvement tasks.
- Credit wallet and pricing entitlements.
- Progress dashboard.
- Limited mascot-driven interactions.
- Optional sound effects.
- Daily/weekly gamified tasks.
- Admin dashboard for prompts, content, usage, and cost.

### Phase 2 scope
- Reading practice and auto-scoring.
- Listening practice and auto-scoring.
- Extended study planner.
- More badge systems and progress loops.

### Phase 3 scope
- Mock exams across all 4 skills.
- Tutor review add-on.
- Referral program.
- Organization/institute features.

## Functional requirements

## Module 1: Authentication and accounts
### Requirements
- Users can register, log in, log out, and reset passwords.
- Users can set target band, study goal, and skill preferences.
- Users can view plan status, credit balance, and recent activity.

### Acceptance criteria
- Auth supports protected learner dashboard.
- Profile stores target score and preference data.
- Wallet balance is visible after login.

## Module 2: Onboarding
### Requirements
- New users go through short onboarding.
- Onboarding captures target band, test date, weak skills, and study motivation.
- Mascot introduces the platform as a coach.

### Acceptance criteria
- Onboarding takes under 3 minutes.
- User sees recommended first task after onboarding.
- Free trial credits are granted after completion.

## Module 3: Writing practice
### Requirements
- Show Writing tasks by type, difficulty, and estimated time.
- Provide a writing editor with timer and draft state.
- Let users submit for AI scoring.
- Display report with criterion scores and recommendations.

### Acceptance criteria
- User can submit a Writing attempt.
- Credits are reserved before scoring.
- Report includes overall estimated band, criterion breakdown, explanation, and next steps.
- Failed score attempts trigger refund or rollback.

## Module 4: Speaking practice
### Requirements
- Show Speaking prompts by part.
- Allow record or upload audio.
- Process transcription before scoring.
- Provide speaking-specific report.

### Acceptance criteria
- User can complete a full speaking attempt.
- Audio is stored and transcribed.
- Report includes fluency, pronunciation, lexical, and grammar-oriented feedback.
- System handles transcription or scoring failure safely.

## Module 5: Reading practice
### Requirements
- Provide reading sets with questions and answer keys.
- Score immediately after submission.
- Use these as low-cost engagement and reward loops.

### Acceptance criteria
- User can complete a Reading set end to end.
- Score is instant.
- User can earn small bonus credits from validated completion.

## Module 6: Listening practice
### Requirements
- Provide listening tasks with media and questions.
- Score immediately with answer keys.
- Tie completions to daily quests.

### Acceptance criteria
- User can play media, answer questions, and receive results.
- Completion can trigger quest rewards when eligible.

## Module 7: Reports and improvement plans
### Requirements
- Every scored submission creates a report object.
- Reports show overall score, criterion detail, evidence-based explanation, strengths, weaknesses, and recommendations.
- Reports generate follow-up tasks.

### Acceptance criteria
- User can reopen old reports.
- User can compare current vs previous reports.
- Recommendations can be turned into personal tasks.

## Module 8: Dashboard and progress
### Requirements
- Show skill activity, latest reports, streak, XP, badges, quests, and credit balance.
- Show learning trend and weak areas.

### Acceptance criteria
- Dashboard loads key stats for user.
- Weakest skill and next recommended action are visible above the fold.

## Module 9: Gamification system
### Objective
Create motivation loops that increase consistency and engagement while limiting abuse and preserving learning quality. Gamification research in education and language learning suggests that points, streaks, quests, and rewards can improve engagement, but systems should reinforce meaningful study behavior rather than shallow interaction.[11][13][14][15][16][10]

### Gamification layers
- XP for broad study activity.
- Credits for premium AI scoring and selected premium actions.
- Daily quests.
- Weekly challenges.
- Streaks.
- Badges.
- Milestones.
- Leaderboard optional, later.

### Currency design
#### XP
- Earned from most learning actions.
- Used for levels, progression visuals, and badges.
- No direct cash value.

#### Credits
- Used for Writing and Speaking AI scoring.
- Earned from plan grants, top-ups, and selected gamified tasks.
- Must be capped to protect cost.

### Credit-earning task design
Use low-cost, high-learning-value actions to award extra credits. This aligns with the need to keep expensive AI-evaluation actions bounded while still making the platform feel generous and motivating.[12][14][16][10]

#### Daily tasks
- Complete one Reading mini-set.
- Complete one Listening mini-set.
- Review one old report.
- Finish one grammar or vocabulary drill.
- Follow today's study suggestion.

#### Weekly tasks
- Study 5 days in one week.
- Complete two speaking practices.
- Revise two writing attempts.
- Improve one weak criterion from last report.

#### Milestones
- First Writing submission.
- First Speaking submission.
- 7-day streak.
- 30-day streak.
- First full mock test.

### Reward examples
- Daily tasks: 1–3 credits each.
- Weekly tasks: 5–15 credits each.
- Milestones: 5–25 credits each.
- Daily earn cap and weekly earn cap required.

### Anti-abuse rules
- Reward validated completions only.
- Require minimum effort/time thresholds on some tasks.
- Limit repeat rewards for identical content.
- Add daily/weekly earning caps.
- Flag suspicious referral or farming behavior.
- Separate XP farming from premium credit earning.

### Acceptance criteria
- User sees quests and rewards clearly.
- System can enforce reward caps.
- Credit earning cannot exceed configured limits.
- Admin can change reward values without redeploying.

## Module 10: Mascot and UI delight system
### Objective
Build attention and emotional continuity through a mascot, micro-animations, and light sound design without reducing trust. Mascot-centered UX patterns can strengthen recognition and emotional connection when the character acts as a guide or cheerleader rather than a gimmick. Audio cues in educational products can also support engagement when used intentionally and sparingly.[17][18][19][20][21][22][23][24]

### Mascot role
- Friendly coach.
- Encouragement before practice.
- Motivation after completion.
- Light nudges in dashboard and onboarding.
- Celebration in milestone moments.

### Mascot design rules
- Must feel credible for both students and adults.
- Use simple shapes and strong readability in small sizes.
- Have 6–8 reusable emotional states.
- Should never mock low performance.

### Suggested mascot moments
- Onboarding greeting.
- Quest completion celebration.
- Streak reminder.
- Report summary encouragement.
- Empty state guidance.

### Sound design rules
- Sound must be optional and user-controlled.
- No background music in testing flows.
- Use short UI sounds only for key moments.
- Silent exam mode should suppress non-essential effects.

### Suggested sound events
- Tap confirm.
- Success complete.
- Streak milestone.
- Record start/stop.
- Reward unlock.

### Acceptance criteria
- User can disable sound.
- Sound never interrupts exam-like flow.
- Mascot appears only in purposeful contexts.

## Module 11: Plans, pricing, and wallet
### Pricing strategy
Because AI scoring is the main cost center, pricing should be based on bounded premium actions rather than broad unlimited use. Market examples show monthly plans, mock-test packages, and AI evaluation access patterns that support a hybrid subscription-plus-credit model.[9][1][2][4]

### Recommended plan structure
| Plan | Description | Included value |
|---|---|---|
| Free | Trial and activation | Limited Writing/Speaking scores, quest system, Reading/Listening practice [1][4] |
| Starter | Light learner subscription | Monthly credits + progress tools [9][2] |
| Pro | Main paid plan | Higher monthly credits, richer reports, priority scoring [2][4] |
| Top-up | Add-on | Extra credits for heavy users [1][9] |

### Wallet rules
- Reserve credits before scoring.
- Consume after success.
- Refund automatically on system failure.
- Display credit price before each premium action.
- Expire bonus credits if needed after configured window.

### Acceptance criteria
- User sees transparent credit rules.
- Billing state is synchronized correctly.
- Credits cannot go below zero.

## Module 12: Notifications
### Requirements
- Email or in-app reminders for streaks and unfinished tasks.
- Report-ready notifications.
- Friendly mascot-based copy for engagement.

### Acceptance criteria
- User can control notification preferences.
- Time-sensitive practice reminders respect timezone.

## Module 13: Admin console
### Requirements
- Manage questions and content.
- Manage prompt packs and rubric versions.
- View usage, AI costs, failures, and refunds.
- Configure quests and reward values.
- Manage plans and prices.

### Acceptance criteria
- Admin can inspect score job states.
- Admin can retry failed jobs.
- Admin can edit active reward rules.

## Non-functional requirements
### Performance
- Dashboard should load quickly on common connections.
- Report pages should render efficiently on mobile and desktop.
- Async scoring latency should be visible via progress state.

### Reliability
- Queue-based scoring pipeline with retry logic.
- Idempotent wallet settlement.
- Fallback behavior for provider failures.

### Security
- Secure auth and session handling.
- Signed audio uploads.
- Rate limits on submissions.
- Audit logs for admin changes.

### Accessibility
- Keyboard-accessible dashboard and tasks.
- Readable contrast.
- Captions/transcript visibility for speaking review.
- Sound off option.

### Compliance and trust
- Clear disclaimer that AI scores are estimated practice scores.
- Privacy-safe handling of audio uploads and transcripts.
- Explain data retention policy.

## UX and IA
### Product areas
- Marketing/landing page.
- Auth/onboarding.
- Learner dashboard.
- Practice hub.
- Writing module.
- Speaking module.
- Reading module.
- Listening module.
- Reports center.
- Rewards/quests center.
- Billing/wallet.
- Admin console.

### Core navigation
- Dashboard
- Practice
- Reports
- Rewards
- Pricing
- Profile

### Tone
- Encouraging
- Clear
- Slightly playful
- Not childish
- Exam-prep credible

## Key user flows
### Flow 1: New learner activation
1. Register.
2. Complete onboarding.
3. Receive starter credits.
4. See recommended first practice.
5. Complete first Writing or Speaking attempt.
6. Receive report.
7. Get first quest reward.

### Flow 2: Daily return loop
1. Open dashboard.
2. See streak, quests, and next action.
3. Complete low-cost practice.
4. Earn XP and maybe credits.
5. Spend credits on a premium AI score.
6. Review feedback and next tasks.

### Flow 3: Credit-aware premium usage
1. User selects Writing score.
2. System shows credit cost.
3. User confirms.
4. Credits reserved.
5. Job processed.
6. Report delivered.
7. Credits settled.

## Data and analytics events
Track at minimum:
- signup_completed
- onboarding_completed
- first_practice_started
- quest_completed
- streak_incremented
- writing_submitted
- speaking_submitted
- score_generated
- score_failed
- credits_reserved
- credits_consumed
- credits_refunded
- topup_purchased
- subscription_started
- report_opened
- improvement_task_completed

## Technical architecture requirements
The product should use a web frontend plus backend orchestration architecture because AI scoring, async jobs, wallet settlement, and provider abstraction require explicit backend workflow control.[25][4]

### Frontend
- Next.js app for learner experience and admin portal.

### Backend
- NestJS API for business logic and orchestration.
- Queue worker for transcription and scoring jobs.
- PostgreSQL for relational data.
- Redis for queue/caching.
- Object storage for audio.

### AI pipeline
- Submission intake.
- Credit reservation.
- Transcription for audio.
- Scoring by rubric.
- Report normalization.
- Recommendation generation.
- Cost logging.
- Notification dispatch.

## Data model requirements
Core entities should include:
- users
- plans
- subscriptions
- wallets and ledger
- skills
- question sets and questions
- sessions and submissions
- scoring jobs
- rubric versions
- score reports and criterion rows
- improvement tasks
- prompt packs
- ai usage logs
- audit logs

## AI scoring requirements
### Writing criteria
- task response
- coherence and cohesion
- lexical resource
- grammatical range and accuracy

### Speaking criteria
- fluency and coherence
- lexical resource
- grammatical range and accuracy
- pronunciation

### Output requirements
Every report should include:
- overall estimated score
- criterion breakdown
- explanation
- strengths
- weaknesses
- improvement tasks
- confidence or internal quality marker

### Guardrails
- Validate schema.
- Clamp score range.
- Reject contradictory or malformed outputs.
- Mark score as estimate only.

## Content strategy
### Initial content needs
- Writing prompts for common task types.
- Speaking prompts by IELTS speaking parts.
- Reading and Listening mini-practice content for quest loops.
- Grammar and vocabulary micro-drills.

### Content standards
- Clear instructions.
- Skill tagging.
- Difficulty tagging.
- Time estimate.
- Quality review before publication.

## Monetization model
### Revenue sources
- Monthly subscriptions.
- Credit top-ups.
- Future tutor review add-ons.
- Possible B2B packages later.

### Economic guardrails
- Bonus credit caps.
- Fair use controls.
- Cost reporting per user and per plan.
- Provider fallback strategy.
- Admin review for abuse patterns.

## Risks and mitigations
### Risk: AI cost overruns
Mitigation: reserve/consume/refund wallet model, capped earned credits, top-ups, plan limits.[1][2][4]

### Risk: Low trust in score quality
Mitigation: transparent “estimated score” language, strong explanations, prompt tuning, future calibration set.[3][4]

### Risk: Gamification becomes shallow
Mitigation: reward real study actions, cap farming, emphasize progress over speed.[15][16]

### Risk: Mascot or sounds feel childish
Mitigation: use coach persona, minimalist expressions, optional sound, calm exam mode.[22][23][17]

### Risk: Too broad a first release
Mitigation: ship Writing and Speaking first, add Reading/Listening for retention later[2][4][1]

Sources
[1] Pricing — AIELTS | AI-Powered IELTS Preparation - EduZMS https://aielts.eduzms.com/pricing.php
[2] IELTS Pricing - PrepEx https://prepex.ai/ielts/pricing
[3] AI IELTS Coach — Essay Scoring on All 4 Criteria in Seconds (2026) https://www.ielts.international
[4] Speechful - Your IELTS AI grader and English tutor https://speechful.ai
[5] What is Online IELTS Platform? Uses, How It Works & Top ... - LinkedIn https://www.linkedin.com/pulse/what-online-ielts-platform-uses-how-works-top-companies-wtewf
[6] IELTS Learning Management System|LMS for IELTS Training https://ekhool.com/blogs/lms-for-ielts-training
[7] AI-Powered IELTS Practice Tests - TestGlider https://www.testglider.com/ielts/en
[8] IELTS Preparation Online - Kaplan International https://www.kaplaninternational.com/language-courses/english/online-courses/exam-prep/ielts
[9] IELTS Mock Test Pricing - Affordable Plans - BAND9AI https://band9ai.com/pricing
[10] How Gamification Makes Learning a New Language Faster and ... https://www.polychatapp.com/blog/gamification-in-language-learning
[11] Gamification for Learning: How to Boost Engagement with Points ... https://buddyboss.com/blog/gamification-for-learning-to-boost-engagement-with-points-badges-rewards/
[12] Can gamification in ed-tech improve language retention? - Sanako https://sanako.com/can-gamification-in-ed-tech-improve-language-retention
[13] Gamification in Language Learning: Making Education Fun and ... https://www.smartico.ai/blog-post/gamification-in-language-learning
[14] Gamification in apps: A complete guide to using motivation to drive ... https://www.revenuecat.com/blog/growth/gamification-in-apps-complete-guide/
[15] Does gamification increase engagement with online programs? A ... https://pmc.ncbi.nlm.nih.gov/articles/PMC5376078/
[16] EJ1345470 - Do Points Matter? The Effects of Gamification Activities ... https://eric.ed.gov/?id=EJ1345470
[17] Duo - Duolingo Brand Guidelines https://design.duolingo.com/writing/duo
[18] Why mascots (like Duo) are powerful pieces of UX | by Daley Wilhelm https://uxdesign.cc/why-mascots-like-duo-are-powerful-pieces-of-ux-e378f4da327f
[19] Creating Our Duolingo Characters • Greg Hartman • Duocon 2020 https://www.youtube.com/watch?v=m-3-D7S0piw
[20] The Evolution Of Duolingo'S Logo And Mascot Branding https://londonlogodesigns.co.uk/blog/the-evolution-of-duolingos-logo-and-mascot-branding/
[21] Duolingo: Gamification for Retention - Tear Them Down - Substack https://tearthemdown.substack.com/p/duolingo-gamified-retention
[22] ERIC - EJ1308957 - Students' Engagement in E-Learning Applications https://eric.ed.gov/?id=EJ1308957
[23] Integrating Audio into Educational Apps: Enhancing Learning Outcomes - DLE https://digitallearningedge.com/integrating-audio-into-educational-apps/
[24] How You Can Start Using Audio To Engage Your Learners https://elearningindustry.com/how-you-can-start-using-audio-to-engage-your-learners
[25] AI-Assisted Essay Scoring and Feedback | Learnosity https://learnosity.com/ai-assisted-scoring-feedback/
