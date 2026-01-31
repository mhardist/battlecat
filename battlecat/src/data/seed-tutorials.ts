import { Tutorial } from "@/types";

/**
 * Seed tutorials for development.
 * These represent the kind of content the system will generate
 * once the full pipeline is connected.
 */
export const SEED_TUTORIALS: Tutorial[] = [
  {
    id: "seed-01",
    slug: "what-is-prompt-engineering",
    title: "What Is Prompt Engineering and Why Should You Care?",
    summary:
      "A beginner-friendly breakdown of how the words you type into AI tools shape the quality of what you get back. Start here if you're new to AI.",
    body: `<h2>The basics</h2>
<p>Prompt engineering is the practice of crafting your input to an AI model so it produces better, more useful output. Think of it like learning to ask better questions — the better you ask, the better the answer.</p>

<h2>Why it matters</h2>
<p>Most people type a vague sentence into ChatGPT and get a vague answer back. That's L0 behavior — transactional, no context, no continuity. Understanding prompts is the first step to getting real value from AI.</p>

<h2>Key techniques</h2>
<ul>
<li><strong>Be specific:</strong> "Write a 3-paragraph summary of X for a non-technical audience" beats "Tell me about X"</li>
<li><strong>Give context:</strong> Tell the AI who you are and what you need the output for</li>
<li><strong>Use examples:</strong> Show the AI what good output looks like</li>
<li><strong>Iterate:</strong> Your first prompt is rarely your best — refine and ask again</li>
</ul>

<h2>The L0 to L1 bridge</h2>
<p>Once you understand prompts, the natural next step is to stop repeating yourself. That's where custom instructions and memory come in — the jump from L0 (Asker) to L1 (Instructor).</p>`,
    maturity_level: 0,
    level_relation: "level-up",
    topics: ["prompt engineering", "getting started"],
    tags: ["beginner", "fundamentals", "prompts"],
    tools_mentioned: ["ChatGPT", "Claude", "Gemini"],
    difficulty: "beginner",
    action_items: [
      "Open ChatGPT or Claude and try the same question with a vague prompt vs. a specific one",
      "Add context about yourself to your next prompt and compare the results",
      "Save your best prompts somewhere — you'll reuse them",
    ],
    source_urls: [
      "https://example.com/prompt-engineering-guide",
      "https://example.com/better-ai-prompts",
    ],
    source_count: 2,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "seed-02",
    slug: "custom-gpts-and-memory",
    title: "Custom GPTs and AI Memory: Stop Repeating Yourself",
    summary:
      "How to use Custom GPTs, Claude Projects, and memory features to create AI assistants that already know who you are and what you need.",
    body: `<h2>The problem with starting over</h2>
<p>Every time you open a new chat, you lose all context. You re-explain your role, your preferences, your constraints. That's wasted time and worse output. This is the L0 trap.</p>

<h2>Level 1: Teach the AI who you are</h2>
<p>L1 is about giving up anonymity and investing time to teach the AI about you. The payoff is massive — responses that actually fit your situation without you having to explain it every time.</p>

<h2>How to do it</h2>

<h3>Custom GPTs (OpenAI)</h3>
<p>Create a GPT pre-loaded with your context: role, industry, communication style, common tasks. Share it with your team or keep it private.</p>

<h3>Claude Projects</h3>
<p>Upload documents, set project instructions, and chat within a persistent context. Claude remembers the project scope across conversations.</p>

<h3>The Grocery Test</h3>
<p>Ask your AI to make you a grocery list. If it gives you a generic list, you're at L0. If it knows you're vegetarian, shop at Trader Joe's, and cook for two — that's L1.</p>

<h2>What you give up</h2>
<p>Anonymity. You have to share real information about yourself. But the trade is worth it: AI that actually helps instead of generically responds.</p>`,
    maturity_level: 1,
    level_relation: "level-practice",
    topics: ["personalization", "custom GPTs", "memory"],
    tags: ["custom-gpts", "projects", "memory", "personalization"],
    tools_mentioned: ["Custom GPTs", "Projects", "Gems"],
    difficulty: "beginner",
    action_items: [
      "Create a Custom GPT (or Claude Project) with your role, preferences, and common tasks",
      "Run the Grocery Test: ask for a grocery list and see if the output reflects YOU",
      "Move one repeated workflow into a persistent AI context",
    ],
    source_urls: ["https://example.com/custom-gpts-guide"],
    source_count: 1,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-16T14:30:00Z",
    updated_at: "2025-01-18T09:00:00Z",
  },
  {
    id: "seed-03",
    slug: "vibe-coding-with-lovable-v0",
    title: "Vibe Coding: Build Real Apps Without Writing Code",
    summary:
      "How tools like Lovable, v0, and Bolt let you describe an app and get a working prototype in minutes. This is L2 — you design, AI builds.",
    body: `<h2>What is vibe coding?</h2>
<p>Vibe coding is describing what you want in natural language and having AI generate a working application. You're the designer; AI is the builder. That's the L2 relationship.</p>

<h2>The tools</h2>

<h3>Lovable</h3>
<p>Full-stack app generation from a description. Handles frontend, backend, database, and deployment. Best for: complete web apps with authentication and data.</p>

<h3>v0 by Vercel</h3>
<p>UI component generation with React/Next.js. Best for: frontend components, landing pages, design system pieces.</p>

<h3>Bolt</h3>
<p>Rapid prototyping with live preview. Best for: quick iterations, exploring ideas visually.</p>

<h3>Replit</h3>
<p>Full development environment with AI assistance. Best for: when you want to see and edit the code alongside the AI.</p>

<h2>The L2 mindset</h2>
<p>At L2, you stop doing the work and start specifying the work. Your value is clarity — knowing what you want built, not how to build it. The clearer your spec, the better the output.</p>

<h2>What L2 gets you</h2>
<p><strong>SHOW IT.</strong> Prototypes, demos, proof of concepts. You can go from idea to clickable demo in an afternoon. That's a competitive advantage most people haven't realized yet.</p>`,
    maturity_level: 2,
    level_relation: "level-practice",
    topics: ["vibe coding", "rapid prototyping", "no-code AI"],
    tags: ["vibe-coding", "prototyping", "lovable", "v0", "bolt"],
    tools_mentioned: ["Lovable", "v0", "Bolt", "Replit"],
    difficulty: "intermediate",
    action_items: [
      "Pick one idea you've been sitting on and describe it in 2-3 paragraphs",
      "Feed that description into Lovable or v0 and see what comes out",
      "Iterate on the output 3 times — each time, be more specific about what you want changed",
    ],
    source_urls: [
      "https://example.com/vibe-coding-explained",
      "https://example.com/lovable-tutorial",
      "https://example.com/v0-examples",
    ],
    source_count: 3,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-18T11:00:00Z",
    updated_at: "2025-01-20T16:00:00Z",
  },
  {
    id: "seed-04",
    slug: "claude-code-agentic-engineering",
    title: "Claude Code and the Agentic Engineering Loop",
    summary:
      "How to work with AI agents that read your codebase, make decisions, and ship code autonomously. The L3 shift from directing to supervising.",
    body: `<h2>From L2 to L3: the technical cliff</h2>
<p>L2 tools build prototypes. L3 tools ship production code. The gap between them is real engineering: security, authentication, data integrity, error handling. Most people stall here.</p>

<h2>What L3 looks like</h2>
<p>You define "done." The agent figures out how. You review outcomes, not keystrokes. This is the Supervisor → Agent relationship.</p>

<h2>The agentic engineering loop</h2>
<ol>
<li><strong>Understand:</strong> Agent reads your codebase, docs, and existing patterns</li>
<li><strong>Plan:</strong> Agent proposes an approach before writing code</li>
<li><strong>Execute:</strong> Agent writes code, creates files, runs tests</li>
<li><strong>Verify:</strong> Agent checks its own work against acceptance criteria</li>
<li><strong>Iterate:</strong> Agent fixes issues found during verification</li>
<li><strong>Deliver:</strong> Clean PR ready for human review</li>
</ol>

<h2>Tools</h2>
<h3>Claude Code</h3>
<p>CLI tool that reads your entire codebase, understands the architecture, and makes changes across multiple files. Works in your terminal alongside git.</p>

<h3>Cursor</h3>
<p>AI-native code editor. Understands your project context and suggests changes across files.</p>

<h2>The key mindset shift</h2>
<p>Stop micromanaging. Write clear acceptance criteria. Let the agent work. Review the diff, not the process. If you're watching every keystroke, you're still at L2.</p>`,
    maturity_level: 3,
    level_relation: "level-practice",
    topics: ["agentic coding", "Claude Code", "engineering workflows"],
    tags: ["agentic", "claude-code", "cursor", "engineering-loop"],
    tools_mentioned: ["Claude Code", "Cursor", "Devin"],
    difficulty: "advanced",
    action_items: [
      "Install Claude Code and point it at a real project",
      "Write acceptance criteria for a feature BEFORE asking the agent to build it",
      "Practice reviewing diffs instead of watching the agent work in real-time",
    ],
    source_urls: [
      "https://example.com/agentic-engineering",
      "https://example.com/claude-code-workflow",
    ],
    source_count: 2,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-20T08:00:00Z",
    updated_at: "2025-01-22T14:00:00Z",
  },
  {
    id: "seed-05",
    slug: "multi-agent-orchestration",
    title: "Multi-Agent Orchestration: Your AI Organization",
    summary:
      "How to coordinate multiple AI agents as a team — parallel execution, quality gates, and the PRD-first waterfall. This is L4: Architect → Organization.",
    body: `<h2>What is L4?</h2>
<p>L4 is where you stop supervising individual agents and start designing systems of agents. You're the architect of an AI organization. The org chart includes AI.</p>

<h2>The PRD-first waterfall</h2>
<p>Start with a Product Requirements Document. Every agent in the system references this single source of truth. No interpretation drift, no scope creep — the PRD is the contract.</p>

<h2>Parallel execution</h2>
<p>Multiple agents working simultaneously on different parts of the same project. One handles frontend, another handles API design, another writes tests. They share a codebase but own different domains.</p>

<h2>The Ralph Wiggum Loop</h2>
<p>Named after "I'm in danger" — when an agent realizes it's stuck, confused, or going in circles. Good orchestration includes circuit breakers: if an agent loops 3 times on the same error, escalate to human.</p>

<h2>Quality gates</h2>
<ul>
<li><strong>Plan review:</strong> Before an agent writes code, its plan gets approved</li>
<li><strong>Test gate:</strong> Code must pass tests before merging</li>
<li><strong>Security gate:</strong> Automated checks for auth, injection, data exposure</li>
<li><strong>Human gate:</strong> Critical paths always get human review</li>
</ul>

<h2>The Gate: L3 → L4</h2>
<p>You can't orchestrate what you can't trust. L4 requires mastery of security (auth, encryption, access control), reliability (error handling, testing, monitoring), and systems thinking (architecture, scaling, integration). This is "The Gate."</p>`,
    maturity_level: 4,
    level_relation: "level-practice",
    topics: ["multi-agent", "orchestration", "systems design"],
    tags: [
      "orchestration",
      "multi-agent",
      "prd-waterfall",
      "quality-gates",
      "the-gate",
    ],
    tools_mentioned: ["Multi-agent orchestration"],
    difficulty: "advanced",
    action_items: [
      "Write a PRD for a project before involving any AI agents",
      "Try running two Claude Code instances on different parts of the same repo using git worktrees",
      "Design a quality gate checklist for your next AI-assisted project",
    ],
    source_urls: [
      "https://example.com/multi-agent-orchestration",
      "https://example.com/prd-first-development",
      "https://example.com/ai-quality-gates",
    ],
    source_count: 3,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-22T10:00:00Z",
    updated_at: "2025-01-25T11:00:00Z",
  },
  {
    id: "seed-06",
    slug: "technical-cliff-l2-to-l3",
    title: "The Technical Cliff: Getting From L2 to L3",
    summary:
      "The hardest level transition. Why prototyping tools can't ship production code, and what you need to learn to cross the gap.",
    body: `<h2>The gap is real</h2>
<p>L2 tools (Lovable, v0, Bolt) generate working prototypes. They look great in demos. But they don't handle authentication properly, they don't sanitize inputs, they don't handle edge cases, and they don't scale.</p>

<h2>What production requires that prototypes skip</h2>
<ul>
<li><strong>Authentication & authorization:</strong> Who can access what? How are tokens stored?</li>
<li><strong>Data integrity:</strong> What happens when two users edit the same record?</li>
<li><strong>Error handling:</strong> What does the user see when the API is down?</li>
<li><strong>Security:</strong> SQL injection, XSS, CSRF — prototypes rarely handle these</li>
<li><strong>Payment processing:</strong> Real money requires real engineering</li>
</ul>

<h2>How to cross the cliff</h2>
<p>You don't need to become a software engineer. But you need to understand enough to supervise one — even if that "engineer" is an AI agent.</p>

<h3>The minimum viable engineering knowledge</h3>
<ol>
<li>Understand what a database does and why schema design matters</li>
<li>Know the difference between client-side and server-side code</li>
<li>Understand authentication flows (OAuth, JWT, sessions)</li>
<li>Know what environment variables are and why secrets can't be in code</li>
<li>Understand git branching and why you don't push to main</li>
</ol>

<h2>The reward</h2>
<p>Cross the cliff and you can SHIP IT. Not just show it — ship it. That's the difference between a demo and a product.</p>`,
    maturity_level: 2,
    level_relation: "level-up",
    topics: ["technical cliff", "production engineering", "security basics"],
    tags: ["level-up", "technical-cliff", "security", "production"],
    tools_mentioned: ["Lovable", "v0", "Bolt", "Claude Code"],
    difficulty: "intermediate",
    action_items: [
      "Take one of your L2 prototypes and list every security hole you can find",
      "Learn the basics of one authentication system (Supabase Auth, NextAuth, or Clerk)",
      "Set up a git repo with branch protection — no direct pushes to main",
    ],
    source_urls: [
      "https://example.com/prototype-to-production",
      "https://example.com/security-for-non-engineers",
    ],
    source_count: 2,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-19T09:00:00Z",
    updated_at: "2025-01-21T15:00:00Z",
  },
  {
    id: "seed-07",
    slug: "the-gate-l3-to-l4",
    title: "The Gate: Security, Reliability, and Systems Thinking",
    summary:
      "The transition from L3 to L4 is gated. Here's what you need to master before you can orchestrate multiple AI agents as an organization.",
    body: `<h2>Why L4 is gated</h2>
<p>You can stumble into L1 or L2. L3 requires a mindset shift. But L4 requires demonstrated competence. If your individual agents aren't secure and reliable, orchestrating multiple agents will multiply your problems.</p>

<h2>The three pillars of The Gate</h2>

<h3>1. Security</h3>
<ul>
<li>Authentication and authorization for every endpoint</li>
<li>Encryption at rest and in transit</li>
<li>Access control: agents should have minimum necessary permissions</li>
<li>Secret management: no keys in code, ever</li>
<li>Audit trails: know what every agent did and when</li>
</ul>

<h3>2. Reliability</h3>
<ul>
<li>Error handling that degrades gracefully</li>
<li>Automated testing (unit, integration, e2e)</li>
<li>Monitoring and alerting</li>
<li>Circuit breakers for external services</li>
<li>Rollback capability for deployments</li>
</ul>

<h3>3. Systems Thinking</h3>
<ul>
<li>Architecture decomposition: breaking complex systems into manageable pieces</li>
<li>Interface design: how components communicate</li>
<li>Scaling patterns: what breaks when load increases?</li>
<li>Integration testing: the system works together, not just individually</li>
</ul>

<h2>How to prepare</h2>
<p>Master L3 first. Ship real products with single agents. Build confidence in code review, testing, and deployment. Then start designing systems.</p>`,
    maturity_level: 3,
    level_relation: "level-up",
    topics: ["the gate", "security", "reliability", "systems thinking"],
    tags: ["the-gate", "level-up", "security", "reliability", "systems-thinking"],
    tools_mentioned: ["Claude Code", "Cursor"],
    difficulty: "advanced",
    action_items: [
      "Audit one of your L3 projects: does it have proper auth, error handling, and tests?",
      "Set up monitoring for a deployed project (even a simple uptime check)",
      "Draw an architecture diagram of your most complex project — identify the weak points",
    ],
    source_urls: [
      "https://example.com/the-gate-framework",
    ],
    source_count: 1,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-01-23T12:00:00Z",
    updated_at: "2025-01-25T10:00:00Z",
  },
  {
    id: "seed-08",
    slug: "build-custom-gpt-claude-project-gemini-gem",
    title: "Build Your First Custom GPT, Claude Project, or Gemini Gem",
    summary:
      "Stop repeating yourself every conversation. This step-by-step guide walks you through building personalized AI assistants on all three major platforms — the single biggest upgrade from L0 to L1.",
    body: `## You're Wasting 30% of Every AI Conversation

Every time you open a new chat and type "I'm a marketing manager at a SaaS startup, I need..." — you've already lost. That context you just typed? The AI forgets it the moment you close the tab. You're at L0: Asker. The AI is a stranger every single time.

> The jump from L0 to L1 isn't about learning a new tool. It's about teaching AI who you are — once — so it never forgets.

---

## Why This Matters

Custom GPTs, Claude Projects, and Gemini Gems are the same concept on three platforms: **a persistent AI assistant pre-loaded with your context**. Your role, your industry, your preferences, your communication style, your recurring tasks. Set it up once, use it forever.

The people who've made this jump report getting **2-3x better outputs** immediately. Not because the AI got smarter — because it finally knows who it's talking to.

---

## How to Build One on Each Platform

### Custom GPTs (ChatGPT Plus)

1. Click **Explore GPTs** in the sidebar, then **+ Create**
2. In the **Configure** tab, write instructions that cover:
   - Who you are (role, industry, company size)
   - How you want responses formatted (bullet points? paragraphs? with examples?)
   - What the GPT should never do (no generic advice, no fluff)
3. Upload any reference documents — style guides, SOPs, product docs
4. Add **Prompt Starters** like "Draft a customer email about..." or "Analyze this competitor's landing page"
5. Test it with real tasks, refine the instructions, repeat

> Pro tip: Use the RODES framework — **R**ole, **O**bjective, **D**etails, **E**xamples, **S**ense Check. Start every instruction set with who the GPT is and what it's trying to achieve.

### Claude Projects

1. Open **claude.ai**, click **Projects** in the sidebar, then **New Project**
2. Set a **Project Name** and write detailed **Project Instructions**
3. Upload files directly — Claude can reference PDFs, docs, spreadsheets, codebases
4. Every conversation within the project inherits the full context
5. Use it for ongoing work: weekly reports, content calendars, code reviews

### Gemini Gems

1. In **gemini.google.com**, find **Gems** in the sidebar
2. Click **Create Gem** and define the persona
3. Add behavioral instructions and knowledge context
4. Gems integrate with Google Workspace — they can reference your Drive, Docs, and Sheets

---

## The Grocery Test

Here's how you know it's working: **ask your custom AI to make you a grocery list.**

- **L0 response**: Generic list of common items
- **L1 response**: Knows you're vegetarian, shops at Trader Joe's, cooks for two, avoids gluten, and always needs more coffee

If your AI can't pass this test, your instructions aren't specific enough.

---

## Common Mistakes

- **Too vague**: "Be helpful and professional" tells the AI nothing. Instead: "You are a content strategist for B2B SaaS. Write in a direct, confident tone. Use bullet points. Always include 3 specific examples."
- **Too restrictive**: Don't micromanage every response format. Give personality and constraints, not scripts.
- **No examples**: Include 2-3 examples of ideal outputs in your instructions. This is the single most effective technique.

---

## The Bottom Line

Building a Custom GPT, Claude Project, or Gemini Gem takes 15 minutes. The time you save over the next month will be measured in hours. This is the easiest, highest-ROI level-up in the entire AI Maturity Framework. Do it today.`,
    maturity_level: 0,
    level_relation: "level-up",
    topics: ["custom GPTs", "Claude Projects", "Gemini Gems", "personalization"],
    tags: ["level-up", "custom-gpts", "projects", "gems", "personalization", "L0-to-L1"],
    tools_mentioned: ["Custom GPTs", "Projects", "Gems", "ChatGPT", "Claude", "Gemini"],
    difficulty: "beginner",
    action_items: [
      "Build a Custom GPT (or Claude Project or Gem) with your role, industry, and communication preferences in the instructions",
      "Run the Grocery Test — ask it for a grocery list and check if the output reflects YOUR dietary preferences and shopping habits",
      "Upload one reference document (style guide, SOP, or product brief) and test a real work task against it",
    ],
    source_urls: [
      "https://www.adventuresincre.com/how-to-build-custom-gpt-gemini-gem-claude-project-2025/",
    ],
    source_count: 1,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-05-20T10:00:00Z",
    updated_at: "2025-05-20T10:00:00Z",
  },
  {
    id: "seed-09",
    slug: "vibe-coding-tools-compared-lovable-v0-bolt",
    title: "I Tested Every Vibe Coding Tool — Here's Which One to Start With",
    summary:
      "Lovable, v0, Bolt, and Replit all promise to turn your words into working apps. After building the same project on each, here's what actually works — and where each tool falls apart.",
    body: `## The Promise: Describe an App, Get a Working App

Vibe coding is the L2 superpower: you describe what you want in plain English, and AI generates a fully functional application. No syntax, no boilerplate, no Stack Overflow rabbit holes. You design, AI builds.

But which tool should you actually use? They all sound the same in their marketing. Here's what happens when you test them with real projects.

> The best vibe coding tool isn't the one with the most features — it's the one that gets you to a working prototype fastest with the fewest dead ends.

---

## The Tools, Ranked for Beginners

### Lovable — Best All-Around Starting Point

**What it does**: Full-stack app generation from a text description. Handles frontend, backend, database, auth, and deployment in one flow.

**What surprised me**: The UI quality is genuinely impressive out of the box. It generates clean, responsive layouts that look professional without tweaking. It also handles Supabase integration natively, so you get real data persistence without configuring anything.

**Where it struggles**: Complex business logic. Once your app needs multi-step workflows or nuanced conditional logic, you'll hit limits. Good for MVPs, tough for production apps.

**Best for**: Complete web apps, dashboards, CRUD tools, internal tools.

### v0 by Vercel — Best for UI Components

**What it does**: Converts prompts into React components using shadcn/ui and Tailwind CSS.

**What surprised me**: The component quality is exceptional. If you need a specific UI element — a pricing table, a data grid, a settings panel — v0 often nails it on the first try.

**Where it struggles**: It generates components, not full apps. You need to know how to wire them together, or use it alongside another tool.

**Best for**: Frontend components, landing pages, design system pieces.

### Bolt.new — Best for Creative Projects

**What it does**: Rapid prototyping with live preview in the browser. Open source.

**Where it struggles**: Production readiness. Bolt is amazing for exploring ideas but the generated code often needs significant cleanup before shipping.

**Best for**: Quick iterations, hackathon projects, exploring ideas visually.

### Replit — Best for Learning

**What it does**: Full cloud IDE with an AI agent that can build and deploy apps from natural language.

**What surprised me**: The agent mode is powerful. It doesn't just generate code — it sets up the project, installs dependencies, configures the environment, and deploys. You can watch it work and learn from its decisions.

**Where it struggles**: Can be overwhelming for pure beginners. The IDE interface is powerful but complex.

**Best for**: People who want to understand what's happening under the hood.

---

## The L1 → L2 Mindset Shift

Moving from L1 (personalized chat) to L2 (building things) requires a mental model change:

- **L1 thinking**: "Help me write an email about X"
- **L2 thinking**: "Build me a dashboard that shows Y with filters for Z"

> At L2, your value isn't typing code — it's having a clear vision of what should exist. The clearer your spec, the better the output.

Three rules for better vibe coding prompts:

1. **Be specific about structure**: "A two-column layout with a sidebar showing filters and a main area showing cards" beats "a nice-looking page"
2. **Describe interactions**: "When I click a card, it expands to show full details with an edit button" gives the AI something to build
3. **Iterate in small steps**: Don't try to describe the entire app at once. Build one screen, refine it, then add the next

---

## The Recommended Path

Start with **Lovable** to build your first complete app. Use **v0** when you need a specific, polished UI component. Try **Bolt** for quick experiments and creative exploration. Graduate to **Replit** when you want to learn what's happening under the hood.

And when your prototype needs real engineering — authentication, payments, production deployment — that's when you've hit the L2→L3 cliff. That's a different tutorial.

---

## The Bottom Line

You can go from idea to working, deployed app in an afternoon. That's not an exaggeration — it's the new baseline. The question isn't whether vibe coding works; it's which tool fits your project. Start with Lovable, iterate fast, and don't let perfect be the enemy of shipped.`,
    maturity_level: 1,
    level_relation: "level-up",
    topics: ["vibe coding", "Lovable", "v0", "Bolt", "app building"],
    tags: ["level-up", "vibe-coding", "lovable", "v0", "bolt", "replit", "comparison", "L1-to-L2"],
    tools_mentioned: ["Lovable", "v0", "Bolt", "Replit"],
    difficulty: "beginner",
    action_items: [
      "Sign up for Lovable (free tier) and describe a simple app idea in 3 sentences — a personal dashboard, a reading list tracker, or a recipe organizer",
      "Take the same idea to v0.dev and compare the UI quality of what each tool generates",
      "Iterate 3 times on your Lovable prototype — each time, be more specific about one thing you want changed",
    ],
    source_urls: [
      "https://uxplanet.org/i-tested-5-ai-coding-tools-so-you-dont-have-to-b229d4b1a324",
    ],
    source_count: 1,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-05-21T10:00:00Z",
    updated_at: "2025-05-21T10:00:00Z",
  },
  {
    id: "seed-10",
    slug: "claude-code-best-practices-agentic-coding",
    title: "Claude Code Best Practices: From Vibe Coder to Agentic Engineer",
    summary:
      "Anthropic's own engineering team shares how they use Claude Code to ship production code autonomously. The definitive guide to crossing from L2 (prototyping) to L3 (supervising AI agents).",
    body: `## The L2 Ceiling

You've built prototypes with Lovable or v0. They look great in demos. But when it's time to add authentication, handle edge cases, write tests, or deploy to production — you hit a wall. Vibe coding tools generate code; **agentic coding tools engineer solutions**.

Claude Code is Anthropic's answer to this gap: a terminal-based AI agent that reads your entire codebase, makes architectural decisions, writes code across multiple files, runs tests, and iterates until things work.

> The L2→L3 shift isn't about using a harder tool. It's about changing your role: from describing what you want (designer) to defining what "done" looks like (supervisor).

---

## What Makes Claude Code Different

Unlike vibe coding tools that generate apps from scratch, Claude Code drops into your **existing** project. It reads your file structure, understands your patterns, respects your conventions, and extends what's already there. Key differences:

- **Full codebase awareness**: Reads your entire repo, not just the file you're looking at
- **Terminal-native**: Runs alongside git, npm, and your existing workflow
- **Agentic loop**: Plans → executes → verifies → iterates autonomously
- **Tool use**: Can run tests, check types, execute commands, and verify its own work

---

## CLAUDE.md: Your Agent's Briefing Document

The single most impactful thing you can do is create a **CLAUDE.md** file in your repo root. Claude Code reads this automatically at the start of every session. Think of it as the agent's onboarding doc.

What to include:

- **Build commands**: \`npm run build\`, \`npm test\`, lint commands
- **Architecture overview**: "This is a Next.js 15 app with Supabase backend, organized by feature"
- **Code conventions**: "We use TypeScript strict mode. No \`any\` types. Prefer named exports."
- **Common patterns**: "API routes use the shared \`createServerClient()\` helper for Supabase"
- **What NOT to do**: "Never modify the database schema without updating \`schema.sql\`"

> The better your CLAUDE.md, the less you need to repeat yourself in prompts. It's the L3 equivalent of Custom GPT instructions — context that persists.

---

## Test-Driven Development with Agents

Anthropic's team calls this their favorite workflow, and it changes how you think about delegation:

1. **You write the test** (or describe what the test should verify)
2. **Claude Code implements the feature** to make the test pass
3. **Claude Code runs the test** to verify it works
4. **You review the diff**, not the process

This is powerful because the test is your **acceptance criteria**. You're defining "done" in code. The agent figures out how to get there.

### Example workflow:
\`\`\`
"Write a test that verifies the /api/submit endpoint returns 400
when no URL is provided, then implement the validation to make it pass."
\`\`\`

Claude Code will write the test, run it (it fails), implement the validation, run it again (it passes), and present you with the diff.

---

## The Key Mindset Shifts

### 1. Stop watching. Start reviewing.
If you're watching Claude Code type every character, you're still at L2. Let it work. Come back and review the diff. If the tests pass and the code is clean, approve it.

### 2. Write prompts like you'd write tickets
Bad: "Fix the login bug"
Good: "Users report that login fails when their email contains a '+' character. The issue is likely in the email validation regex in \`lib/auth.ts\`. Write a test that reproduces this, then fix it."

### 3. Use \`/compact\` for long sessions
Claude Code conversations accumulate context. Use \`/compact\` periodically to summarize and free up the context window for new work.

### 4. Let it run commands
Claude Code can execute shell commands, run tests, and check its own work. Don't be afraid to let it. The agentic loop — plan, execute, verify — only works if the agent can verify.

---

## Common Pitfalls

- **Underdefined tasks**: "Make the app better" gives the agent nothing to work with. Be specific about what needs to change and how you'll know it's done.
- **Overriding the agent's plan**: If Claude Code proposes an approach and you immediately redirect, you're micromanaging. Let it try. Redirect if the result is wrong, not the approach.
- **Skipping CLAUDE.md**: Without it, every session starts cold. You'll waste the first 5 minutes of every conversation re-explaining your codebase.

---

## The Bottom Line

Claude Code isn't a better autocomplete. It's a junior engineer that reads your codebase, follows your conventions, writes tests, and ships PRs. Your job is to define what "done" looks like, review the output, and course-correct when needed. That's L3: Supervisor → Agent. The sooner you stop directing every keystroke, the sooner you start shipping faster than you ever could alone.`,
    maturity_level: 2,
    level_relation: "level-up",
    topics: ["Claude Code", "agentic coding", "test-driven development", "CLAUDE.md"],
    tags: ["level-up", "claude-code", "agentic", "tdd", "best-practices", "L2-to-L3"],
    tools_mentioned: ["Claude Code", "Cursor"],
    difficulty: "intermediate",
    action_items: [
      "Install Claude Code (brew install claude-code) and run it in an existing project — ask it to explain the codebase architecture",
      "Create a CLAUDE.md file in your repo with build commands, conventions, and architecture overview",
      "Try the TDD workflow: write a test description, let Claude Code implement the feature and verify it passes",
    ],
    source_urls: [
      "https://www.anthropic.com/engineering/claude-code-best-practices",
    ],
    source_count: 1,
    image_url: null,
    is_stale: false,
    is_published: true,
    created_at: "2025-05-22T10:00:00Z",
    updated_at: "2025-05-22T10:00:00Z",
  },
];

