/** Battlecat AI brand configuration */
export const BRAND = {
  name: "Battlecat",
  domain: "battlecat.ai",
  tagline: "Level up your AI skills",
  description:
    "Forward links from your phone. Get organized, step-by-step AI learning tutorials mapped to the AI Maturity Framework.",
} as const;

/**
 * Battlecat color palette
 * Forest teal + amber gold, Material Design principles
 */
export const COLORS = {
  primary: {
    DEFAULT: "#1B7A6E",
    dark: "#0F4F47",
    light: "#2A9D8F",
  },
  secondary: {
    DEFAULT: "#D4960A",
    dark: "#A67508",
    light: "#E8B54D",
  },
  background: {
    DEFAULT: "#FAFAF8",
    dark: "#111113",
  },
  surface: {
    DEFAULT: "#FFFFFF",
    dark: "#1E1E22",
  },
  text: {
    primary: "#1C1C1E",
    secondary: "#6B7280",
    primaryDark: "#F5F5F5",
    secondaryDark: "#9CA3AF",
  },
  border: "#E5E7EB",
  success: "#10B981",
  error: "#EF4444",
  /** Per-level accent colors */
  levels: {
    0: "#9CA3AF",
    1: "#14B8A6",
    2: "#22C55E",
    3: "#F59E0B",
    4: "#D4960A",
  },
} as const;
