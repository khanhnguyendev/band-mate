---
id: 6s6566
title: 'Module 4: Speaking practice'
status: done
priority: high
labels:
  - speaking
  - mvp
  - ai-scoring
createdAt: '2026-05-01T07:35:24.935Z'
updatedAt: '2026-05-02T02:37:27.924Z'
timeSpent: 693
assignee: '@me'
---
# Module 4: Speaking practice

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Speaking prompts by part (1/2/3). Audio record or upload. Transcription before scoring. Speaking-specific report covering fluency, pronunciation, lexical, and grammar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User can complete a full speaking attempt via record or upload
- [x] #2 Audio is stored in Supabase Storage and transcribed before scoring
- [x] #3 Report covers fluency, pronunciation, lexical resource, and grammar
- [x] #4 Transcription or scoring failure is handled safely with credit refund
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prisma seed: add 3 speaking question sets (Part 1 / Part 2 / Part 3) + active PromptPack `pp-speaking-v1` with system prompt for 4 IELTS speaking criteria and template using {{task_type}}/{{prompt}}/{{transcript}} placeholders
2. SupabaseAdminService + TranscriptionService: injectable service wrapping `createClient(url, SERVICE_ROLE_KEY)` for worker storage access; TranscriptionService downloads audio blob from `audio-submissions` bucket and calls OpenAI Whisper (`openai` package) for transcript
3. Upload URL + submitSpeaking: `POST /v1/submissions/speaking/upload-url` returns Supabase Storage signed upload URL + audioKey; `SubmissionsService.submitSpeaking()` reserves 3 credits, creates Submission (skill=speaking, audioKey), enqueues `transcribe-audio` job
4. TranscribeAudioWorker: idempotent (skip if transcript already set); downloads audio → Whisper → updates submission.transcript → enqueues `score-speaking` job; onFailed (last attempt) → refund + mark failed
5. ScoreSpeakingWorker: loads speaking PromptPack, calls Claude with transcript, clamps bands, persists ScoreReport with 4 criteria (Fluency & Coherence, Pronunciation, Lexical Resource, Grammatical Range & Accuracy), consumes credits; onFailed → refund + mark failed
6. SpeakingModule wiring: register both workers, queues, TranscriptionService, SupabaseAdminService; add routes to SubmissionsController and SpeakingController
7. Web: `/speaking` question browser (cards by part) + `/speaking/[questionId]` SpeakingEditor component (MediaRecorder record button + file upload fallback; fetches upload URL, uploads directly to Supabase Storage, submits audioKey, polls status, redirects to /reports/:id); existing report page handles speaking reports
8. Tests: SubmissionsService.submitSpeaking spec (reserve→enqueue); TranscribeAudioWorker spec (happy path + failure/refund); ScoreSpeakingWorker spec (happy path + idempotency + failure/refund)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: seed (3 speaking question sets + pp-speaking-v1 PromptPack), TranscriptionService (OpenAI Whisper via openai pkg), TranscribeAudioWorker (idempotent, enqueues score-speaking), ScoreSpeakingWorker (4 criteria: Fluency&Coherence/Pronunciation/Lexical/Grammar), upload-url + submitSpeaking endpoints, SpeakingEditor (MediaRecorder + file upload, polling), /speaking browser page. 30/30 tests pass.
<!-- SECTION:NOTES:END -->

