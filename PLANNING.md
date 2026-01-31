# Battlecat AI — Planning Document

## Vision

**battlecat.ai** — A polished, branded evergreen blog that turns your late-night TikTok saves and article forwards into organized, step-by-step AI learning tutorials, mapped to the AI Maturity Framework (Levels 0–4).

You text a link from your iPhone via WhatsApp. The system extracts, processes, categorizes by maturity level, merges related content into rich tutorials, generates content-relevant hero images, and publishes to a shareable website. Links become references. The synthesized content is the product.

---

## Decisions Locked In

| Question | Answer |
|----------|--------|
| **Ingestion** | WhatsApp via Twilio Sandbox + web form on battlecat.ai |
| **Primary content** | TikTok, articles, tweets |
| **Secondary content** | YouTube, PDFs, LinkedIn |
| **TikTok extraction** | tikwm.com API → Deepgram Nova-3 transcription (spoken words only) |
| **YouTube extraction** | youtube-transcript npm package → Jina Reader fallback |
| **AI topics** | All topics, organized by framework level |
| **Content merging** | Yes — merge multiple sources into one topic. Content is king, links are references |
| **Hero images** | Together AI FLUX — content-relevant infographic/mind-map style |
| **Website vibe** | Polished / branded — "Battlecat" (He-Man 80s theme system) |
| **Audience** | Start private, go public later |
| **Tech comfort** | Technical — can code, deploy, maintain |
| **Domain** | battlecat.ai — DNS managed at GoDaddy, pointed to Vercel |
| **Hosting** | Vercel (Next.js native deployment) |
| **Preferences** | Vercel for hosting, Supabase for data, Twilio for messaging |
| **Repo** | Monorepo: `playground/battlecat` |

### Must-Have Features (All Implemented)
- Search across all saved content
- Filter by topic / category / tag / level / relation / difficulty
- Learning path view (sequential ordering)
- Bookmark / favorite specific tutorials
- Share individual posts via link
- Level-up quiz — interactive assessment to find your AI maturity level
- AI tools directory with launch timeline
- Achievement/reward system with He-Man theme
- Orko 0–5 tutorial ratings
- Moss Man stale/outdated article markers (database-backed)
- Dark mode with system preference detection
- Progress tracking (completion + notes)
- Mobile-responsive navigation

### Should-Have Features
- [x] Comments or notes on any post
- [x] Progress tracking ("I've completed this tutorial")
- [ ] Email digest / newsletter
- [x] Dark mode

---

## The AI Maturity Framework (Levels 0–4)

This is the organizing backbone. Every piece of content ingested gets classified to one or more levels. The website's "Level Up" view shows users what to learn next based on where they are.

### Level 0: Asker → Answerer
- **Relationship:** Transactional
- **Trust:** Nothing
- **Investment:** Nothing
- **Description:** You type a question, get an answer. No memory, no context, no continuity. Like asking a stranger for directions.
- **Tools:** ChatGPT, Claude, Gemini
- **Content examples:** "What is a prompt?", "How do I use ChatGPT?", basic AI literacy

### Level 1: Instructor → Assistant
- **Relationship:** Retained
- **Trust:** Accuracy
- **Investment:** Context (time to teach who you are)
- **Description:** You give background, preferences, constraints. AI adapts to your situation with persistent memory and tailored responses.
- **Tools:** Custom GPTs, Projects, Gems
- **Mindset shift:** "Repetition is waste" — stop re-explaining yourself
- **Content examples:** Custom instructions, memory features, personalization techniques, the Grocery Test (generic vs. personalized)

### Level 2: Designer → Builder
- **Relationship:** Collaborative
- **Trust:** Execution
- **Investment:** Specification (clarity on what you want built)
- **Description:** You describe what you want, AI builds it. Working apps, landing pages, prototypes — in minutes. This is "vibe coding."
- **Tools:** Lovable, v0, Bolt, Replit
- **Key insight:** L2 gets you to SHOW IT. Prototypes, demos, proof of concepts.
- **Content examples:** Vibe coding tutorials, prompt-to-app workflows, UI generation, rapid prototyping

