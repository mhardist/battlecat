import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Link — Battlecat AI",
  description:
    "Paste a link to a TikTok, article, tweet, YouTube video, PDF, or LinkedIn post. We'll turn it into an AI tutorial.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
