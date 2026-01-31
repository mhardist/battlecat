# Learnings — Battlecat AI Build

Technical lessons learned during the development and deployment of Battlecat AI. These are real issues encountered during production deployment, not hypothetical concerns.

---

## 1. yt-dlp Does Not Work on Vercel Serverless

**Problem:** The original plan used `yt-dlp` (a Python binary) to extract audio streams from TikTok and subtitles from YouTube. This works locally but fails completely on Vercel serverless functions — there's no way to install arbitrary system binaries in that environment.

**Impact:** This was the #1 requirement for the project (TikTok audio transcription), and it was completely broken on deploy.

**Fix:** Replaced yt-dlp with cloud-based alternatives that work entirely over HTTP:
- **TikTok:** tikwm.com API — returns video stream URLs without needing to download or process locally. Stream URL is passed to Deepgram for transcription.
- **YouTube:** `youtube-transcript` npm package — fetches transcript data via YouTube's internal API, no binary needed.

**Lesson:** When building for serverless (Vercel, Cloudflare Workers, AWS Lambda), every dependency must work over HTTP or be a pure JavaScript/Node.js package. System binaries (yt-dlp, ffmpeg, puppeteer without headless-chromium layer) will not be available. Validate extraction strategies against the deployment target early, not after the site is live.

---

## 2. Self-Referencing HTTP Fetch Fails on Vercel Serverless

**Problem:** The processing pipeline was triggered by making a `fetch()` call from `/api/submit` to `/api/process` on the same server. The response was sent to the client first, then `triggerProcessing().catch(console.error)` ran as a fire-and-forget promise.

On Vercel, once a serverless function sends its response, the execution context is terminated. The fetch to `/api/process` never completed. Submissions were stored in Supabase with status "received" but never progressed.

**Impact:** The entire processing pipeline silently failed. No errors were visible because the `.catch(console.error)` only logged to the terminated function's console.

**Fix:** Used Next.js `after()` API (available since Next.js 15) to schedule background work that runs after the response is sent. The `after()` callback keeps the Vercel function alive until the work completes. Processing logic was extracted into a shared `lib/process-submission.ts` module called directly — no HTTP round-trip needed.

**Lesson:** On serverless platforms, you cannot fire-and-forget async work after sending a response. Use platform-specific APIs:
- **Vercel/Next.js:** `after()` from `next/server`
- **Cloudflare Workers:** `waitUntil()` on the `ExecutionContext`
- **AWS Lambda:** Use SQS/SNS/EventBridge for async work
- **General:** Never make a serverless function call itself via HTTP — inline the logic or use a queue.

---

## 3. Supabase Renamed Its API Keys

**Problem:** Supabase documentation and most tutorials reference `anon public key` and `service_role secret key`. The Supabase dashboard now labels these as:
- **Publishable key** (was: anon public key)
- **Secret key** (was: service_role secret key)

The keys are found under Settings → API (may also be listed under a "Default" section rather than directly alongside the URL).

**Lesson:** When writing setup instructions, note that third-party service UIs change frequently. Include the key purpose/description alongside the expected name so users can identify the right key even if labels change.

---

## 4. WhatsApp Sandbox as Alternative to 10DLC SMS

**Problem:** US phone numbers require 10DLC registration for SMS messaging. This is a multi-step process involving brand registration, campaign registration, and carrier approval — overkill for a personal project.

**Fix:** Used Twilio WhatsApp Sandbox instead. No registration required. Users join by sending "join <two-word-code>" to the sandbox number (+14155238886). Messages arrive via the same Twilio webhook infrastructure.

**Trade-offs:**
- WhatsApp messages arrive with `From=whatsapp:+1xxx` — needed to strip the `whatsapp:` prefix for phone number normalization
- Sandbox requires each user to opt in with the join message
- Sandbox is for development only — production WhatsApp requires Meta Business verification

