import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Level Up — Battlecat AI",
  description:
    "Find your current AI maturity level and discover what to learn next. Move from Asker to Architect.",
};

export default function LevelUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
