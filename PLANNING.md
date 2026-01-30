# Battle Cat AI — Planning Document

## Vision

**battlecat.ai** — A polished, branded evergreen blog that turns your late-night TikTok saves and article forwards into organized, step-by-step AI learning tutorials, mapped to the AI Maturity Framework (Levels 0–4).

You text a link from your iPhone. The system extracts, processes, categorizes by maturity level, merges related content into rich tutorials, and publishes to a shareable website. Links become references. The synthesized content is the product.

---

## Decisions Locked In

| Question | Answer |
|----------|--------|
| **Ingestion** | Text (SMS) via Twilio — dedicated phone number |
| **Primary content** | TikTok, articles, tweets |
| **Secondary content** | YouTube, PDFs, LinkedIn |
| **TikTok extraction** | Spoken words only (audio transcription) |
| **AI topics** | All topics, organized by framework level |
| **Content merging** | Yes — merge multiple sources into one topic. Content is king, links are references |
| **Website vibe** | Polished / branded — new brand "Battle Cat" (He-Man 80s) |
| **Audience** | Start private, go public later |
| **Tech comfort** | Technical — can code, deploy, maintain |
| **Domain** | battlecat.ai — parked at GoDaddy, not pointed yet |
| **Preferences** | Cloudflare, AWS/GCP experience, Twilio already in toolbelt |
| **Repo** | New repo: `battlecat` |

### Must-Have Features
- Search across all saved content
- Filter by topic / category / tag
- Learning path view (sequential ordering)
- Bookmark / favorite specific tutorials
- Share individual posts via link
- **Level-up view** — shows content mapped to where someone needs to grow next

### Should-Have Features
- Comments or notes on any post
- Progress tracking ("I've completed this tutorial")
- Email digest / newsletter
- Dark mode

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

The system should also tag content with:
- **Level-up content**: teaches you to move FROM this level to the next
- **Level-practice content**: deepens your skills AT this level
- **Cross-level content**: spans multiple levels (e.g., a full project walkthrough from L0 to L3)

---

## Recommended Tech Stack

### Infrastructure
- **DNS / CDN / Edge:** Cloudflare (point battlecat.ai from GoDaddy to Cloudflare nameservers)
- **Hosting:** Cloudflare Pages (website) + Cloudflare Workers (API/backend)
- **Database:** Supabase (Postgres + auth + real-time + storage)
- **Search:** Supabase full-text search initially, upgrade to Typesense or Meilisearch later
- **Queue:** Cloudflare Queues or Supabase Edge Functions for async processing
- **Media storage:** Cloudflare R2 (S3-compatible, no egress fees)

### Ingestion
- **SMS:** Twilio — dedicated phone number receives texts, webhook hits the API
- **Future inputs:** iOS Shortcut, email (Cloudflare Email Workers), web form on battlecat.ai

### Content Extraction
- **Articles / blogs:** Jina Reader API (with optional API key for higher rate limits)
- **TikTok:** yt-dlp to extract audio stream URL → Deepgram Nova-3 for transcription (spoken words only)
- **YouTube:** yt-dlp subtitles (VTT auto-generated/manual) → Deepgram audio fallback → Jina Reader last resort
- **Twitter/X:** Jina Reader with fxtwitter proxy fallback (optional Twitter API v2 bearer token)
- **LinkedIn:** Jina Reader for public articles/posts, Google cache fallback for /pulse/ articles, manual paste workaround for blocked content
- **PDFs:** pdf-parse v2 (text + metadata extraction)

### AI Processing
- **Primary LLM:** Anthropic Claude API (Sonnet for speed, Opus for complex synthesis)
- **Tasks:** Categorize by level (0–4), extract key concepts, generate tutorial structure, identify merge candidates, tag topics, assign difficulty
- **Merging pipeline:** When new content arrives on an existing topic, the LLM synthesizes both into an updated, richer tutorial

### Website
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages
- **Auth:** Supabase Auth (for private phase, admin access)
- **Branding:** Battle Cat (He-Man 80s) — needs full brand identity design (see branding task below)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     YOUR iPHONE                          │
│        Text a link to your Battle Cat number             │
└──────────────────────┬──────────────────────────────────┘
                       │ SMS with URL + optional note
                       ▼
┌──────────────────────────────────────────────────────────┐
│              TWILIO SMS WEBHOOK                           │
│  Receives SMS → forwards to Cloudflare Worker            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│          INGESTION WORKER (Cloudflare)                    │
│                                                           │
│  • Parse URL from message body                           │
│  • Detect source type (TikTok, article, tweet, etc.)     │
│  • Queue for extraction                                  │
│  • Send confirmation SMS back                            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│          EXTRACTION ENGINE (Cloudflare Worker)            │
│                                                           │
│  • Articles: Jina Reader / Firecrawl                     │
│  • TikTok: yt-dlp + Deepgram Nova-3 (spoken words)       │
│  • YouTube: yt-dlp transcript                            │
│  • Twitter: Tweet/thread extraction                      │
│  • PDFs: pdf-parse                                       │
│  • LinkedIn: scrape or fallback                          │
└──────────────────────┬───────────────────────────────────┘
                       │ raw text + metadata
                       ▼
