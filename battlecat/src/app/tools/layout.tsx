import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools Directory — Battlecat AI",
  description:
    "Every AI tool organized by maturity level, with launch dates, descriptions, and key milestones. From ChatGPT to multi-agent orchestration.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
