# Battle Cat AI

**battlecat.ai** — Text a link from your iPhone, get organized AI learning tutorials mapped to the AI Maturity Framework (L0-L4).

## Architecture

```
iPhone SMS → Twilio → /api/ingest → Extract → Claude AI → Supabase → Next.js Website
Web Form  → /api/submit ──────────────────────────────────────────────┘
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

## Features

### Must-Have (Built)
- Search across all content with level filtering
- Filter by level, topic, tag, relation, difficulty
- Learning path view (L0→L4 timeline)
- Bookmark/favorite tutorials (localStorage)
- Share individual tutorials via link
- Level-up view showing what to learn next
- Dark mode toggle

### Should-Have (Built)
- Personal notes on any tutorial
- Progress tracking (mark tutorials complete)
- Mobile-responsive navigation

### Coming Soon
- Supabase backend integration
- Twilio phone number + live SMS ingestion
- TikTok audio transcription (Whisper)
- Tweet/YouTube/PDF/LinkedIn extractors
- Email digest/newsletter
- Admin dashboard

## Setup

1. Copy `.env.example` to `.env.local` and fill in your keys
2. Run the Supabase schema: `src/db/schema.sql`
3. Configure Twilio webhook to point to `/api/ingest`
4. `npm install && npm run dev`

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (Postgres + FTS)
- **AI:** Anthropic Claude API
- **SMS:** Twilio
- **Extraction:** Jina Reader (articles), Whisper (TikTok audio)
- **Styling:** Tailwind CSS v4
- **Deployment:** Cloudflare Pages
