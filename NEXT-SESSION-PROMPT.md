# Battle Cat AI — Enhancement Prompt

Use this prompt to continue development on battlecat.ai in a new session. The site is live at battlecat.ai, deployed on Vercel from the `main` branch. All code is in the `playground/battlecat` directory.

## Context

Battle Cat AI is a learning platform that turns forwarded links (TikToks, articles, tweets) into organized AI tutorials mapped to the AI Maturity Framework (L0-L4). The full pipeline is working: WhatsApp ingestion → content extraction → Claude AI processing → Supabase storage → Next.js website with ISR.

Read PLANNING.md for the full architecture, framework details, and brand brief. Read LEARNINGS.md for deployment gotchas.

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4 + @tailwindcss/typography
- Supabase (Postgres + FTS + Storage), Anthropic Claude Sonnet, Deepgram Nova-3
- Twilio WhatsApp Sandbox, Together AI FLUX (image generation)
- Deployed on Vercel, domain: battlecat.ai, DNS: GoDaddy

## Enhancements to Implement

### 1. Rename "Battle Cat" → "Battlecat" (one word)

Rename all user-facing instances of "Battle Cat" to "Battlecat" (one word, capital B capital C). This includes:
- Site title, nav, footer, meta tags
- README files, PLANNING.md, PRD.md
- Brand config (`src/config/brand.ts`)
- All page copy that references the brand name
- The `<title>` tag pattern should become "Page Title — Battlecat AI"
- Do NOT rename the `battlecat/` directory or any code identifiers — only user-facing text

### 2. Home Page Redesign: Breaking News First

The current home page leads with the AI Maturity Framework explanation. Redesign it so:

**New layout (top to bottom):**
1. **Hero** — Brief tagline + "Send a link, get a tutorial" value prop. Keep it tight (3 lines max).
2. **Breaking News / Latest Tutorials** — The most recent tutorials displayed prominently as a card grid with hero images, level badges, and summaries. This is the main content. Use the TutorialCard component (which now supports hero images). Show the 6 most recent tutorials.
3. **Framework Overview** — Move the L0-L4 framework cards BELOW the tutorials. Keep the visual cards but make this section secondary. Add a "Learn about the framework →" link rather than showing all details.
4. **Stats bar** — Tutorial count, source count, level distribution. Keep this compact.

The goal: when someone lands on battlecat.ai, they should immediately see interesting content (tutorials), not a framework explanation. The framework is the organizing principle, not the hero.

### 3. Level-Up Page → Interactive Quiz Wizard

Replace the current static Level-Up page with an interactive "Find Your Level" quiz. This should feel like a BuzzFeed-style personality quiz but for AI maturity.

**Quiz flow:**
1. Show a welcome screen: "Where are you on your AI journey? Take 60 seconds to find out."
2. Ask 5-7 multiple choice questions that map to framework levels. Examples:
   - "When you use AI tools, you typically..." → [Ask a question and move on (L0) / Give it detailed context about yourself (L1) / Describe what you want built (L2) / Define the outcome and let it figure out how (L3) / Design a system of multiple AI agents working together (L4)]
   - "Which of these tools have you used?" → [ChatGPT/Gemini only (L0) / Custom GPTs or Projects (L1) / Lovable, v0, or Bolt (L2) / Claude Code or Cursor (L3) / Multi-agent orchestration (L4)]
   - "Your biggest AI frustration is..." → [It doesn't understand what I want (L0) / I have to repeat myself constantly (L1) / The things it builds don't quite work (L2) / It needs too much hand-holding (L3) / Coordinating multiple AI tasks is chaotic (L4)]
3. Calculate the user's level based on their answers (weighted scoring)
4. Show a results page with:
   - Their level (e.g., "You're at Level 2: Designer → Builder")
   - What this means (brief description)
   - "Here's what to learn next" — tutorials tagged as `level-up` from their current level
   - "Deepen your skills" — tutorials tagged as `level-practice` at their current level
   - A shareable result ("Share your level" button)
5. Store the result in localStorage so they don't have to retake it

**Implementation notes:**
- This is a client component (`"use client"`)
- Use React state to track current question and answers
- Animate transitions between questions (simple fade or slide)
- The quiz questions and answer mappings should be in a config file (not hardcoded in JSX)
- Use the existing level colors from `src/config/levels.ts`
- After the quiz, fetch tutorials from `/api/tutorials` and filter by the determined level

### 4. Tool/App Icons Next to Tool Mentions

When tutorials mention specific AI tools (ChatGPT, Claude, Cursor, Lovable, etc.), display a small icon or logo next to the tool name. This applies to:
- The tool pills/badges on tutorial cards and detail pages
- The tools_mentioned array rendering

**Implementation approach:**
- Create a `src/config/tool-icons.ts` mapping of tool name → icon URL or SVG
- For well-known tools (ChatGPT, Claude, Gemini, Cursor, Lovable, v0, Bolt, Replit, Devin), use their actual logos (small 16x16 or 20x20). Source these as SVGs or small PNGs stored in `public/tools/`.
- For unknown tools, use a generic tool/wrench icon
- Create a `ToolBadge` component that renders the icon + tool name
- Replace the current plain `<span>` tool badges with this component

### 5. AI Tool Launch Dates & Timeline

Research and display when AI tools and features were launched. This adds temporal context to tutorials — readers can see how recent or established a tool is.

**Data to collect:**
For each tool in the framework (ChatGPT, Claude, Gemini, Custom GPTs, Claude Projects, Lovable, v0, Bolt, Replit, Cursor, Claude Code, Devin), find:
- Launch date (month/year)
- Current version/status
- Key milestone dates (e.g., "GPT-4 released March 2023")

**Where to display:**
- On the Learning Paths page, add a timeline view showing when tools at each level became available
- On tutorial detail pages, show a small "Tool launched: [date]" note next to tool mentions
- Create a dedicated `/tools` page that lists all AI tools organized by level, with launch dates, descriptions, and links to relevant tutorials

**Implementation:**
- Create `src/config/tools.ts` with structured data for each tool
- This data can be used by the ToolBadge component, the tools page, and the timeline

## Important Notes

- All code changes should be on a `claude/` prefixed branch
- Push to the branch and create PRs — the user will merge to `main` for deployment
- The site uses ISR with 60-second revalidation for server pages
- Client pages fetch from `/api/tutorials` on mount
- Supabase service role key is used server-side; anon key client-side
- The typography plugin is already installed — use `prose` classes for rendered content
- Hero images are generated by Together AI FLUX and stored in Supabase Storage
- All content extractors are cloud-based (no binary dependencies) — this is required for Vercel serverless
- Environment variables are in Vercel project settings (not in the repo)

## Files to Reference

- `PLANNING.md` — Full architecture, framework details, brand brief, implementation status
- `LEARNINGS.md` — Technical lessons from deployment
- `PRD.md` — Product requirements document
- `battlecat/README.md` — Project structure and setup
- `battlecat/src/config/levels.ts` — Level definitions and colors
- `battlecat/src/config/brand.ts` — Brand tokens
- `battlecat/src/types/index.ts` — TypeScript types
- `battlecat/src/data/tutorials.ts` — Supabase data layer
- `battlecat/src/components/TutorialCard.tsx` — Tutorial card (supports hero images)
- `battlecat/src/app/page.tsx` — Home page (to redesign)
- `battlecat/src/app/level-up/page.tsx` — Level-up page (to replace with quiz)
