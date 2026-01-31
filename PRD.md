# Product Requirements Document — Battle Cat AI

**Product:** Battle Cat AI (battlecat.ai)
**Owner:** Miki Hardisty, CEO, ʻŌlelo Intelligence
**Version:** 1.0
**Date:** January 31, 2026

---

## 1. Product Overview

Battle Cat AI is a personal learning platform that transforms forwarded links (TikToks, articles, tweets, YouTube videos, PDFs) into organized, step-by-step AI tutorials. Content is categorized using the AI Maturity Framework (Levels 0–4) and published as an evergreen blog at battlecat.ai.

### Core Value Proposition

Turn information consumption into structured knowledge. Instead of saving TikToks you'll never revisit, forward them to Battle Cat — it extracts the content, classifies it by your learning stage, and publishes a searchable tutorial you can share.

### Target User

Phase 1: Miki (sole user, private). Phase 2: Public — anyone learning to use AI tools, from beginners (L0) to advanced practitioners (L4).

---

## 2. User Stories

### Ingestion
- **As a user, I can forward a TikTok link via WhatsApp** and have the spoken audio transcribed, classified, and published as a tutorial.
- **As a user, I can paste any URL** (article, tweet, YouTube, PDF, LinkedIn post) into a web form at battlecat.ai/submit and have it processed.
- **As a user, I receive confirmation** that my link was received and is being processed.

### Consumption
- **As a reader, I can browse tutorials** filtered by maturity level (L0–L4), topic, difficulty, and content relation (level-up, practice, cross-level).
- **As a reader, I can search** across all tutorials by keyword, topic, tool name, or tag.
- **As a reader, I can follow a learning path** from L0 to L4, seeing what tutorials are available at each stage and what it takes to level up.
- **As a reader, I can view the Level-Up guide** to understand what I need to learn to move from my current level to the next.
- **As a reader, I can view a tutorial** with full body content, action items, source references, and metadata (level, topics, difficulty, tools mentioned).

### Engagement
- **As a reader, I can bookmark tutorials** to save them for later, with a dedicated bookmarks page.
- **As a reader, I can mark tutorials as complete** and track my progress across the framework.
- **As a reader, I can add personal notes** to any tutorial.
- **As a reader, I can share any tutorial** via a direct link (Web Share API or clipboard).
- **As a reader, I can toggle dark mode** for comfortable reading.
- **As a reader, I can subscribe to an RSS feed** of new tutorials.

### Content Intelligence
- **As a content system, when a new link is ingested on a topic that already has a tutorial at the same level**, the system merges the content into a richer, consolidated tutorial rather than creating a duplicate.
- **As a content system, every tutorial is tagged** with level-up (teaches transition to next level), level-practice (deepens current level skills), or cross-level (spans multiple levels).

---

## 3. The AI Maturity Framework

The framework is the organizing backbone of all content on the platform.

| Level | Human Role | AI Role | Relationship | Key Investment |
|-------|-----------|---------|-------------|----------------|
| **L0** | Asker | Answerer | Transactional | Nothing |
| **L1** | Instructor | Assistant | Retained | Context (teach who you are) |
| **L2** | Designer | Builder | Collaborative | Specification (clarity on what to build) |
| **L3** | Supervisor | Agent | Delegated | Trust (willingness to let go) |
| **L4** | Architect | Organization | Orchestrated | Systems thinking (decompose & design) |

### Level Distribution (Estimated)
- L0: 49% of AI users
- L1: 25%
- L2: 15%
- L3: 8%
- L4: 3%

---

## 4. Functional Requirements

### 4.1 Ingestion

| ID | Requirement | Status |
|----|------------|--------|
| ING-1 | Accept URLs via Twilio WhatsApp webhook (`/api/ingest`) | Done |
| ING-2 | Accept URLs via web form (`/api/submit` + `/submit` page) | Done |
| ING-3 | Auto-detect source type from URL (tiktok, youtube, article, tweet, pdf, linkedin) | Done |
| ING-4 | Store submission in Supabase with status tracking (received → extracting → processing → published/failed) | Done |
| ING-5 | Return confirmation message to user (TwiML for WhatsApp, JSON for web) | Done |
| ING-6 | Support optional note alongside URL (web form) | Done |
| ING-7 | Accept URLs via SMS (requires 10DLC registration) | Not started |
| ING-8 | Accept URLs via iOS Shortcut | Not started |
| ING-9 | Accept URLs via email | Not started |

