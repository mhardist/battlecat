# AI Learning Organizer — Planning Document

## Vision

A system that lets you **forward any link** (TikTok, article, YouTube video, tweet, etc.) from your iPhone and automatically:

1. **Extracts** the full content and key details from the source
2. **Categorizes** it by AI topic (prompting, agents, fine-tuning, RAG, etc.)
3. **Synthesizes** it into structured, step-by-step tutorials
4. **Publishes** it to an evergreen blog-style website you can share with friends

---

## Questions To Answer Before Building

### 1. Ingestion — How do you want to send links?

You said "forward to a text or other." Let's nail this down:

- **Option A: iMessage / SMS** — You text a link to a dedicated phone number (powered by Twilio or similar). Lowest friction, works exactly like texting a friend.
- **Option B: Email** — You share a link to a dedicated email address (e.g., `save@myailearning.com`). iOS Share Sheet → Mail is two taps.
- **Option C: iOS Shortcut** — A custom Shortcut in your Share Sheet that sends the URL directly to your backend API. One tap from any app.
- **Option D: Telegram / WhatsApp Bot** — You forward links to a bot in a messaging app you already use.
- **Option E: Dedicated lightweight app / PWA** — A simple "paste and submit" progressive web app on your home screen.

**Question for you:**
> Which of these feels most natural to you? You can pick more than one. The system can support multiple inputs — but which is the *primary* one you'd reach for at 11pm scrolling TikTok?

---

### 2. Content Extraction — What types of content do you forward most?

Different sources need different extraction strategies:

| Source | Extraction Method |
|--------|------------------|
| TikTok videos | Transcribe audio via Whisper, capture captions, extract on-screen text via OCR |
| YouTube videos | Pull transcript (YouTube API or yt-dlp), extract chapters |
| Articles / Blog posts | Scrape readable text (Readability algorithm, Jina Reader, or Firecrawl) |
| Twitter/X threads | Unroll and extract full thread text |
| Reddit posts | Pull post + top comments |
| PDFs / Research papers | Parse text, extract figures and tables |
| Podcasts | Transcribe audio via Whisper |

**Questions for you:**
> - Which 3-5 source types do you forward most frequently?
> - Do you want the system to also grab images/screenshots from the content, or is text enough?
> - For TikToks specifically — do you want just the spoken content, or also the on-screen text overlays?

---

### 3. AI Processing — How should content be organized?

Once content is extracted, an LLM processes it. Here's where we need your input:

**Question: What AI topics are you currently focused on?**
> For example:
> - Prompt engineering
> - Building AI agents
> - RAG (Retrieval-Augmented Generation)
> - Fine-tuning models
> - AI coding tools (Cursor, Claude Code, Copilot)
> - AI image/video generation
> - AI for business / automation
> - AI fundamentals (transformers, embeddings, etc.)
>
> List your top priorities so the system can organize around YOUR learning path, not a generic one.

**Question: What format works best for you?**
> - **Step-by-step tutorial** — "Do this, then this, then this" with code blocks or screenshots
> - **Concept summary + action items** — "Here's the idea, here's what to try"
> - **Skill tree / learning path** — Content mapped to prerequisites and levels
> - **All of the above**, chosen per piece of content?

**Question: Should the system merge related content?**
> For example, if you send 3 different TikToks about building AI agents, should it:
> - (A) Keep them as 3 separate posts
> - (B) Merge them into one comprehensive tutorial
> - (C) Keep them separate but link them as a "series" on the same topic
> - (D) Your call each time (the system asks you)

---

### 4. The Website — What should it look and feel like?

You said "evergreen blog-post like website." Let's define that:

**Question: What's the vibe?**
> - **Minimal / clean** — Think Notion public page, Bear Blog, or a simple wiki
> - **Polished / branded** — Think Substack or Medium with your personal branding
> - **Dashboard-style** — Categories on a sidebar, progress tracking, bookmarks
> - **Something else?** Show me a site you like and I'll match the feel

**Question: Who's the audience?**
> - Just you (private, maybe share individual links)
> - You + a small group of friends (semi-private, shareable links)
> - Public to anyone (SEO-friendly, discoverable)
> - Start private, go public later