### Level 3: Supervisor → Agent
- **Relationship:** Delegated
- **Trust:** Judgment
- **Investment:** Trust (willingness to let go)
- **Description:** AI works autonomously — reads your codebase, makes decisions, ships code. You review outcomes, not keystrokes. Define "done," the agent figures out how.
- **Tools:** Claude Code, Cursor, Devin
- **Key insight:** L3 gets you to SHIP IT. Micromanager → Supervisor. Agentic engineering loop: Understand → Plan → Execute → Verify → Iterate → Deliver.
- **The Technical Cliff (L2→L3):** Security gaps, context degradation, auth/payments/data need real engineering
- **Content examples:** Claude Code workflows, acceptance criteria, defining "done," agentic engineering patterns

### Level 4: Architect → Organization
- **Relationship:** Orchestrated
- **Trust:** The system
- **Investment:** Systems thinking (ability to decompose & design)
- **Description:** Multiple AI agents coordinated as an organization. You design workflows, quality gates, and feedback loops. The org chart includes AI.
- **Tools:** Multi-agent orchestration
- **Key insight:** Stop Supervising, Start Architecting. One founder, zero employees, a decentralized product team.
- **The Gate (L3→L4):** Requires security (auth, encryption, access control), reliability (error handling, testing, monitoring), and systems thinking (architecture, scaling, integration)
- **Content examples:** Agent swarming, parallel execution, PRD-first waterfall, Ralph Wiggum Loop, git worktrees, orchestrator patterns, human OVER the loop

### Level Transitions — What Each Level Costs You

| Transition | Give Up | Invest |
|-----------|---------|--------|
| 0 → 1 | Anonymity | Time to teach who you are |
| 1 → 2 | Doing | Clarity on what you want built |
| 2 → 3 | Directing | Willingness to let go |
| 3 → 4 | Supervising | Ability to decompose & design |

### Where Most People Are

| Level | % of Users | Activity |
|-------|-----------|----------|
| L0 | 49% | Asking |
| L1 | 25% | Instructing |
| L2 | 15% | Designing |
| L3 | 8% | Supervising |
| L4 | 3% | Architecting |

> "Moving up one level is a competitive moat."

---

## How Content Maps to Levels

When the AI processing layer ingests content, it classifies using these signals:

| Signal | L0 | L1 | L2 | L3 | L4 |
|--------|----|----|----|----|-----|
| Topic | Basic AI usage | Personalization, memory | Building apps/prototypes | Agentic coding, CI/CD | Multi-agent systems |
| Tools mentioned | ChatGPT, Gemini | Custom GPTs, Gems | Lovable, v0, Bolt | Claude Code, Cursor | Orchestration, swarming |
| Complexity | One-off question | Contextual workflow | Spec → build | Define done → ship | Design system → operate |
| User role | Consumer | Instructor | Designer | Supervisor | Architect |

The system also tags content with:
- **Level-up content**: teaches you to move FROM this level to the next
- **Level-practice content**: deepens your skills AT this level
- **Cross-level content**: spans multiple levels (e.g., a full project walkthrough from L0 to L3)

---

## Tech Stack (Actual)

### Infrastructure
- **DNS:** GoDaddy (A + CNAME records pointing to Vercel)
- **Hosting:** Vercel (Next.js native deployment from `main` branch)
- **Database:** Supabase (Postgres + RLS + full-text search + Storage)
- **Search:** Supabase full-text search (GIN indexes on tutorials table)

### Ingestion
- **WhatsApp:** Twilio WhatsApp Sandbox — send link via WhatsApp to `+14155238886`, webhook hits `/api/ingest`
- **Web form:** battlecat.ai/submit — paste any URL + optional note
- **Future inputs:** iOS Shortcut, email, SMS (requires 10DLC registration)

### Content Extraction
- **Articles / blogs:** Jina Reader API (`r.jina.ai`) with optional API key for higher rate limits
- **TikTok:** tikwm.com cloud API → Deepgram Nova-3 transcription → Jina Reader fallback
- **YouTube:** youtube-transcript npm package → Jina Reader fallback
- **Twitter/X:** Jina Reader with fxtwitter proxy fallback
- **LinkedIn:** Jina Reader for public articles/posts, Google cache fallback for /pulse/ articles
- **PDFs:** pdf-parse v2 (text + metadata extraction)
- All external fetches use `fetchWithTimeout()` (20s default, AbortController) to prevent hung requests

### AI Processing
- **Primary LLM:** Anthropic Claude API (Sonnet `claude-sonnet-4-20250514`)
- **Tasks:** Categorize by level (0–4), extract key concepts, generate tutorial structure, identify merge candidates, tag topics, assign difficulty
- **Merging pipeline:** When new content arrives on an existing topic, Claude synthesizes both into an updated, richer tutorial. Uses `.maybeSingle()` for existence checks, handles slug collisions with random suffix retry.
- **Image Generation:** Together AI FLUX — generates content-relevant infographic/mind-map hero images based on tutorial summary and action items. Images stored in Supabase Storage.

