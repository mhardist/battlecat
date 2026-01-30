# Battle Cat AI

**battlecat.ai** — Text a link from your iPhone, get organized AI learning tutorials mapped to the AI Maturity Framework (L0-L4).

## Architecture

```
iPhone SMS → Twilio → /api/ingest → Extract → Claude AI → Supabase → Next.js Website
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ingest/       # Twilio SMS webhook
│   │   └── process/      # Content extraction + AI processing pipeline
│   ├── tutorials/[slug]/ # Tutorial detail page
│   ├── levels/[level]/   # Level detail page (L0-L4)
│   ├── search/           # Full-text search
│   ├── layout.tsx        # Root layout with nav
│   └── page.tsx          # Home page with framework overview
├── config/
│   ├── brand.ts          # Color palette, brand tokens
│   └── levels.ts         # AI Maturity Framework level definitions
├── db/
│   └── schema.sql        # Supabase database schema
├── lib/
│   ├── ai.ts             # Claude API: classifier, tutorial generator, merger
│   ├── extract.ts        # Content extraction (articles, TikTok, tweets, etc.)
│   └── supabase.ts       # Supabase client
└── types/
    └── index.ts          # TypeScript type definitions
```

## Setup

1. Copy `.env.example` to `.env.local` and fill in your keys
2. Run the Supabase schema: `src/db/schema.sql`
3. Configure Twilio webhook to point to `/api/ingest`
4. `npm run dev`

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (Postgres)
- **AI:** Anthropic Claude API
- **SMS:** Twilio
- **Extraction:** Jina Reader (articles), Whisper (TikTok audio)
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages
