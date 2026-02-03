# Listen to Tutorial — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-generated MP3 audio to tutorials via Deepgram Aura-2 TTS, with a ListenButton component across all tutorial surfaces.

**Architecture:** Markdown body → regex strip → sentence-boundary chunking → Deepgram TTS per chunk → MP3 concatenation (with header stripping) → Supabase Storage upload → `audio_url` on tutorials table → `ListenButton` component with icon/bar variants, single-player enforcement, MediaSession API, iOS Safari support.

**Tech Stack:** Deepgram Aura-2 (`@deepgram/sdk` v4.11.3 — already installed), Supabase Storage, Vitest (new), React 19 client components.

**Local Build Constraints:** No Deepgram/Supabase access during dev. All external calls fail gracefully (never-throw pattern). Deploy first, then run migration + create bucket on server.

**PRD Reference:** `LISTEN-TO-TUTORIAL.md` (in project root)

---

## How to Execute This Plan from a New Claude Code Session

### One-Shot Execution (Recommended)

Open a **new terminal** in the battlecat directory and run Claude Code. Paste the following as your first prompt:

```
Read the implementation plan at /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
and the PRD at /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/LISTEN-TO-TUTORIAL.md

Execute ALL tasks in this plan from start to finish using TDD.

Rules:
1. Work through phases 1-6 in order. Within each phase, follow the task sequence exactly.
2. TDD is mandatory for all logic tasks: write the failing test FIRST, run it to confirm RED, implement code, run to confirm GREEN, then commit.
3. For Phase 3 + Phase 5, dispatch parallel subagents (they are independent).
4. After EACH task: run `npx vitest run` and `npx tsc --noEmit` to verify nothing is broken.
5. Commit after each task with the exact commit message specified in the plan.
6. After ALL tasks complete, run the full verification checklist: `npx vitest run && npx tsc --noEmit && npm run build && npm run lint`
7. Use /clear between phases to keep context clean.
8. Do NOT skip any steps. Do NOT modify tests to make them pass — fix the implementation instead.
9. When the plan says "write failing tests covering X, Y, Z" — write comprehensive tests for ALL items listed, not just a subset.
10. For the ListenButton component, follow the feature table exactly (single-player, iOS Safari, MediaSession, a11y, error handling, loading state).

Start with Phase 1, Task 1.1 now.
```

### Alternative: Subagent-Driven Execution

For faster execution with parallel subagents, paste this instead:

```
Read the implementation plan at /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
and the PRD at /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/LISTEN-TO-TUTORIAL.md

Use the superpowers:subagent-driven-development skill to execute this plan.

Dispatch strategy:
- Phase 1: Execute tasks 1.1 and 1.2 sequentially (foundation — everything depends on this)
- Phase 2: Execute tasks 2.1, 2.2, 2.3 in a SINGLE subagent sequentially (they share files)
- Phase 3 + Phase 5: Dispatch TWO parallel subagents (3.1 and 5.1 are independent)
- Phase 4: Execute task 4.1 after Phase 3 completes
- Phase 6: Execute tasks 6.1, 6.2, 6.3 sequentially after Phase 4 + 5 complete

TDD is mandatory: write failing test → run RED → implement → run GREEN → commit.
After each phase, run a code review subagent to verify the work.
Use the superpowers:verification-before-completion skill before claiming the plan is done.
Run the full verification checklist at the end: npx vitest run && npx tsc --noEmit && npm run build && npm run lint
```

### Alternative: Manual Phase-by-Phase

If you prefer maximum control, execute one phase per session:

```
# Phase 1 — paste this first:
Read /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
Execute Phase 1 tasks (1.1 and 1.2) using TDD. Commit after each task.
Run: npx vitest run && npx tsc --noEmit

# After Phase 1 completes, /clear and paste:
Read /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
Execute Phase 2 (tasks 2.1, 2.2, 2.3) using TDD. These share files so run sequentially.
Run: npx vitest run && npx tsc --noEmit

# After Phase 2, /clear and paste:
Read /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
Execute Phase 3 (task 3.1) and Phase 5 (task 5.1) in PARALLEL using subagents.
Run: npx vitest run && npx tsc --noEmit

# After Phase 3+5, /clear and paste:
Read /Users/developer-sandbox/Desktop/Development/miki/playground/battlecat/i.md
Execute Phase 4 (task 4.1) then Phase 6 (tasks 6.1, 6.2, 6.3).
Run full verification: npx vitest run && npx tsc --noEmit && npm run build && npm run lint
```