### Website
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4 with custom CSS properties
- **Deployment:** Vercel (auto-deploy from `main` branch)
- **Data:** Supabase async data layer with seed data fallback, ISR (60s revalidation)
- **Branding:** Battlecat (He-Man 80s theme system) — logo/favicon still needed

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     YOUR iPHONE                           │
│     WhatsApp a link to +1 (415) 523-8886                 │
│     Or paste a link at battlecat.ai/submit               │
└──────────────────────┬───────────────────────────────────┘
                       │ WhatsApp message / web POST
                       ▼
┌──────────────────────────────────────────────────────────┐
│        INGESTION (Vercel Serverless Functions)            │
│                                                           │
│  /api/ingest — Twilio WhatsApp webhook                   │
│  /api/submit — Web form POST endpoint                    │
│                                                           │
│  • Parse URL from message body                           │
│  • Detect source type (TikTok, article, tweet, etc.)     │
│  • Store submission in Supabase (status: "received")     │
│  • Use after() to run processing in background           │
│  • Return confirmation (TwiML / JSON)                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│        EXTRACTION ENGINE (lib/extract.ts)                 │
│                                                           │
│  • Articles: Jina Reader (r.jina.ai)                     │
│  • TikTok: tikwm.com API → Deepgram Nova-3 audio        │
│  • YouTube: youtube-transcript npm package               │
│  • Twitter: Jina Reader → fxtwitter fallback             │
│  • PDFs: pdf-parse v2                                    │
│  • LinkedIn: Jina Reader → Google cache fallback         │
│  • All fetches wrapped in fetchWithTimeout (20s)         │
└──────────────────────┬───────────────────────────────────┘
                       │ raw text + metadata
                       ▼
┌──────────────────────────────────────────────────────────┐
│        AI PROCESSING PIPELINE (lib/ai.ts)                │
│                                                           │
│  1. Classify AI Maturity Level (0–4)                     │
│  2. Extract topics, key concepts, action items           │
│  3. Check for existing content on same topic             │
│     (.maybeSingle() — not .single())                     │
│  4. If match: MERGE into richer tutorial                 │
│     If new: CREATE new tutorial                          │
│  5. Generate step-by-step tutorial structure              │
│  6. Tag: level, topic, tools mentioned, difficulty       │
│  7. Generate summary + title                             │
│  8. Flag as level-up, level-practice, or cross-level     │
│  9. Handle slug collisions (random suffix retry)         │
└──────────────────────┬───────────────────────────────────┘
                       │ structured tutorial object
                       ▼