┌──────────────────────────────────────────────────────────┐
│          AI PROCESSING PIPELINE (Claude API)              │
│                                                           │
│  1. Classify AI Maturity Level (0–4)                     │
│  2. Extract topics, key concepts, action items           │
│  3. Check for existing content on same topic             │
│  4. If match: MERGE into richer tutorial                 │
│     If new: CREATE new tutorial                          │
│  5. Generate step-by-step tutorial structure             │
│  6. Tag: level, topic, tools mentioned, difficulty       │
│  7. Generate summary + title                             │
│  8. Flag as level-up, level-practice, or cross-level     │
└──────────────────────┬───────────────────────────────────┘
                       │ structured tutorial object
                       ▼
┌──────────────────────────────────────────────────────────┐
│          SUPABASE (Storage Layer)                         │
│                                                           │
│  • tutorials table (content, metadata, level, tags)      │
│  • sources table (original URLs, extraction data)        │
│  • topics table (topic taxonomy)                         │
│  • user_progress table (bookmarks, completion)           │
│  • Full-text search index                                │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│          BATTLECAT.AI (Next.js on Cloudflare Pages)      │
│                                                           │
│  VIEWS:                                                  │
│  • Home — latest tutorials, featured content             │
│  • By Level — L0, L1, L2, L3, L4 sections               │
│  • Level-Up — "You're at L2, here's how to reach L3"    │
│  • By Topic — prompt engineering, agents, RAG, etc.      │
│  • Learning Paths — sequential ordered content           │
│  • Tutorial Detail — full step-by-step post              │
│  • Search — full-text across all content                 │
│                                                           │
│  FEATURES:                                               │
│  • Bookmark / favorite                                   │
│  • Share via link                                        │
│  • Filter by level + topic + tag                         │
│  • Progress tracking                                     │
│  • Notes / comments                                      │
│  • Dark mode                                             │
│  • Mobile-first responsive                               │
└──────────────────────────────────────────────────────────┘
```

---

## Execution Plan

### Phase 0: Foundation & Branding

- [x] **Task 0.1: Create the `battlecat` project** — Next.js 16, TypeScript, Tailwind CSS v4
- [ ] **Task 0.2: Brand identity** — Color palette and tokens done. Logo, favicon, OG image need design agent (Midjourney/DALL-E/Ideogram). Brief is below.
- [ ] **Task 0.3: Point domain** — GoDaddy nameservers → Cloudflare. Cloudflare Pages deployment.

### Phase 1: Ingestion (Text a Link)

- [ ] **Task 1.1: Twilio setup** — Purchase phone number, configure SMS webhook → `/api/ingest`
- [x] **Task 1.2: Ingestion worker** — `POST /api/ingest` parses SMS for URLs, detects source type, stores in Supabase, returns TwiML confirmation
- [x] **Task 1.3: Web form** (pulled from Phase 6) — `POST /api/submit` + `/submit` page for pasting links from a browser

### Phase 2: Content Extraction

- [x] **Task 2.1: Article extractor** — Jina Reader API with optional API key auth
- [x] **Task 2.2: TikTok extractor** — yt-dlp extracts audio stream URL → Deepgram Nova-3 transcribes spoken words
- [x] **Task 2.3: Tweet extractor** — Jina Reader first, fxtwitter.com proxy fallback. Normalizes x.com URLs.
- [x] **Task 2.4a: YouTube extractor** — Three strategies: yt-dlp subtitles (VTT → plain text parser) → Deepgram audio transcription → Jina Reader page content
- [x] **Task 2.4b: PDF extractor** — pdf-parse v2 (PDFParse class) — downloads PDF, extracts text + metadata (title, author, pages)
- [x] **Task 2.4c: LinkedIn extractor** — Jina Reader for public articles, Google cache fallback for /pulse/ articles. Clear error with paste-as-note workaround.

### Phase 3: AI Processing Pipeline

- [x] **Task 3.1: Level classifier** — Claude Sonnet prompt with full framework definition, classifies to L0–L4
- [x] **Task 3.2: Tutorial generator** — Two-step: classify then generate (title, summary, body, action items, topics, tags, tools, difficulty)
- [x] **Task 3.3: Content merger** — Detects topic overlap at same level, Claude synthesizes into richer tutorial, preserves source URLs as references
- [x] **Task 3.4: Level-up tagger** — Tags as level-up, level-practice, or cross-level

### Phase 4: The Website

- [x] **Task 4.1: Core pages** — Home (hero, framework cards, latest tutorials, stats), Tutorial detail, Level pages (L0–L4), Level-up view, Learning paths (L0→L4 timeline), Browse/filter, Search, Submit, Bookmarks
- [x] **Task 4.2: Features** — Bookmarks (localStorage), Share (Web Share API + clipboard), Filters (level, relation, difficulty, topic), Progress tracking (completion + notes), Dark mode (class toggle + localStorage)
- [x] **Task 4.3: Polish** — Mobile hamburger nav, custom 404, OG meta tags on layout, empty states on all pages
- [ ] **Task 4.3: Remaining polish** — Per-page SEO titles, RSS feed, loading skeleton states

### Phase 5: End-to-End Integration

- [ ] Text a TikTok link from iPhone → see it arrive as a tutorial on battlecat.ai
- [ ] Verify merge behavior with duplicate topics
- [ ] Verify level classification accuracy
- [ ] Tune prompts based on real results

### Phase 6: Expansion

- [x] Web form on battlecat.ai ("Paste a link") — pulled forward
- [ ] iOS Shortcut as second ingestion method
- [ ] Email ingestion (Cloudflare Email Workers)
- [ ] Newsletter / email digest (weekly)
- [ ] Make site public — SEO, social sharing, open access
- [ ] Admin dashboard for content moderation

---

## Brand Brief: Battle Cat AI

All branding decisions are locked in. This brief can be handed directly to a design agent.

### Brand Origin
Battle Cat is the armored tiger from the 1980s He-Man cartoon — fierce, loyal, a force multiplier. The brand channels that energy into AI learning: this tool makes you more powerful.

### Design Direction

| Attribute | Decision |
|-----------|----------|
| **Vibe** | Clean, modern, approachable. Not retro — but with subtle 80s accents that reward those who get the reference |
| **Design system** | Material Design principles — elevation, motion, clear hierarchy, accessible components |
| **Logo** | Abstract mark that evokes Battle Cat / Cringer without being a literal cartoon tiger. Think: stylized silhouette, geometric abstraction, or a mark that suggests feline power + intelligence. Should work at favicon size and full bleed |
| **Palette** | Agent's recommendation (see below) |
| **Typography** | Clean sans-serif for body (Inter, Plus Jakarta Sans, or similar). A slightly bolder/display weight for headings that carries personality without being loud |
| **Tone** | Tasteful but not unapproachable. Confident but not elitist. The site should feel like a smart friend sharing notes, not a lecture hall |

### Recommended Color Palette

Built around Material Design with subtle warmth and a nod to Battle Cat's green/gold:

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Forest Teal | `#1B7A6E` | Navigation, primary buttons, active states — evokes Battle Cat's armored green |
| **Primary Dark** | Deep Teal | `#0F4F47` | Headers, dark surfaces, hover states |
| **Secondary** | Amber Gold | `#D4960A` | Accents, highlights, CTAs, level-up indicators — the 80s warmth, Battle Cat's eyes |
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
| L4 | Gold | `#D4960A` | Mastery, Battle Cat's power |

