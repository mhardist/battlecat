import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found — Battlecat AI",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-bc-primary">404</h1>
        <p className="text-xl text-bc-text-secondary">
          This page doesn&apos;t exist yet.
        </p>
        <p className="text-sm text-bc-text-secondary">
          Maybe it&apos;s waiting for a link you haven&apos;t sent yet.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-bc-primary px-5 py-2.5 font-semibold text-white transition-shadow hover:shadow-lg"
        >
          Go Home
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border-2 border-bc-border px-5 py-2.5 font-semibold text-bc-text-secondary transition-colors hover:border-bc-primary hover:text-bc-primary"
        >
          Browse Tutorials
        </Link>
      </div>
    </div>
  );
}