---

## Claude Code Execution Strategy

**Recommended: Subagent-Driven Development (single session)**

Based on best practices research:

- **Fresh subagent per task** — each task gets a clean 200k context window
- **Parallel dispatch** where tasks are independent (Phase 3 + Phase 5)
- **Sequential dispatch** where tasks have file dependencies
- **Code review subagent** between phases to catch drift
- **TDD enforced** — every logic task writes failing test first, then implements

**Context Management Rules:**
- Main orchestrator stays lean — only dispatches tasks and reviews results
- Each subagent gets complete file paths, exact code, and verification commands
- `/clear` between phases to reset orchestrator context
- Subagents handle the heavy reading/writing; orchestrator just coordinates

**File Contention Strategy:** Tasks 2.1/2.2/2.3 all touch the same files (`generate-audio.ts` + its test file). Run them sequentially in one subagent to avoid merge conflicts.

---

## Critical File Paths

| File | Action | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modify line 63 | Add `audio_url: string \| null` |
| `src/data/seed-tutorials.ts` | Modify 10 locations | Add `audio_url: null` to each seed |
| `src/db/schema.sql` | Modify line 32 | Add `audio_url text` column |
| `src/db/migrations/001_add_audio_url.sql` | Create | Versioned migration |
| `.env.example` | Modify | Add `AUDIO_ENABLED`, `TOGETHER_API_KEY` |
| `vitest.config.ts` | Create | Test runner config with `@/` alias |
| `src/lib/generate-audio.ts` | Create | Core audio module (strip, chunk, TTS, upload) |
| `src/lib/__tests__/generate-audio.test.ts` | Create | Unit tests for pure functions |
| `src/lib/__tests__/types.test.ts` | Create | Type + seed data tests |
| `src/components/ListenButton.tsx` | Create | Audio player component |
| `src/lib/process-submission.ts` | Modify lines 152-170 | Parallel image+audio gen |
| `src/components/TutorialActions.tsx` | Modify | Add ListenButton bar variant |
| `src/components/TutorialCard.tsx` | Modify lines 140-164 | Add ListenButton icon variant |
| `src/app/tutorials/[slug]/page.tsx` | Modify lines 130-135 | Pass audioUrl prop |

---

## Phase 1: Infrastructure (Sequential)

### Task 1.1: Install Vitest and Configure Test Runner

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/smoke.test.ts` (temporary verification)
- Modify: `package.json` (add vitest devDep + test scripts)

**Step 1: Install vitest**
```bash
npm install --save-dev vitest
```

**Step 2: Create `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Step 3: Add scripts to `package.json`**
Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Write smoke test** `src/lib/__tests__/smoke.test.ts`
```typescript
import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('resolves @/ alias', async () => {
    const types = await import('@/types')
    expect(types).toBeDefined()
  })
})
```

**Step 5: Run test to verify**
```bash
npx vitest run
```
Expected: 2 tests pass.

**Step 6: Delete smoke test, commit**
```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "feat: add vitest test runner with path alias configuration"
```

---

### Task 1.2: Update Tutorial Type + Seed Data + Schema + Env

**Files:**
- Modify: `src/types/index.ts:63` — add `audio_url: string | null` after `image_url`
- Modify: `src/data/seed-tutorials.ts` — add `audio_url: null` to all 10 seed objects (after each `image_url: null,` line)
- Modify: `src/db/schema.sql:32` — add `audio_url text,` after `image_url text,`
- Create: `src/db/migrations/001_add_audio_url.sql`
- Modify: `.env.example` — add `AUDIO_ENABLED` and `TOGETHER_API_KEY`

**Step 1: Write failing test** `src/lib/__tests__/types.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import type { Tutorial } from '@/types'
import { SEED_TUTORIALS } from '@/data/seed-tutorials'

describe('Tutorial type includes audio_url', () => {
  it('accepts audio_url as null', () => {
    const partial: Pick<Tutorial, 'audio_url'> = { audio_url: null }
    expect(partial.audio_url).toBeNull()
  })

  it('accepts audio_url as string', () => {
    const partial: Pick<Tutorial, 'audio_url'> = { audio_url: 'https://example.com/a.mp3' }
    expect(partial.audio_url).toBe('https://example.com/a.mp3')
  })
})

describe('seed tutorials have audio_url', () => {
  it('every seed tutorial has audio_url: null', () => {
    for (const t of SEED_TUTORIALS) {
      expect(t).toHaveProperty('audio_url')
      expect(t.audio_url).toBeNull()
    }
  })
})
```

