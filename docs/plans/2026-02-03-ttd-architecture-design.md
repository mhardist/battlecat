# TTD Architecture — Task + Test Driven Development

**Feature:** Text-to-Speech Audio for Tutorials (LISTEN-TO-PRD.md)
**Product:** Battlecat AI (battlecat.ai)
**Date:** February 3, 2026

---

## 1. Overview

TTD (Task + Test Driven Development) is an autonomous build pipeline orchestrated through Claude Code's native Task primitives (`TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`). The developer initiates a single command, walks away, and Claude works through the entire PRD unattended — building, testing, verifying, and fixing as needed.

### Core Principles

1. **Task-Driven** — Every unit of work is a Claude Code Task with explicit dependencies (`addBlockedBy`). Claude cannot skip ahead or work out of order.
2. **Test-First** — Each implementation task follows red-green-refactor. Tests are written before code. Tasks only complete when tests pass.
3. **Self-Healing** — Failed tests trigger automatic diagnosis and fix cycles. No human intervention unless the fix budget is exhausted.
4. **Layer-Parallel** — Independent layers (backend utilities, frontend components, dev tooling) run concurrently via subagents. Sequential where files overlap.
5. **Chrome-Verified** — Final gate is visual/functional verification in the browser using Claude's Chrome capabilities, not just unit tests.
6. **Learnings-Captured** — Every Chrome-caught bug is documented in `LISTEN-TO-LEARNINGS.md` following the established learnings pattern.

### AFK Workflow

```
Developer runs: "Execute the TTD pipeline for LISTEN-TO-PRD.md"
    |
    v
Claude autonomously:
  1. Creates all tasks with dependency chains
  2. Works through phases (setup → utilities → integration → wiring)
  3. Each task: write test (red) → implement (green) → refactor
  4. Runs full build gate (vitest + tsc + next build)
  5. Starts dev server, runs Chrome verification (BV-1 through BV-9)
  6. Fixes any Chrome failures (TDD loop), writes learnings
  7. Final verify → ready for PR
    |
    v
Developer returns to green build + verified feature
```

---

## 2. Pipeline Overview

```
Developer initiates
        |
   Phase 0: Setup (vitest, types, DB migration)
        |
   Phase 1: Core utilities (parallel, TDD)
     +-- sanitizeScriptText
     +-- chunkText
     +-- generateAudioScript
        |
   Phase 2: Integration layer (parallel, TDD)
     +-- generateTutorialAudio full module
     +-- Dev audio route + withDevAudio
     +-- ListenButton component
        |
   Phase 3: Wiring (sequential)
     +-- Pipeline integration (process-submission.ts)
     +-- Frontend wiring (TutorialCard, TutorialActions, detail page)
     +-- Environment + full build verify
        |
   Phase 4: Full test suite gate
        |
   Phase 5: Chrome verification (BV-1 through BV-9)
        |
   Phase 6: Fix loop (conditional, if Chrome finds issues)
        |
   Done -- ready for PR
```

---

## 3. Phase 0 — Setup Foundation

No TDD cycle. Pure infrastructure that all other tasks depend on.

### Task 0.1: Vitest Setup

**What:** Install vitest, create `vitest.config.ts` with `@/` path alias mapping to `./src`, add `"test"` script to `package.json`.

**Completion criteria:** `npx vitest run` executes without config errors (even with zero tests).

**Blocks:** All Phase 1 tasks.

**Self-healing:** If vitest config fails (path alias wrong, missing dependency), read the error, fix the config, retry.

### Task 0.2: Types + Schema + Migration

**Blocked by:** 0.1

**What:**
- Add `audio_url: string | null` to `Tutorial` interface in `src/types/index.ts`
- Add `audio_url text` column to tutorials table in `src/db/schema.sql`
- Create migration file `src/db/migrations/001_add_audio_url.sql` with `ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;`

**Completion criteria:** TypeScript compiles with the new field. Migration file exists.

**Blocks:** Phase 2.3 (ListenButton needs the Tutorial type).

### Task 0.3: Seed Data Prep

**Blocked by:** 0.1

**What:** Add `audio_url: null` to all 10 seed tutorial objects in `src/data/seed-tutorials.ts`.

**Completion criteria:** Seed data compiles with `audio_url` field present on all entries.

**Blocks:** Phase 2.2 (dev audio system).

### Phase 0 Dependency Graph