**Question: What features matter most?**
> Rank these 1-5 (1 = must have, 5 = don't care):
> - [ ] Search across all saved content
> - [ ] Filter by topic / category / tag
> - [ ] "Learning path" view that orders content sequentially
> - [ ] Bookmark / favorite specific tutorials
> - [ ] Comments or notes you can add to any post
> - [ ] Share individual posts via link
> - [ ] Progress tracking ("I've completed this tutorial")
> - [ ] Email digest / newsletter of new content
> - [ ] Dark mode

---

### 5. Tech Stack — Preferences?

**Question: What's your technical comfort level?**
> - **Non-technical** — I want this hosted and managed, minimal setup
> - **Somewhat technical** — I can follow instructions, comfortable with basic config
> - **Technical** — I can code, deploy, and maintain infrastructure

**Question: Any existing tools or platforms you want to use?**
> For example:
> - Hosting: Vercel, Netlify, Cloudflare Pages, a VPS
> - CMS: Notion, Obsidian, Sanity, Contentful, just markdown files
> - AI API: OpenAI, Anthropic Claude, open-source models
> - Database: Supabase, Firebase, Planetscale, SQLite
> - Domain: Do you have one, or need one?

---

## Proposed Architecture (Draft — Pending Your Answers)

```
┌─────────────────────────────────────────────────────┐
│                    YOUR iPHONE                       │
│  Share Sheet → iOS Shortcut / Text / Email           │
└──────────────────────┬──────────────────────────────┘
                       │ URL + optional note
                       ▼
┌──────────────────────────────────────────────────────┐
│              INGESTION LAYER                          │
│  (API endpoint, email webhook, or SMS webhook)       │
│  Receives link, queues for processing                │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│           CONTENT EXTRACTION ENGINE                   │
│                                                       │
│  • Web scraper (articles, blogs)                     │
│  • Video transcriber (TikTok, YouTube via Whisper)   │
│  • Social media parser (Twitter, Reddit)             │
│  • PDF/document parser                               │
└──────────────────────┬───────────────────────────────┘
                       │ raw extracted text + metadata
                       ▼
┌──────────────────────────────────────────────────────┐
│            AI PROCESSING LAYER                        │
│                                                       │
│  • Categorize by topic                               │
│  • Extract key concepts & action items               │
│  • Generate step-by-step tutorial format             │
│  • Identify related existing content                 │
│  • Assign difficulty level                           │
│  • Generate tags and summary                         │
└──────────────────────┬───────────────────────────────┘
                       │ structured tutorial object
                       ▼
┌──────────────────────────────────────────────────────┐
│              STORAGE & CMS LAYER                      │
│                                                       │
│  • Database (content, metadata, categories)          │
│  • Media storage (screenshots, thumbnails)           │
│  • Search index                                      │
│  • Content relationships (series, prerequisites)     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│           EVERGREEN BLOG / WEBSITE                    │
│                                                       │
│  • Browse by category / topic                        │
│  • Step-by-step tutorial view                        │
│  • Learning path view                                │
│  • Search                                            │
│  • Shareable individual post links                   │
│  • Mobile-friendly                                   │
└──────────────────────────────────────────────────────┘
```

---

## What Happens After You Answer

Once you answer the questions above, the next steps are:

1. **Lock the tech stack** based on your preferences and comfort level
2. **Build the ingestion endpoint** — get links flowing in from your phone
3. **Build the extraction engine** — one source type at a time, starting with your most common
4. **Build the AI processing pipeline** — categorize, structure, and format content
5. **Build the website** — start with a minimal version, iterate based on what you want
6. **Connect it end-to-end** — send a TikTok from your phone, see it appear as a tutorial on your site
7. **Polish and expand** — add more source types, improve the AI output, refine the design

---

## Quick-Start: Minimum Viable Version

If you want something working fast, the simplest version is:

- **Input:** iOS Shortcut → sends URL to an API
- **Extraction:** Jina Reader or Firecrawl for articles, yt-dlp + Whisper for video
- **AI:** Claude API to process extracted text into a tutorial
- **Storage:** Markdown files in a GitHub repo
- **Website:** Astro or Next.js static site on Vercel, auto-deploys on new content

This could be a working prototype before expanding to the full vision.

---

*Answer the questions above and we'll move from planning to building.*