┌──────────────────────────────────────────────────────────┐
│        IMAGE GENERATION (lib/generate-image.ts)          │
│                                                           │
│  • Together AI FLUX model                                │
│  • Prompt includes tutorial summary + action items       │
│  • Generates infographic/mind-map style hero image       │
│  • Uploads to Supabase Storage (images bucket)           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│        SUPABASE (Storage Layer)                           │
│                                                           │
│  • submissions table (ingestion tracking + status)       │
│  • tutorials table (content, metadata, level, tags,      │
│    is_stale, hero_image)                                 │
│  • sources table (original URLs, extraction data)        │
│  • images storage bucket (hero images)                   │
│  • Full-text search (GIN indexes)                        │
│  • Row Level Security policies                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│        BATTLECAT.AI (Next.js 16 on Vercel)               │
│                                                           │
│  SERVER PAGES (ISR, revalidate every 60s):               │
│  • Home — latest tutorials, framework overview, stats    │
│  • Tutorial Detail — full tutorial + Orko rating +       │
│    Moss Man stale toggle + read tracker                  │
│  • Level Pages (L0-L4) — level info + tutorials          │
│  • Learning Paths — visual L0→L4 timeline                │
│  • RSS Feed — /feed.xml                                  │
│                                                           │
│  CLIENT PAGES (fetch from /api/tutorials on mount):      │
│  • Browse — filter by level, topic, difficulty           │
│  • Search — full-text search with level filters          │
│  • Bookmarks — saved tutorials (localStorage)            │
│  • Level-Up — interactive 6-question quiz wizard         │
│  • Tools — AI tools directory with timeline view         │
│  • Achievements — reward gallery + power tier display    │
│  • Submit — web form to paste links                      │
│                                                           │
│  HE-MAN THEME SYSTEM:                                   │
│  • Orko — 0–5 tutorial ratings (localStorage)            │
│  • Moss Man — stale/outdated markers (database-backed)   │
│  • Sorceress — achievement celebration modal             │
│                                                           │
│  FEATURES:                                               │
│  • Bookmark / favorite (localStorage)                    │
│  • Share via Web Share API + clipboard                    │
│  • Filter by level + topic + relation + difficulty       │
│  • Progress tracking (completion + notes)                │
│  • Dark mode (class toggle + localStorage)               │
│  • Mobile-first responsive (hamburger nav)               │
│  • Per-page SEO metadata                                 │
│  • Loading skeletons                                     │
│  • 20 achievements, Points of Power, 5 power tiers      │
│  • Orko 0–5 tutorial ratings                             │
│  • Moss Man stale/outdated article markers               │
│  • Sorceress celebration modal on achievement unlock     │
└──────────────────────────────────────────────────────────┘
```

---

## He-Man Theme System

Characters from He-Man and the Masters of the Universe serve as UI metaphors throughout the app:

| Character | Role | Persistence | Implementation |
|-----------|------|-------------|----------------|
| **Orko** | Tutorial ratings (0–5 Orkos) | localStorage | SVG icon, interactive hover states, `useRatings` hook |
| **Moss Man** | Stale/outdated article marker | Supabase database | SVG icon, toggle via `POST /api/tutorials/[id]/stale`, optimistic UI |
| **Sorceress of Castle Grayskull** | Achievement celebration | localStorage (achievements) | SVG portrait, modal with themed messages, queued display |

### Achievement System
- **20 achievements** across 7 categories: reading, completion, submission, rating, level-mastery, exploration, special
- **Points of Power** — each achievement awards points (10–100)
- **5 Power Tiers:** Apprentice (0+) → Guardian (75+) → Defender (200+) → Heroic Warrior (400+) → Master of the Universe (600+)
- **Sorceress Modal** — animated celebration with character SVG, themed message per achievement, queued display for multiple unlocks
- **Tracking** — combines data from 4 localStorage hooks (achievements, bookmarks, ratings, progress) via `AchievementProvider` context

---

## Execution Plan

### Phase 0: Foundation & Branding

- [x] **Task 0.1: Create the `battlecat` project** — Next.js 16, TypeScript, Tailwind CSS v4
- [ ] **Task 0.2: Brand identity** — Color palette and tokens done. Logo, favicon, OG image need design agent (Midjourney/DALL-E/Ideogram). Brief is below.
- [x] **Task 0.3: Point domain** — GoDaddy A + CNAME records → Vercel. Domain added to Vercel project. battlecat.ai is live.

### Phase 1: Ingestion (Send a Link)

- [x] **Task 1.1: Twilio setup** — Using WhatsApp Sandbox (number: +14155238886). Webhook configured to `https://battlecat.ai/api/ingest`.
- [x] **Task 1.2: Ingestion worker** — `POST /api/ingest` parses WhatsApp/SMS for URLs, detects source type, stores in Supabase, triggers processing via `after()`, returns TwiML confirmation
- [x] **Task 1.3: Web form** — `POST /api/submit` + `/submit` page for pasting links from a browser

### Phase 2: Content Extraction

- [x] **Task 2.1: Article extractor** — Jina Reader API with optional API key auth
- [x] **Task 2.2: TikTok extractor** — tikwm.com cloud API → Deepgram Nova-3 transcription → Jina Reader fallback
- [x] **Task 2.3: Tweet extractor** — Jina Reader first, fxtwitter.com proxy fallback. Normalizes x.com URLs.
- [x] **Task 2.4a: YouTube extractor** — youtube-transcript npm package → Jina Reader fallback
- [x] **Task 2.4b: PDF extractor** — pdf-parse v2 (PDFParse class) — downloads PDF, extracts text + metadata (title, author, pages)
- [x] **Task 2.4c: LinkedIn extractor** — Jina Reader for public articles, Google cache fallback for /pulse/ articles. Clear error with paste-as-note workaround.

### Phase 3: AI Processing Pipeline