```
0.1 Vitest ---> 0.2 Types/Schema (parallel)
             |-> 0.3 Seed data    (parallel)
```

---

## 4. Phase 1 — Core Utilities (TDD, Parallel)

Pure functions with no external dependencies. Ideal TDD candidates — pure input/output, easily testable, no API calls. All three tasks run in parallel via subagents.

### Task 1.1: `sanitizeScriptText`

**Blocked by:** 0.1

**PRD requirements:** SAN-1 through SAN-8

**TDD cycle:**

```
RED:   Write tests in src/lib/__tests__/generate-audio.test.ts
       - SAN-1: URLs removed entirely
       - SAN-2: Code blocks removed (fenced and inline)
       - SAN-3: Image references removed
       - SAN-4: Markdown table markup removed
       - SAN-5: Repeated whitespace collapsed, line breaks normalized
       - SAN-6: HTML entities decoded (&amp; -> &, &lt; -> <, etc.)
       - SAN-7: Inline HTML tags stripped
       - SAN-8: Horizontal rules removed
GREEN: Implement sanitizeScriptText() in src/lib/generate-audio.ts
REFACTOR: Clean up regex patterns, consolidate where possible
```

**Completion criteria:** All SAN-* tests pass.

### Task 1.2: `chunkText`

**Blocked by:** 0.1

**PRD requirements:** AUD-2, AUD-3

**TDD cycle:**

```
RED:   Write tests in src/lib/__tests__/generate-audio.test.ts
       - Splits at sentence boundaries (". ", "! ", "? ", ".\n") under 1900 chars
       - Handles single sentence >1900 chars (word boundary fallback)
       - Handles empty string input (returns empty array)
       - Handles text exactly at 1900 char boundary
       - Multiple sentences that fit in one chunk stay together
GREEN: Implement chunkText() in src/lib/generate-audio.ts
REFACTOR: Edge case review
```

**Completion criteria:** All chunk tests pass.

### Task 1.3: `generateAudioScript` (mocked)

**Blocked by:** 0.1

**PRD requirements:** AUD-1, AUD-1b

**TDD cycle:**

```
RED:   Write tests with mocked Claude API
       - Returns non-empty script from tutorial body
       - Returns null on API failure (AUD-1b)
       - Returns null on timeout
       - Output contains no code syntax (backticks, braces)
       - Output is clean prose paragraphs
GREEN: Implement generateAudioScript() with Claude Sonnet call
       - Prompt: rewrite for spoken delivery
       - Describe code in plain language (never read syntax)
       - Remove visual references
       - Convert tables to natural language
       - Remove code-only instructional steps
       - Preserve educational content
REFACTOR: Prompt tuning for output quality
```

**Completion criteria:** All mocked AI tests pass. Function handles errors without throwing.

### Phase 1 Dependency Graph

```
0.1 ---> 1.1 sanitize   (parallel via subagent)
     |-> 1.2 chunk       (parallel via subagent)
     |-> 1.3 aiScript    (parallel via subagent)
```

---

## 5. Phase 2 — Integration Layer (TDD, Parallel)

Assembles Phase 1 utilities into complete modules and builds the frontend component. Three parallel workstreams touching different files.

### Task 2.1: `generateTutorialAudio` Full Module

**Blocked by:** 1.1, 1.2, 1.3

**PRD requirements:** AUD-4 through AUD-12, PIP-4

**TDD cycle:**

```
RED:   Write integration tests (mocked Deepgram SDK + Supabase Storage)
       - AUD-4: Calls Deepgram Aura-2 with correct config (model, encoding, sample rate)
       - AUD-5: Concatenates MP3 buffers from all chunks
       - AUD-5b: Strips MP3 headers/ID3 tags from chunks 2+
       - AUD-6: Uploads to tutorials/{slug}-{timestamp}.mp3
       - AUD-7: Returns public audio URL string
       - AUD-8: Returns null on any failure (never throws)
       - AUD-9: Logs errors with [audio] prefix
       - AUD-10: Skips when AUDIO_ENABLED !== "true", logs skip message
       - AUD-11: Logs structured outcome on success (slug, chunks, bytes, ms)
       - AUD-12: Skips when script <50 chars after sanitization
       - PIP-4: 20-second timeout via Promise.race
GREEN: Wire up: generateAudioScript -> sanitizeScriptText -> chunkText
       -> Deepgram TTS per chunk -> strip headers -> concat
       -> upload to Supabase Storage -> return URL
REFACTOR: Error handling paths, logging consistency
```