### 4.2 Content Extraction

| ID | Requirement | Status |
|----|------------|--------|
| EXT-1 | Extract article content via Jina Reader API | Done |
| EXT-2 | Extract TikTok audio → transcribe via tikwm.com API + Deepgram Nova-3 | Done |
| EXT-3 | Extract YouTube transcript via youtube-transcript package | Done |
| EXT-4 | Extract tweet content via Jina Reader + fxtwitter fallback | Done |
| EXT-5 | Extract PDF text + metadata via pdf-parse v2 | Done |
| EXT-6 | Extract LinkedIn articles via Jina Reader + Google cache fallback | Done |
| EXT-7 | All extractors must work on Vercel serverless (no binary dependencies) | Done |
| EXT-8 | Graceful fallback chain for each source type | Done |

### 4.3 AI Processing

| ID | Requirement | Status |
|----|------------|--------|
| AI-1 | Classify content to maturity level (L0–L4) using Claude Sonnet | Done |
| AI-2 | Tag content relation: level-up, level-practice, or cross-level | Done |
| AI-3 | Extract topics, tags, tools mentioned, difficulty rating | Done |
| AI-4 | Generate tutorial: title, slug, summary, body (markdown), action items | Done |
| AI-5 | Merge new content into existing tutorial on same topic at same level | Done |
| AI-6 | Processing runs via Next.js `after()` API (background, reliable on Vercel) | Done |
| AI-7 | Failed submissions marked with error message in Supabase | Done |
| AI-8 | Manual retry via `/api/process` endpoint | Done |

### 4.4 Website

| ID | Requirement | Status |
|----|------------|--------|
| WEB-1 | Home page: framework overview, latest tutorials, user distribution stats | Done |
| WEB-2 | Tutorial detail page: full body, action items, metadata, source URLs | Done |
| WEB-3 | Level pages (L0–L4): level description, transitions, tutorials at level | Done |
| WEB-4 | Learning paths: visual L0→L4 timeline with tutorials at each node | Done |
| WEB-5 | Level-up view: interactive level selector, transition costs, recommended content | Done |
| WEB-6 | Browse page: filter by level, relation, difficulty, topic | Done |
| WEB-7 | Search page: full-text search across titles, summaries, topics, tags, tools | Done |
| WEB-8 | Submit page: web form for pasting URLs + optional note | Done |
| WEB-9 | Bookmarks page: view all saved tutorials | Done |
| WEB-10 | Dark mode with system preference detection and manual toggle | Done |
| WEB-11 | Mobile-responsive navigation (hamburger menu) | Done |
| WEB-12 | Custom 404 page | Done |
| WEB-13 | Per-page SEO metadata | Done |
| WEB-14 | RSS feed at /feed.xml | Done |
| WEB-15 | Loading skeleton states | Done |
| WEB-16 | Bookmark tutorials (localStorage) | Done |
| WEB-17 | Share tutorials via Web Share API + clipboard fallback | Done |
| WEB-18 | Mark tutorials as complete (localStorage) | Done |
| WEB-19 | Add personal notes to tutorials (localStorage) | Done |
| WEB-20 | New tutorials visible on site within 60 seconds (ISR) | Done |

### 4.5 Data Layer

| ID | Requirement | Status |
|----|------------|--------|
| DAT-1 | Supabase Postgres database with submissions, tutorials, sources tables | Done |
| DAT-2 | Full-text search via GIN indexes | Done |
| DAT-3 | Row Level Security policies | Done |
| DAT-4 | Async data layer with seed data fallback (works without Supabase) | Done |
| DAT-5 | Client-side API endpoint (`/api/tutorials`) for interactive pages | Done |
| DAT-6 | Server-side ISR (60s revalidation) for SEO pages | Done |
| DAT-7 | Seed tutorials (7 tutorials, L0–L4) for development and fallback | Done |

