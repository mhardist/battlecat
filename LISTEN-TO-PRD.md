# Product Requirements Document — Listen to Tutorial

**Feature:** Text-to-Speech Audio for Tutorials
**Product:** Battlecat AI (battlecat.ai)
**Version:** 1.1
**Date:** February 2, 2026

---

## 1. Product Overview

Add server-generated MP3 audio for new tutorials on Battlecat AI. During the content processing pipeline, the tutorial markdown body is stripped to clean plain text, sanitized for spoken output, and sent to Deepgram Aura-2 TTS to produce a persisted MP3 file. A "Listen" button appears wherever the bookmark button exists, allowing users to play the tutorial as audio directly in the browser.

### Core Value Proposition

Tutorials are 800-1500+ words. Not every user wants to read — some prefer to listen while commuting, exercising, or multitasking. Server-generated audio (vs. browser TTS) provides consistent, high-quality voice output across all devices and browsers, and the files are generated once and cached permanently.

---

## 2. User Stories

### Playback
- **As a reader, I can click a "Listen" button on any tutorial detail page** to hear the tutorial read aloud as audio.
- **As a reader, I can click a listen icon on tutorial cards** (browse, search, bookmarks, level-up) to play audio without opening the tutorial.
- **As a reader, when I play audio on one card and then click play on another,** the first stops automatically (single-player enforcement).
- **As a reader, if a tutorial has no audio yet,** the listen button does not appear (no broken/empty state).
- **As a reader browsing existing tutorials created before the audio feature,** I see no listen buttons — the UI is identical to what it was before the feature shipped.

### Pipeline
- **As a system, when a new tutorial is created via the processing pipeline,** an MP3 audio file is automatically generated and persisted.
- **As a system, when a tutorial is merged with new content,** the audio is always regenerated to match the updated body.
- **As a system**, if audio generation is disabled via config,** the pipeline skips audio without errors and tutorials publish normally.

---

## 3. Functional Requirements

### 3.1 Audio Generation

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| AUD-1 | Generate spoken audio script from tutorial body using Claude Sonnet AI. Prompt instructs the model to: rewrite for spoken delivery, describe code concepts in plain language (never read syntax), remove references to visual elements, convert tables to natural language, remove code-only instructional steps, preserve all educational content faithfully, output clean prose paragraphs only. | Not started | Replaces pure regex stripping — AI handles code-heavy tutorials, orphaned references, and context-aware rewriting that regex cannot |
| AUD-1b | If AI script generation fails (API error, timeout, rate limit), skip audio generation entirely and return null. Do not fall back to regex-only stripping — ship quality audio or no audio. | Not started | Avoids serving awkward audio from regex-only processing of code-heavy tutorials |
| AUD-1c | Apply regex sanitization (SAN-1 through SAN-8) as a post-AI safety net on the generated script before sending to TTS | Not started | Defense-in-depth: catches any stray URLs, HTML entities, or markdown artifacts the AI might leave in output |
| AUD-2 | Chunk script at sentence boundaries (<=1900 chars per chunk, Deepgram 2000 char limit) | Not started | |
| AUD-3 | Handle single sentences exceeding 1900 chars by splitting at last word boundary | Not started | |
| AUD-4 | Send chunks to Deepgram Aura-2 TTS (`aura-2-athena-en`, MP3, 24000 sample rate) | Not started | |
| AUD-5 | Concatenate MP3 buffers from all chunks into single audio file | Not started | |
| AUD-5b | Strip MP3 headers and ID3 tags from all chunks after the first before concatenation | Not started | Prevents clicks/pops at chunk boundaries. MP3 concatenation via header stripping is sufficient for v1 since all chunks use identical Deepgram encoding settings. If audible artifacts are detected at chunk boundaries, consider using an audio library for proper frame-level joining in a future version. |
| AUD-6 | Upload MP3 to Supabase Storage `audio` bucket at `tutorials/{slug}-{timestamp}.mp3` | Not started | Timestamp in filename for cache busting (matches image gen pattern) |
| AUD-7 | Store public audio URL as `audio_url` on tutorials table | Not started | |
| AUD-8 | Return `null` on any failure (missing API key, Deepgram error, upload error) — never throw | Not started | |
| AUD-9 | Log errors with `[audio]` prefix for consistency with `[image]` and `[process]` prefixes | Not started | |
| AUD-10 | Skip audio generation if `AUDIO_ENABLED` env var is not `"true"` — log `[audio] Audio generation disabled, skipping` and return null | Not started | Kill switch |
| AUD-11 | Log structured outcome on success: `[audio] Generated for {slug}: {chunks} chunks, {bytes} bytes, {ms}ms` | Not started | Observability |
| AUD-12 | If sanitized text is <50 characters after stripping, skip audio generation and return null. Log `[audio] Script too short ({n} chars), skipping` | Not started | Prevents generating near-empty audio files |

