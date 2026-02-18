"use client";

import { useState, useEffect, useCallback } from "react";
import { articleToMarkdown } from "@/lib/articleToMarkdown";
import { copyToClipboard } from "@/lib/copyToClipboard";

interface CopyMarkdownButtonProps {
  /** CSS selector for the article body container */
  bodySelector: string;
  /** Tutorial title to prepend as h1 */
  title: string;
  /** Optional metadata to include as HTML comments */
  meta?: {
    date?: string;
    author?: string;
    tags?: string[];
    level?: number;
    difficulty?: string;
  };
}

export function CopyMarkdownButton({
  bodySelector,
  title,
  meta,
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(false);

  // Only show the button client-side where clipboard is available
  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        (!!navigator.clipboard?.writeText ||
          typeof document.execCommand === "function"),
    );
  }, []);

  const handleCopy = useCallback(async () => {
    if (copied) return;

    const markdown = await articleToMarkdown(bodySelector, {
      title,
      ...meta,
    });

    if (!markdown) return;

    const success = await copyToClipboard(markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [bodySelector, title, meta, copied]);

  // Graceful degradation: don't render during SSR or if clipboard is unavailable
  if (!supported) return null;

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy article as Markdown"}
      title={copied ? "Copied!" : "Copy as Markdown"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
        copied
          ? "border-bc-success bg-bc-success/10 text-bc-success"
          : "border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
      }`}
    >
      {copied ? (
        <>
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy as Markdown
        </>
      )}
    </button>
  );
}