**Completion criteria:** All integration tests pass with mocked external services.

### Task 2.2: Dev Audio System

**Blocked by:** 0.3

**PRD requirements:** DEV-1 through DEV-5

**TDD cycle:**

```
RED:   Write tests for withDevAudio() helper
       - Injects audio_url as "/api/tts/{slug}" on seed tutorials in dev
       - No-op in production (audio_url remains null)
       - Handles tutorials with existing non-null audio_url (no override)
       Write tests for /api/tts/[slug] route handler
       - Returns MP3 buffer with Content-Type: audio/mpeg in dev
       - Returns 404 when NODE_ENV === "production"
       - Returns 404 for nonexistent slug
GREEN: Implement withDevAudio() in src/data/seed-tutorials.ts
       Implement route at src/app/api/tts/[slug]/route.ts
       Wire withDevAudio() into data layer functions in src/data/tutorials.ts
REFACTOR: Consolidate dev environment guards
```

**Completion criteria:** Dev audio tests pass. Seed tutorials show audio URLs in test environment.

### Task 2.3: ListenButton Component

**Blocked by:** 0.2

**PRD requirements:** FE-1 through FE-18

**TDD cycle:**

```
RED:   Write component tests
       - FE-1: icon variant renders compact speaker icon
       - FE-2: bar variant renders icon + text label
       - FE-5: Returns null when audioUrl is falsy (null, undefined, empty)
       - FE-6: Dispatches "battlecat-audio-play" custom window event on play
       - FE-7: Renders hidden <audio> element in DOM (not programmatic new Audio())
       - FE-8: Error event on <audio> resets playing state
       - FE-9: onClick has preventDefault + stopPropagation for icon variant
       - FE-10: Cleanup on unmount — pause audio, remove event listeners
       - FE-11: MediaSession API handlers for play, pause, stop
       - FE-12: MediaSession metadata (title, artist: "Battlecat AI", artwork)
       - FE-13: MediaSession playbackState updates on play/pause/end
       - FE-14: Dynamic aria-label ("Play tutorial audio" / "Pause tutorial audio")
       - FE-15: aria-pressed reflects current play state
       - FE-16: Keyboard Enter/Space triggers play/pause
       - FE-17: Error state shows "Audio unavailable" text, resets after 3s
       - FE-18: Loading state (idle -> loading -> playing) with pulse animation
GREEN: Build ListenButton.tsx as "use client" component
       - icon variant: compact, sized to match bookmark icon
       - bar variant: icon + label, styled to match Bookmark/Complete buttons
       - Hidden <audio> element rendered in JSX
       - Single-player via custom event listener
       - Full a11y: aria-label, aria-pressed, keyboard support
       - MediaSession integration for lock screen controls
       - Three visual states: idle, loading (pulse), playing
       - Error state with 3-second auto-reset
REFACTOR: Extract shared play/pause logic if icon and bar have duplication
```

**Completion criteria:** All component tests pass. Component renders correctly in both variants.

### Phase 2 Dependency Graph

```
1.1 + 1.2 + 1.3 ---> 2.1 generateTutorialAudio
0.3 ----------------> 2.2 Dev audio system
0.2 ----------------> 2.3 ListenButton component
```

All three run in parallel — they touch entirely different files.

---

## 6. Phase 3 — Wiring (Sequential)

Connects modules together. Sequential because these tasks modify overlapping files and the data flows between them.

### Task 3.1: Pipeline Integration

**Blocked by:** 2.1

**PRD requirements:** PIP-1 through PIP-5

**TDD cycle:**

```
RED:   Write test for processSubmission audio integration
       - PIP-1: Audio and image run in parallel via Promise.all
       - PIP-2: Audio failure does not block publishing
       - PIP-3: Audio always regenerated on merge
       - PIP-5: Logs total processSubmission elapsed time
       - audio_url stored on tutorial record after generation
GREEN: Modify src/lib/process-submission.ts
       - Import generateTutorialAudio
       - Add to Promise.all alongside generateImage (step 8 + 8c)
       - Store returned audio_url on tutorial upsert
       - Add timing log: [process] processSubmission completed in {ms}ms
REFACTOR: Verify error isolation — image failure doesn't affect audio and vice versa
```

