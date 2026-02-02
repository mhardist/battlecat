# Product Requirements Document — Listen to Tutorial

**Feature:** Text-to-Speech Audio for Tutorials
**Product:** Battlecat AI (battlecat.ai)
**Branch:** `bkirsch-listen-to-tutorial`
**Version:** 3.0
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

### Pipeline
- **As a system, when a new tutorial is created via the processing pipeline,** an MP3 audio file is automatically generated and persisted.
- **As a system, when a tutorial is merged with new content,** the audio is always regenerated to match the updated body.
- **[NEW] As a system, if audio generation is disabled via config,** the pipeline skips audio without errors and tutorials publish normally.

---

## 3. Functional Requirements

### 3.1 Audio Generation

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| AUD-1 | Strip markdown body to clean plain text script (pure regex, no AI) | Not started | |
| AUD-2 | Chunk script at sentence boundaries (<=1900 chars per chunk, Deepgram 2000 char limit) | Not started | |
| AUD-3 | Handle single sentences exceeding 1900 chars by splitting at last word boundary | Not started | |
| AUD-4 | Send chunks to Deepgram Aura-2 TTS (`aura-2-athena-en`, MP3, 24000 sample rate) | Not started | |
| AUD-5 | Concatenate MP3 buffers from all chunks into single audio file | Not started | |
| AUD-5b | Strip MP3 headers and ID3 tags from all chunks after the first before concatenation | Not started | Prevents clicks/pops at chunk boundaries |
| AUD-6 | Upload MP3 to Supabase Storage `audio` bucket at `tutorials/{slug}-{timestamp}.mp3` | Not started | Timestamp in filename for cache busting (matches image gen pattern) |
| AUD-7 | Store public audio URL as `audio_url` on tutorials table | Not started | |
| AUD-8 | Return `null` on any failure (missing API key, Deepgram error, upload error) — never throw | Not started | |
| AUD-9 | Log errors with `[audio]` prefix for consistency with `[image]` and `[process]` prefixes | Not started | |
| AUD-10 | Skip audio generation if `AUDIO_ENABLED` env var is not `"true"` — log `[audio] Audio generation disabled, skipping` and return null | Not started | Kill switch |
| AUD-11 | Log structured outcome on success: `[audio] Generated for {slug}: {chunks} chunks, {bytes} bytes, {ms}ms` | Not started | Observability |

### 3.2 Text Sanitization for Speech

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| SAN-1 | Remove URLs entirely | Not started | URLs are unlistenable |
| SAN-2 | Remove code blocks (fenced and inline) — these are visual, not auditory content | Not started | |
| SAN-3 | Remove image references (`![alt](url)`) | Not started | |
| SAN-4 | Remove markdown table markup entirely — tables are visual content, not suited for audio | Not started | |
| SAN-5 | Collapse repeated whitespace and normalize line breaks | Not started | |
| SAN-6 | Decode HTML entities (`&amp;` -> `&`, `&lt;` -> `<`, etc.) before stripping | Not started | |
| SAN-7 | Strip any inline HTML tags (`<br>`, `<strong>`, etc.) | Not started | Some tutorials use HTML |
| SAN-8 | Remove horizontal rules (`---`, `***`, `___`) | Not started | |

### 3.3 Pipeline Integration

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| PIP-1 | Run audio generation in parallel with image generation (step 8) using `Promise.all` in `processSubmission()`, before link/publish | Not started | Reduces combined time from ~17-23s to ~10-13s |
| PIP-2 | Audio generation failure does not block tutorial publishing (non-fatal, same pattern as image) | Not started | |
| PIP-3 | Always regenerate audio on merge — body is always overwritten, no change detection needed | Not started | ~$0.01 per call, not worth optimizing |
| PIP-4 | Audio generation step has a 20-second timeout — if exceeded, abort and return null | Not started | Prevents blowing the 60s Vercel budget |
| PIP-5 | Log total `after()` elapsed time at completion: `[process] after() completed in {ms}ms` | Not started | Track budget usage |

### 3.4 Database

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| DB-1 | Add `audio_url text` column to tutorials table (`src/db/schema.sql`) | Not started | |
| DB-2 | Add `audio_url: string \| null` to `Tutorial` TypeScript interface (`src/types/index.ts`) | Not started | |
| DB-3 | Existing `select("*")` queries automatically include `audio_url` (no data layer changes needed) | Not started | |
| DB-4 |Create versioned migration file: `src/db/migrations/001_add_audio_url.sql` | Not started | Trackable migration |