---

## 5. Non-Functional Requirements

| ID | Requirement | Status |
|----|------------|--------|
| NFR-1 | All content extractors work on Vercel serverless (no system binaries) | Done |
| NFR-2 | Processing pipeline completes within 60 seconds (maxDuration) | Done |
| NFR-3 | Site loads with seed data even if Supabase is unreachable | Done |
| NFR-4 | Mobile-first responsive design | Done |
| NFR-5 | Dark mode support | Done |
| NFR-6 | SEO-optimized (meta tags, RSS, semantic HTML) | Done |
| NFR-7 | Auto-deploy from `main` branch via Vercel | Done |

---

## 6. Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes (Vercel Serverless) |
| Database | Supabase (Postgres + FTS + RLS) |
| AI | Anthropic Claude Sonnet |
| Audio | Deepgram Nova-3 |
| TikTok | tikwm.com API |
| YouTube | youtube-transcript npm |
| Articles | Jina Reader API |
| Messaging | Twilio (WhatsApp Sandbox) |
| Hosting | Vercel |
| DNS | GoDaddy → Vercel |
| Domain | battlecat.ai |

### Key Architectural Decisions

1. **Cloud-only extraction** — No binary dependencies (yt-dlp, ffmpeg). All extraction via HTTP APIs + npm packages. Required for Vercel serverless.
2. **`after()` for background processing** — Next.js `after()` API keeps serverless functions alive after response. No self-referencing HTTP calls, no external queues needed.
3. **Dual data-fetching** — Server components use async Supabase calls (ISR). Client components fetch from `/api/tutorials` on mount. Both merge with seed data.
4. **Content merging** — When new content matches an existing tutorial (same topic + level), Claude merges it into a richer tutorial rather than creating a duplicate. Links become references.
5. **Seed data fallback** — 7 hand-written tutorials (L0–L4) ensure the site always has content, even before any links are processed.

---

## 7. Branding

**Name:** Battle Cat AI
**Tagline:** "AI learning that levels you up."
**Origin:** Battle Cat from He-Man (1980s) — fierce, loyal, a force multiplier.
**Palette:** Forest Teal (#1B7A6E) + Amber Gold (#D4960A)
**Design:** Clean, modern, approachable. Material Design principles. Not retro — but with subtle 80s accents.

See PLANNING.md for full brand brief, color palette, level colors, and logo concepts.

---

## 8. Open Items

| Item | Priority | Notes |
|------|----------|-------|
| End-to-end pipeline testing | P0 | Merge latest PR, test TikTok → tutorial flow |
| Rotate all API keys | P0 | Keys exposed during dev session |
| Logo and visual brand assets | P1 | Use Midjourney/DALL-E with brand brief |
| Prompt tuning | P1 | Tune classification + generation based on real results |
| iOS Shortcut ingestion | P2 | Second ingestion method for power users |
| Email ingestion | P2 | Forward emails to an address → process |
| Newsletter/digest | P3 | Weekly email with new tutorials |
| Admin dashboard | P3 | Content moderation, submission monitoring |
| SMS ingestion | P3 | Requires 10DLC registration |
| Make site public | P3 | SEO, social sharing, open access |
| Comments / discussion | P4 | Reader engagement features |
| Progress analytics | P4 | Track reading patterns across levels |

---

## 9. Success Criteria

### Phase 1 (Current — Private Use)
- Send a TikTok link via WhatsApp → tutorial appears on battlecat.ai within 2 minutes
- All 6 source types extract successfully on Vercel
- AI classification accuracy is reasonable (correct level within ±1)
- Content merging produces coherent combined tutorials
- Site is responsive, fast, and usable on mobile

### Phase 2 (Public Launch)
- 50+ tutorials across all 5 levels
- Organic search traffic from AI learning keywords
- RSS subscribers
- Share links generate preview cards (OG images)
- Sub-2-second page load times

### Phase 3 (Growth)
- Multiple ingestion methods (WhatsApp, web, iOS Shortcut, email)
- Newsletter with 100+ subscribers
- Community engagement (comments, shared learning paths)
- Content quality that justifies the Battle Cat brand