**Completion criteria:** Pipeline tests pass. Audio generation wired in parallel with image generation.

### Task 3.2: Frontend Wiring

**Blocked by:** 2.3, 3.1

**PRD requirements:** FE-3, FE-4

**TDD cycle:**

```
RED:   Write integration tests
       - TutorialCard shows ListenButton icon when audio_url is truthy
       - TutorialCard hides ListenButton when audio_url is null
       - TutorialActions renders ListenButton bar when audioUrl prop is truthy
       - TutorialActions hides ListenButton when audioUrl is falsy
       - Tutorial detail page passes audioUrl to TutorialActions
GREEN: Modify src/components/TutorialCard.tsx
       - Import ListenButton
       - Add icon variant below bookmark, guarded by audio_url check
       Modify src/components/TutorialActions.tsx
       - Add audioUrl prop
       - Add ListenButton bar variant between Bookmark and Mark Complete
       Modify src/app/tutorials/[slug]/page.tsx
       - Pass tutorial.audio_url as audioUrl prop to TutorialActions
REFACTOR: Verify no visual regression on tutorials without audio (null audio_url)
```

**Completion criteria:** Frontend tests pass. ListenButton appears in correct locations only when audio exists.

### Task 3.3: Environment + Full Build Verify

**Blocked by:** 3.2

**No TDD — pure verification task.**

```
1. Add AUDIO_ENABLED to .env.example with comment
2. Add TOGETHER_API_KEY to .env.example (existing gap noted in PRD)
3. Run: npx tsc --noEmit (zero TypeScript errors)
4. Run: npx vitest run (all tests pass)
5. Run: npm run build (Next.js production build succeeds)
6. If any step fails: diagnose, fix, retry (max 5 attempts)
```

**Completion criteria:** All three commands pass cleanly.

### Phase 3 Dependency Graph

```
2.1 ---> 3.1 Pipeline ---> 3.2 Frontend wiring ---> 3.3 Env + build verify
2.3 ----------------------> 3.2
```

---

## 7. Phase 4 — Full Test Suite Gate

Single task. The integration checkpoint before visual verification.

### Task 4.1: Full Test Suite + Build

**Blocked by:** 3.3

```
1. npx vitest run           — all tests must pass
2. npx tsc --noEmit         — zero TypeScript errors
3. npm run build            — Next.js production build succeeds
4. If ANY step fails:
   a. Read the error output
   b. Diagnose root cause
   c. Fix the code
   d. Re-run the failing step
   e. Repeat until green (max 5 attempts per failure)
5. Only mark task complete when all three pass cleanly
```

**Why this exists separately from 3.3:** Task 3.3 verifies after wiring changes. Task 4.1 is a clean-room re-run to catch any state that leaked between tasks — test interactions, import side effects, build cache issues.

**Self-healing budget:** Up to 5 fix-retry cycles per failing command. If still failing after 5 attempts, log what's broken and stop. This is the one case where human intervention may be needed.

**Completion criteria:** All three commands pass in a single clean run.

---

## 8. Phase 5 — Chrome Verification

Claude uses its Chrome browser to visually and functionally verify the feature on the running dev server. This replaces manual QA.

### Task 5.1: Start Dev Server

**Blocked by:** 4.1

```
1. Run npm run dev in background
2. Wait for "Ready" or "compiled" message
3. Verify localhost:3000 responds with 200
```

**Completion criteria:** Dev server is running and responsive.

### Task 5.2: Chrome Verification Script

**Blocked by:** 5.1

Execute BV-1 through BV-9 from the PRD verbatim:

| Step | Page | Verify |
|------|------|--------|
| BV-1 | `/browse` | Each seed tutorial card shows a listen icon below the bookmark icon |
| BV-2 | `/browse` | Click a listen icon -> icon changes to pause state, audio plays |
| BV-3 | `/browse` | Click a different card's listen icon -> first audio stops, second plays |
| BV-4 | `/tutorials/{any-seed-slug}` | Listen bar appears between Bookmark and Mark Complete buttons |
| BV-5 | `/tutorials/{any-seed-slug}` | Click listen bar -> audio plays. Click again -> audio pauses |
| BV-6 | `/search` (search for "prompt") | Listen icon on search result cards |
| BV-7 | `/bookmarks` (after bookmarking a seed tutorial) | Listen icon on bookmarked cards |
| BV-8 | `/level-up` | Listen icon on recommended tutorial cards |
| BV-9 | Start audio on `/browse`, navigate to `/tutorials/{slug}` | Audio stops on navigation |

