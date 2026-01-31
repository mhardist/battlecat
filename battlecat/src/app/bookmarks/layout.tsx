import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks — Battlecat AI",
  description: "Your saved AI tutorials. Pick up where you left off.",
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