### 3.2 Text Sanitization — Post-AI Safety Net

Applied to the AI-generated audio script (not the raw markdown). Defense-in-depth to catch any artifacts the AI might leave in its output.

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| SAN-1 | Remove URLs entirely | Not started | URLs are unlistenable — AI should omit these but regex catches stragglers |
| SAN-2 | Remove code blocks (fenced and inline) | Not started | AI rewrites code as prose, but may occasionally leave backtick fragments |
| SAN-3 | Remove image references (`![alt](url)`) | Not started | |
| SAN-4 | Remove markdown table markup entirely | Not started | AI converts tables to prose, regex catches any leftover pipe characters |
| SAN-5 | Collapse repeated whitespace and normalize line breaks | Not started | |
| SAN-6 | Decode HTML entities (`&amp;` -> `&`, `&lt;` -> `<`, etc.) | Not started | |
| SAN-7 | Strip any inline HTML tags (`<br>`, `<strong>`, etc.) | Not started | |
| SAN-8 | Remove horizontal rules (`---`, `***`, `___`) | Not started | |

### 3.3 Pipeline Integration

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| PIP-1 | Run audio generation in parallel with image generation (step 8) using `Promise.all` in `processSubmission()`, before link/publish | Not started | Reduces combined time from ~17-23s to ~10-13s |
| PIP-2 | Audio generation failure does not block tutorial publishing (non-fatal, same pattern as image) | Not started | |
| PIP-3 | Always regenerate audio on merge — body is always overwritten, no change detection needed | Not started | ~$0.20 per call, acceptable for v1 |
| PIP-4 | Audio generation step has a 20-second timeout via `Promise.race` — if exceeded, return null | Not started | Prevents blowing the 60s Vercel budget. Use `Promise.race([audioPromise, timeoutPromise])` — simple and works regardless of SDK signal support |
| PIP-5 | Log total `processSubmission` elapsed time at completion: `[process] processSubmission completed in {ms}ms` | Not started | Track budget usage |

### 3.4 Database

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| DB-1 | Add `audio_url text` column to tutorials table (`src/db/schema.sql`) | Not started | |
| DB-2 | Add `audio_url: string \| null` to `Tutorial` TypeScript interface (`src/types/index.ts`) | Not started | |
| DB-3 | Existing `select("*")` queries automatically include `audio_url` (no data layer changes needed) | Not started | |
| DB-4 | Create versioned migration file: `src/db/migrations/001_add_audio_url.sql` | Not started | Trackable migration |
| DB-5 | Migration uses `ADD COLUMN IF NOT EXISTS audio_url text` with no `DEFAULT` — all existing rows get null. No backfill of audio for existing tutorials. | Not started | Existing tutorials only get audio if re-processed via merge |

### 3.5 Storage

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| STO-1 | Create `audio` bucket in Supabase Storage (public, 10 MB per-file upload limit, `audio/mpeg` MIME type only) | Not started | |
| STO-2 | File path convention: `tutorials/{slug}-{timestamp}.mp3` | Not started | Cache busting |
| STO-3 | No upsert needed — each generation creates a unique filename due to timestamp | Not started | |
| STO-4 | Old audio files are not auto-deleted on regeneration. Document manual cleanup procedure for storage maintenance. | Not started | Acceptable tradeoff for v1 |

### 3.6 Local Development Audio

Pre-generated audio files for seed tutorials enable local UI development and testing without access to Deepgram, Supabase, or Anthropic APIs.

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| DEV-1 | Dev-only API route `/api/tts/[slug]` serves MP3 files from `src/data/tts/audio/` | Not started | Returns 404 in production (`NODE_ENV === "production"` guard). Streams file with `Content-Type: audio/mpeg`. |
| DEV-2 | `withDevAudio()` helper injects `audio_url: "/api/tts/{slug}"` on seed tutorials when `NODE_ENV !== "production"` | Not started | Applied in data layer (getAllTutorials, getTutorialBySlug, etc.). Seeds keep `audio_url: null` in source. |
| DEV-3 | Seed tutorials show working listen buttons in local dev with playable audio | Not started | Enables full UI testing without any external API keys |
| DEV-4 | In production, seed tutorials remain unchanged — `audio_url: null`, no listen button | Not started | `withDevAudio` is a no-op in prod; API route returns 404 in prod |
| DEV-5 | Pre-generated audio files exist for all 10 seed tutorials at `src/data/tts/audio/{slug}.mp3` | Not started | Already generated — text scripts at `src/data/tts/text/{slug}.txt` |

