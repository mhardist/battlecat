import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLevel } from "@/config/levels";
import { getTutorialBySlug } from "@/data/tutorials";
import { getAllTutorials as getSeedTutorials } from "@/data/seed-tutorials";
import { LevelBadge } from "@/components/LevelBadge";
import { TutorialActions } from "@/components/TutorialActions";
import { ToolBadge } from "@/components/ToolBadge";
import { TutorialRating } from "@/components/TutorialRating";
import { renderMarkdown } from "@/lib/markdown";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Revalidate every 60 seconds so new tutorials appear quickly */
export const revalidate = 60;

/** Pre-generate paths for seed tutorials; new Supabase tutorials render on demand */
export function generateStaticParams() {
  return getSeedTutorials().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);
  if (!tutorial) return { title: "Tutorial Not Found — Battlecat AI" };
  const level = getLevel(tutorial.maturity_level);
  return {
    title: `${tutorial.title} — Battlecat AI`,
    description: tutorial.summary,
    openGraph: {
      title: tutorial.title,
      description: tutorial.summary,
      type: "article",
      siteName: "Battlecat AI",
      ...(tutorial.image_url && { images: [{ url: tutorial.image_url, width: 1344, height: 768 }] }),
      tags: [...tutorial.topics, `L${tutorial.maturity_level} ${level?.you_role}`],
    },
  };
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);

  if (!tutorial) {
    notFound();
  }

  const level = getLevel(tutorial.maturity_level);
  const bodyHtml = renderMarkdown(tutorial.body);
  const readingTime = Math.max(1, Math.ceil(tutorial.body.split(/\s+/).length / 200));

  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero Image */}
      {tutorial.image_url && (
        <div className="relative -mx-4 sm:mx-0 mb-8 overflow-hidden rounded-none sm:rounded-2xl">
          <img
            src={tutorial.image_url}
            alt={tutorial.title}
            className="w-full aspect-[16/9] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className="space-y-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <LevelBadge
            level={tutorial.maturity_level}
            relation={tutorial.level_relation}
            size="md"
          />
          <span className="rounded-full border border-bc-border px-2.5 py-0.5 text-xs font-medium text-bc-text-secondary capitalize">
            {tutorial.difficulty}
          </span>
          <span className="text-xs text-bc-text-secondary">
            {readingTime} min read
          </span>
          {tutorial.source_count > 1 && (
            <span className="text-xs text-bc-text-secondary">
              Synthesized from {tutorial.source_count} sources
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
          {tutorial.title}
        </h1>

        <p className="text-lg text-bc-text-secondary leading-relaxed">
          {tutorial.summary}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {tutorial.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-bc-primary/10 px-2.5 py-0.5 text-xs font-medium text-bc-primary"
            >
              {topic}
            </span>
          ))}
          {tutorial.tools_mentioned.map((tool) => (
            <ToolBadge key={tool} tool={tool} size="md" />
          ))}
        </div>
      </header>

      {/* Actions: bookmark, complete, share, notes */}
      <TutorialActions
        tutorialId={tutorial.id}
        tutorialTitle={tutorial.title}
        tutorialSlug={tutorial.slug}
      />

      {/* Body — rendered markdown */}
      <div
        className="tutorial-prose prose prose-lg max-w-none mt-8
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-[var(--foreground)]
          prose-a:text-bc-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:font-semibold prose-strong:text-[var(--foreground)]
          prose-blockquote:border-l-bc-primary prose-blockquote:bg-bc-surface prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:not-italic
          prose-li:text-[var(--foreground)]
          prose-code:text-bc-primary prose-code:font-medium
          prose-hr:border-bc-border
          dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Action Items */}
      {tutorial.action_items.length > 0 && (
        <section className="mt-12 rounded-2xl border-l-4 border-l-bc-secondary bg-bc-surface p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-bc-secondary flex items-center gap-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Try This Now
          </h2>
          <ul className="mt-5 space-y-4">
            {tutorial.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bc-secondary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Orko Rating */}
      <section className="mt-10 rounded-2xl border border-bc-border bg-bc-surface p-6 text-center space-y-2">
        <h3 className="text-lg font-bold">How many Orkos does this deserve?</h3>
        <div className="flex justify-center">
          <TutorialRating tutorialId={tutorial.id} size="lg" />
        </div>
      </section>

      {/* Sources */}
      {tutorial.source_urls.length > 0 && (
        <section className="mt-10 space-y-3 border-t border-bc-border pt-6">
          <h3 className="text-sm font-medium text-bc-text-secondary uppercase tracking-wider">
            Sources ({tutorial.source_count})
          </h3>
          <ul className="space-y-2">
            {tutorial.source_urls.map((url, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-bc-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-bc-primary hover:underline truncate"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between border-t border-bc-border mt-8 pt-6">
        <Link
          href={`/levels/${tutorial.maturity_level}`}
          className="text-sm text-bc-primary hover:underline"
        >
          &larr; All L{tutorial.maturity_level} tutorials
        </Link>
        <Link
          href="/browse"
          className="text-sm text-bc-primary hover:underline"
        >
          Browse all &rarr;
        </Link>
      </nav>
    </article>
  );
}
