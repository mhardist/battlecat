import { LevelInfo, MaturityLevel } from "@/types";

/** Complete AI Maturity Framework level definitions */
export const LEVELS: Record<MaturityLevel, LevelInfo> = {
  0: {
    level: 0,
    name: "Asker",
    you_role: "Asker",
    ai_role: "Answerer",
    relationship: "Transactional",
    trust: "Nothing",
    investment: "Nothing",
    description:
      "You type a question, get an answer. No memory, no context, no continuity. Like asking a stranger for directions.",
    tools: ["ChatGPT", "Claude", "Gemini"],
    color: "#9CA3AF",
  },
  1: {
    level: 1,
    name: "Instructor",
    you_role: "Instructor",
    ai_role: "Assistant",
    relationship: "Retained",
    trust: "Accuracy",
    investment: "Context",
    description:
      "You give background, preferences, constraints. AI adapts to your situation with persistent memory and tailored responses.",
    tools: ["Custom GPTs", "Projects", "Gems"],
    color: "#14B8A6",
  },
  2: {
    level: 2,
    name: "Designer",
    you_role: "Designer",
    ai_role: "Builder",
    relationship: "Collaborative",
    trust: "Execution",
    investment: "Specification",
    description:
      'You describe what you want, AI builds it. Working apps, landing pages, prototypes — in minutes. This is "vibe coding."',
    tools: ["Lovable", "v0", "Bolt", "Replit"],
    color: "#22C55E",
  },
  3: {
    level: 3,
    name: "Supervisor",
    you_role: "Supervisor",
    ai_role: "Agent",
    relationship: "Delegated",
    trust: "Judgment",
    investment: "Trust",
    description:
      'AI works autonomously — reads your codebase, makes decisions, ships code. You review outcomes, not keystrokes. Define "done," the agent figures out how.',
    tools: ["Claude Code", "Cursor", "Devin"],
    color: "#F59E0B",
  },
  4: {
    level: 4,
    name: "Architect",
    you_role: "Architect",
    ai_role: "Organization",
    relationship: "Orchestrated",
    trust: "The System",
    investment: "Systems Thinking",
    description:
      "Multiple AI agents coordinated as an organization. You design workflows, quality gates, and feedback loops. The org chart includes AI.",
    tools: ["Multi-agent orchestration"],
    color: "#D4960A",
  },
};

/** Level transition costs */
export const TRANSITIONS = [
  { from: 0, to: 1, give_up: "Anonymity", invest: "Time to teach who you are" },
  { from: 1, to: 2, give_up: "Doing", invest: "Clarity on what you want built" },
  { from: 2, to: 3, give_up: "Directing", invest: "Willingness to let go" },
  { from: 3, to: 4, give_up: "Supervising", invest: "Ability to decompose & design" },
];

/** Get a level by number */
export function getLevel(level: MaturityLevel): LevelInfo {
  return LEVELS[level];
}

/** Get all levels as an ordered array */
export function getAllLevels(): LevelInfo[] {
  return [LEVELS[0], LEVELS[1], LEVELS[2], LEVELS[3], LEVELS[4]];
}