### 3.5 Storage

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| STO-1 | Create `audio` bucket in Supabase Storage (public, 50 MB limit, `audio/mpeg` only) | Not started | |
| STO-2 | File path convention: `tutorials/{slug}-{timestamp}.mp3` | Not started | Cache busting |
| STO-3 | No upsert needed — each generation creates a unique filename due to timestamp | Not started | |
| STO-4 | Old audio files are not auto-deleted on regeneration. Document manual cleanup procedure for storage maintenance. | Not started | Acceptable tradeoff for v1 |

### 3.6 Frontend — ListenButton

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| FE-1 | `ListenButton` client component with `icon` variant (compact speaker icon, matches bookmark sizing) | Not started | |
| FE-2 | `ListenButton` client component with `bar` variant (icon + text label, matches Bookmark/Complete styling) | Not started | |
| FE-3 | Listen icon on tutorial cards below bookmark (browse, search, bookmarks, level-up pages) | Not started | |
| FE-4 | Listen bar on tutorial detail page between Bookmark and Mark Complete buttons | Not started | |
| FE-5 | Only render ListenButton when `audioUrl` is truthy (no broken/empty state) | Not started | |
| FE-6 | Single-player enforcement via custom `"battlecat-audio-play"` window event | Not started | |
| FE-7 | Render `<audio>` element in DOM (hidden) rather than programmatic `new Audio()` — required for iOS Safari gesture-initiated playback | Not started | Mobile compatibility |
| FE-8 | Graceful error handling — `<audio>` `error` event resets playing state | Not started | |
| FE-9 | `onClick` with `preventDefault` + `stopPropagation` for icon variant (inside `<Link>` wrapper) | Not started | |
| FE-10 | Cleanup on unmount — pause audio, remove event listeners on Next.js navigation | Not started | |



---

## 4. Non-Functional Requirements

| ID | Requirement | Status | Notes |
|----|------------|--------|-------|
| NFR-1 | Audio generation completes within 20s per tutorial (hard timeout via AbortController) | Not started | |
| NFR-2 | New env vars required: `AUDIO_ENABLED` (kill switch) | Not started | |
| NFR-3 | Site works without audio bucket — graceful degradation, listen buttons hidden | Not started | |
| NFR-4 | Seed tutorials work without audio (`audio_url` is null, no listen button rendered) | Not started | |
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
stripMarkdownToScript()     <- Pure regex, no AI
    |  Removes: ## headers, **bold**, *italic*, `code`,
    |  ```code blocks```, > blockquotes, [text](url) links,
    |  --- rules, ![images], list markers (-, *, 1.)
    |  Decodes HTML entities (&amp; etc.)
    |  Strips inline HTML tags
    |  Removes table markup entirely
    |  Removes bare URLs
    |  Keeps: plain sentence text
    |  Collapses: multiple newlines -> single newline
    v
Plain text script (continuous prose)
    |
    v
