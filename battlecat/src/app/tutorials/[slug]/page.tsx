import { notFound } from "next/navigation";
import Link from "next/link";
import { getLevel } from "@/config/levels";
import { MaturityLevel } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Tutorial detail page.
 * In production, this fetches from Supabase.
 * For now, shows the page structure.
 */
export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;

  // TODO: Fetch tutorial from Supabase by slug
  // const { data: tutorial } = await supabase
  //   .from("tutorials")
  //   .select("*")
  //   .eq("slug", slug)
  //   .eq("is_published", true)
  //   .single();

  // Placeholder for development
  const tutorial = null;

  if (!tutorial) {
    notFound();
  }

  // Type assertion for when real data is connected
  const t = tutorial as {
    title: string;
    summary: string;
    body: string;
    maturity_level: MaturityLevel;
    level_relation: string;
    topics: string[];
    tags: string[];
    tools_mentioned: string[];
    difficulty: string;
    action_items: string[];
    source_urls: string[];
    source_count: number;
    created_at: string;
    updated_at: string;
  };

  const level = getLevel(t.maturity_level);

  return (
    <article className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/levels/${t.maturity_level}`}
            className="rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: level.color }}
          >
            L{t.maturity_level} {level.name}
          </Link>
          <span className="text-sm text-bc-text-secondary">
            {t.level_relation}
          </span>
          <span className="text-sm text-bc-text-secondary">
            {t.difficulty}
          </span>
        </div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-lg text-bc-text-secondary">{t.summary}</p>
        <div className="flex flex-wrap gap-1">
          {t.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-bc-border px-2 py-0.5 text-xs text-bc-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="prose max-w-none dark:prose-invert">
        {/* In production, render markdown body */}
        <div dangerouslySetInnerHTML={{ __html: t.body }} />
      </div>

      {/* Action Items */}
      {t.action_items.length > 0 && (
        <section className="rounded-lg border-l-4 border-l-bc-secondary bg-bc-surface p-6">
          <h2 className="text-xl font-bold text-bc-secondary">
            Try This
          </h2>
          <ul className="mt-3 space-y-2">
            {t.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 text-bc-secondary font-bold">
                  {i + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      {t.source_urls.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-bc-text-secondary">
            Sources ({t.source_count})
          </h3>
          <ul className="space-y-1">
            {t.source_urls.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-bc-primary hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
