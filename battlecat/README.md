# Battlecat AI

**battlecat.ai** — Send a link from your iPhone via WhatsApp (or paste it on the web), get organized AI learning tutorials mapped to the AI Maturity Framework (L0-L4).

## Live Site

**https://battlecat.ai** — Deployed on Vercel, auto-deploys from `main` branch.

## Architecture

```
iPhone WhatsApp → Twilio → /api/ingest ─┐
Web Form       → /api/submit ───────────┤
                                         ▼
                                   Extract Content
                             (tikwm / youtube-transcript /
                              Deepgram / Jina Reader)
                                         │
                                         ▼
                                 Claude AI Processing
                            (classify, generate, merge)
                                         │
                                    ┌────┴────┐
                                    ▼         ▼
                              Supabase DB   Together AI
                              (tutorials)   (hero images)
                                    │
                                    ▼
                          Next.js Website (ISR)
                          battlecat.ai on Vercel
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ingest/              # Twilio WhatsApp/SMS webhook
│   │   ├── process/             # Manual processing trigger (retry endpoint)
│   │   ├── submit/              # Web form submission endpoint
│   │   └── tutorials/
│   │       ├── route.ts         # Tutorial data API for client components
│   │       └── [id]/stale/      # Toggle stale/outdated status (Moss Man)
│   ├── achievements/            # Rewards page — achievement gallery + Power Tier
│   ├── bookmarks/               # Saved tutorials view
│   ├── browse/                  # Filterable tutorial grid
│   ├── feed.xml/                # RSS feed route
│   ├── level-up/                # Interactive quiz wizard ("find your level")
│   ├── levels/[level]/          # Level detail pages (L0-L4)
│   ├── paths/                   # Visual L0→L4 learning path timeline
│   ├── search/                  # Full-text search with filters
│   ├── submit/                  # Web form for pasting links
│   ├── tools/                   # AI tools directory with timeline
│   ├── tutorials/[slug]/        # Tutorial detail page
│   ├── globals.css              # Battlecat theme (custom properties + dark mode)
│   ├── layout.tsx               # Root layout with responsive nav + AchievementProvider
│   ├── not-found.tsx            # Custom 404 page
│   └── page.tsx                 # Home page — latest tutorials, stats, framework overview
├── components/
│   ├── AchievementProvider.tsx  # Context: global achievement tracking + Sorceress modal
│   ├── DarkModeToggle.tsx       # Light/dark mode toggle with localStorage
│   ├── FilterBar.tsx            # Level, relation, and difficulty filters
│   ├── LevelBadge.tsx           # Colored level badge component
│   ├── MobileNav.tsx            # Hamburger menu for mobile
│   ├── MossManBadge.tsx         # Stale/outdated marker (database-backed, Moss Man SVG)
│   ├── OrkoRating.tsx           # 0–5 Orko character SVG rating component
│   ├── Skeleton.tsx             # Loading skeleton component
│   ├── SorceressModal.tsx       # Achievement celebration modal (Sorceress SVG + messages)
│   ├── ToolBadge.tsx            # Inline AI tool icon badge
│   ├── TutorialActions.tsx      # Bookmark, complete, share, notes actions
│   ├── TutorialCard.tsx         # Tutorial list card with stale overlay + Orko mini-rating
│   ├── TutorialRating.tsx       # Client wrapper connecting OrkoRating to localStorage
│   └── TutorialReadTracker.tsx  # Invisible tracker for read achievements
├── config/
│   ├── achievements.ts          # 20 achievements, Power Tiers, point definitions
│   ├── brand.ts                 # Color palette, brand tokens
│   ├── levels.ts                # AI Maturity Framework level definitions
│   ├── quiz.ts                  # 6-question quiz, scoring, level result descriptions
│   ├── tool-icons.ts            # SVG icon paths for 14 AI tools
│   └── tools.ts                 # AI tools database (launch dates, milestones, URLs)
├── data/
│   ├── seed-tutorials.ts        # 10 seed tutorials (L0-L4) for development
│   └── tutorials.ts             # Async Supabase data layer with seed fallback
├── db/
│   └── schema.sql               # Supabase database schema with FTS + RLS
├── hooks/
│   ├── useAchievements.ts       # localStorage achievement state + tracking
│   ├── useBookmarks.ts          # localStorage bookmark management
│   ├── useProgress.ts           # Tutorial completion + notes tracking
│   └── useRatings.ts            # localStorage 0–5 Orko rating management
├── lib/
│   ├── ai.ts                    # Claude API: classifier, tutorial generator, merger
│   ├── extract.ts               # Content extraction with fetchWithTimeout
│   ├── generate-image.ts        # Together AI FLUX: content-relevant hero images
│   ├── markdown.ts              # Markdown → HTML rendering
│   ├── process-submission.ts    # Processing pipeline (extract → AI → store → image)
│   └── supabase.ts              # Lazy-initialized Supabase clients
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Content Extractors

All six source-type extractors are implemented in `src/lib/extract.ts`. All use cloud APIs — no binary dependencies required. Each fetch uses `fetchWithTimeout()` (20s default) to prevent hung requests.

| Source | Strategy | Fallback |
|--------|----------|----------|
| **Article** | Jina Reader (`r.jina.ai`) | — |
| **TikTok** | tikwm.com API → Deepgram Nova-3 audio transcription | Jina Reader (page content) |
| **Tweet** | Jina Reader | fxtwitter.com proxy |
| **YouTube** | youtube-transcript npm package | Jina Reader |
| **PDF** | pdf-parse v2 (`PDFParse` class) | — |
| **LinkedIn** | Jina Reader | Google cache (articles only) |

Source type is auto-detected from the URL hostname/path.

## Processing Pipeline

The processing pipeline runs inline on Vercel using the Next.js `after()` API:

1. **Ingest** — `/api/submit` or `/api/ingest` receives URL, stores in Supabase
2. **Extract** — `lib/extract.ts` pulls content using source-specific strategies (with timeout protection)
3. **Classify** — Claude Sonnet classifies to AI Maturity Level (L0-L4)
4. **Generate** — Claude generates tutorial (title, summary, body, action items)
5. **Merge or Create** — Checks for existing tutorials on same topic at same level (`.maybeSingle()`); merges if found, creates new if not. Handles slug collisions with random suffix retry.
6. **Image Generation** — Together AI FLUX generates a content-relevant infographic/mind-map hero image based on the tutorial summary and action items
7. **Publish** — Tutorial stored in Supabase, visible on site within 60 seconds (ISR)

The `after()` API ensures the Vercel function stays alive after the HTTP response is sent, so processing completes reliably in the background.

## Features

### Website
- **Tutorials-first home page** — Latest tutorials grid, live stats bar, framework overview
- **AI tools directory** — Timeline view, per-level tool cards, tutorial counts
- **Interactive quiz wizard** — 6-question assessment to find your AI maturity level, with animated transitions and localStorage persistence
- **Achievement/reward system** — 20 He-Man themed achievements, Points of Power, 5 power tiers (Apprentice → Master of the Universe), Sorceress of Castle Grayskull celebration modal
- **Orko rating system** — 0–5 Orko character ratings on every tutorial (localStorage)
- **Moss Man stale markers** — Click-to-toggle "outdated" indicator, persisted to Supabase database (not localStorage)
- **Tool badges** — Inline SVG icons for 14 AI tools on tutorial cards and detail pages
- Search across all content with level filtering
- Filter by level, topic, tag, relation, difficulty
- Learning path view (L0→L4 timeline)
- Bookmark/favorite tutorials (localStorage)
- Share individual tutorials via Web Share API
- Dark mode toggle with system preference detection
- Personal notes on any tutorial
- Progress tracking (mark tutorials complete)
- Mobile-responsive navigation (hamburger menu)
- Per-page SEO metadata + OpenGraph images
- RSS feed at /feed.xml
- Loading skeleton states
- Custom 404 page

### Backend
- All 6 content extractors (cloud-based, no binary dependencies)
- Claude AI integration (level classifier, tutorial generator, content merger)
- Together AI FLUX hero image generation (content-relevant infographics)
- Twilio WhatsApp webhook endpoint (`/api/ingest`)
- Web form submission endpoint (`/api/submit`)
- Stale toggle API (`/api/tutorials/[id]/stale`) — database-backed
- Processing pipeline (`lib/process-submission.ts`) using `after()` API
- Tutorial data API (`/api/tutorials`) for client components
- Supabase async data layer with seed data fallback
- ISR (60s revalidation) for server-rendered pages
- Supabase database schema with full-text search + RLS
- Fetch timeout protection (AbortController, 20s default)
- Slug collision handling (random suffix retry on unique constraint violation)

### He-Man Theme System
The app uses characters from He-Man and the Masters of the Universe as UI metaphors:

| Character | Role | Implementation |
|-----------|------|----------------|
| **Orko** | Tutorial ratings (0–5 Orkos) | SVG icon, localStorage, interactive hover states |
| **Moss Man** | Stale/outdated article marker | SVG icon, database-backed toggle via API |
| **Sorceress of Castle Grayskull** | Achievement celebration | SVG portrait, modal with themed messages |

## Setup

1. Copy `.env.example` to `.env.local` and fill in your keys:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `DEEPGRAM_API_KEY` (TikTok + YouTube audio transcription)
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`
   - `JINA_API_KEY` (optional, improves rate limits for article extraction)
   - `TOGETHER_API_KEY` (hero image generation via Together AI FLUX)
2. Run the Supabase schema: `src/db/schema.sql`
3. Ensure the `tutorials` table has the `is_stale` column:
   ```sql
   ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS is_stale boolean NOT NULL DEFAULT false;
   ```
4. Create an `images` storage bucket in Supabase (for hero image uploads)
5. Configure Twilio WhatsApp webhook to point to `https://your-domain/api/ingest`
6. `npm install && npm run dev`

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory to `battlecat`
3. Add all environment variables in Vercel project settings (including `TOGETHER_API_KEY`)
4. Deploy from `main` branch
5. Add custom domain (battlecat.ai) in Vercel Domains settings
6. Point DNS (GoDaddy A + CNAME records) to Vercel

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + FTS + RLS)
- **AI:** Anthropic Claude API (Sonnet)
- **Image Generation:** Together AI (FLUX)
- **Messaging:** Twilio (WhatsApp Sandbox)
- **Audio Transcription:** Deepgram Nova-3
- **TikTok Extraction:** tikwm.com API (cloud-based)
- **YouTube Extraction:** youtube-transcript npm package
- **Article Extraction:** Jina Reader
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
