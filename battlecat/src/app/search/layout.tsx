import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — Battle Cat AI",
  description: "Search across all AI tutorials by keyword, topic, or tool.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
