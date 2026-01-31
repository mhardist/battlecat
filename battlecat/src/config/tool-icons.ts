/**
 * Tool icon configuration.
 * Maps tool names to SVG icon paths (inline) for well-known AI tools.
 * Uses simple, recognizable shapes — no external image dependencies.
 */

export interface ToolIconConfig {
  /** Display color for the icon */
  color: string;
  /** SVG path data for a 16x16 viewBox */
  icon: string;
}

/**
 * Map of known tool names (lowercase) to their icon configs.
 * Tool names are normalized to lowercase for matching.
 */
export const TOOL_ICONS: Record<string, ToolIconConfig> = {
  // L0 — Chat tools
  chatgpt: {
    color: "#10A37F",
    icon: "M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.5 3.5a.75.75 0 0 1 1.5 0v3l2.1 1.2a.75.75 0 0 1-.75 1.3L8 8.25V4.5z",
  },
  claude: {
    color: "#D97706",
    icon: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM5.5 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm3 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .4.8A2.5 2.5 0 0 1 8 12a2.5 2.5 0 0 1-1.9-1.2.5.5 0 0 1-.1-.3z",
  },
  gemini: {
    color: "#4285F4",
    icon: "M8 1L2 5v6l6 4 6-4V5L8 1zM8 3.5l3.5 2.1v4.3L8 12 4.5 9.9V5.6L8 3.5z",
  },
  // L1 — Personalization tools
  "custom gpts": {
    color: "#10A37F",
    icon: "M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h7v2H3v-2zm9 0l3 2-3 2v-4z",
  },
  projects: {
    color: "#D97706",
    icon: "M2 3a1 1 0 0 1 1-1h4l2 2h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z",
  },
  gems: {
    color: "#4285F4",
    icon: "M8 1l2.5 5H14l-3.5 3.5L12 15l-4-3-4 3 1.5-5.5L2 6h3.5L8 1z",
  },
  // L2 — Builder tools
  lovable: {
    color: "#E11D48",
    icon: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4a3.5 3.5 0 0 1 5.5 3c0 3.5-5.5 7-5.5 7z",
  },
  v0: {
    color: "#000000",
    icon: "M3 3l5 10 5-10H3zm5 3l2.5 5h-5L8 6z",
  },
  bolt: {
    color: "#7C3AED",
    icon: "M9 1L3 9h4l-1 6 6-8H8l1-6z",
  },
  replit: {
    color: "#F26207",
    icon: "M4 2h8a1 1 0 0 1 1 1v4H4V2zm0 6h9v4a1 1 0 0 1-1 1H4V8zm-1-6v12h1V2H3z",
  },
  // L3 — Agent tools
  "claude code": {
    color: "#D97706",
    icon: "M4.5 3l-3 5 3 5h1.2L2.4 8l3.3-5H4.5zm7 0h-1.2l3.3 5-3.3 5h1.2l3-5-3-5zM7 13l2-10h-1L6 13h1z",
  },
  cursor: {
    color: "#000000",
    icon: "M3 2l9 6-4 1 2 5-2 .8-2-5-3 3V2z",
  },
  copilot: {
    color: "#000000",
    icon: "M8 1a5 5 0 0 0-5 5v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V6a5 5 0 0 0-5-5zM5.5 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm3 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z",
  },
  devin: {
    color: "#6366F1",
    icon: "M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-1 3v4l3-2-3-2z",
  },
  // L4 — Orchestration
  "multi-agent orchestration": {
    color: "#D4960A",
    icon: "M8 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0-6v5m-4-1l3 2m5-2l-3 2",
  },
};

/** Normalize tool name for lookup */
export function getToolIcon(toolName: string): ToolIconConfig | null {
  const normalized = toolName.toLowerCase().trim();
  return TOOL_ICONS[normalized] || null;
}

/** Default icon for unknown tools */
export const DEFAULT_TOOL_ICON: ToolIconConfig = {
  color: "#6B7280",
  icon: "M10.5 2H5.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
};
