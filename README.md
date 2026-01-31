# Battlecat AI

**battlecat.ai** — Send a link from your iPhone via WhatsApp (or paste it on the web), get organized AI learning tutorials mapped to the AI Maturity Framework (L0-L4).

## Status: Live on Vercel

The site is deployed at **https://battlecat.ai**. The full pipeline (ingestion, extraction, AI processing, image generation, publishing) is built and deployed. The processing pipeline uses the Next.js `after()` API to run background tasks on Vercel serverless.

See [PLANNING.md](./PLANNING.md) for the full plan, framework details, and implementation status.

## How It Works

1. **Send a link** via WhatsApp to +1 (415) 523-8886 (Twilio Sandbox) — or paste via web form at battlecat.ai/submit
2. **Content is extracted** — articles (Jina Reader), TikTok audio (tikwm.com + Deepgram Nova-3), YouTube (youtube-transcript), tweets, PDFs, LinkedIn
3. **AI classifies it** by Maturity Level (L0 Asker → L4 Architect) using Claude Sonnet
4. **Merges with existing content** on the same topic (links become references, content is king)
5. **Hero image generated** by Together AI FLUX (content-relevant infographic/mind-map)
6. **Published** as a step-by-step tutorial on battlecat.ai (visible within 60s via ISR)

## The Framework

| Level | You | AI | Relationship |
|-------|-----|-----|-------------|
| 0 | Asker | Answerer | Transactional |
| 1 | Instructor | Assistant | Retained |
| 2 | Designer | Builder | Collaborative |
| 3 | Supervisor | Agent | Delegated |
| 4 | Architect | Organization | Orchestrated |

## What's Built

- **Website** — Next.js 16 app with 12 pages: home, browse, search, tutorial detail, level pages (L0-L4), learning paths, level-up quiz, AI tools directory, achievements/rewards, bookmarks, submit, RSS feed
- **Content Extractors** — 6 source types: article, TikTok, tweet, YouTube, PDF, LinkedIn (all cloud-based, no binary dependencies)
- **AI Pipeline** — Claude Sonnet for classification (L0-L4), tutorial generation, content merging + Together AI FLUX for hero images
- **He-Man Theme System** — Orko (0-5 tutorial ratings), Moss Man (stale/outdated markers), Sorceress of Castle Grayskull (achievement celebrations)
- **Achievement System** — 20 He-Man themed achievements, Points of Power, 5 power tiers (Apprentice → Master of the Universe)
- **API Endpoints** — WhatsApp webhook, web form submission, tutorial data API, stale toggle API, processing pipeline
- **Database** — Supabase Postgres with full-text search, RLS policies, image storage, async data layer
- **Deployment** — Vercel with auto-deploy from `main`, GoDaddy DNS, battlecat.ai domain

See [`battlecat/README.md`](./battlecat/README.md) for project structure and setup instructions.

## What's Remaining

- **Logo and visual brand assets** — Use Midjourney/DALL-E with brand brief in PLANNING.md
- **End-to-end testing** — Test full TikTok → tutorial flow via WhatsApp
- **Prompt tuning** — Tune AI prompts based on real results

## Documentation

- [`PLANNING.md`](./PLANNING.md) — Architecture, framework details, brand brief, implementation status
- [`LEARNINGS.md`](./LEARNINGS.md) — 15 technical lessons from deployment
- [`PRD.md`](./PRD.md) — Product requirements document (v2.0)
- [`NEXT-SESSION-PROMPT.md`](./NEXT-SESSION-PROMPT.md) — Continuation prompt for new development sessions
- [`battlecat/README.md`](./battlecat/README.md) — Project structure and setup

## Reference Materials

- `blue-preso-slides.pdf` — AI Maturity Framework presentation (Entrepreneurs Sandbox, Jan 2026)
- `BlowUpYourArchitecture-compressed (1).pdf` — Architecture & agentic engineering patterns