**For each step:**

```
1. Navigate to the page in Chrome
2. Inspect DOM / take screenshot
3. Verify the expected element exists and behaves correctly
4. Log PASS or FAIL with details
5. If FAIL -> record failure for Phase 6
```

**Completion criteria:** All 9 verification steps executed. Results logged with PASS/FAIL status.

---

## 9. Phase 6 — Fix Loop + Learnings (Conditional)

Activates only if Phase 5 finds failures. Self-healing cycle with learnings capture.

### Task 6.1: Fix Failing BV Steps (TDD)

**Blocked by:** 5.2 (only created if failures exist)

For each Chrome verification failure:

```
1. Read the failure detail (e.g., "BV-3: first audio did not stop")
2. Map failure to PRD requirement (e.g., FE-6: battlecat-audio-play event)
3. Read the relevant source file
4. Diagnose the root cause
5. Write a test that reproduces the failure (RED)
6. Fix the code (GREEN)
7. Run npx vitest run (verify no regressions)
8. Re-run the specific Chrome verification step
9. If still failing -> repeat (max 3 attempts per issue)
10. Mark fixed or escalate to human
```

**Key principle:** Every Chrome-caught bug gets a test added. The test suite grows with real-world failures, preventing regressions.

### Task 6.2: Write LISTEN-TO-LEARNINGS.md

**Blocked by:** 6.1

Create `LISTEN-TO-LEARNINGS.md` in the project root. Each Chrome-caught failure that required a code fix gets a numbered entry following the pattern from `LEARNINGS.md`:

```markdown
# Learnings — Listen to Tutorial (TTS Feature)

Technical lessons learned during TTD implementation of the Text-to-Speech
audio feature. These are real issues caught during Chrome verification,
not hypothetical concerns.

---

## 1. <Short Problem Title>

**Problem:** What was observed in Chrome verification (which BV step,
what was expected vs actual behavior).

**Impact:** What user experience was broken or degraded.

**Fix:** What code change resolved it (file, function, what changed).

**Lesson:** The generalizable takeaway for future development.

---
```

**If zero Chrome failures occurred:** Create the file with the header and a note:

```markdown
# Learnings — Listen to Tutorial (TTS Feature)

No issues found during Chrome verification. All BV-1 through BV-9 steps
passed on first attempt.
```

### Task 6.3: Final Full Verify

**Blocked by:** 6.2

```
1. Run npx vitest run — all tests pass (including new regression tests)
2. Run npm run build — production build succeeds
3. Run full Chrome verification (BV-1 through BV-9) one final time
4. If all green -> stop dev server -> mark pipeline COMPLETE
5. Ready for PR
```

**Completion criteria:** All tests pass, build succeeds, all 9 Chrome verification steps pass.

---

## 10. Complete Task Dependency Graph

```
PHASE 0 — Setup
  0.1 Vitest setup
  0.2 Types + Schema + Migration          blocked by: 0.1
  0.3 Seed data audio_url: null           blocked by: 0.1

PHASE 1 — Core Utilities (TDD, parallel)
  1.1 sanitizeScriptText                  blocked by: 0.1
  1.2 chunkText                           blocked by: 0.1
  1.3 generateAudioScript                 blocked by: 0.1

PHASE 2 — Integration Layer (TDD, parallel)
  2.1 generateTutorialAudio module        blocked by: 1.1, 1.2, 1.3
  2.2 Dev audio system                    blocked by: 0.3
  2.3 ListenButton component              blocked by: 0.2

PHASE 3 — Wiring (sequential)
  3.1 Pipeline integration                blocked by: 2.1
  3.2 Frontend wiring                     blocked by: 2.3, 3.1
  3.3 Environment + full build verify     blocked by: 3.2

PHASE 4 — Gate
  4.1 Full test suite + build             blocked by: 3.3

PHASE 5 — Chrome Verification
  5.1 Start dev server                    blocked by: 4.1
  5.2 Run BV-1 through BV-9              blocked by: 5.1

PHASE 6 — Fix Loop (conditional)
  6.1 Fix failing BV steps (TDD)          blocked by: 5.2 (if failures)
  6.2 Write LISTEN-TO-LEARNINGS.md        blocked by: 6.1
  6.3 Final full verify                   blocked by: 6.2
```

