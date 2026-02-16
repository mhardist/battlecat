"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/MobileNav";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/paths", label: "Paths" },
  { href: "/tools", label: "Tools" },
  { href: "/level-up", label: "Level Up" },
  { href: "/achievements", label: "Rewards" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
];

export function SiteNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-bc-border bg-bc-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-bc-primary">
          Battlecat
          <span className="ml-1 text-xs font-normal text-bc-text-secondary">
            AI
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-bc-text-secondary transition-colors hover:bg-bc-primary/10 hover:text-bc-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-bc-border py-8 text-center text-sm text-bc-text-secondary">
      <p>
        Battlecat AI — Built on the{" "}
        <span className="font-medium text-bc-secondary">
          AI Maturity Framework
        </span>
      </p>
    </footer>
  );
}