**Step 2: Run test (RED)**
```bash
npx vitest run src/lib/__tests__/types.test.ts
```
Expected: TypeScript error — `audio_url` does not exist on Tutorial.

**Step 3: Implement all changes**

`src/types/index.ts` — add after line 63 (`image_url: string | null;`):
```typescript
  audio_url: string | null;
```

`src/data/seed-tutorials.ts` — add `audio_url: null,` after each `image_url: null,` line (10 insertions total)

`src/db/schema.sql` — add after line 32 (`image_url text,`):
```sql
  audio_url text,
```

Create `src/db/migrations/001_add_audio_url.sql`:
```sql
-- Migration 001: Add audio_url column to tutorials table
-- Run on Supabase SQL editor after deploying code.
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;
```

`.env.example` — append:
```
# Together AI (hero image generation)
TOGETHER_API_KEY=your-together-api-key

# Audio generation (set to "true" to enable)
AUDIO_ENABLED=false
```

**Step 4: Run test (GREEN)**
```bash
npx vitest run src/lib/__tests__/types.test.ts
```

**Step 5: Verify full build**
```bash
npx tsc --noEmit
```

**Step 6: Commit**
```bash
git add src/types/index.ts src/data/seed-tutorials.ts src/db/schema.sql src/db/migrations/ .env.example
git commit -m "feat: add audio_url to Tutorial type, seed data, schema, and migration"
```

---

## Phase 2: Core Pure Functions with TDD (Single subagent — sequential due to shared files)

### Task 2.1: `stripMarkdownToScript()`

**Files:**
- Create: `src/lib/generate-audio.ts` (initial — just this function)
- Create: `src/lib/__tests__/generate-audio.test.ts`

**Step 1: Write failing tests** — full test suite covering:
- Removes headers (`##`, `###`)
- Removes bold/italic (`**`, `*`, `__`, `_`)
- Converts links `[text](url)` → keeps text, removes URL
- Removes fenced code blocks (` ```...``` `)
- Removes inline code backticks
- Removes blockquotes (`>`)
- Removes image references (`![alt](url)`)
- Removes horizontal rules (`---`, `***`, `___`)
- Removes list markers (`-`, `*`, `1.`)
- Decodes HTML entities (`&amp;` → `&`, `&lt;` → `<`, `&gt;` → `>`)
- Strips inline HTML tags (`<strong>`, `<br>`, etc.)
- Removes bare URLs (`https://...`)
- Removes table markup (`| col |` lines)
- Collapses 3+ newlines → 2
- Returns empty string for empty input
- Handles real seed tutorial HTML body content (seed-01 uses `<h2>`, `<p>`, `<ul>`, `<li>`, `<strong>` tags)

**Step 2: Run test (RED)** — function not exported yet

**Step 3: Implement** — pure regex-based stripping (no dependencies):
```
Order of operations: fenced code blocks → inline code → images → links → tables →
horizontal rules → headers → blockquotes → list markers → bold/italic → bare URLs →
HTML tags → HTML entities → whitespace collapse → trim
```

**Step 4: Run test (GREEN)**

**Step 5: Commit** `feat: add stripMarkdownToScript() with TDD tests`

---

### Task 2.2: `chunkText()`

**Files:**
- Modify: `src/lib/__tests__/generate-audio.test.ts` (append tests)
- Modify: `src/lib/generate-audio.ts` (add function)

**Step 1: Write failing tests** covering:
- Empty string → empty array
- Short text → single chunk
- Splits at sentence boundaries (`. `, `! `, `? `)
- Single sentence >1900 chars → word boundary fallback
- All content preserved (no text lost)
- Default maxChars is 1900
- Chunks are trimmed

**Step 2: Run test (RED)**

**Step 3: Implement** — sentence-boundary splitter with word-boundary fallback:
```
While remaining > maxChars:
  1. Search backwards from maxChars for ". " or "! " or "? " or ".\n"
  2. If found: split there
  3. If not found: split at last space before maxChars
  4. If no space: hard split at maxChars
```

**Step 4: Run test (GREEN)**

**Step 5: Commit** `feat: add chunkText() sentence-boundary splitter with TDD tests`

---

### Task 2.3: `stripMp3Headers()`

