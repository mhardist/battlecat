import { notFound } from "next/navigation";
import Link from "next/link";
import { getLevel } from "@/config/levels";
import { getTutorialBySlug, getAllTutorials } from "@/data/seed-tutorials";
import { LevelBadge } from "@/components/LevelBadge";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-generate paths for seed tutorials */
export function generateStaticParams() {
  return getAllTutorials().map((t) => ({ slug: t.slug }));
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) {
    notFound();
  }

  const level = getLevel(tutorial.maturity_level);

  return (
    <article className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <LevelBadge
            level={tutorial.maturity_level}
            relation={tutorial.level_relation}
            size="md"
          />
          <span className="rounded-full border border-bc-border px-2.5 py-0.5 text-xs font-medium text-bc-text-secondary capitalize">
            {tutorial.difficulty}
          </span>
          {tutorial.source_count > 1 && (
            <span className="text-xs text-bc-text-secondary">
              Synthesized from {tutorial.source_count} sources
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold">{tutorial.title}</h1>
        <p className="text-lg text-bc-text-secondary">{tutorial.summary}</p>

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
            <span
              key={tool}
              className="rounded-full bg-bc-border px-2.5 py-0.5 text-xs text-bc-text-secondary"
            >
              {tool}
            </span>
          ))}
        </div>
      </header>

      {/* Body */}
      <div
        className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-bc-primary prose-strong:font-semibold"
        dangerouslySetInnerHTML={{ __html: tutorial.body }}
      />

      {/* Action Items */}
      {tutorial.action_items.length > 0 && (
        <section className="rounded-xl border-l-4 border-l-bc-secondary bg-bc-surface p-6 shadow-sm">
          <h2 className="text-xl font-bold text-bc-secondary">
            Try This
          </h2>
          <ul className="mt-4 space-y-3">
            {tutorial.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bc-secondary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      {tutorial.source_urls.length > 0 && (
        <section className="space-y-3 border-t border-bc-border pt-6">
          <h3 className="text-sm font-medium text-bc-text-secondary">
            Sources ({tutorial.source_count})
          </h3>
          <ul className="space-y-1.5">
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
      <nav className="flex items-center justify-between border-t border-bc-border pt-6">
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