### Logo Concepts (For Design Agent)

Prompt direction for generating the abstract Battle Cat mark:

> "Abstract geometric logo mark for 'Battle Cat AI'. Inspired by a powerful armored tiger but NOT a literal tiger illustration. Think: angular geometric shapes suggesting a feline profile or silhouette, clean lines, modern minimalism. Could reference cat ears, a shield shape, or forward motion. Works in single color. Suitable for favicon at 32px. Material Design aesthetic. Colors: forest teal (#1B7A6E) and amber gold (#D4960A). No text in the mark."

### Brand Deliverables Checklist

- [ ] Logo mark (SVG, PNG at multiple sizes)
- [ ] Logo + wordmark lockup
- [ ] Favicon (16px, 32px, 192px, 512px)
- [ ] OG share image (1200x630)
- [ ] Color palette tokens (CSS custom properties + Tailwind config)
- [ ] Typography scale (headings, body, captions, code)
- [ ] Component styling guide (cards, badges, buttons, level indicators)
- [ ] Dark mode variant
- [ ] Loading / empty state illustrations (optional, Phase 4)

---

## Implementation Status

Updated: January 2026

### Phase 0: Foundation & Branding

| Task | Status | Notes |
|------|--------|-------|
| 0.1 Create battlecat project | **Done** | Next.js 16, TypeScript, Tailwind CSS v4 |
| 0.2 Brand identity | **Partial** | Color palette + tokens implemented. Logo, favicon, OG image still needed (design agent / Midjourney). |
| 0.3 Point domain | **Pending** | Requires: GoDaddy nameservers → Cloudflare, Cloudflare Pages deployment |

