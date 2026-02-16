import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battlecat AI — Level Up Your AI Skills",
  description:
    "Forward links from your phone. Get organized, step-by-step AI learning tutorials mapped to the AI Maturity Framework.",
  openGraph: {
    title: "Battlecat AI",
    description: "Level up your AI skills with organized tutorials.",
    siteName: "Battlecat AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Battlecat AI" href="/feed.xml" />
      </head>
      <body className="antialiased">
        <SiteNav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