### 3.7 Frontend — ListenButton

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| FE-1 | `ListenButton` client component with `icon` variant (compact speaker icon, matches bookmark sizing) | Not started | |
| FE-2 | `ListenButton` client component with `bar` variant (icon + text label, matches Bookmark/Complete styling) | Not started | |
| FE-3 | Listen icon on tutorial cards below bookmark (browse, search, bookmarks, level-up pages) | Not started | |
| FE-4 | Listen bar on tutorial detail page between Bookmark and Mark Complete buttons | Not started | |
| FE-5 | Only render ListenButton when `audioUrl` is truthy — tutorials with null/undefined `audio_url` must not show any listen-related UI (no button, no icon, no placeholder). This applies to seed tutorials, existing Supabase tutorials created before the feature, and tutorials where audio generation failed. | Not started | Guards in both TutorialCard and TutorialActions |
| FE-6 | Single-player enforcement via custom `"battlecat-audio-play"` window event | Not started | |
| FE-7 | Render `<audio>` element in DOM (hidden) rather than programmatic `new Audio()` — required for iOS Safari gesture-initiated playback | Not started | Mobile compatibility — play() must be called synchronously in click handler, not deferred via useEffect or state updates |
| FE-8 | Graceful error handling — `<audio>` `error` event resets playing state | Not started | |
| FE-9 | `onClick` with `preventDefault` + `stopPropagation` for icon variant (inside `<Link>` wrapper) | Not started | |
| FE-10 | Cleanup on unmount — pause audio, remove event listeners on Next.js navigation | Not started | |
| FE-11 | Implement MediaSession API with `play`, `pause`, and `stop` action handlers for lock screen/notification center controls | Not started | |
| FE-12 | Set MediaSession metadata (title from tutorial, artist: "Battlecat AI", artwork from `image_url` if available) | Not started | |
| FE-13 | Update MediaSession `playbackState` on play/pause/end events | Not started | |
| FE-14 | Dynamic `aria-label` ("Play tutorial audio" / "Pause tutorial audio") on ListenButton | Not started | |
| FE-15 | `aria-pressed` attribute reflecting current play state | Not started | |
| FE-16 | Keyboard support — Enter/Space trigger play/pause, visible focus outline matching existing button styles | Not started | |
| FE-17 | On audio load error, display brief "Audio unavailable" text or change button appearance to indicate failure. Reset after 3 seconds or on next interaction. | Not started | Error indicator UX |
| FE-18 | Loading/buffering state between click and `canplay` event — subtle pulse animation or spinner on the icon. Three states: idle → loading → playing. | Not started | Loading state UX |

---

## 4. Non-Functional Requirements

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| NFR-1 | Audio generation completes within 20s per tutorial (hard timeout via `Promise.race`) | Not started | |
| NFR-2 | New env vars required: `AUDIO_ENABLED` (kill switch) | Not started | |
| NFR-3 | Site works without audio bucket — graceful degradation, listen buttons hidden | Not started | |
| NFR-4 | All existing tutorials (seed and Supabase) work without audio — `audio_url` defaults to null, no listen button rendered anywhere (cards or detail page). The UI for tutorials without audio must be identical to the pre-feature state. | Not started | Covers seed tutorials, pre-existing Supabase tutorials, and any tutorial where audio generation failed or was skipped |
| NFR-5 | Audio generation module follows same error handling pattern as image generation (never throws) | Not started | |
| NFR-6 | Audio plays correctly on iOS Safari 16+, Chrome Android, desktop Chrome/Firefox/Safari  | Not started | |

---

## 5. Technical Architecture

### Stack Additions

| Layer | Technology | Usage |
|-------|-----------|-------|
| TTS | Deepgram Aura-2 | Text-to-speech audio generation |
| Storage | Supabase Storage | MP3 file persistence (`audio` bucket) |
| Testing | Vitest | Unit tests for text processing functions |

### Key Function Signatures

```ts
generateTutorialAudio(body: string, slug: string): Promise<string | null>
generateAudioScript(body: string): Promise<string | null>   // Claude Sonnet AI rewrite
sanitizeScriptText(text: string): string                     // Post-AI regex safety net
chunkText(text: string, maxChars?: number): string[]
```

