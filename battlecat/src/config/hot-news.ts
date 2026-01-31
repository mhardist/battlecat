/**
 * Hot News items for the homepage.
 * Curated selection of the most recent and impactful AI releases.
 * Each item should be distinct in content — different tools, levels, and topics.
 * Focus on FUNCTIONALITY: product launches, features, capabilities — not funding or earnings.
 * Order: most recent first. Items should be from the past week.
 * Last updated: 2026-01-31
 */

import type { NewsItem } from "@/components/HotNews";

export const HOT_NEWS: NewsItem[] = [
  {
    date: "2026-01-30",
    headline: "Google Jules Upgrades to Gemini 3 Flash with Planning Critic Agent",
    teaser:
      "Google replaced Gemini 2.5 Pro with Gemini 3 Flash as the default model in Jules, its async coding agent. Scores 78% on SWE-bench Verified. New Planning Critic agent reviews execution plans before code is written, cutting task failures by 9.5%.",
    toolName: "Google Jules",
    level: 3,
    url: "https://jules.google/docs/changelog/2026-01-30",
  },
  {
    date: "2026-01-29",
    headline: "Google DeepMind Launches Project Genie — AI-Generated Interactive 3D Worlds",
    teaser:
      "Project Genie lets you create, explore, and remix interactive 3D environments from text prompts or images. Powered by the Genie 3 world model, it generates the path ahead in real time as you navigate, simulating physics and interactions.",
    toolName: "Google DeepMind",
    level: 2,
    url: "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/",
  },
  {
    date: "2026-01-29",
    headline: "Gemini 3 Pro and Flash Get Computer Use — Direct GUI Interaction",
    teaser:
      "Google extended Computer Use tool support to Gemini 3 Pro and Flash previews, enabling models to interact directly with desktop GUIs. Also launched the Interactions API beta for unified agent communication and new TTS models with improved expressivity.",
    toolName: "Gemini",
    level: 4,
    url: "https://ai.google.dev/gemini-api/docs/changelog",
  },
  {
    date: "2026-01-28",
    headline: "Chrome Gets Gemini 3 Auto Browse — Agentic Web Tasks from a Single Prompt",
    teaser:
      "Google shipped Auto Browse in Chrome: an agentic tool that autonomously performs multi-step web tasks like researching hotels, scheduling appointments, and filling forms. Pauses for confirmation on purchases. Also supports Universal Commerce Protocol (UCP).",
    toolName: "Google Chrome",
    level: 1,
    url: "https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/",
  },
  {
    date: "2026-01-27",
    headline: "Kimi K2.5 Goes Open-Source with 100-Agent Swarm Technology",
    teaser:
      "Moonshot AI released Kimi K2.5, a 1T-parameter open-source MoE model with agent swarm tech: up to 100 sub-agents executing 1,500 tool calls in parallel. Scored 76.8% on SWE-bench. Also launched Kimi Code, an open-source CLI coding agent.",
    toolName: "Kimi",
    level: 3,
    url: "https://techcrunch.com/2026/01/27/chinas-moonshot-releases-a-new-open-source-model-kimi-k2-5-and-a-coding-agent/",
  },
  {
    date: "2026-01-26",
    headline: "Anthropic Launches MCP Apps — Interactive Slack, Figma, Canva Inside Claude",
    teaser:
      "MCP Apps lets third-party tools render interactive UI elements directly inside Claude. Launch partners include Slack, Figma, Canva, Asana, and Salesforce. The open standard is adopted by ChatGPT, VS Code, and Goose.",
    toolName: "Claude",
    level: 2,
    url: "https://techcrunch.com/2026/01/26/anthropic-launches-interactive-claude-apps-including-slack-and-other-workplace-tools/",
  },
  {
    date: "2026-01-25",
    headline: "AI Agents Score Just 24% on Real-World Work Benchmark",
    teaser:
      "The Apex-Agents benchmark tested leading AI on actual banking, consulting, and legal tasks. Google Gemini 3 Flash scored highest at 24%. AI still struggles with information scattered across Slack, Drive, and email — a reality check for enterprise agentic AI.",
    toolName: "Research",
    level: 2,
    url: "https://www.aiapps.com/blog/ai-news-january-2026-breakthroughs-launches-trends/",
  },
  {
    date: "2026-01-24",
    headline: "Google Patches Antigravity IDE After Agent Loop Meltdowns",
    teaser:
      "Google's AI-first Antigravity IDE (built on the $2.4B Windsurf acquisition) hit issues with recursive optimization loops corrupting codebases. Logic Patch v2.1.4 shipped, but many devs are reverting to traditional editors until stability improves.",
    toolName: "Google Antigravity",
    level: 3,
    url: "https://thenewstack.io/hands-on-with-antigravity-googles-newest-ai-coding-experiment/",
  },
];