**Lesson:** For personal/prototype projects, WhatsApp Sandbox is a faster path than SMS. The API is nearly identical (same TwiML response format, same webhook structure). Consider it as a first option rather than a fallback.

---

## 5. Vercel Root Directory Configuration

**Problem:** The project is a monorepo (`playground/battlecat`). Vercel defaulted to deploying from the repo root, where there's no Next.js app. The deployment succeeded (just the root README) but the site returned 404 for all routes.

**Fix:** Set "Root Directory" to `battlecat` in Vercel → Settings → General.

**Lesson:** For monorepos on Vercel, the root directory setting is required and easy to miss. Vercel doesn't warn you if it can't find a framework — it just deploys whatever's in the root.

---

## 6. DNS Configuration: GoDaddy + Vercel

**Problem:** The original plan used Cloudflare for DNS/hosting. Switched to Vercel mid-project for better Next.js support.

**Setup that worked:**
1. Keep DNS at GoDaddy (don't transfer nameservers)
2. Add an A record: `@` → `76.76.21.21` (Vercel's IP)
3. Add a CNAME record: `www` → `cname.vercel-dns.com`
4. Add the domain in Vercel → Settings → Domains
5. Vercel handles SSL automatically

**Lesson:** Vercel doesn't require transferring nameservers. Simple A + CNAME records work. The key step people miss is adding the domain in the Vercel dashboard — DNS records alone aren't enough.

---

## 7. Vercel Deploys from Branch, Not Feature Branches

**Problem:** All development happened on a feature branch (`claude/ai-learning-organizer-*`), but Vercel was configured to deploy from `main`. After the first deploy, the site was empty because `main` had none of the battle cat code.

**Fix:** Created a PR, merged feature branch to `main`, and Vercel auto-deployed.

**Lesson:** Set up Vercel deployment early and merge to `main` frequently. Development on long-lived feature branches without deployment verification leads to integration surprises.

---

## 8. Server Components vs. Client Components Data Flow

**Problem:** Some pages need to be server components (for SEO, ISR) while others need to be client components (for interactivity like bookmarks, search). Both need to read from Supabase.

**Solution:**
- **Server pages** (home, tutorial detail, level pages, learning paths): Use an async data layer (`data/tutorials.ts`) that calls Supabase directly. ISR with 60-second revalidation.
- **Client pages** (browse, search, bookmarks, level-up): Start with seed data for instant render, then fetch from `/api/tutorials` on mount to get latest Supabase data.
- **Seed data fallback**: The data layer merges Supabase results with seed data, deduplicating by slug. This means the site always shows content even if Supabase is down.

**Lesson:** The dual data-fetching pattern (server-side async + client-side API) works well for Next.js apps that need both SEO and interactivity. The key is having a shared data layer that both paths use, with seed data as a fallback.

---

## 9. maxDuration for Long-Running Serverless Functions

**Problem:** The processing pipeline (extract content + AI classification + tutorial generation) can take 30-60 seconds. Vercel's default serverless function timeout is 10 seconds on the Hobby plan.

**Fix:** Added `export const maxDuration = 60` to route handlers that run the processing pipeline. This tells Vercel to allow up to 60 seconds of execution.

**Lesson:** Always set `maxDuration` on routes that call external APIs (especially LLMs). The default timeout is almost always too short for AI-heavy pipelines.

---

## 10. Cloud API Alternatives for Common Binary Dependencies

When deploying to serverless, these replacements work:

| Binary | Cloud Alternative | Notes |
|--------|-------------------|-------|
| yt-dlp (TikTok) | tikwm.com API | Free, returns video URLs + metadata |
| yt-dlp (YouTube) | youtube-transcript npm | Pure JS, fetches from YouTube's internal API |
| ffmpeg | Deepgram SDK (direct URL) | Pass audio URL directly, no local processing needed |
| puppeteer | Jina Reader API | Handles JS-rendered pages server-side |
| wkhtmltopdf | None needed | Use CSS print styles or react-pdf instead |

**Lesson:** For every binary dependency, there's usually a cloud API that does the same thing over HTTP. The trade-off is latency and rate limits vs. zero deployment complexity.

---

## 11. Supabase `.single()` vs `.maybeSingle()` — Silent Crashes

**Problem:** The content merge query used `.single()` to check if a tutorial already existed on the same topic at the same level. When no matching tutorial existed (the common case for new topics), `.single()` throws a PostgREST error because it expects exactly one row. This silently crashed the processing pipeline.

**Fix:** Changed to `.maybeSingle()` which returns `null` when zero rows match instead of throwing.

**Lesson:** In Supabase/PostgREST, `.single()` is for queries that MUST return exactly one row (like a primary key lookup). For "does this exist?" queries, always use `.maybeSingle()`. The PostgREST error message (`PGRST116`) doesn't clearly indicate this is a "zero rows" problem, making it hard to debug.

---

## 12. Slug Collisions in AI-Generated Content

**Problem:** Claude sometimes generates the same slug for similar articles (e.g., two articles about "AI coding tools" both get slug `ai-coding-tools`). Supabase's unique constraint on the slug column throws error code `23505`, crashing the insert.

**Fix:** Catch PostgreSQL error code `23505` (unique violation), append a random 6-character suffix to the slug, and retry the insert once.

**Lesson:** AI-generated slugs are not reliably unique. When using LLMs to generate database-unique fields, always have a collision-handling strategy. A simple random suffix retry is sufficient — you don't need elaborate deduplication.

---

## 13. External API Calls Need Timeout Protection

**Problem:** External API calls (Jina Reader, tikwm, PDF downloads) occasionally hang indefinitely, consuming the entire 60-second serverless budget and leaving submissions stuck in "processing" status.

**Fix:** Created a `fetchWithTimeout()` wrapper using `AbortController` with a 20-second default timeout (25 seconds for PDF downloads). Applied to all external fetch calls in the extraction pipeline.

**Lesson:** Never call external APIs without a timeout. The default Node.js `fetch()` has no timeout — it will wait forever. Use `AbortController` with `signal` parameter. Set timeouts well below your serverless function's `maxDuration` to leave room for retries and the AI processing step.

---

## 14. Image Generation Prompts Need Content Context

**Problem:** Hero images generated by Together AI FLUX were generic abstract shapes with no relation to the tutorial content. The prompt only included the title and vague topic references.

**Fix:** Rewrote the image generation to accept the tutorial `summary` and `actionItems` as parameters, and changed the prompt style from "abstract geometric shapes" to "infographic/mind-map" incorporating actual content details.

**Lesson:** When generating images for content, pass the actual content (or a summary) to the prompt — not just metadata like titles and tags. The more context the image model has, the more relevant the output.

---

## 15. localStorage Hooks Need Consistent Patterns

**Problem:** As more client-side state was added (bookmarks, ratings, progress, achievements), inconsistent patterns between hooks led to bugs and duplicated logic.

**Solution:** Established a standard localStorage hook pattern used across all four hooks:
1. **Two-effect pattern**: First effect loads from localStorage on mount, second effect persists on change (only after `loaded` flag is true)
2. **SSR safety**: All localStorage access wrapped in try-catch
3. **Stable references**: Use `useCallback` for all returned functions to prevent unnecessary re-renders
4. **Typed state**: Strong TypeScript types (Set, Record, or custom interface)

**Hooks following this pattern:**
- `useBookmarks` — Set<string> of tutorial IDs
- `useRatings` — Record<string, number> of tutorial ID → rating
- `useProgress` — Record<string, ProgressEntry> with completion + notes
- `useAchievements` — Unlocked IDs + tracking counters

**Lesson:** When a codebase has multiple localStorage-backed hooks, establish the pattern early and follow it consistently. The two-effect pattern (load → persist) with a `loaded` guard prevents hydration mismatches and race conditions.
