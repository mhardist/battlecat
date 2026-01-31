/**
 * AI tool database with launch dates, descriptions, and framework levels.
 * Used by the /tools page, ToolBadge component, and timeline views.
 */

export interface AIToolMilestone {
  date: string; // "YYYY-MM" format
  event: string;
  significance?: "high" | "medium" | "low";
}

export interface AITool {
  name: string;
  level: number;
  launchDate: string; // "YYYY-MM" format
  description: string;
  url: string;
  status: "active" | "beta" | "deprecated";
  milestones?: AIToolMilestone[];
}

export const AI_TOOLS: AITool[] = [
  // L0 — Chat Tools
  {
    name: "ChatGPT",
    level: 0,
    launchDate: "2022-11",
    description:
      "OpenAI's flagship conversational AI. The tool that brought AI to the mainstream.",
    url: "https://chat.openai.com",
    status: "active",
    milestones: [
      { date: "2022-11", event: "ChatGPT launches (GPT-3.5)", significance: "high" },
      { date: "2023-03", event: "GPT-4 released", significance: "high" },
      { date: "2023-11", event: "GPT-4 Turbo released", significance: "medium" },
      { date: "2024-05", event: "GPT-4o released — multimodal flagship", significance: "high" },
      { date: "2024-09", event: "o1 released — first reasoning model", significance: "high" },
      { date: "2024-12", event: "o3 announced at 12 Days of OpenAI", significance: "high" },
      { date: "2025-01", event: "o3-mini released — affordable reasoning", significance: "medium" },
      { date: "2025-02", event: "GPT-4.5 released — largest non-reasoning model", significance: "high" },
      { date: "2025-04", event: "GPT-4.1 and GPT-4.1 mini released", significance: "medium" },
      { date: "2025-04", event: "o3 and o4-mini released — full reasoning lineup", significance: "high" },
      { date: "2025-07", event: "GPT-5 released — unified model", significance: "high" },
    ],
  },
  {
    name: "Claude",
    level: 0,
    launchDate: "2023-03",
    description:
      "Anthropic's AI assistant known for safety, long context, and nuanced reasoning.",
    url: "https://claude.ai",
    status: "active",
    milestones: [
      { date: "2023-03", event: "Claude launches", significance: "high" },
      { date: "2023-07", event: "Claude 2 released", significance: "medium" },
      { date: "2024-03", event: "Claude 3 family (Haiku, Sonnet, Opus)", significance: "high" },
      { date: "2024-06", event: "Claude 3.5 Sonnet released", significance: "high" },
      { date: "2024-10", event: "Claude 3.5 Sonnet (new) — upgraded", significance: "medium" },
      { date: "2025-02", event: "Claude 3.5 Opus released", significance: "medium" },
      { date: "2025-05", event: "Claude Sonnet 4 released", significance: "high" },
      { date: "2025-05", event: "Claude Opus 4 released — strongest coding model", significance: "high" },
      { date: "2025-11", event: "Claude Opus 4.5 released — hybrid reasoning", significance: "high" },
    ],
  },
  {
    name: "Gemini",
    level: 0,
    launchDate: "2023-12",
    description:
      "Google's multimodal AI model, integrated across Google products.",
    url: "https://gemini.google.com",
    status: "active",
    milestones: [
      { date: "2023-12", event: "Gemini launches (replacing Bard)", significance: "high" },
      { date: "2024-02", event: "Gemini Ultra released", significance: "medium" },
      { date: "2024-05", event: "Gemini 1.5 Pro (1M context)", significance: "high" },
      { date: "2024-12", event: "Gemini 2.0 Flash released", significance: "high" },
      { date: "2025-01", event: "Gemini 2.0 Flash Thinking — reasoning mode", significance: "medium" },
      { date: "2025-03", event: "Gemini 2.5 Pro released — top coding benchmarks", significance: "high" },
      { date: "2025-05", event: "Gemini 2.5 Flash released — fast + affordable", significance: "medium" },
    ],
  },

  // L1 — Personalization Tools
  {
    name: "Custom GPTs",
    level: 1,
    launchDate: "2023-11",
    description:
      "Build personalized ChatGPT instances with custom instructions, knowledge, and tools.",
    url: "https://chat.openai.com/gpts",
    status: "active",
    milestones: [
      { date: "2023-11", event: "Custom GPTs announced at DevDay", significance: "high" },
      { date: "2024-01", event: "GPT Store launches", significance: "medium" },
    ],
  },
  {
    name: "Projects",
    level: 1,
    launchDate: "2024-06",
    description:
      "Claude's persistent workspace with custom instructions, uploaded files, and project context.",
    url: "https://claude.ai",
    status: "active",
    milestones: [
      { date: "2024-06", event: "Projects feature launches in Claude", significance: "high" },
    ],
  },
  {
    name: "Gems",
    level: 1,
    launchDate: "2024-09",
    description:
      "Google's customizable Gemini instances with tailored instructions and expertise areas.",
    url: "https://gemini.google.com",
    status: "active",
    milestones: [
      { date: "2024-09", event: "Gems feature launches in Gemini", significance: "medium" },
    ],
  },

  // L2 — Builder Tools
  {
    name: "Lovable",
    level: 2,
    launchDate: "2024-02",
    description:
      "Describe what you want, get a working full-stack app. The leading vibe coding platform.",
    url: "https://lovable.dev",
    status: "active",
    milestones: [
      { date: "2024-02", event: "Launches as GPT Engineer", significance: "high" },
      { date: "2024-11", event: "Rebrands to Lovable", significance: "medium" },
      { date: "2025-06", event: "Lovable 2.0 with backend support, Supabase integration", significance: "medium" },
    ],
  },
  {
    name: "v0",
    level: 2,
    launchDate: "2023-10",
    description:
      "Vercel's AI-powered UI generator. Describe a component, get production-ready React code.",
    url: "https://v0.dev",
    status: "active",
    milestones: [
      { date: "2023-10", event: "v0 launches in private beta", significance: "high" },
      { date: "2024-03", event: "v0 opens to public", significance: "medium" },
    ],
  },
  {
    name: "Bolt",
    level: 2,
    launchDate: "2024-09",
    description:
      "StackBlitz's AI coding tool. Build full-stack apps from a prompt with live preview.",
    url: "https://bolt.new",
    status: "active",
    milestones: [
      { date: "2024-09", event: "Bolt.new launches", significance: "high" },
    ],
  },
  {
    name: "Replit",
    level: 2,
    launchDate: "2024-03",
    description:
      "Cloud IDE with AI agent that can build, deploy, and iterate on full apps from natural language.",
    url: "https://replit.com",
    status: "active",
    milestones: [
      { date: "2024-03", event: "Replit Agent launches", significance: "high" },
      { date: "2024-10", event: "Replit Agent v2 with deployments", significance: "medium" },
    ],
  },

  // L3 — Agent Tools
  {
    name: "Claude Code",
    level: 3,
    launchDate: "2025-02",
    description:
      "Anthropic's agentic coding tool. Reads your codebase, makes decisions, ships code autonomously.",
    url: "https://docs.anthropic.com/en/docs/claude-code",
    status: "active",
    milestones: [
      { date: "2025-02", event: "Claude Code launches in research preview", significance: "high" },
      { date: "2025-05", event: "Claude Code GA with Claude Sonnet 4", significance: "high" },
      { date: "2025-09", event: "Claude Code hooks, background agents, SDK", significance: "medium" },
    ],
  },
  {
    name: "Cursor",
    level: 3,
    launchDate: "2023-03",
    description:
      "AI-native code editor built on VS Code. Tab completions, chat, and autonomous coding agent.",
    url: "https://cursor.com",
    status: "active",
    milestones: [
      { date: "2023-03", event: "Cursor launches", significance: "high" },
      { date: "2024-01", event: "Cursor 0.2 with multi-file editing", significance: "medium" },
      { date: "2024-09", event: "Cursor Composer launches — agent mode", significance: "high" },
      { date: "2025-02", event: "Cursor BugBot for automated PR review", significance: "medium" },
    ],
  },
  {
    name: "Devin",
    level: 3,
    launchDate: "2024-03",
    description:
      "Cognition's autonomous AI software engineer. Plans, codes, debugs, and deploys independently.",
    url: "https://devin.ai",
    status: "active",
    milestones: [
      { date: "2024-03", event: "Devin announced by Cognition", significance: "high" },
      { date: "2024-12", event: "Devin GA launch", significance: "high" },
      { date: "2025-06", event: "Devin 2.0 with improved planning", significance: "medium" },
    ],
  },

  // L3 — Agent Tools (new entrants)
  {
    name: "GitHub Copilot",
    level: 3,
    launchDate: "2022-06",
    description:
      "GitHub's AI pair programmer. Code completions, chat, and autonomous agent mode for multi-file changes.",
    url: "https://github.com/features/copilot",
    status: "active",
    milestones: [
      { date: "2022-06", event: "GitHub Copilot launches", significance: "high" },
      { date: "2023-11", event: "Copilot Chat in VS Code", significance: "medium" },
      { date: "2024-10", event: "Copilot Workspace preview — plan + execute in browser", significance: "high" },
      { date: "2025-02", event: "Copilot agent mode — autonomous multi-file coding in VS Code", significance: "high" },
      { date: "2025-05", event: "Copilot coding agent — assigns GitHub issues to AI", significance: "high" },
    ],
  },
  {
    name: "Windsurf",
    level: 3,
    launchDate: "2024-11",
    description:
      "Codeium's AI IDE (formerly Codeium Editor). Flows-based agentic coding with Cascade agent.",
    url: "https://windsurf.com",
    status: "active",
    milestones: [
      { date: "2024-11", event: "Windsurf IDE launches — first agentic IDE", significance: "high" },
      { date: "2025-02", event: "Windsurf Wave 3 with memory and multi-file Cascade", significance: "medium" },
      { date: "2025-05", event: "SWE-1 model — purpose-built for coding agents", significance: "medium" },
    ],
  },
  {
    name: "OpenAI Codex",
    level: 3,
    launchDate: "2025-05",
    description:
      "OpenAI's cloud-based coding agent. Runs in a sandboxed environment, handles GitHub issues and PRs autonomously.",
    url: "https://openai.com/index/introducing-codex/",
    status: "active",
    milestones: [
      { date: "2025-05", event: "Codex launches in ChatGPT — cloud coding agent", significance: "high" },
    ],
  },
  {
    name: "Amazon Q Developer",
    level: 3,
    launchDate: "2024-04",
    description:
      "AWS's AI-powered developer assistant. Code generation, transformation, and autonomous agent for feature development.",
    url: "https://aws.amazon.com/q/developer/",
    status: "active",
    milestones: [
      { date: "2024-04", event: "Amazon Q Developer launches (replacing CodeWhisperer)", significance: "high" },
      { date: "2025-01", event: "Q Developer agent — autonomous feature implementation", significance: "medium" },
    ],
  },

  // L0 — Chat (new entrants)
  {
    name: "Grok",
    level: 0,
    launchDate: "2023-11",
    description:
      "xAI's AI assistant with real-time X (Twitter) data access and unfiltered personality.",
    url: "https://grok.com",
    status: "active",
    milestones: [
      { date: "2023-11", event: "Grok 1 launches on X Premium", significance: "medium" },
      { date: "2024-08", event: "Grok-2 released — competitive with GPT-4", significance: "medium" },
      { date: "2025-02", event: "Grok 3 released — largest training run ever, tops benchmarks", significance: "high" },
      { date: "2025-04", event: "Grok 3 available free on grok.com", significance: "medium" },
    ],
  },
  {
    name: "DeepSeek",
    level: 0,
    launchDate: "2024-01",
    description:
      "Chinese AI lab's open-source models. DeepSeek R1 shocked the industry with GPT-4 level reasoning at a fraction of the cost.",
    url: "https://www.deepseek.com",
    status: "active",
    milestones: [
      { date: "2024-01", event: "DeepSeek V2 released — MoE architecture breakthrough", significance: "medium" },
      { date: "2024-12", event: "DeepSeek V3 released — 671B MoE trained for $5.6M", significance: "high" },
      { date: "2025-01", event: "DeepSeek R1 released — open-source reasoning rivaling o1", significance: "high" },
      { date: "2025-02", event: "DeepSeek triggers global AI stock selloff — cost disruption", significance: "high" },
      { date: "2025-05", event: "DeepSeek R1-0528 — improved reasoning, open weights", significance: "medium" },
    ],
  },
  {
    name: "Perplexity",
    level: 0,
    launchDate: "2023-01",
    description:
      "AI-powered answer engine combining search with conversational AI. Real-time web access with citations.",
    url: "https://perplexity.ai",
    status: "active",
    milestones: [
      { date: "2023-01", event: "Perplexity AI launches", significance: "medium" },
      { date: "2024-05", event: "Perplexity Pro with GPT-4 and Claude access", significance: "medium" },
      { date: "2025-01", event: "Perplexity Sonar — real-time search API", significance: "medium" },
      { date: "2025-07", event: "Perplexity launches agentic features — completes tasks", significance: "medium" },
    ],
  },
  {
    name: "Kimi",
    level: 0,
    launchDate: "2024-03",
    description:
      "Moonshot AI's chatbot with industry-leading long context (2M+ tokens). Strong reasoning with K2 model series.",
    url: "https://kimi.moonshot.cn",
    status: "active",
    milestones: [
      { date: "2024-03", event: "Kimi launches with 2M token context window", significance: "high" },
      { date: "2025-01", event: "Kimi K1.5 — multi-modal reasoning model", significance: "medium" },
      { date: "2025-07", event: "Kimi K2 released — MoE with 1T total parameters", significance: "high" },
    ],
  },

  // L3 — Agent (new entrant)
  {
    name: "Manus",
    level: 3,
    launchDate: "2025-03",
    description:
      "General-purpose AI agent that autonomously completes tasks: research, coding, data analysis, travel planning.",
    url: "https://manus.im",
    status: "active",
    milestones: [
      { date: "2025-03", event: "Manus launches — first general-purpose AI agent, viral debut", significance: "high" },
      { date: "2025-06", event: "Manus open-sources OpenManus framework", significance: "medium" },
    ],
  },

  // L0 — Open-source models
  {
    name: "Llama",
    level: 0,
    launchDate: "2023-02",
    description:
      "Meta's open-source LLM family. Llama 4 introduced MoE architecture and multimodal capabilities.",
    url: "https://llama.meta.com",
    status: "active",
    milestones: [
      { date: "2023-02", event: "LLaMA released (research only)", significance: "high" },
      { date: "2023-07", event: "Llama 2 released — open for commercial use", significance: "high" },
      { date: "2024-04", event: "Llama 3 released (8B and 70B)", significance: "high" },
      { date: "2024-07", event: "Llama 3.1 405B — largest open model", significance: "high" },
      { date: "2024-12", event: "Llama 3.3 70B — matches 405B quality", significance: "medium" },
      { date: "2025-04", event: "Llama 4 Scout (109B MoE) and Maverick released", significance: "high" },
    ],
  },
  {
    name: "Mistral",
    level: 0,
    launchDate: "2023-09",
    description:
      "French AI lab's open and commercial models. Known for efficient, high-quality models at multiple sizes.",
    url: "https://mistral.ai",
    status: "active",
    milestones: [
      { date: "2023-09", event: "Mistral 7B released — best open model at size", significance: "high" },
      { date: "2024-02", event: "Mistral Large released", significance: "medium" },
      { date: "2024-07", event: "Mistral Large 2 (123B)", significance: "medium" },
      { date: "2024-09", event: "Pixtral 12B — multimodal model", significance: "medium" },
      { date: "2025-01", event: "Mistral Small 3 — efficient 24B model", significance: "medium" },
      { date: "2025-02", event: "Mistral Saba — regional language specialist", significance: "low" },
    ],
  },
  {
    name: "Qwen",
    level: 0,
    launchDate: "2024-06",
    description:
      "Alibaba's open-source model family. Qwen 2.5 series competitive across all sizes from 0.5B to 72B.",
    url: "https://qwenlm.github.io",
    status: "active",
    milestones: [
      { date: "2024-06", event: "Qwen 2 released — multi-size open family", significance: "medium" },
      { date: "2024-09", event: "Qwen 2.5 released — 0.5B to 72B, top benchmarks", significance: "high" },
      { date: "2025-01", event: "QwQ-32B released — open reasoning model", significance: "medium" },
      { date: "2025-04", event: "Qwen 3 released — hybrid thinking modes", significance: "high" },
    ],
  },
  {
    name: "Gemma",
    level: 0,
    launchDate: "2024-02",
    description:
      "Google's open-source small models built from Gemini research. Efficient models for on-device and edge deployment.",
    url: "https://ai.google.dev/gemma",
    status: "active",
    milestones: [
      { date: "2024-02", event: "Gemma 1 released (2B and 7B)", significance: "medium" },
      { date: "2024-06", event: "Gemma 2 released (2B, 9B, 27B)", significance: "medium" },
      { date: "2025-03", event: "Gemma 3 released — multimodal, 128K context", significance: "medium" },
    ],
  },

  // L2 — Builder (new entrant)
  {
    name: "Tempo",
    level: 2,
    launchDate: "2024-12",
    description:
      "AI design-to-code platform. Generates production React code from Figma designs and natural language.",
    url: "https://tempolabs.ai",
    status: "active",
    milestones: [
      { date: "2024-12", event: "Tempo Labs launches — AI design-to-code", significance: "medium" },
    ],
  },

  // L4 — Orchestration
  {
    name: "Multi-agent orchestration",
    level: 4,
    launchDate: "2024-06",
    description:
      "Frameworks for coordinating multiple AI agents as a team. The frontier of AI systems design.",
    url: "https://docs.anthropic.com/en/docs/agents",
    status: "active",
    milestones: [
      { date: "2024-06", event: "Multi-agent patterns emerge", significance: "medium" },
      { date: "2024-11", event: "MCP (Model Context Protocol) released by Anthropic", significance: "high" },
      { date: "2025-01", event: "Claude Agent SDK launches", significance: "high" },
      { date: "2025-04", event: "Google A2A (Agent-to-Agent) protocol released", significance: "high" },
      { date: "2025-04", event: "OpenAI Agents SDK released", significance: "high" },
    ],
  },
];

/** Get tools by framework level */
export function getToolsByLevel(level: number): AITool[] {
  return AI_TOOLS.filter((t) => t.level === level);
}

/** Get a tool by name (case-insensitive) */
export function getToolByName(name: string): AITool | undefined {
  return AI_TOOLS.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/** Format a date string like "2024-03" to "Mar 2024" */
export function formatToolDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/** Get all milestones from all tools, sorted newest first */
export function getAllMilestones() {
  return AI_TOOLS.flatMap((tool) =>
    (tool.milestones || []).map((m) => ({
      ...m,
      toolName: tool.name,
      level: tool.level,
      significance: m.significance || ("medium" as const),
    }))
  ).sort((a, b) => b.date.localeCompare(a.date));
}

/** Get milestones from the last N months */
export function getRecentMilestones(months: number) {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;
  return getAllMilestones().filter((m) => m.date >= cutoffStr);
}
