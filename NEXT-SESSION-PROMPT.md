# Battlecat AI — Next Session Prompt

Use this prompt to continue development on battlecat.ai in a new session. The site is live at battlecat.ai, deployed on Vercel from the `main` branch. All code is in the `playground/battlecat` directory.

## Context

Battlecat AI is a learning platform that turns forwarded links (TikToks, articles, tweets) into organized AI tutorials mapped to the AI Maturity Framework (L0-L4). The full pipeline is working: WhatsApp ingestion → content extraction → Claude AI processing → Together AI hero image generation → Supabase storage → Next.js website with ISR.

Read PLANNING.md for the full architecture, framework details, and brand brief. Read LEARNINGS.md for deployment gotchas (15 lessons learned).

## Tech Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4 + @tailwindcss/typography
- Supabase (Postgres + FTS + Storage), Anthropic Claude Sonnet, Deepgram Nova-3
- Twilio WhatsApp Sandbox, Together AI FLUX (hero image generation)
- Deployed on Vercel, domain: battlecat.ai, DNS: GoDaddy

## What's Built (Current State)

Everything below is implemented and deployed:

### Core Pipeline
- WhatsApp ingestion via Twilio Sandbox (`/api/ingest`)
- Web form submission (`/api/submit` + `/submit` page)
- 6 content extractors (article, TikTok, tweet, YouTube, PDF, LinkedIn) — all cloud-based
- Claude AI processing (classify L0-L4, generate tutorial, merge related content)
- Together AI FLUX hero image generation (content-relevant infographics)
- Supabase storage with FTS, RLS, seed data fallback
- Processing pipeline using Next.js `after()` API

### Website Pages
- **Home** — Latest tutorials grid, live stats bar, framework overview
- **Browse** — Filterable tutorial grid (level, relation, difficulty, topic)
- **Search** — Full-text search with level filters
- **Tutorial Detail** — Full tutorial with actions, rating, stale markers, read tracking
- **Level Pages (L0-L4)** — Level info + tutorials at each level
- **Learning Paths** — Visual L0→L4 timeline
- **Level-Up Quiz** — 6-question interactive wizard to find your AI maturity level
- **AI Tools Directory** — Collapsible timeline (28 tools, 100+ milestones), per-level tool cards, tutorial counts, significance-based display
- **Achievements/Rewards** — 20 He-Man themed achievements, Points of Power, power tiers
- **Bookmarks** — Saved tutorials (localStorage)
- **Submit** — Web form to paste links
- **RSS Feed** — /feed.xml

### He-Man Theme System
| Character | Role | Implementation |
|-----------|------|----------------|
| **Orko** | Tutorial ratings (0–5 Orkos) | SVG icon, localStorage, interactive hover |
| **Moss Man** | Stale/outdated article marker | SVG icon, database-backed toggle via API |
| **Sorceress of Castle Grayskull** | Achievement celebration | SVG portrait, modal with themed messages |

### Homepage Hot News
- "Hot in AI" section between hero and latest tutorials
- 3 curated articles shown by default, expandable to 8
- Config-driven via `config/hot-news.ts` — manually updated
- Each item: date, level indicator, tool name, headline, teaser, optional URL

### Collapsible Tools Timeline
- Time-bucketed: "This Month", "Last 3 Months", "Last 6 Months", "Last Year", "Older"
- Reverse chronological — newest first
- Significance-based filtering (high items always visible, medium/low toggle with "Show more")
- Level filter pills and search input
- Expandable individual milestones with level info and tutorial counts

### Research Agent API
- `GET /api/research-tools?since=YYYY-MM` — Claude-powered discovery of new AI tool releases
- Returns structured `ToolRelease[]` data (name, event, date, level, significance, url)
- Designed for future Vercel Cron daily automation

### Client Features
- Bookmark/favorite (localStorage)
- Share via Web Share API + clipboard
- Dark mode with system preference detection
- Progress tracking (completion + notes)
- Orko 0–5 rating on every tutorial
- Achievement system with 20 achievements, 5 power tiers
- Sorceress celebration modal on achievement unlock
- Mobile-responsive hamburger nav