**Files:**
- Modify: `src/lib/__tests__/generate-audio.test.ts` (append tests)
- Modify: `src/lib/generate-audio.ts` (add function)

**Step 1: Write failing tests** covering:
- Buffer without ID3 header → returned unchanged
- Buffer with ID3v2 header → header stripped, audio data preserved
- Empty buffer → empty buffer
- Buffer too small for ID3 → returned unchanged

**Step 2: Run test (RED)**

**Step 3: Implement** — ID3v2 header detection and stripping:
```
If bytes 0-2 == "ID3" (0x49, 0x44, 0x33):
  Parse syncsafe integer size from bytes 6-9 (7 bits per byte)
  headerSize = 10 + size
  Return buffer.subarray(headerSize)
Else: return buffer unchanged
```

**Step 4: Run test (GREEN)**

**Step 5: Commit** `feat: add stripMp3Headers() utility with TDD tests`

---

## Phase 3: Audio Generation Module (Depends on Phase 2)

### Task 3.1: `generateTutorialAudio()` Main Function

**Files:**
- Modify: `src/lib/generate-audio.ts` (add main function + upload helper)
- Modify: `src/lib/__tests__/generate-audio.test.ts` (add tests)

**Step 1: Write failing tests** covering:
- Returns null when `AUDIO_ENABLED` is not `"true"`
- Returns null when `AUDIO_ENABLED` is unset
- Returns null when `DEEPGRAM_API_KEY` is unset
- Returns null when stripped text < 50 chars
- Never throws on any error (catches Deepgram/network failures gracefully)

**Step 2: Run test (RED)**

**Step 3: Implement** — main function following `generateTutorialImage` pattern (`src/lib/generate-image.ts`):

```typescript
export async function generateTutorialAudio(
  body: string, slug: string
): Promise<string | null>
```

Key implementation details:
- Kill switch: `if (process.env.AUDIO_ENABLED !== 'true')` → log `[audio] Audio generation disabled, skipping`, return null
- API key: `if (!process.env.DEEPGRAM_API_KEY)` → log, return null
- Strip body → check length (< 50 chars → skip) → chunk → TTS per chunk → strip MP3 headers from chunks 2+ → concatenate → upload
- Deepgram SDK: `const { createClient } = await import('@deepgram/sdk')` then `deepgram.speak.request({ text }, { model: 'aura-2-athena-en', encoding: 'mp3', sample_rate: 24000 })`
- Stream collection: `response.getStream()` → `reader.read()` loop → `Buffer.concat()`
- Upload helper: `createServerClient()` from `@/lib/supabase`, bucket `"audio"`, path `tutorials/{slug}-{timestamp}.mp3`, contentType `audio/mpeg`
- All errors caught and logged with `[audio]` prefix, return null (never throw)
- Success log: `[audio] Generated for {slug}: {chunks} chunks, {bytes} bytes, {ms}ms`

**Step 4: Run test (GREEN)**

**Step 5: Commit** `feat: add generateTutorialAudio() with Deepgram TTS and Supabase upload`

---

## Phase 4: Pipeline Integration (Depends on Phase 3)

### Task 4.1: Parallel Audio+Image in processSubmission

**File:** `src/lib/process-submission.ts`

**Changes:**

1. **Add import** (line 3):
   ```typescript
   import { generateTutorialAudio } from "@/lib/generate-audio";
   ```

2. **Add pipeline timer** (inside try block, after line 40):
   ```typescript
   const pipelineStart = Date.now();
   ```

3. **Hoist merged result variable** (before the `if (existing)` block at line 82):
   ```typescript
   let mergedResult: { body: string; summary: string; action_items: string[] } | null = null;
   ```
   Then inside the `if (existing)` block, set `mergedResult = merged;` after the `mergeTutorial()` call.

