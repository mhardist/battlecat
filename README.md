# Battle Cat AI

**battlecat.ai** — Text a link from your iPhone, get organized AI learning tutorials on a shareable blog, mapped to the AI Maturity Framework (L0-L4).

## Status: Core Build Complete

The website, content extractors, AI pipeline, and API endpoints are built. Remaining work is infrastructure provisioning and deployment. See [PLANNING.md](./PLANNING.md) for the full plan and implementation status.

## How It Works

1. **Text a link** from your iPhone to a dedicated Twilio number (or paste via web form)
2. **Content is extracted** — articles (Jina Reader), TikTok/YouTube audio (Deepgram Nova-3), tweets, PDFs, LinkedIn
3. **AI classifies it** by Maturity Level (L0 Asker → L4 Architect)
4. **Merges with existing content** on the same topic (links become references, content is king)
5. **Published** as a step-by-step tutorial on battlecat.ai

## The Framework

| Level | You | AI | Relationship |
|-------|-----|-----|-------------|
| 0 | Asker | Answerer | Transactional |
| 1 | Instructor | Assistant | Retained |
| 2 | Designer | Builder | Collaborative |
| 3 | Supervisor | Agent | Delegated |
| 4 | Architect | Organization | Orchestrated |

## What's Built

- **Website** — Next.js 16 app with browse, search, paths, level-up, bookmarks, dark mode, mobile nav
- **Content Extractors** — 6 source types: article, TikTok, tweet, YouTube, PDF, LinkedIn
- **AI Pipeline** — Claude Sonnet for classification (L0-L4), tutorial generation, content merging
- **API Endpoints** — Twilio SMS webhook, web form submission, processing pipeline
- **Database Schema** — Supabase Postgres with full-text search, RLS policies

See [`battlecat/README.md`](./battlecat/README.md) for project structure and setup instructions.

## What Needs Manual Setup

- Supabase project provisioning + schema deployment
- Twilio phone number + webhook configuration
- Deepgram, Anthropic, Jina API keys
- DNS: battlecat.ai → Cloudflare Pages
- yt-dlp on server for video extraction
- Logo and visual brand assets

## Reference Materials

- `blue-preso-slides.pdf` — AI Maturity Framework presentation (Entrepreneurs Sandbox, Jan 2026)
- `BlowUpYourArchitecture-compressed (1).pdf` — Architecture & agentic engineering patterns