### Phase 1: Ingestion

| Task | Status | Notes |
|------|--------|-------|
| 1.1 Twilio setup | **Pending** | Requires: purchase phone number, configure SMS webhook |
| 1.2 Ingestion worker | **Done** | `POST /api/ingest` — parses SMS, detects source type, stores submission |
| Web form (Phase 6 pull-forward) | **Done** | `POST /api/submit` + `/submit` page — paste links from browser |

### Phase 2: Content Extraction

| Task | Status | Notes |
|------|--------|-------|
| 2.1 Article extractor | **Done** | Jina Reader with optional API key auth |
| 2.2 TikTok extractor | **Done** | yt-dlp audio stream → Deepgram Nova-3 transcription |
| 2.3 Tweet extractor | **Done** | Jina Reader → fxtwitter fallback |
| 2.4a YouTube extractor | **Done** | yt-dlp subtitles (VTT parser) → Deepgram audio → Jina Reader |
| 2.4b PDF extractor | **Done** | pdf-parse v2 (text + metadata) |
| 2.4c LinkedIn extractor | **Done** | Jina Reader for public articles, Google cache fallback |

### Phase 3: AI Processing Pipeline

| Task | Status | Notes |
|------|--------|-------|
| 3.1 Level classifier | **Done** | Claude Sonnet — classifies L0–L4 with full framework prompt |
| 3.2 Tutorial generator | **Done** | Two-step: classify → generate (title, summary, body, action items, tags) |
| 3.3 Content merger | **Done** | Detects topic overlap at same level, synthesizes into richer tutorial |
| 3.4 Level-up tagger | **Done** | Tags as level-up, level-practice, or cross-level |

### Phase 4: The Website

| Task | Status | Notes |
|------|--------|-------|
| 4.1 Home page | **Done** | Hero, framework cards, latest tutorials, user distribution chart |
| 4.1 Tutorial detail | **Done** | Full layout with actions (bookmark, complete, share, notes) |
| 4.1 Level pages (L0–L4) | **Done** | Level info, transitions, level-up tutorials, all tutorials |
| 4.1 Level-up view | **Done** | Interactive level selector, transition costs, The Technical Cliff / The Gate |
| 4.1 Learning paths | **Done** | Visual L0→L4 timeline with tutorials at each node |
| 4.1 Browse / filter | **Done** | Level, relation, difficulty, topic multi-filter |
| 4.1 Search | **Done** | Text search across titles, summaries, topics, tags, tools |
| 4.2 Bookmarks | **Done** | localStorage-backed, dedicated /bookmarks page |
| 4.2 Share | **Done** | Web Share API + clipboard fallback, per-tutorial |
| 4.2 Filters | **Done** | Level, relation, difficulty, topic |
| 4.2 Progress tracking | **Done** | localStorage-backed completion + personal notes |
| 4.2 Dark mode | **Done** | Class-based toggle with localStorage persistence |
| 4.3 Mobile responsive | **Done** | Hamburger menu, full-screen overlay, route-aware |
| 4.3 Custom 404 | **Done** | Branded not-found page |
| 4.3 SEO meta tags | **Partial** | OG tags on layout, per-page titles pending |
| 4.3 RSS feed | **Pending** | |

### Phase 5: End-to-End Integration

| Task | Status | Notes |
|------|--------|-------|
| Live SMS → tutorial pipeline | **Pending** | Requires: Supabase project + Twilio phone number |
| Merge behavior testing | **Pending** | Requires live pipeline |
| Prompt tuning | **Pending** | Requires live pipeline |

### Phase 6: Expansion

| Task | Status | Notes |
|------|--------|-------|
| Web form ingestion | **Done** | Pulled forward — /submit page + /api/submit endpoint |
| iOS Shortcut | **Pending** | |
| Email ingestion | **Pending** | |
| Newsletter / digest | **Pending** | |
| Make site public | **Pending** | |
| Admin dashboard | **Pending** | |

### What Requires Manual Setup

These tasks cannot be automated and require account access:

1. **Supabase** — Create project at supabase.com → run `battlecat/src/db/schema.sql` → copy keys to `.env.local`
2. **Deepgram** — Sign up at deepgram.com → copy API key → `DEEPGRAM_API_KEY`
3. **Twilio** — Purchase phone number → configure SMS webhook to `https://battlecat.ai/api/ingest`
4. **Domain** — GoDaddy: change nameservers to Cloudflare → Cloudflare: add battlecat.ai → Cloudflare Pages deployment
5. **yt-dlp** — Install on deployment server (`pip install yt-dlp`) for TikTok/YouTube audio extraction
6. **Logo / visual assets** — Use Midjourney, DALL-E, or designer with the brand brief above
