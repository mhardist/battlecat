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
- **Articles / blogs:** Jina Reader API or Firecrawl (readable text extraction)
- **TikTok:** yt-dlp to download audio → OpenAI Whisper API for transcription
- **YouTube:** yt-dlp for transcript or YouTube transcript API
- **Twitter/X:** Tweet extraction via API or scraping service
- **LinkedIn:** Scrape or manual paste (LinkedIn blocks most automated access)
- **PDFs:** pdf-parse or Unstructured.io

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
│  • TikTok: yt-dlp + Whisper (spoken words)               │
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

**Task 0.1: Create the `battlecat` repo**
- New GitHub repo: `mhardist/battlecat`
- Initialize with Next.js 14+, Tailwind CSS, TypeScript
- Set up Cloudflare Pages deployment
- Configure Supabase project

**Task 0.2: Brand Identity for Battle Cat**
- This is a from-scratch brand inspired by He-Man's Battle Cat (80s cartoon)
- Deliverables needed:
  - Logo (primary + icon)
  - Color palette
  - Typography selection
  - Brand voice / tone guide
  - Favicon + social share images (OG tags)
  - Loading/empty state illustrations
- **Approach:** Use AI agents skilled in brand design to generate options:
  - Use an image generation model (Midjourney, DALL-E, or Ideogram) for logo concepts
  - Use Claude to define brand voice, color theory, typography pairing
  - Use a design tool (Figma, or Lovable for rapid iteration) to assemble brand kit
  - Iterate until the brand feels right — 80s energy, modern polish

**Task 0.3: Point domain**
- Transfer DNS to Cloudflare (or point GoDaddy nameservers to Cloudflare)
- Set up battlecat.ai on Cloudflare Pages

### Phase 1: Ingestion (Text a Link)

**Task 1.1: Twilio setup**
- Purchase a phone number
- Configure SMS webhook → Cloudflare Worker endpoint

**Task 1.2: Ingestion Worker**
- Parse incoming SMS for URLs
- Detect source type from URL patterns
- Store raw submission in Supabase
- Queue for extraction
- Reply with confirmation SMS ("Got it — processing your link")

### Phase 2: Content Extraction

**Task 2.1: Article extractor**
- Jina Reader API integration for articles/blogs
- Fallback to Firecrawl if Jina fails

**Task 2.2: TikTok extractor**
- yt-dlp to download audio track
- Whisper API for transcription (spoken words only)

**Task 2.3: Tweet extractor**
- Twitter/X API or scraping service for tweets + threads

**Task 2.4: Secondary extractors (YouTube, PDF, LinkedIn)**
- YouTube: yt-dlp transcript extraction
- PDF: pdf-parse for text extraction
- LinkedIn: best-effort scrape with manual fallback

### Phase 3: AI Processing Pipeline

**Task 3.1: Level classifier**
- Claude API prompt that classifies content into L0–L4 based on:
  - Tools/platforms mentioned
  - Complexity of concepts
  - User role implied (asker, instructor, designer, supervisor, architect)
  - Actionability (watching vs. building vs. orchestrating)

**Task 3.2: Tutorial generator**
- Claude API prompt that transforms raw extracted text into:
  - Title
  - Summary (2-3 sentences)
  - Maturity level(s)
  - Topics / tags
  - Step-by-step tutorial body
  - "Try this" action items
  - Tools referenced
  - Difficulty rating
  - Prerequisites (links to other tutorials)

**Task 3.3: Content merger**
- When new content arrives, check existing tutorials for topic overlap
- If match found: Claude synthesizes old + new into an updated, richer tutorial
- Original source links preserved as references
- Merge history tracked

**Task 3.4: Level-up tagger**
- Classify each tutorial as:
  - **Level-up:** Teaches you to move from L(n) to L(n+1)
  - **Level-practice:** Deepens skill at current level
  - **Cross-level:** Spans multiple levels

### Phase 4: The Website

**Task 4.1: Core pages**
- Home page (featured + latest)
- Tutorial detail page
- Level pages (L0, L1, L2, L3, L4)
- Level-up view ("You're here → here's what to learn next")
- Topic pages
- Learning path view
- Search

**Task 4.2: Features**
- Bookmarks / favorites (Supabase + local storage for anonymous users)
- Share via link (OG meta tags for social previews)
- Filter by level + topic + tag
- Progress tracking
- Notes / comments (Supabase real-time)
- Dark mode (Tailwind dark variant)

**Task 4.3: Polish**
- Apply Battle Cat brand identity throughout
- Mobile-first responsive design
- Loading states, empty states, error states
- SEO meta tags (for when it goes public)
- RSS feed

### Phase 5: End-to-End Integration

- Text a TikTok link from iPhone
- See it arrive as a processed, level-tagged tutorial on battlecat.ai
- Verify merge behavior with duplicate topics
- Verify level classification accuracy
- Tune prompts based on real results

### Phase 6: Expansion

- Add iOS Shortcut as second ingestion method
- Email ingestion (Cloudflare Email Workers)
- Web form on battlecat.ai ("Paste a link")
- Newsletter / email digest (weekly)
- Make site public — SEO, social sharing, open access
- Admin dashboard for content moderation

---

## Remaining Questions

Before building begins, one question remains:

**For the Battle Cat brand — do you have any specific visual direction in mind?**
- Color palette preferences? (80s neon? Dark/moody like your deck? Warm gold tones?)
- Should the logo literally feature a battle cat / tiger, or is it more abstract?
- Any brands or sites whose visual identity you admire?

---

*Once you answer the branding question, we start building in the `battlecat` repo.*
