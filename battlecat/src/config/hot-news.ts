/**
 * Hot News items for the homepage.
 * Curated selection of the most recent and impactful AI releases.
 * Each item should be distinct in content — different tools, levels, and topics.
 * Order: most recent first.
 */

import type { NewsItem } from "@/components/HotNews";

export const HOT_NEWS: NewsItem[] = [
  {
    date: "2025-11",
    headline: "Claude Opus 4.5 — Hybrid Reasoning Meets Creative Power",
    teaser:
      "Anthropic releases Claude Opus 4.5, combining extended thinking with the strongest creative and coding capabilities. Sets new benchmarks on SWE-bench and creative writing tasks.",
    toolName: "Claude",
    level: 0,
    url: "https://www.anthropic.com",
  },
  {
    date: "2025-07",
    headline: "GPT-5 Unifies OpenAI's Model Lineup",
    teaser:
      "OpenAI launches GPT-5, merging reasoning and creative capabilities into a single model. Available across ChatGPT and API, replacing the separate o-series and GPT-4 lines.",
    toolName: "ChatGPT",
    level: 0,
    url: "https://openai.com",
  },
  {
    date: "2025-07",
    headline: "Kimi K2 — 1 Trillion Parameter Open-Source MoE Model",
    teaser:
      "Moonshot AI releases Kimi K2 with 1T total parameters using Mixture-of-Experts. Competitive with top proprietary models at a fraction of inference cost. Apache 2.0 licensed.",
    toolName: "Kimi",
    level: 0,
    url: "https://kimi.moonshot.cn",
  },
  {
    date: "2025-06",
    headline: "Manus Open-Sources Agent Framework",
    teaser:
      "After its viral launch as the first general-purpose AI agent, Manus open-sources OpenManus — enabling developers to build autonomous agents for research, coding, and task completion.",
    toolName: "Manus",
    level: 3,
    url: "https://manus.im",
  },
  {
    date: "2025-05",
    headline: "GitHub Copilot Assigns Issues to AI Coding Agent",
    teaser:
      "GitHub launches its coding agent that can be assigned issues just like a human developer. Autonomously creates branches, writes code, runs tests, and opens PRs.",
    toolName: "GitHub Copilot",
    level: 3,
    url: "https://github.com/features/copilot",
  },
  {
    date: "2025-05",
    headline: "OpenAI Codex — Cloud Coding Agent in ChatGPT",
    teaser:
      "OpenAI launches Codex as a cloud-based coding agent inside ChatGPT. Runs in sandboxed environments, handles entire GitHub repos, and can autonomously implement features and fix bugs.",
    toolName: "OpenAI Codex",
    level: 3,
    url: "https://openai.com/index/introducing-codex/",
  },
  {
    date: "2025-05",
    headline: "DeepSeek R1-0528 Improves Open-Source Reasoning",
    teaser:
      "DeepSeek releases R1-0528 with improved mathematical and coding reasoning. Continues the disruption that started when R1 triggered a global AI stock selloff in January.",
    toolName: "DeepSeek",
    level: 0,
    url: "https://www.deepseek.com",
  },
  {
    date: "2025-04",
    headline: "Llama 4 Brings MoE to Open-Source",
    teaser:
      "Meta releases Llama 4 Scout (109B MoE, 17B active) and Maverick models. First Llama with Mixture-of-Experts architecture and multimodal support from day one.",
    toolName: "Llama",
    level: 0,
    url: "https://llama.meta.com",
  },
];
