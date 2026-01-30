# Battle Cat AI

**battlecat.ai** — Text a link from your iPhone, get organized AI learning tutorials mapped to the AI Maturity Framework (L0-L4).

## Architecture

```
iPhone SMS → Twilio → /api/ingest ─┐
Web Form  → /api/submit ───────────┤
                                    ▼
                              Extract Content
                          (Jina / yt-dlp / Deepgram)
                                    │
                                    ▼
                            Claude AI Processing
                       (classify, generate, merge)
                                    │
                                    ▼
                               Supabase DB
                                    │
                                    ▼
                          Next.js Website (SSG)
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ingest/              # Twilio SMS webhook
│   │   ├── process/             # Content extraction + AI processing pipeline
│   │   └── submit/              # Web form submission endpoint
│   ├── bookmarks/               # Saved tutorials view
│   ├── browse/                  # Filterable tutorial grid
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
│   ├── TutorialActions.tsx      # Bookmark, complete, share, notes actions
│   └── TutorialCard.tsx         # Tutorial list card component
├── config/
│   ├── brand.ts                 # Color palette, brand tokens
│   └── levels.ts                # AI Maturity Framework level definitions
├── data/
│   └── seed-tutorials.ts        # 7 seed tutorials (L0-L4) for development
├── db/
│   └── schema.sql               # Supabase database schema with FTS
├── hooks/
│   ├── useBookmarks.ts          # localStorage bookmark management
│   └── useProgress.ts           # Tutorial completion + notes tracking
├── lib/
│   ├── ai.ts                    # Claude API: classifier, tutorial generator, merger
│   ├── extract.ts               # Content extraction (articles, TikTok, tweets, etc.)
│   └── supabase.ts              # Lazy-initialized Supabase clients
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Content Extractors

All six source-type extractors are implemented in `src/lib/extract.ts`:

| Source | Strategy | Fallback |
|--------|----------|----------|
| **Article** | Jina Reader (`r.jina.ai`) | — |
| **TikTok** | yt-dlp audio stream → Deepgram Nova-3 | — |
| **Tweet** | Jina Reader | fxtwitter.com proxy |
| **YouTube** | yt-dlp subtitles (VTT) | Deepgram audio transcription → Jina Reader |
| **PDF** | pdf-parse v2 (`PDFParse` class) | — |
| **LinkedIn** | Jina Reader | Google cache (articles only) |

Source type is auto-detected from the URL hostname/path.

## Features

### Website (Built)
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
- Custom 404 page

### Backend (Built)
- All 6 content extractors (article, TikTok, tweet, YouTube, PDF, LinkedIn)
- Claude AI integration (level classifier, tutorial generator, content merger)
- Twilio SMS webhook endpoint (`/api/ingest`)
- Web form submission endpoint (`/api/submit`)
- Processing pipeline (`/api/process`)
- Supabase database schema with full-text search

### Requires Manual Setup
- Supabase project provisioning + schema deployment
- Twilio phone number purchase + webhook configuration
- Deepgram account + API key (for TikTok/YouTube audio)
- DNS pointing battlecat.ai → Cloudflare Pages
- yt-dlp installation on server (for TikTok/YouTube extraction)

## Setup

1. Copy `.env.example` to `.env.local` and fill in your keys:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `DEEPGRAM_API_KEY` (TikTok + YouTube audio transcription)
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`
   - `JINA_API_KEY` (optional, improves rate limits for article extraction)
2. Run the Supabase schema: `src/db/schema.sql`
3. Install yt-dlp on the server for TikTok/YouTube extraction
4. Configure Twilio webhook to point to `https://battlecat.ai/api/ingest`
5. `npm install && npm run dev`

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + FTS)
- **AI:** Anthropic Claude API (Sonnet)
- **SMS:** Twilio
- **Audio Transcription:** Deepgram Nova-3
- **Extraction:** Jina Reader (articles), yt-dlp (video/audio streams), pdf-parse v2 (PDFs)
- **Styling:** Tailwind CSS v4
- **Deployment:** Cloudflare Pages
