import type { Metadata } from "next";
import Link from "next/link";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battle Cat AI — Level Up Your AI Skills",
  description:
    "Forward links from your phone. Get organized, step-by-step AI learning tutorials mapped to the AI Maturity Framework.",
  openGraph: {
    title: "Battle Cat AI",
    description: "Level up your AI skills with organized tutorials.",
    siteName: "Battle Cat AI",
    type: "website",
  },
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/paths", label: "Paths" },
  { href: "/level-up", label: "Level Up" },
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <nav className="sticky top-0 z-50 border-b border-bc-border bg-bc-surface/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-lg font-bold text-bc-primary"
            >
              Battle Cat
              <span className="ml-1 text-xs font-normal text-bc-text-secondary">
                AI
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-bc-text-secondary transition-colors hover:bg-bc-primary/10 hover:text-bc-primary"
                >
                  {link.label}
                </Link>
              ))}
              <DarkModeToggle />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-bc-border py-8 text-center text-sm text-bc-text-secondary">
          <p>
            Battle Cat AI — Built on the{" "}
            <span className="font-medium text-bc-secondary">
              AI Maturity Framework
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}