### Deepgram TTS Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `aura-2-athena-en` | Calm, smooth, professional — suited for educational content |
| Encoding | `mp3` | Universally supported, good compression |
| Sample rate | `24000` | Standard for voice, good quality-to-size ratio |
| Max chars/request | 2000 (Deepgram limit) | Chunk at <=1900 chars with sentence-boundary splitting |

### Data Flow

```
Tutorial body (markdown)
    |
    v
generateAudioScript()        <- Claude Sonnet AI
    |  Rewrites tutorial for spoken delivery
    |  Describes code in plain language (never reads syntax)
    |  Removes visual references ("as shown above", "see the diagram")
    |  Converts tables to natural language summaries
    |  Removes code-only instructions ("copy this into your terminal")
    |  Preserves all educational content faithfully
    |  Outputs clean prose paragraphs
    |  If AI call fails → return null, skip audio entirely
    v
AI-generated audio script
    |
    v
sanitizeScriptText()         <- Post-AI regex safety net
    |  Catches any artifacts AI might leave:
    |  Removes: stray URLs, code backticks, image refs,
    |  table pipe chars, HTML tags, horizontal rules
    |  Decodes HTML entities (&amp; etc.)
    |  Collapses: multiple newlines -> single newline
    v
Clean spoken script
    |
    v
textToSpeech()               <- Deepgram Aura-2 SDK (@deepgram/sdk)
    |  Chunks text at sentence boundaries (<=1900 chars each)
    |  Calls speak.request({ text }, { model, encoding, sample_rate }) per chunk
    |  Collects streaming response: response.getStream() + for await...of
    |  Strips MP3 headers from chunks 2+ before concat
    |  Concatenates MP3 buffers
    |  20-second hard timeout via Promise.race
    v
MP3 audio buffer
    |
    v
uploadAudioToSupabase()      <- Supabase Storage "audio" bucket
    |  Path: tutorials/{slug}-{timestamp}.mp3
    |  Content-Type: audio/mpeg
    |  Returns public URL
    v
audio_url stored on tutorials table
    |
    v
ListenButton component       <- HTML5 <audio> play/pause
    |  Real DOM <audio> element (hidden)
    |  aria-label, aria-pressed, keyboard support
```

### Pipeline Integration

```
Step 8 + 8c (parallel via Promise.all):
  - Generate hero image (Together AI FLUX)             ~10s
  - Generate tutorial audio (Deepgram TTS)             ~7-13s  (20s hard timeout)
  Combined wall time: ~10-13s (max of the two)

Step 8b: Generate hot news blurb (Claude, if flagged)  ~5s     (runs after parallel step)
Step 9:  Link source to tutorial
Step 10: Mark submission as published
[NEW] Log: [process] processSubmission completed in {ms}ms
```

Image and audio generation run in parallel via `Promise.all` since they are independent operations writing to different columns. Audio generation includes two sequential steps internally: AI script generation (~3-5s via Claude Sonnet) followed by TTS (~7-13s via Deepgram), totaling ~10-18s — but this runs parallel with image generation (~10s), so combined wall time stays ~10-18s (max of the two). Hot news (step 8b) runs sequentially after since it's conditional. Total post-processing budget: ~10-18s of the 60s Vercel timeout (steps 1-7 consume ~15-30s for extraction + AI generation). Audio generation failure does not block tutorial publishing. Each step has an individual timeout to prevent cascading delays. Note: hot-news tutorials may see ~3s additional latency since step 8b now waits for both image and audio to complete (not just image).

### Key Architectural Decisions