### Parallelism Map

```
Time --->

|  0.1  |
         |  0.2  |  0.3  |                          (parallel)
         |  1.1  |  1.2  |  1.3  |                  (parallel via subagents)
                                   |  2.1  |         \
                  |  2.2  |                           | (parallel, 2.2/2.3
                           |  2.3  |                 /  start earlier)
                                            | 3.1 |
                                                    | 3.2 |
                                                           | 3.3 |
                                                                  | 4.1 |
                                                                         | 5.1 | 5.2 |
                                                                                       | 6.x |
```

### Statistics

- **Total tasks:** 17 (+3 conditional in Phase 6)
- **TDD tasks:** 10 of 17 follow red-green-refactor
- **Max concurrency:** 5 tasks (1.1 + 1.2 + 1.3 can overlap with 2.2 + 2.3)
- **Self-healing points:** Phase 1-3 (test failures), Phase 4 (build gate), Phase 6 (Chrome fixes)
- **Self-healing budget:** 5 retries per build failure, 3 retries per Chrome failure
- **Human intervention:** Only if self-healing budget exhausted

---

## 11. Files Created/Modified Summary

### New Files

| File | Created by Task |
|------|----------------|
| `vitest.config.ts` | 0.1 |
| `src/db/migrations/001_add_audio_url.sql` | 0.2 |
| `src/lib/__tests__/generate-audio.test.ts` | 1.1, 1.2, 1.3, 2.1 |
| `src/lib/generate-audio.ts` | 1.1, 1.2, 1.3, 2.1 |
| `src/components/ListenButton.tsx` | 2.3 |
| `src/app/api/tts/[slug]/route.ts` | 2.2 |
| `LISTEN-TO-LEARNINGS.md` | 6.2 |

### Modified Files

| File | Modified by Task |
|------|-----------------|
| `package.json` | 0.1 (vitest + test script) |
| `src/types/index.ts` | 0.2 (audio_url field) |
| `src/db/schema.sql` | 0.2 (audio_url column) |
| `src/data/seed-tutorials.ts` | 0.3 (audio_url: null), 2.2 (withDevAudio) |
| `src/data/tutorials.ts` | 2.2 (wire withDevAudio) |
| `src/lib/process-submission.ts` | 3.1 (parallel audio gen) |
| `src/components/TutorialCard.tsx` | 3.2 (ListenButton icon) |
| `src/components/TutorialActions.tsx` | 3.2 (audioUrl prop + ListenButton bar) |
| `src/app/tutorials/[slug]/page.tsx` | 3.2 (pass audioUrl prop) |
| `.env.example` | 3.3 (AUDIO_ENABLED, TOGETHER_API_KEY) |

---

## 12. Execution Command

To start the TTD pipeline:

```
Execute the TTD pipeline for LISTEN-TO-PRD.md using the architecture
defined in docs/plans/2026-02-03-ttd-architecture-design.md.

Create all tasks with dependencies using TaskCreate and addBlockedBy.
Work through each phase autonomously. Each TDD task: write test (red),
implement (green), refactor. Self-heal on failures. Run Chrome
verification as final gate. Write LISTEN-TO-LEARNINGS.md for any
Chrome-caught bugs. Stop when all phases complete or self-healing
budget is exhausted.
```

---

## 13. PRD Cross-Reference

Every PRD requirement is covered by at least one task:

| PRD Section | Requirements | Task(s) |
|-------------|-------------|---------|
| 3.1 Audio Generation | AUD-1 through AUD-12 | 1.3, 2.1 |
| 3.2 Text Sanitization | SAN-1 through SAN-8 | 1.1 |
| 3.3 Pipeline Integration | PIP-1 through PIP-5 | 3.1 |
| 3.4 Database | DB-1 through DB-5 | 0.2 |
| 3.5 Storage | STO-1 through STO-4 | 2.1 |
| 3.6 Local Development | DEV-1 through DEV-5 | 2.2 |
| 3.7 Frontend | FE-1 through FE-18 | 2.3, 3.2 |
| 4 Non-Functional | NFR-1 through NFR-6 | 2.1, 3.3, 4.1 |
| 10.2 Automated Tests | AT-1 through AT-9 | 1.1, 1.2, 1.3 |
| 10.3 Browser Verification | BV-1 through BV-9 | 5.2 |