/** Get all seed tutorials */
export function getAllTutorials(): Tutorial[] {
  return SEED_TUTORIALS.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/** Get tutorials by maturity level */
export function getTutorialsByLevel(level: number): Tutorial[] {
  return getAllTutorials().filter((t) => t.maturity_level === level);
}

/** Get a tutorial by slug */
export function getTutorialBySlug(slug: string): Tutorial | undefined {
  return SEED_TUTORIALS.find((t) => t.slug === slug);
}

/** Get tutorials that teach you to level up from a given level */
export function getLevelUpTutorials(fromLevel: number): Tutorial[] {
  return getAllTutorials().filter(
    (t) =>
      t.level_relation === "level-up" && t.maturity_level === fromLevel
  );
}

/** Get all unique topics across all tutorials */
export function getAllTopics(): string[] {
  const topics = new Set<string>();
  for (const t of SEED_TUTORIALS) {
    for (const topic of t.topics) {
      topics.add(topic);
    }
  }
  return [...topics].sort();
}

/** Search tutorials by query (simple text match for seed data) */
export function searchTutorials(query: string): Tutorial[] {
  const q = query.toLowerCase();
  return getAllTutorials().filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.topics.some((topic) => topic.toLowerCase().includes(q)) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.tools_mentioned.some((tool) => tool.toLowerCase().includes(q))
  );
}