textToSpeech()               <- Deepgram Aura-2 SDK (@deepgram/sdk)
    |  Chunks text at sentence boundaries (<=1900 chars each)
    |  Calls speak.request({ text }, { model, encoding, sample_rate }) per chunk
    |  Collects streaming response: response.getStream() + for await...of
    |  Strips MP3 headers from chunks 2+ before concat
    |  Concatenates MP3 buffers
    |  20-second hard timeout via AbortController
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
[NEW] Log: [process] after() completed in {ms}ms
```

Image and audio generation run in parallel via `Promise.all` since they are independent operations writing to different columns. Hot news (step 8b) runs sequentially after since it's conditional. Total post-processing budget: ~10-18s of the 60s Vercel timeout (steps 1-7 consume ~15-30s for extraction + AI generation). Audio generation failure does not block tutorial publishing. Each step has an individual timeout to prevent cascading delays.

### Key Architectural Decisions

1. **Server-generated audio (not browser TTS)** — Consistent, high-quality voice output across all devices. Files generated once and cached permanently.
2. **Sentence-boundary chunking** — Deepgram enforces 2000 char limit. Split at sentence boundaries (`. `, `! `, `? `, `.\n`) with 1900 char threshold. Single sentences >1900 chars split at last word boundary.
3. **MP3 concatenation with header stripping** — Strip ID3 tags and MP3 headers from chunks 2+ before concatenation to prevent audible artifacts at chunk boundaries.
4. **Parallel pipeline steps** — Image generation (step 8) and audio generation (step 8c) run concurrently via `Promise.all` in `after()` callback. Both are independent and non-blocking — failure of either does not block tutorial publishing.
5. **Custom window event for single-player** — `"battlecat-audio-play"` event dispatched on play ensures only one ListenButton plays at a time across the page.
6. **DOM-rendered `<audio>` element** — Hidden `<audio>` element rendered in DOM (not programmatic `new Audio()`). Required for iOS Safari which blocks `play()` calls not in a user gesture call stack.
7. **Timestamped filenames for cache busting** — `tutorials/{slug}-{timestamp}.mp3` ensures browsers fetch fresh audio after regeneration. Matches existing image generation pattern.
8. **Kill switch via `AUDIO_ENABLED` env var** — Audio generation skipped entirely if not set to `"true"`. Allows disabling without a code deploy.
9. **Per-step timeout** — 20-second hard timeout on audio generation prevents blowing the 60s Vercel function budget.

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
| `src/lib/generate-audio.ts` | Core audio generation module (markdown strip, sanitization, Deepgram TTS via `@deepgram/sdk`, Supabase upload) |
| `src/components/ListenButton.tsx` | Client component — audio play/pause button with `icon` and `bar` variants, a11y support |
| `src/db/migrations/001_add_audio_url.sql` | Versioned migration: `ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;` |
| `src/lib/__tests__/generate-audio.test.ts` | Unit tests for `stripMarkdownToScript`, `chunkText`, sanitization |
| `vitest.config.ts` | Vitest configuration (test runner setup — must include `resolve.alias` for `@/` path mapping to `./src`) |

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
| `package.json` | Add `vitest` dev dependency and `"test"` script |

---

## 7. Edge Cases and Error Handling

| Scenario | Behavior |
|----------|----------|
| `AUDIO_ENABLED` not set or not `"true"` | Audio generation skipped entirely. Log `[audio] disabled`. Listen buttons hidden. |
| `DEEPGRAM_API_KEY` not set | `generateTutorialAudio` returns null, logs warning. Tutorial publishes without audio. Listen button hidden. |
| Deepgram API returns error | Returns null. Tutorial publishes without audio. |
| Supabase Storage upload fails | Returns null. Tutorial publishes without audio. |
| Tutorial body is empty or very short | Strip produces minimal text. Deepgram generates short audio. No special handling needed. |
| Single sentence > 1900 characters | Fallback: split at last word boundary before 1900 chars. |
| Audio generation exceeds 20s | Abort via AbortController, return null, log `[audio] Timeout after 20s`. Tutorial publishes without audio. |
| Audio fails to load in browser | `<audio>` `error` event resets playing state. Button returns to idle. |
| User navigates away while audio playing | `useEffect` cleanup pauses audio and cleans up references. |
| Multiple listen buttons on same page | Custom event `"battlecat-audio-play"` ensures only one plays at a time. |
| Merged tutorial | Audio always regenerated on merge (body is always overwritten). New timestamped filename. Old file remains in storage (manual cleanup). |
| Seed tutorials (no Supabase) | `audio_url` is null. Listen button not rendered. |
| Supabase Storage `audio` bucket not created | Upload fails gracefully. Returns null. |
| Tutorial body contains tables | Table markup removed entirely — tables are visual content. |
| Tutorial body contains bare URLs | URLs removed from speech text. |
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
| Deepgram Aura-2 TTS | Pay-per-character | ~$0.005-0.015 per tutorial (5000-9000 chars) |
| Supabase Storage | 1GB free, then $0.021/GB | ~$0.0001 per MP3 file (3-5 MB) |

Per-tutorial API cost is low (~$0.01). Storage cost is the primary concern: at ~4MB average per tutorial, **100 tutorials consumes ~400MB (40% of Supabase's 1GB free tier)**. The ceiling is ~250 tutorials before requiring a paid plan.

**Storage scaling note:** Timestamped filenames mean regenerated audio accumulates old files — periodic manual cleanup of orphaned files recommended when storage exceeds 75% capacity (750MB).

---

## 10. Testing

### 10.1 Prerequisites

1. Ensure `DEEPGRAM_API_KEY` is set in `.env.local`
2. Set `AUDIO_ENABLED=true` in `.env.local`
4. Create the `audio` bucket in Supabase Dashboard: Storage -> New bucket -> Name: `audio`, Public: Yes
5. Run the schema migration (or use the migration file `src/db/migrations/001_add_audio_url.sql`):
   ```sql
   ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;
   ```
6. Install test dependencies: `npm install`
7. Start the dev server: `npm run dev`

### 10.2 Automated Tests

| ID | Test | Type |
|----|------|------|
| AT-1 | `stripMarkdownToScript` removes headers, bold, italic, links, code blocks, blockquotes, images, list markers, horizontal rules | Unit |
| AT-2 | `stripMarkdownToScript` decodes HTML entities (`&amp;`, `&lt;`, `&gt;`) | Unit |
| AT-3 | `stripMarkdownToScript` strips inline HTML tags | Unit |
| AT-4 | `stripMarkdownToScript` removes bare URLs | Unit |
| AT-5 | `stripMarkdownToScript` collapses multiple newlines to single newline | Unit |
| AT-6 | `chunkText` splits at sentence boundaries under 1900 chars | Unit |
| AT-7 | `chunkText` handles single sentence > 1900 chars (word boundary fallback) | Unit |
| AT-8 | `chunkText` handles empty string input | Unit |
| AT-9 | `stripMarkdownToScript` tested against 3 real tutorial bodies from seed data | Unit |

Run with: `npm test` or `npx vitest run`

### 10.3 Manual Testing — Local

| ID | Test | Steps |
|----|------|-------|
| T-1 | Pipeline end-to-end | Submit a URL via `/submit`. Wait for processing. Verify `audio_url` populated, Listen button appears on detail page, audio plays/pauses. |
| T-2 | UI on card pages | Visit `/browse`, `/search`, `/bookmarks`. Verify listen icon appears below bookmark on cards with `audio_url`. Verify audio plays and other audio stops. |
| T-3 | Navigation cleanup | Start playing audio on detail page. Navigate away. Verify audio stops. |
| T-4 | Single-player enforcement | On `/browse`, play audio on one card. Play on another. Verify first stops, only second plays. |
| T-5 | No audio graceful state | Find tutorial without `audio_url`. Verify no listen button on detail page or card. |
| T-6 | Error resilience | Remove `DEEPGRAM_API_KEY`. Submit URL. Verify tutorial publishes without audio (no crash, `audio_url` null). Restore key. |
| T-8 | Kill switch | Set `AUDIO_ENABLED=false`. Submit URL. Verify no audio generated. Set back to `true`. |
| T-9 | iOS Safari | Open on iOS Safari. Tap listen button. Verify audio plays (not blocked by autoplay policy). |

### 10.4 Deployed Testing (Vercel / battlecat.ai)

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
4. **Verify kill switch** — Temporarily set `AUDIO_ENABLED=false`, confirm pipeline skips audio, then set back to `true`
5. **Verify** — Spot-check tutorials on all 5 pages, including mobile Safari
6. **Monitor** — Watch Vercel function logs for `[audio]` lines, check success/failure counts and after() timing

---

## 12. Open Items

| Item | Priority | Notes |
|------|----------|-------|
| Playback speed control | P2 | Add 1x/1.5x/2x speed toggle to ListenButton |
| Audio progress bar | P2 | Show playback position and duration |
| Download button | P3 | Allow users to download MP3 for offline listening |
| Voice selection | P3 | Let admin choose from multiple Deepgram voices |
| Audio-only feed | P4 | Podcast RSS feed with audio enclosures |
| Streaming playback | P4 | Stream audio as it generates instead of waiting for full file |
|  Old file cleanup | P3 | Script or cron to delete orphaned audio files from storage after regeneration |
|  Structured data | P3 | Add schema.org/AudioObject markup for SEO |
|  User preference | P3 | localStorage toggle to hide listen buttons site-wide |
|  Multi-language voices | P4 | Abstract voice selection for future i18n support |
| Storage monitoring | P3 | Alert when audio bucket exceeds 750MB (75% of free tier) |

---

## 13. Success Criteria

### Phase 1 (Launch)
- New tutorials automatically get audio generated during the processing pipeline
- Listen button appears on tutorial detail pages and tutorial cards across all 5 pages
- Audio plays reliably on desktop and mobile browsers (including iOS Safari)
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