- [x] **Task 3.1: Level classifier** — Claude Sonnet prompt with full framework definition, classifies to L0–L4
- [x] **Task 3.2: Tutorial generator** — Two-step: classify then generate (title, summary, body, action items, topics, tags, tools, difficulty)
- [x] **Task 3.3: Content merger** — Detects topic overlap at same level, Claude synthesizes into richer tutorial, preserves source URLs as references. Uses `.maybeSingle()` for existence check.
- [x] **Task 3.4: Level-up tagger** — Tags as level-up, level-practice, or cross-level
- [x] **Task 3.5: Hero image generation** — Together AI FLUX generates content-relevant infographic/mind-map hero images from tutorial summary + action items. Stored in Supabase Storage.

### Phase 4: The Website

- [x] **Task 4.1: Core pages** — Home (hero, framework cards, latest tutorials, stats), Tutorial detail, Level pages (L0–L4), Level-up quiz, Learning paths (L0→L4 timeline), Browse/filter, Search, Submit, Bookmarks, Tools directory, Achievements/rewards
- [x] **Task 4.2: Features** — Bookmarks (localStorage), Share (Web Share API + clipboard), Filters (level, relation, difficulty, topic), Progress tracking (completion + notes), Dark mode (class toggle + localStorage), Orko ratings (0–5), Moss Man stale markers (database-backed), Achievement system (20 achievements, 5 power tiers, Sorceress modal)
- [x] **Task 4.3: Polish** — Mobile hamburger nav, custom 404, per-page SEO metadata, RSS feed (/feed.xml), loading skeletons, OG meta tags
- [x] **Task 4.4: Interactive quiz** — 6-question wizard with animated transitions, localStorage persistence, level-specific tutorial recommendations
- [x] **Task 4.5: Tools directory** — AI tools database with launch dates, timeline view, per-level cards, tutorial counts
- [x] **Task 4.6: He-Man theme system** — Orko ratings, Moss Man stale markers, Sorceress achievement modal

### Phase 5: End-to-End Integration

- [x] **Task 5.1: Supabase data layer** — `data/tutorials.ts` async module reads from Supabase with seed data fallback, deduplicates by slug
- [x] **Task 5.2: API endpoint** — `/api/tutorials` serves tutorials + topics to client components
- [x] **Task 5.3: Server pages wired** — Home, tutorial detail, level pages, learning paths all use async Supabase data layer with ISR (60s)
- [x] **Task 5.4: Client pages wired** — Browse, search, bookmarks, level-up, tools, achievements fetch from `/api/tutorials` on mount
- [x] **Task 5.5: Processing pipeline** — Shared `lib/process-submission.ts` called via `after()` from submit/ingest routes. No self-referencing HTTP calls.
- [x] **Task 5.6: Stale marker API** — `POST /api/tutorials/[id]/stale` toggles `is_stale` in Supabase database
- [ ] **Task 5.7: End-to-end testing** — Send TikTok via WhatsApp → verify extraction → verify tutorial appears on site
- [ ] **Task 5.8: Prompt tuning** — Tune classification and generation prompts based on real results

### Phase 6: Expansion

- [x] Web form on battlecat.ai ("Paste a link")
- [ ] iOS Shortcut as second ingestion method
- [ ] Email ingestion
- [ ] Newsletter / email digest (weekly)
- [ ] Make site public — SEO, social sharing, open access
- [ ] Admin dashboard for content moderation
- [ ] SMS ingestion (requires 10DLC registration for US numbers)

---

## Brand Brief: Battlecat AI

All branding decisions are locked in. This brief can be handed directly to a design agent.

### Brand Origin
Battlecat is the armored tiger from the 1980s He-Man cartoon — fierce, loyal, a force multiplier. The brand channels that energy into AI learning: this tool makes you more powerful. The He-Man theme extends beyond branding into the UI with character-themed features (Orko for ratings, Moss Man for stale content, the Sorceress for achievement celebrations).

### Design Direction

| Attribute | Decision |
|-----------|----------|
| **Vibe** | Clean, modern, approachable. Not retro — but with subtle 80s accents that reward those who get the reference |
| **Design system** | Material Design principles — elevation, motion, clear hierarchy, accessible components |
| **Logo** | Abstract mark that evokes Battlecat / Cringer without being a literal cartoon tiger. Think: stylized silhouette, geometric abstraction, or a mark that suggests feline power + intelligence. Should work at favicon size and full bleed |
| **Palette** | Agent's recommendation (see below) |
| **Typography** | Clean sans-serif for body (Inter, Plus Jakarta Sans, or similar). A slightly bolder/display weight for headings that carries personality without being loud |
| **Tone** | Tasteful but not unapproachable. Confident but not elitist. The site should feel like a smart friend sharing notes, not a lecture hall |

