/**
 * AI tool database with launch dates, descriptions, and framework levels.
 * Used by the /tools page, ToolBadge component, and timeline views.
 */

export interface AITool {
  name: string;
  level: number;
  launchDate: string; // "YYYY-MM" format
  description: string;
  url: string;
  status: "active" | "beta" | "deprecated";
  milestones?: { date: string; event: string }[];
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
      { date: "2022-11", event: "ChatGPT launches (GPT-3.5)" },
      { date: "2023-03", event: "GPT-4 released" },
      { date: "2023-11", event: "GPT-4 Turbo released" },
      { date: "2024-05", event: "GPT-4o released" },
      { date: "2025-04", event: "GPT-4.1 released" },
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
      { date: "2023-03", event: "Claude launches" },
      { date: "2023-07", event: "Claude 2 released" },
      { date: "2024-03", event: "Claude 3 family (Haiku, Sonnet, Opus)" },
      { date: "2024-10", event: "Claude 3.5 Sonnet (new)" },
      { date: "2025-02", event: "Claude 3.5 Opus" },
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
      { date: "2023-12", event: "Gemini launches (replacing Bard)" },
      { date: "2024-02", event: "Gemini Ultra released" },
      { date: "2024-05", event: "Gemini 1.5 Pro (1M context)" },
      { date: "2025-03", event: "Gemini 2.5 Pro" },
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
      { date: "2023-11", event: "Custom GPTs announced at DevDay" },
      { date: "2024-01", event: "GPT Store launches" },
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
      { date: "2024-06", event: "Projects feature launches in Claude" },
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
      { date: "2024-09", event: "Gems feature launches in Gemini" },
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
      { date: "2024-02", event: "Launches as GPT Engineer" },
      { date: "2024-11", event: "Rebrands to Lovable" },
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
      { date: "2023-10", event: "v0 launches in private beta" },
      { date: "2024-03", event: "v0 opens to public" },
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
      { date: "2024-09", event: "Bolt.new launches" },
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
      { date: "2024-03", event: "Replit Agent launches" },
      { date: "2024-10", event: "Replit Agent v2 with deployments" },
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
      { date: "2025-02", event: "Claude Code launches in research preview" },
      { date: "2025-05", event: "Claude Code GA with Claude 4 Sonnet" },
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
      { date: "2023-03", event: "Cursor launches" },
      { date: "2024-01", event: "Cursor 0.2 with multi-file editing" },
      { date: "2024-09", event: "Cursor Composer launches" },
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
      { date: "2024-03", event: "Devin announced by Cognition" },
      { date: "2024-12", event: "Devin GA launch" },
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
      { date: "2024-06", event: "Multi-agent patterns emerge" },
      { date: "2025-01", event: "Claude Agent SDK launches" },
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
