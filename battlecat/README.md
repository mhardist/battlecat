# Battle Cat AI

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
                                         ▼
                                    Supabase DB
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
│   │   └── tutorials/           # Tutorial data API for client components
│   ├── bookmarks/               # Saved tutorials view
│   ├── browse/                  # Filterable tutorial grid
│   ├── feed.xml/                # RSS feed route
│   ├── level-up/                # Interactive "find your level" tool
│   ├── levels/[level]/          # Level detail pages (L0-L4)
│   ├── paths/                   # Visual L0→L4 learning path timeline
│   ├── search/                  # Full-text search with filters
│   ├── submit/                  # Web form for pasting links
│   ├── tutorials/[slug]/        # Tutorial detail page
│   ├── globals.css              # Battle Cat theme (custom properties + dark mode)
│   ├── layout.tsx               # Root layout with responsive nav
│   ├── not-found.tsx            # Custom 404 page
│   └── page.tsx                 # Home page with framework overview + stats
├── components/
│   ├── DarkModeToggle.tsx       # Light/dark mode toggle with localStorage
│   ├── FilterBar.tsx            # Level, relation, and difficulty filters
│   ├── LevelBadge.tsx           # Colored level badge component
│   ├── MobileNav.tsx            # Hamburger menu for mobile
│   ├── Skeleton.tsx             # Loading skeleton component
│   ├── TutorialActions.tsx      # Bookmark, complete, share, notes actions
│   └── TutorialCard.tsx         # Tutorial list card component
├── config/
│   ├── brand.ts                 # Color palette, brand tokens
│   └── levels.ts                # AI Maturity Framework level definitions
├── data/
│   ├── seed-tutorials.ts        # 7 seed tutorials (L0-L4) for development
│   └── tutorials.ts             # Async Supabase data layer with seed fallback
├── db/
│   └── schema.sql               # Supabase database schema with FTS + RLS
├── hooks/
│   ├── useBookmarks.ts          # localStorage bookmark management
│   └── useProgress.ts           # Tutorial completion + notes tracking
├── lib/
│   ├── ai.ts                    # Claude API: classifier, tutorial generator, merger
│   ├── extract.ts               # Content extraction (articles, TikTok, tweets, etc.)
│   ├── process-submission.ts    # Shared processing pipeline (extract → AI → store)
│   └── supabase.ts              # Lazy-initialized Supabase clients
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Content Extractors

All six source-type extractors are implemented in `src/lib/extract.ts`. All use cloud APIs — no binary dependencies like yt-dlp required.

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
2. **Extract** — `lib/extract.ts` pulls content using source-specific strategies
3. **Classify** — Claude Sonnet classifies to AI Maturity Level (L0-L4)
4. **Generate** — Claude generates tutorial (title, summary, body, action items)
5. **Merge or Create** — Checks for existing tutorials on same topic at same level; merges if found, creates new if not
6. **Publish** — Tutorial stored in Supabase, visible on site within 60 seconds (ISR)

The `after()` API ensures the Vercel function stays alive after the HTTP response is sent, so processing completes reliably in the background.

## Features

### Website
- Search across all content with level filtering
- Filter by level, topic, tag, relation, difficulty
- Learning path view (L0→L4 timeline)
- Bookmark/favorite tutorials (localStorage)
- Share individual tutorials via Web Share API
- Level-up view showing what to learn next
- Dark mode toggle with system preference detection
- Personal notes on any tutorial
- Progress tracking (mark tutorials complete)
- Mobile-responsive navigation (hamburger menu)
- Per-page SEO metadata
- RSS feed at /feed.xml
- Loading skeleton states
- Custom 404 page

### Backend
- All 6 content extractors (cloud-based, no binary dependencies)
- Claude AI integration (level classifier, tutorial generator, content merger)
- Twilio WhatsApp webhook endpoint (`/api/ingest`)
- Web form submission endpoint (`/api/submit`)
- Processing pipeline (`lib/process-submission.ts`) using `after()` API
- Tutorial data API (`/api/tutorials`) for client components
- Supabase async data layer with seed data fallback
- ISR (60s revalidation) for server-rendered pages
- Supabase database schema with full-text search + RLS

## Setup

1. Copy `.env.example` to `.env.local` and fill in your keys:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `DEEPGRAM_API_KEY` (TikTok + YouTube audio transcription)
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`
   - `JINA_API_KEY` (optional, improves rate limits for article extraction)
2. Run the Supabase schema: `src/db/schema.sql`
3. Configure Twilio WhatsApp webhook to point to `https://your-domain/api/ingest`
4. `npm install && npm run dev`

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory to `battlecat`
3. Add all environment variables in Vercel project settings
4. Deploy from `main` branch
5. Add custom domain (battlecat.ai) in Vercel Domains settings
6. Point DNS (GoDaddy A + CNAME records) to Vercel

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + FTS + RLS)
- **AI:** Anthropic Claude API (Sonnet)
- **Messaging:** Twilio (WhatsApp Sandbox)
- **Audio Transcription:** Deepgram Nova-3
- **TikTok Extraction:** tikwm.com API (cloud-based)
- **YouTube Extraction:** youtube-transcript npm package
- **Article Extraction:** Jina Reader
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
