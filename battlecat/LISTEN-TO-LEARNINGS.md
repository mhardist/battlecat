# LISTEN-TO-LEARNINGS

**Feature:** Text-to-Speech Audio for Tutorials
**Date:** February 4, 2026
**Pipeline:** TTD (Task + Test Driven Development)

---

## Chrome Verification Results

All BV-1 through BV-9 verification steps passed on first attempt. No Chrome-caught bugs.

---

## Build Issues Resolved During Pipeline

### 1. TypeScript: `Buffer<ArrayBufferLike>` not assignable to `Buffer<ArrayBuffer>`

**File:** `src/lib/generate-audio.ts:355`
**Symptom:** `tsc --noEmit` failed. `Buffer.concat()` returns `Buffer<ArrayBufferLike>` in Node 22 types, but `stripId3Header()` expects `Buffer<ArrayBuffer>`.
**Fix:** Cast `Buffer.concat(streamChunks)` with explicit type annotation.
**Lesson:** Node 22's stricter Buffer generics require explicit type handling when mixing `Uint8Array[]` from web streams with Node `Buffer` APIs.

### 2. TypeScript: `process.env.NODE_ENV` is read-only in test files

**File:** `src/lib/__tests__/dev-audio.test.ts`
**Symptom:** `tsc --noEmit` flagged assignments to `process.env.NODE_ENV` as read-only.
**Fix:** Cast `process.env` to `Record<string, string | undefined>` before assignment.
**Lesson:** TypeScript's `@types/node` marks `NODE_ENV` as readonly. Test code that stubs environment variables needs explicit casts.

### 3. TypeScript: Vitest `Mock<Procedure | Constructable>` not callable

**File:** `src/lib/__tests__/process-submission.test.ts`
**Symptom:** `tsc --noEmit` reported mock variables not callable.
**Fix:** Cast mock references to `(...args: unknown[]) => unknown` before calling.
**Lesson:** Vitest's `vi.fn()` return type doesn't directly satisfy function call signatures when stored in variables. Explicit callable casts are needed.

### 4. sanitizeScriptText: HTML tags with URLs leak URL text

**File:** `src/lib/generate-audio.ts`
**Symptom:** Input like `<a href="http://example.com">link</a>` would leave `http://example.com` in the output because the URL regex consumed characters through quote boundaries before HTML tag stripping ran.
**Fix:** Moved HTML tag stripping (SAN-7) before URL removal (SAN-1) in the processing pipeline.
**Lesson:** Sanitization step ordering matters. Tags containing URLs must be stripped first so their inner content (including URLs) is removed as a unit.

---

## Architecture Observations

### Parallel subagent execution works well
Phases 1 and 2 each ran 3 subagents in parallel. The main risk is file conflicts when multiple agents write to the same file. Mitigation: agents check for existing content and append rather than overwrite.

### `withDevAudio()` pattern is effective for dev experience
Injecting `/api/tts/{slug}` URLs at the data access layer means no component changes are needed for dev audio to work. The dev API route serves pre-generated MP3 files from the filesystem.

### Promise.all for image + audio is the right pattern
Both are non-blocking, independent operations. Running them in parallel reduces total pipeline time. Both have `.catch()` handlers that return `null` on failure.

---

## QA Verification Gaps

Three gaps were identified during QA verification of the TTD pipeline output:

### 1. Missing `TOGETHER_API_KEY` in `.env.example`

**Gap:** The TTS pipeline uses Together AI as a provider, but `.env.example` did not include `TOGETHER_API_KEY`, making it invisible to new developers setting up the project.
**Fix:** Added `TOGETHER_API_KEY=your-together-key` with a descriptive comment to `.env.example`.

### 2. Six ListenButton test cases specified in PRD but not implemented

**Gap:** The PRD specified test cases FE-8, FE-10, FE-11, FE-12, FE-13, and FE-17 for the `ListenButton` component. These were implemented in the component but had no corresponding tests in `ListenButton.test.tsx`.
**Tests added:**
- **FE-8:** Error event on `<audio>` resets playing state
- **FE-10:** Cleanup on unmount pauses audio and removes event listeners
- **FE-11:** MediaSession API handlers registered for play, pause, stop (with cleanup)
- **FE-12:** MediaSession metadata (title, artist: "Battlecat AI", artwork)
- **FE-13:** MediaSession playbackState updates on play/pause
- **FE-17:** Error state shows "Audio unavailable" text, resets after 3 seconds

**jsdom note:** `navigator.mediaSession` is not available in jsdom. Tests FE-11/12/13 required mocking via `Object.defineProperty(navigator, 'mediaSession', ...)`.

### 3. LISTEN-TO-LEARNINGS.md located outside project root

**Gap:** The learnings document was stored at `docs/LISTEN-TO-LEARNINGS.md` (monorepo root), but the convention for project documentation is the `battlecat/` project root for discoverability.
**Fix:** Moved to `battlecat/LISTEN-TO-LEARNINGS.md` via `git mv`.
