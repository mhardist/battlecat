# Battle Cat AI

**battlecat.ai** — Send a link from your iPhone via WhatsApp, get organized AI learning tutorials on a shareable blog, mapped to the AI Maturity Framework (L0-L4).

## Status: Live on Vercel

The site is deployed at **https://battlecat.ai**. The full pipeline (ingestion, extraction, AI processing, publishing) is built and deployed. The processing pipeline uses the Next.js `after()` API to run background tasks on Vercel serverless.

See [PLANNING.md](./PLANNING.md) for the full plan, framework details, and implementation status.

## How It Works

1. **Send a link** via WhatsApp to +1 (415) 523-8886 (Twilio Sandbox) — or paste via web form at battlecat.ai/submit
2. **Content is extracted** — articles (Jina Reader), TikTok audio (tikwm.com + Deepgram Nova-3), YouTube (youtube-transcript), tweets, PDFs, LinkedIn
3. **AI classifies it** by Maturity Level (L0 Asker → L4 Architect) using Claude Sonnet
4. **Merges with existing content** on the same topic (links become references, content is king)
5. **Published** as a step-by-step tutorial on battlecat.ai (visible within 60s via ISR)

## The Framework

| Level | You | AI | Relationship |
|-------|-----|-----|-------------|
| 0 | Asker | Answerer | Transactional |
| 1 | Instructor | Assistant | Retained |
| 2 | Designer | Builder | Collaborative |
| 3 | Supervisor | Agent | Delegated |
| 4 | Architect | Organization | Orchestrated |

## What's Built

- **Website** — Next.js 16 app with browse, search, paths, level-up, bookmarks, dark mode, mobile nav, RSS feed, per-page SEO, loading skeletons
- **Content Extractors** — 6 source types: article, TikTok, tweet, YouTube, PDF, LinkedIn (all cloud-based, no binary dependencies)
- **AI Pipeline** — Claude Sonnet for classification (L0-L4), tutorial generation, content merging
- **API Endpoints** — WhatsApp webhook, web form submission, tutorial data API, processing pipeline
- **Database** — Supabase Postgres with full-text search, RLS policies, async data layer
- **Deployment** — Vercel with auto-deploy from `main`, GoDaddy DNS, battlecat.ai domain

See [`battlecat/README.md`](./battlecat/README.md) for project structure and setup instructions.

## What's Remaining

- **End-to-end testing** — Merge latest PR, test TikTok → tutorial flow
- **Logo and visual brand assets** — Use Midjourney/DALL-E with brand brief in PLANNING.md
- **Rotate API keys** — Keys were exposed during development session
- **Prompt tuning** — Tune AI prompts based on real results

## Reference Materials

- `blue-preso-slides.pdf` — AI Maturity Framework presentation (Entrepreneurs Sandbox, Jan 2026)
- `BlowUpYourArchitecture-compressed (1).pdf` — Architecture & agentic engineering patterns
