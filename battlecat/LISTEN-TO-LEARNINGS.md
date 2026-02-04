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