1. **Server-generated audio (not browser TTS)** — Consistent, high-quality voice output across all devices. Files generated once and cached permanently.
2. **AI-generated audio script (not regex stripping)** — Claude Sonnet rewrites the tutorial body into a spoken script. Handles code-heavy tutorials by describing code in plain language, removes orphaned visual references, converts tables to prose. Regex sanitization applied as a post-AI safety net. If AI call fails, audio is skipped entirely (no fallback to regex-only stripping) — quality audio or no audio.
3. **Sentence-boundary chunking** — Deepgram enforces 2000 char limit. Split at sentence boundaries (`. `, `! `, `? `, `.\n`) with 1900 char threshold. Single sentences >1900 chars split at last word boundary.
4. **MP3 concatenation with header stripping** — Strip ID3 tags and MP3 headers from chunks 2+ before concatenation to prevent audible artifacts at chunk boundaries.
5. **Parallel pipeline steps** — Image generation (step 8) and audio generation (step 8c) run concurrently via `Promise.all` in `processSubmission()`. Both are independent and non-blocking — failure of either does not block tutorial publishing.
6. **Custom window event for single-player** — `"battlecat-audio-play"` event dispatched on play ensures only one ListenButton plays at a time across the page.
7. **DOM-rendered `<audio>` element** — Hidden `<audio>` element rendered in DOM (not programmatic `new Audio()`). Required for iOS Safari which blocks `play()` calls not in a user gesture call stack.
8. **Timestamped filenames for cache busting** — `tutorials/{slug}-{timestamp}.mp3` ensures browsers fetch fresh audio after regeneration. Matches existing image generation pattern.
9. **Kill switch via `AUDIO_ENABLED` env var** — Audio generation skipped entirely if not set to `"true"`. Allows disabling without a code deploy.
10. **Per-step timeout via `Promise.race`** — 20-second hard timeout on audio generation via `Promise.race([audioPromise, timeoutPromise])` prevents blowing the 60s Vercel function budget.

### Expected Audio Size

| Tutorial length | Script chars | Chunks | Audio duration | MP3 file size (~64kbps) |
|----------------|-------------|--------|----------------|------------------------|
| 800 words | ~4,000 | 2-3 | ~5 min | ~2.5 MB |
| 1,200 words | ~6,500 | 3-4 | ~8 min | ~4 MB |
| 1,500 words | ~8,500 | 4-5 | ~10 min | ~5 MB |

---

## 6. File Changes

### New Files

| File | Description |
|------|-------------|
| `src/lib/generate-audio.ts` | Core audio generation module (AI script generation via Claude Sonnet, post-AI regex sanitization, Deepgram TTS via `@deepgram/sdk`, Supabase upload) |
| `src/components/ListenButton.tsx` | Client component — audio play/pause button with `icon` and `bar` variants, a11y support |
| `src/db/migrations/001_add_audio_url.sql` | Versioned migration: `ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;` |
| `src/lib/__tests__/generate-audio.test.ts` | Unit tests for `sanitizeScriptText`, `chunkText`; integration tests for AI script quality against seed tutorial bodies |
| `vitest.config.ts` | Vitest configuration (test runner setup — must include `resolve.alias` for `@/` path mapping to `./src`) |
| `src/app/api/tts/[slug]/route.ts` | Dev-only API route — serves MP3 from `src/data/tts/audio/`, returns 404 in production |

### Modified Files

| File | Description |
|------|-------------|
| `src/db/schema.sql` | Add `audio_url text` column to tutorials table |
| `src/types/index.ts` | Add `audio_url: string \| null` to `Tutorial` interface |
| `src/lib/process-submission.ts` | Add parallel audio generation via `Promise.all` with image gen + merge regeneration + per-step timeout + after() timing log |
| `src/components/TutorialCard.tsx` | Add ListenButton icon below bookmark (uses existing `tutorial.audio_url` from `Tutorial` prop — no page-level changes needed) |
| `src/components/TutorialActions.tsx` | Add `audioUrl` prop + ListenButton bar between Bookmark and Mark Complete |
| `src/app/tutorials/[slug]/page.tsx` | Pass `audioUrl` prop to TutorialActions |
| `.env.example` | Add `AUDIO_ENABLED` and `TOGETHER_API_KEY` (existing gap) |
| `src/data/seed-tutorials.ts` | Add `audio_url: null` to all seed tutorial objects + `withDevAudio()` helper that injects local audio URLs in dev |
| `src/data/tutorials.ts` | Wrap seed tutorial functions with `withDevAudio()` so dev audio URLs propagate to all pages |
| `package.json` | Add `vitest` dev dependency and `"test"` script |

---

## 7. Edge Cases and Error Handling