### Recommended Color Palette

Built around Material Design with subtle warmth and a nod to Battlecat's green/gold:

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Forest Teal | `#1B7A6E` | Navigation, primary buttons, active states — evokes Battlecat's armored green |
| **Primary Dark** | Deep Teal | `#0F4F47` | Headers, dark surfaces, hover states |
| **Secondary** | Amber Gold | `#D4960A` | Accents, highlights, CTAs, level-up indicators — the 80s warmth, Battlecat's eyes |
| **Background** | Off-White | `#FAFAF8` | Page background, clean and breathable |
| **Surface** | Warm White | `#FFFFFF` | Cards, elevated content panels |
| **Text Primary** | Charcoal | `#1C1C1E` | Body text, headings |
| **Text Secondary** | Slate | `#6B7280` | Captions, metadata, secondary info |
| **Border/Divider** | Light Gray | `#E5E7EB` | Subtle separation |
| **Success** | Emerald | `#10B981` | Completed tutorials, progress |
| **Dark Mode BG** | Near Black | `#111113` | Dark mode background |
| **Dark Mode Surface** | Dark Gray | `#1E1E22` | Dark mode cards |

### Level Colors (for the Framework)

Each maturity level gets its own accent color, used in badges, borders, and the Level-Up view:

| Level | Color | Hex | Rationale |
|-------|-------|-----|-----------|
| L0 | Cool Gray | `#9CA3AF` | Neutral starting point |
| L1 | Teal | `#14B8A6` | Engagement beginning |
| L2 | Green | `#22C55E` | Creative energy, building |
| L3 | Amber | `#F59E0B` | Warm, trusted, autonomous |
| L4 | Gold | `#D4960A` | Mastery, Battlecat's power |

### Logo Concepts (For Design Agent)

Prompt direction for generating the abstract Battlecat mark:

> "Abstract geometric logo mark for 'Battlecat AI'. Inspired by a powerful armored tiger but NOT a literal tiger illustration. Think: angular geometric shapes suggesting a feline profile or silhouette, clean lines, modern minimalism. Could reference cat ears, a shield shape, or forward motion. Works in single color. Suitable for favicon at 32px. Material Design aesthetic. Colors: forest teal (#1B7A6E) and amber gold (#D4960A). No text in the mark."

### Brand Deliverables Checklist

- [ ] Logo mark (SVG, PNG at multiple sizes)
- [ ] Logo + wordmark lockup
- [ ] Favicon (16px, 32px, 192px, 512px)
- [ ] OG share image (1200x630)
- [x] Color palette tokens (CSS custom properties + Tailwind config)
- [x] Typography scale (headings, body, captions, code)
- [x] Component styling guide (cards, badges, buttons, level indicators)
- [x] Dark mode variant
- [x] Loading / empty state illustrations (skeleton components)
- [x] He-Man character SVGs (Orko, Moss Man, Sorceress)

---

## Implementation Status

Updated: January 31, 2026

### Summary

| Phase | Status |
|-------|--------|
| Phase 0: Foundation & Branding | **Done** (logo pending) |
| Phase 1: Ingestion | **Done** |
| Phase 2: Content Extraction | **Done** (6 extractors) |
| Phase 3: AI Processing Pipeline | **Done** (includes image generation) |
| Phase 4: The Website | **Done** (12 pages, 20 achievements, He-Man theme) |
| Phase 5: End-to-End Integration | **Done** (prompt tuning pending) |
| Phase 6: Expansion | **Partial** (web form done, rest pending) |

### What Requires Manual Action

1. **Logo / visual assets** — Use Midjourney, DALL-E, or designer with the brand brief above
2. **End-to-end test** — Send a TikTok link via WhatsApp or web form, verify it appears as a tutorial
3. **Prompt tuning** — Tune classification and generation prompts based on real results
4. **10DLC registration** (optional) — Required if you want to add SMS ingestion alongside WhatsApp

### Environment Variables (Vercel)

All of these are configured in Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret/service role key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `DEEPGRAM_API_KEY` | Deepgram API key (audio transcription) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio WhatsApp number (+14155238886) |
| `JINA_API_KEY` | Jina Reader API key (optional, improves rate limits) |
| `TOGETHER_API_KEY` | Together AI API key (hero image generation) |