4. **Replace step 8** (lines 152-170) with parallel image+audio generation:
   ```typescript
   // 8. Generate hero image + audio in parallel (non-fatal)
   let imageUrl: string | null = null;
   let audioUrl: string | null = null;

   try {
     const imagePromise = generateTutorialImage(
       generated.title,
       generated.classification.topics,
       generated.classification.maturity_level,
       generated.summary,
       generated.action_items,
     );

     // Use merged body for audio when merging, generated body for new tutorials
     const audioBody = mergedResult?.body ?? generated.body;
     const audioSlug = existing ? existing.slug : generated.slug;

     const audioPromise = Promise.race([
       generateTutorialAudio(audioBody, audioSlug),
       new Promise<null>((resolve) => setTimeout(() => {
         console.log('[audio] Timeout after 20s');
         resolve(null);
       }, 20_000)),
     ]);

     [imageUrl, audioUrl] = await Promise.all([imagePromise, audioPromise]);

     const updates: Record<string, unknown> = {};
     if (imageUrl) updates.image_url = imageUrl;
     if (audioUrl) updates.audio_url = audioUrl;
     if (Object.keys(updates).length > 0) {
       await supabase.from("tutorials").update(updates).eq("id", tutorialId);
     }
     if (imageUrl) console.log(`[process] Generated hero image for ${tutorialId}`);
     if (audioUrl) console.log(`[process] Generated audio for ${tutorialId}`);
   } catch (mediaErr) {
     console.error(`[process] Media generation failed (non-fatal):`, mediaErr);
   }
   ```

5. **Add elapsed time log** (before the return at ~line 215):
   ```typescript
   const elapsed = Date.now() - pipelineStart;
   console.log(`[process] processSubmission completed in ${elapsed}ms`);
   ```

**No unit test** — integration-heavy. Verified by manual testing (PRD T-1).

**Verify:**
```bash
npx tsc --noEmit
```

**Commit:** `feat: integrate audio generation into pipeline with parallel execution and 20s timeout`

---

## Phase 5: Frontend — ListenButton (Can run PARALLEL with Phase 3/4 — only depends on Phase 1 types)

### Task 5.1: ListenButton Component

**File:** Create `src/components/ListenButton.tsx`

**Implementation:** `"use client"` component with these features:

| Feature | Implementation |
|---------|---------------|
| Two variants | `variant: "icon" \| "bar"` prop |
| Three states | `idle → loading → playing` (plus `error`) |
| Single-player | `"battlecat-audio-play"` CustomEvent on window — dispatch before play, listen to pause self |
| iOS Safari | Real DOM `<audio ref={audioRef}>` element (hidden) + `play()` called synchronously in click handler |
| MediaSession | `navigator.mediaSession.metadata` with title, artist "Battlecat AI", artwork from image_url |
| MediaSession handlers | `play`, `pause`, `stop` action handlers |
| MediaSession state | Update `playbackState` on play/pause/end events |
| a11y | Dynamic `aria-label` ("Play/Pause tutorial audio"), `aria-pressed`, keyboard Enter/Space via native `<button>` |
| Error handling | `<audio>` `error` event → set error state → show "Audio Unavailable" for 3s → reset to idle |
| Loading state | `animate-pulse` on icon between click and `canplay`/successful `play()` |
| Cleanup | `useEffect` return cleanup: pause audio, remove window event listeners |

**Props:**
```typescript
interface ListenButtonProps {
  audioUrl: string;
  variant: "icon" | "bar";
  tutorialTitle?: string;
  imageUrl?: string | null;
}
```

**Icon variant:** Compact button with speaker/pause SVG icon, matches bookmark icon sizing in TutorialCard
**Bar variant:** `inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium` — matches Bookmark/Complete button styling in TutorialActions

**Color scheme:** Uses existing `bc-primary` for active state (matches other interactive elements)

**Critical iOS Safari requirement:** The `play()` call MUST happen synchronously in the click handler call stack. Do NOT defer it via `useEffect` or state updates. Set `audio.src` and call `audio.play()` directly in the `onClick` handler.

**No unit test** — browser APIs (Audio, MediaSession, DOM events). Manual testing per PRD T-2 through T-9b.

**Verify:**
```bash
npx tsc --noEmit
```

**Commit:** `feat: add ListenButton component with icon/bar variants, single-player, MediaSession, a11y`

---

## Phase 6: Wiring (Depends on Phase 4 + Phase 5 both complete)

### Task 6.1: Wire into TutorialActions

**File:** `src/components/TutorialActions.tsx`

**Changes:**
1. Add import: `import { ListenButton } from "./ListenButton";`
2. Add props to interface (after line 13 `isStale?: boolean;`):
   ```typescript
   audioUrl?: string | null;
   imageUrl?: string | null;
   ```
3. Add to destructured props (line 16-21)
4. Insert between Bookmark button (line 80) and Mark Complete button (line 82):
   ```tsx
   {/* Listen */}
   {audioUrl && (
     <ListenButton audioUrl={audioUrl} variant="bar"
       tutorialTitle={tutorialTitle} imageUrl={imageUrl} />
   )}
   ```