| Scenario | Behavior |
|----------|----------|
| `AUDIO_ENABLED` not set or not `"true"` | Audio generation skipped entirely. Log `[audio] disabled`. Listen buttons hidden. |
| `DEEPGRAM_API_KEY` not set | `generateTutorialAudio` returns null, logs warning. Tutorial publishes without audio. Listen button hidden. |
| Deepgram API returns error | Returns null. Tutorial publishes without audio. |
| Supabase Storage upload fails | Returns null. Tutorial publishes without audio. |
| AI script generation fails (API error, timeout, rate limit) | Skip audio entirely — return null. Do not fall back to regex-only stripping. Log `[audio] AI script generation failed: {error}`. Tutorial publishes without audio. |
| Tutorial body is code-heavy (40%+ code) | AI rewrites code sections as plain language descriptions. Produces listenable content instead of disjointed fragments. |
| Tutorial body is empty or very short | AI returns minimal script. If <50 chars after sanitization, skip audio generation and return null (AUD-12). Log and continue. |
| Single sentence > 1900 characters | Fallback: split at last word boundary before 1900 chars. |
| Audio generation exceeds 20s | `Promise.race` timeout fires, return null, log `[audio] Timeout after 20s`. Tutorial publishes without audio. |
| Audio fails to load in browser | `<audio>` `error` event resets playing state. Display "Audio unavailable" text or error appearance for 3 seconds (FE-17), then return to idle. |
| User navigates away while audio playing | `useEffect` cleanup pauses audio and cleans up references. |
| Multiple listen buttons on same page | Custom event `"battlecat-audio-play"` ensures only one plays at a time. |
| Merged tutorial | Audio always regenerated on merge (body is always overwritten). New timestamped filename. Old file remains in storage (manual cleanup). |
| Seed tutorials in production | `audio_url` is null (source value). `withDevAudio` is no-op in prod. Listen button not rendered. |
| Seed tutorials in local dev | `withDevAudio()` injects `audio_url: "/api/tts/{slug}"`. Listen button rendered. Audio served from `src/data/tts/audio/`. |
| `/api/tts/[slug]` called in production | Returns 404 immediately (`NODE_ENV === "production"` guard). No file access. |
| `/api/tts/[slug]` called with nonexistent slug | Returns 404 (file not found). |
| Existing Supabase tutorials (created before audio feature) | `audio_url` column defaults to null via migration. No listen button rendered on cards or detail page. No visual difference from pre-feature UI. |
| Tutorial where audio generation failed or was skipped | `audio_url` remains null. Listen button hidden. Tutorial displays normally without any audio-related UI. |
| Supabase Storage `audio` bucket not created | Upload fails gracefully. Returns null. |
| Tutorial body contains tables | AI converts table data to natural language summaries. Regex safety net catches any leftover pipe characters. |
| Tutorial body contains bare URLs | AI omits URLs. Regex safety net catches any stragglers. |
| Tutorial body contains code snippets with surrounding prose | AI describes what the code does in plain language, removes "as shown above" / "copy this" references. No orphaned text. |
| iOS Safari autoplay restriction | DOM `<audio>` element + `play()` in click handler call stack satisfies gesture requirement. |

---

## 8. Environment Variables

| Variable | Already exists? | Used for |
|----------|----------------|----------|
| `DEEPGRAM_API_KEY` | Yes (STT) | Now also used for TTS. Same key handles both services. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Storage URL for audio bucket |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side upload to audio bucket |
| `AUDIO_ENABLED` | No | Set to `"true"` to enable audio generation. Kill switch. |

---

## 9. Cost Estimate

| Service | Cost model | Per tutorial estimate |
|---------|-----------|---------------------|
| Claude Sonnet (audio script) | Input/output tokens | ~$0.02 per tutorial (~6K chars input, ~4K chars output) |
| Deepgram Aura-2 TTS | Pay-per-character ($0.030/1K chars) | ~$0.15-0.27 per tutorial (5000-9000 chars) |
| Supabase Storage | 1GB free, then $0.021/GB | ~$0.0001 per MP3 file (3-5 MB) |

