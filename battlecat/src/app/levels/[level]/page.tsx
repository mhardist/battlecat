import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLevel, getAllLevels, TRANSITIONS } from "@/config/levels";
import { MaturityLevel } from "@/types";
import { getTutorialsByLevel, getLevelUpTutorials } from "@/data/seed-tutorials";

interface Props {
  params: Promise<{ level: string }>;
}

export function generateStaticParams() {
  return getAllLevels().map((l) => ({ level: String(l.level) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: levelParam } = await params;
  const levelNum = parseInt(levelParam, 10) as MaturityLevel;
  const level = getLevel(levelNum);
  if (!level) return { title: "Level Not Found — Battle Cat AI" };
  return {
    title: `Level ${level.level}: ${level.you_role} → ${level.ai_role} — Battle Cat AI`,
    description: level.description,
  };
}

export default async function LevelPage({ params }: Props) {
  const { level: levelParam } = await params;
  const levelNum = parseInt(levelParam, 10) as MaturityLevel;

  if (isNaN(levelNum) || levelNum < 0 || levelNum > 4) {
    notFound();
  }

  const level = getLevel(levelNum);
  const transitionTo = TRANSITIONS.find((t) => t.from === levelNum);
  const transitionFrom = TRANSITIONS.find((t) => t.to === levelNum);
  const tutorials = getTutorialsByLevel(levelNum);
  const levelUpTutorials = getLevelUpTutorials(levelNum);

  return (
    <div className="space-y-8">
      {/* Level Header */}
      <div
        className="rounded-xl border-l-4 bg-bc-surface p-6"
        style={{ borderLeftColor: level.color }}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold" style={{ color: level.color }}>
            L{level.level}
          </span>
          <h1 className="text-3xl font-bold">
            {level.you_role} &rarr; {level.ai_role}
          </h1>
        </div>
        <p className="mt-2 text-lg text-bc-text-secondary">
          {level.description}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-bc-text-secondary">
              Relationship
            </span>
            <p className="font-semibold">{level.relationship}</p>
          </div>
          <div>
            <span className="font-medium text-bc-text-secondary">Trust</span>
            <p className="font-semibold">{level.trust}</p>
          </div>
          <div>
            <span className="font-medium text-bc-text-secondary">
              Investment
            </span>
            <p className="font-semibold">{level.investment}</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm font-medium text-bc-text-secondary">
            Tools
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {level.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: level.color }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Level Transition Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {transitionFrom && (
          <div className="rounded-lg border border-bc-border bg-bc-surface p-4">
            <h3 className="text-sm font-medium text-bc-text-secondary">
              Getting Here (L{transitionFrom.from} &rarr; L{transitionFrom.to})
            </h3>
            <p className="mt-1">
              <span className="text-bc-text-secondary">Give up:</span>{" "}
              <span className="font-medium">{transitionFrom.give_up}</span>
            </p>
            <p>
              <span className="text-bc-text-secondary">Invest:</span>{" "}
              <span className="font-medium">{transitionFrom.invest}</span>
            </p>
          </div>
        )}
        {transitionTo && (
          <div className="rounded-lg border border-bc-border bg-bc-surface p-4">
            <h3 className="text-sm font-medium text-bc-secondary">
              Level Up &rarr; L{transitionTo.to}
            </h3>
            <p className="mt-1">
              <span className="text-bc-text-secondary">Give up:</span>{" "}
              <span className="font-medium">{transitionTo.give_up}</span>
            </p>
            <p>
              <span className="text-bc-text-secondary">Invest:</span>{" "}
              <span className="font-medium">{transitionTo.invest}</span>
            </p>
          </div>
        )}
      </div>

      {/* Level-Up Content */}
      {levelUpTutorials.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-bc-secondary">
            Level-Up Tutorials
          </h2>
          <div className="grid gap-3">
            {levelUpTutorials.map((t) => (
              <Link
                key={t.id}
                href={`/tutorials/${t.slug}`}
                className="group flex items-start gap-4 rounded-lg border border-bc-secondary/20 bg-bc-secondary/5 p-4 transition-all hover:shadow-md"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-bc-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <div>
                  <h3 className="font-semibold group-hover:text-bc-primary transition-colors">
                    {t.title}
                  </h3>
                  <p className="mt-1 text-sm text-bc-text-secondary">
                    {t.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Tutorials for this Level */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">
          L{level.level} Tutorials ({tutorials.length})
        </h2>
        {tutorials.length > 0 ? (
          <div className="grid gap-3">
            {tutorials.map((t) => (
              <Link
                key={t.id}
                href={`/tutorials/${t.slug}`}
                className="group rounded-lg border border-bc-border bg-bc-surface p-4 transition-all hover:shadow-md hover:border-bc-primary/30"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="capitalize text-bc-text-secondary">
                    {t.difficulty}
                  </span>
                  <span className="text-bc-border">|</span>
                  <span className="text-bc-text-secondary">
                    {t.level_relation === "level-up"
                      ? "Level Up"
                      : t.level_relation === "level-practice"
                        ? "Practice"
                        : "Cross-Level"}
                  </span>
                  {t.source_count > 1 && (
                    <>
                      <span className="text-bc-border">|</span>
                      <span className="text-bc-text-secondary">
                        {t.source_count} sources
                      </span>
                    </>
                  )}
                </div>
                <h3 className="mt-1.5 font-semibold group-hover:text-bc-primary transition-colors">
                  {t.title}
                </h3>
                <p className="mt-1 text-sm text-bc-text-secondary line-clamp-2">
                  {t.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-bc-primary/10 px-2 py-0.5 text-xs text-bc-primary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
            <p className="text-bc-text-secondary">
              No L{level.level} tutorials yet. Forward content about{" "}
              {level.tools.join(", ")} to populate this level.
            </p>
          </div>
        )}
      </section>

      {/* Navigation */}
      <nav className="flex items-center justify-between border-t border-bc-border pt-6">
        {levelNum > 0 ? (
          <Link
            href={`/levels/${levelNum - 1}`}
            className="text-sm text-bc-primary hover:underline"
          >
            &larr; L{levelNum - 1}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href="/paths"
          className="text-sm text-bc-text-secondary hover:text-bc-primary"
        >
          All Levels
        </Link>
        {levelNum < 4 ? (
          <Link
            href={`/levels/${levelNum + 1}`}
            className="text-sm text-bc-primary hover:underline"
          >
            L{levelNum + 1} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
