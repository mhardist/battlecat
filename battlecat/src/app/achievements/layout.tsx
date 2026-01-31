import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievements — Battlecat AI",
  description: "Track your learning achievements and earn Points of Power on your AI mastery journey.",
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
