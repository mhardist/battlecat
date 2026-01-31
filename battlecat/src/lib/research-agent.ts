/**
 * Research Agent — discovers new AI tool releases using Claude API.
 *
 * This module provides the core logic for researching and cataloging
 * new AI tool, model, feature, and agent releases. It can be triggered
 * manually via API or on a schedule via Vercel Cron.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ToolRelease {
  name: string;
  event: string;
  date: string; // "YYYY-MM" format
  level: number; // 0-4
  significance: "high" | "medium" | "low";
  url: string;
  isNewTool: boolean;
  existingToolName?: string;
  description?: string;
}

const RESEARCH_PROMPT = `You are an AI industry analyst. Your job is to identify all major AI tool, model, feature, and agent releases that have occurred since the given date.

For each release, provide:
- name: The official name of the tool/model/feature
- event: A one-line description of what was released
- date: Release date in "YYYY-MM" format
- level: The AI maturity framework level (0=chat/models, 1=personalization, 2=builder tools, 3=agent/coding tools, 4=orchestration/multi-agent)
- significance: "high" for major launches and paradigm shifts, "medium" for notable updates, "low" for minor releases
- url: Official URL for the release
- isNewTool: true if this is a brand new tool/model, false if it's an update to an existing one
- existingToolName: If isNewTool is false, the name of the existing tool
- description: A 1-2 sentence description for new tools

Focus on:
1. Major AI lab releases (OpenAI, Anthropic, Google, Meta, xAI, DeepSeek, Mistral, Moonshot/Kimi)
2. Builder tools (Lovable, Bolt, Replit, v0, Tempo)
3. Coding agents (Cursor, Claude Code, GitHub Copilot, Windsurf, Devin, Amazon Q, OpenAI Codex)
4. Open-source models (Llama, Qwen, Gemma, DeepSeek, Mistral open models)
5. AI infrastructure and protocols (MCP, A2A, Agent SDKs)
6. Notable new entrants (Manus, Perplexity updates, etc.)

Return ONLY valid JSON — an array of objects matching the schema above. No markdown, no explanation.`;

export async function researchToolReleases(
  sinceDate: string
): Promise<ToolRelease[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `List all major AI tool, model, feature, and agent releases since ${sinceDate}. Today is ${new Date().toISOString().slice(0, 10)}.\n\n${RESEARCH_PROMPT}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonStr = text
    .replace(/^```json?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  try {
    const releases = JSON.parse(jsonStr) as ToolRelease[];
    return releases.filter(
      (r) =>
        r.name &&
        r.event &&
        r.date &&
        typeof r.level === "number" &&
        r.level >= 0 &&
        r.level <= 4
    );
  } catch {
    console.error("Failed to parse research results:", jsonStr.slice(0, 200));
    return [];
  }
}