## Potential Enhancements

### 1. Logo & Visual Brand Assets
The site still needs a proper logo, favicon, and OG share image. The brand brief is in PLANNING.md with prompt direction for design tools (Midjourney/DALL-E/Ideogram).

Deliverables needed:
- Logo mark (SVG, PNG at multiple sizes)
- Logo + wordmark lockup
- Favicon (16px, 32px, 192px, 512px)
- OG share image (1200x630)

### 2. iOS Shortcut for Ingestion
Create an iOS Shortcut that sends a URL directly to the `/api/submit` endpoint. This would let users share links from any app's share sheet without needing WhatsApp.

### 3. Newsletter / Email Digest
Weekly email summarizing new tutorials. Could use Resend, Postmark, or Supabase Edge Functions with a cron trigger.

### 4. Admin Dashboard
Content moderation interface:
- View all submissions and their processing status
- Edit/delete tutorials
- Manual re-process failed submissions
- View analytics (submissions per day, popular topics, level distribution)

### 5. Prompt Tuning
Tune the Claude classification and generation prompts based on real results. The current prompts work but could be improved with examples from actual processed content.

### 6. Progress Analytics
A personal analytics page showing:
- Tutorials read per level over time
- Achievement progress visualization
- Suggested next tutorials based on reading history
- "Your AI journey" timeline

### 7. Social Features
- Share quiz results ("I'm Level 2!")
- Public profiles showing achievements and power tier
- Leaderboard of most active learners

## Important Notes

- All code changes should be on a `claude/` prefixed branch
- Push to the branch and create PRs — the user will merge to `main` for deployment
- The site uses ISR with 60-second revalidation for server pages
- Client pages fetch from `/api/tutorials` on mount
- Supabase service role key is used server-side; anon key client-side
- The typography plugin is already installed — use `prose` classes for rendered content
- Hero images are generated by Together AI FLUX and stored in Supabase Storage
- All content extractors are cloud-based (no binary dependencies) — required for Vercel serverless
- Environment variables are in Vercel project settings (not in the repo)
- The Moss Man stale marker is the ONLY feature using database persistence — everything else uses localStorage

## Files to Reference

- `PLANNING.md` — Full architecture, framework details, brand brief, implementation status
- `LEARNINGS.md` — 15 technical lessons from deployment
- `PRD.md` — Product requirements document (v2.0)
- `battlecat/README.md` — Project structure and setup
- `battlecat/src/config/achievements.ts` — 20 achievements, power tiers, point definitions
- `battlecat/src/config/levels.ts` — Level definitions and colors
- `battlecat/src/config/quiz.ts` — Quiz questions and scoring
- `battlecat/src/config/tools.ts` — AI tools database (28 tools, 100+ milestones, significance ratings)
- `battlecat/src/config/hot-news.ts` — Curated Hot News items (8 articles)
- `battlecat/src/config/tool-icons.ts` — SVG icon paths for 28 AI tools
- `battlecat/src/config/brand.ts` — Brand tokens
- `battlecat/src/types/index.ts` — TypeScript types
- `battlecat/src/data/tutorials.ts` — Supabase data layer
- `battlecat/src/components/AchievementProvider.tsx` — Achievement tracking context
- `battlecat/src/components/SorceressModal.tsx` — Achievement celebration modal
- `battlecat/src/components/MossManBadge.tsx` — Stale marker component
- `battlecat/src/components/OrkoRating.tsx` — Rating component
- `battlecat/src/components/HotNews.tsx` — Hot News section (3 items, expandable to 8)
- `battlecat/src/components/ToolsTimeline.tsx` — Collapsible tools timeline
- `battlecat/src/lib/research-agent.ts` — Claude-powered research agent for tool discovery
- `battlecat/src/app/api/research-tools/route.ts` — Research agent API endpoint