Per-tutorial API cost is ~$0.22 (Deepgram $0.20 + Claude $0.02). Storage cost is the primary concern: at ~4MB average per tutorial, **100 tutorials consumes ~400MB (40% of Supabase's 1GB free tier)**. The ceiling is ~250 tutorials before requiring a paid plan.

**Storage scaling note:** Timestamped filenames mean regenerated audio accumulates old files — periodic manual cleanup of orphaned files recommended when storage exceeds 75% capacity (750MB).

---

## 10. Testing

### 10.1 Prerequisites

**For unit tests (10.2) and browser verification (10.3) — no API keys needed:**
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Seed tutorials automatically get audio URLs via `withDevAudio()` in dev mode
4. Pre-generated MP3 files served via `/api/tts/[slug]` route

**For manual/pipeline testing (10.4) — requires API keys:**
1. Ensure `DEEPGRAM_API_KEY` is set in `.env.local`
2. Set `AUDIO_ENABLED=true` in `.env.local`
3. Create the `audio` bucket in Supabase Dashboard: Storage -> New bucket -> Name: `audio`, Public: Yes
4. Run the schema migration (or use the migration file `src/db/migrations/001_add_audio_url.sql`):
   ```sql
   ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;
   ```

### 10.2 Automated Tests

| ID | Test | Type |
|----|------|------|
| AT-1 | `sanitizeScriptText` removes stray URLs, code backticks, image refs, table pipes, HTML tags, horizontal rules | Unit |
| AT-2 | `sanitizeScriptText` decodes HTML entities (`&amp;`, `&lt;`, `&gt;`) | Unit |
| AT-3 | `sanitizeScriptText` strips inline HTML tags | Unit |
| AT-4 | `sanitizeScriptText` collapses multiple newlines to single newline | Unit |
| AT-5 | `chunkText` splits at sentence boundaries under 1900 chars | Unit |
| AT-6 | `chunkText` handles single sentence > 1900 chars (word boundary fallback) | Unit |
| AT-7 | `chunkText` handles empty string input | Unit |
| AT-8 | `generateAudioScript` produces non-empty script from code-heavy tutorial body (mocked AI response for unit test) | Unit |
| AT-9 | `generateAudioScript` returns null on AI failure (mocked error) | Unit |

Run with: `npm test` or `npx vitest run`

### 10.3 Browser Verification — Claude Chrome Extension (Local Dev)

Claude Code uses its Chrome browser extension to visually verify listen button functionality on the local dev server. This replaces manual testing for seed tutorial audio during development. No external API keys required — uses pre-generated audio via the dev-only `/api/tts/[slug]` route.

**Prerequisites:**
1. Dev server running (`npm run dev`)
2. Seed tutorials loaded with dev audio URLs (`withDevAudio()` active in dev)

**Verification Script:**

| Step | Page | Verify | On Failure |
|------|------|--------|------------|
| BV-1 | `/browse` | Each seed tutorial card shows a listen icon below the bookmark icon | Check TutorialCard.tsx — ListenButton should render when `audioUrl` is truthy |
| BV-2 | `/browse` | Click a listen icon → icon changes to pause state, audio plays | Check ListenButton click handler, `<audio>` element src, play() call |
| BV-3 | `/browse` | Click a different card's listen icon → first audio stops, second plays | Check `"battlecat-audio-play"` custom event dispatch and listener |
| BV-4 | `/tutorials/{any-seed-slug}` | Listen bar appears between Bookmark and Mark Complete buttons | Check TutorialActions.tsx — `audioUrl` prop passed, ListenButton bar variant rendered |
| BV-5 | `/tutorials/{any-seed-slug}` | Click listen bar → audio plays. Click again → audio pauses | Check play/pause toggle logic in ListenButton |
| BV-6 | `/search` (search for "prompt") | Listen icon on result cards | Check that search results pass `audio_url` through to TutorialCard |
| BV-7 | `/bookmarks` (after bookmarking a seed tutorial) | Listen icon on bookmarked cards | Check bookmarks page passes tutorial data including `audio_url` |
| BV-8 | `/level-up` | Listen icon on recommended tutorial cards | Check level-up page passes tutorial data including `audio_url` |
| BV-9 | Start audio on `/browse`, navigate to `/tutorials/{slug}` | Audio stops on navigation | Check `useEffect` cleanup in ListenButton |

**On any failure:** Identify the root cause in the code, fix it, and re-run the failing verification step.

### 10.4 Manual Testing — Local (Requires API Keys)

| ID | Test | Steps |
|----|------|-------|
| T-1 | Pipeline end-to-end | Submit a URL via `/submit`. Wait for processing. Verify `audio_url` populated, Listen button appears on detail page, audio plays/pauses. |
| T-2 | UI on card pages | Visit `/browse`, `/search`, `/bookmarks`. Verify listen icon appears below bookmark on cards with `audio_url`. Verify audio plays and other audio stops. |
| T-3 | Navigation cleanup | Start playing audio on detail page. Navigate away. Verify audio stops. |
| T-4 | Single-player enforcement | On `/browse`, play audio on one card. Play on another. Verify first stops, only second plays. |
| T-5 | No audio graceful state | Find tutorial without `audio_url`. Verify no listen button on detail page or card. |
| T-6 | Error resilience | Remove `DEEPGRAM_API_KEY`. Submit URL. Verify tutorial publishes without audio (no crash, `audio_url` null). Restore key. |
| T-7 | Keyboard accessibility | Tab to ListenButton. Press Enter/Space. Verify play/pause toggles. Verify focus outline visible. |
| T-8 | Kill switch | Set `AUDIO_ENABLED=false`. Submit URL. Verify no audio generated. Set back to `true`. |
| T-9 | iOS Safari | Open on iOS Safari. Tap listen button. Verify audio plays (not blocked by autoplay policy). |
| T-9b | Lock screen controls | iOS/Android — start playing audio, lock phone. Verify lock screen shows play/pause controls with tutorial title. Verify pause/resume from lock screen works. |

### 10.5 Deployed Testing (Vercel / battlecat.ai)

| ID | Test | Steps |
|----|------|-------|
| T-10 | New tutorial pipeline | Submit URL via WhatsApp or `/submit`. Verify Listen button present and audio plays on tutorial page. |
| T-11 | Cross-page verification | Check all 5 pages: tutorial detail (bar), browse (icon), search (icon), bookmarks (icon), level-up (icon). |
| T-12 | Mobile | Open on iOS Safari and Android Chrome. Verify listen button visible, tappable, audio plays, stops on navigation. |
| T-13 | Vercel function timing | Check function logs. Verify `after()` execution under 60s. Look for `[audio]` log lines with timing data. |

---

## 11. Rollout Plan

1. **Add env var** — Set `AUDIO_ENABLED=true` in Vercel environment settings
2. **Schema + Storage** — Run migration and create bucket (both environments)
3. **Deploy code** — All file changes in a single PR
4. **Verify existing tutorials** — Confirm existing tutorials (without audio) display no listen buttons on any page — UI should be identical to pre-feature state
5. **Verify kill switch** — Temporarily set `AUDIO_ENABLED=false`, confirm pipeline skips audio, then set back to `true`
6. **Verify new tutorial** — Submit a URL, confirm audio is generated and listen button appears
7. **Verify** — Spot-check tutorials on all 5 pages, including mobile Safari
8. **Monitor** — Watch Vercel function logs for `[audio]` lines, check success/failure counts and after() timing
9. **Storage audit at +30 days** — Check audio bucket storage usage. If >500MB, run manual cleanup of orphaned files from regenerated tutorials.

**Note:** Existing tutorials will not be backfilled with audio. Only new tutorials (and existing ones that receive a merge from new content) will get audio generated. This is intentional for v1 — a backfill script is a future consideration.

---

## 12. Open Items

| Item | Priority | Notes |
|------|----------|-------|
| Playback speed control | P2 | Add 1x/1.5x/2x speed toggle to ListenButton |
| Audio progress bar | P1 | Show playback position and duration (fast-follow) |
| Download button | P3 | Allow users to download MP3 for offline listening |
| Voice selection | P3 | Let admin choose from multiple Deepgram voices |
| Audio-only feed | P4 | Podcast RSS feed with audio enclosures |
| Streaming playback | P4 | Stream audio as it generates instead of waiting for full file |
|  Old file cleanup | P3 | Script or cron to delete orphaned audio files from storage after regeneration |
|  Structured data | P3 | Add schema.org/AudioObject markup for SEO |
|  User preference | P3 | localStorage toggle to hide listen buttons site-wide |
|  Multi-language voices | P4 | Abstract voice selection for future i18n support |
| Storage monitoring | P3 | Alert when audio bucket exceeds 750MB (75% of free tier) |
| Audio failure rate monitoring/alerting | P2 | Set up alerting when audio generation failure rate exceeds threshold in Vercel logs |
| Backfill existing tutorials | P2 | Script to generate audio for existing tutorials that have null `audio_url` — run once after feature is stable |

---

## 13. Success Criteria

### Phase 1 (Launch)
- New tutorials automatically get audio generated during the processing pipeline
- Listen button appears on tutorial detail pages and tutorial cards for tutorials with audio across all 5 pages
- Audio plays reliably on desktop and mobile browsers (including iOS Safari)
- Mobile lock screen controls work via MediaSession API
- Audio generation failure does not block or delay tutorial publishing
- Single-player enforcement works across multiple ListenButton instances
- Kill switch can disable audio generation without a code deploy
- Unit tests pass for text stripping and chunking functions

### Phase 2 (MVP)
- Listen button visible on newly created tutorial across the site
- Audio quality is clear and consistent across tutorials of varying length (no clicks/pops at chunk boundaries)

### Phase 3 (Mature)
- Playback speed controls available for power users
- Audio progress bar shows position and duration
- Download option for offline listening
- Storage monitoring and cleanup in place