**Commit:** `feat: wire ListenButton bar variant into TutorialActions`

---

### Task 6.2: Wire into TutorialCard

**File:** `src/components/TutorialCard.tsx`

**Changes:**
1. Add import: `import { ListenButton } from "./ListenButton";`
2. Replace the bookmark `<button>` block (lines 140-164) with a flex column wrapper containing both bookmark and listen:
   ```tsx
   {showBookmark && onToggleBookmark && (
     <div className="flex flex-col items-center gap-1">
       <button
         onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
           onToggleBookmark(tutorial.id);
         }}
         className="shrink-0 p-1 text-bc-text-secondary hover:text-bc-secondary transition-colors"
         aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
       >
         <svg className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
         </svg>
       </button>
       {tutorial.audio_url && (
         <ListenButton audioUrl={tutorial.audio_url} variant="icon"
           tutorialTitle={tutorial.title} imageUrl={tutorial.image_url} />
       )}
     </div>
   )}
   ```

Note: No prop changes needed — `tutorial.audio_url` comes from the `Tutorial` type (updated in Task 1.2).

**Commit:** `feat: wire ListenButton icon variant into TutorialCard`

---

### Task 6.3: Wire into Tutorial Detail Page

**File:** `src/app/tutorials/[slug]/page.tsx`

**Changes:** Add 2 props to `<TutorialActions>` at lines 130-135:
```tsx
<TutorialActions
  tutorialId={tutorial.id}
  tutorialTitle={tutorial.title}
  tutorialSlug={tutorial.slug}
  isStale={tutorial.is_stale}
  audioUrl={tutorial.audio_url}
  imageUrl={tutorial.image_url}
/>
```

**Commit:** `feat: pass audioUrl and imageUrl to TutorialActions on detail page`

---

## Execution Order & Parallelization

```
Phase 1 (sequential — foundation):
  Task 1.1: Vitest setup
  Task 1.2: Types + seed + schema + env + migration

Phase 2 (single subagent, sequential — shared files):
  Task 2.1: stripMarkdownToScript()     [TDD]
  Task 2.2: chunkText()                 [TDD]
  Task 2.3: stripMp3Headers()           [TDD]

Phase 3 (depends on Phase 2):           Phase 5 (depends on Phase 1 only):
  Task 3.1: generateTutorialAudio()      Task 5.1: ListenButton component
        |                                       |
Phase 4 (depends on Phase 3):           (wait for both 4.1 + 5.1)
  Task 4.1: Pipeline integration                |

Phase 6 (depends on Phase 4 + Phase 5):
  Task 6.1: TutorialActions wiring
  Task 6.2: TutorialCard wiring
  Task 6.3: Detail page wiring
```

**Maximum parallelism:** Phase 3 + Phase 5 can run concurrently (2 subagents).
**Total tasks:** 10
**Total commits:** 10

---

## Verification Checklist (Post-Implementation)

```bash
# 1. All tests pass
npx vitest run

# 2. No type errors
npx tsc --noEmit

# 3. Production build succeeds
npm run build

# 4. Lint clean
npm run lint
```

**Manual checks before deploy:**
- Seed tutorials show NO listen button (audio_url is null)
- Build output has no warnings related to ListenButton or generate-audio

**Post-deploy checklist:**
1. Run migration on Supabase SQL editor: `ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS audio_url text;`
2. Create `audio` bucket in Supabase Dashboard → Storage → New bucket → Name: `audio`, Public: Yes
3. Set `AUDIO_ENABLED=true` in Vercel environment variables
4. Submit a URL via /submit → verify `[audio]` log lines in Vercel → verify Listen button appears on tutorial page
5. Test single-player enforcement across cards on /browse
6. Test iOS Safari playback (tap listen, verify audio plays)
7. Test lock screen controls (play audio, lock phone, verify controls appear)

---

## Sources

- [Anthropic Official: Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Subagent Parallelization Patterns](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/)
- [Claude Code Best Practices Collection](https://rosmur.github.io/claudecode-best-practices/)
- [Task Tool vs Subagents](https://amitkoth.com/claude-code-task-tool-vs-subagents/)
- [Multi-agent Parallel Coding](https://medium.com/@codecentrevibe/claude-code-multi-agent-parallel-coding-83271c4675fa)
- [Practical Guide to Subagents](https://www.eesel.ai/blog/subagents-in-claude-code)
