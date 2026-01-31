import type { Metadata } from "next";
import Link from "next/link";
import { getAllLevels, TRANSITIONS } from "@/config/levels";
import { getTutorialsByLevel, getLevelUpTutorials } from "@/data/tutorials";

export const metadata: Metadata = {
  title: "Learning Paths — Battlecat AI",
  description:
    "Follow the AI Maturity Framework from L0 (Asker) to L4 (Architect). See what to learn at each level and what it takes to level up.",
};

export const revalidate = 60;

export default async function LearningPathsPage() {
  const levels = getAllLevels();

  // Prefetch all tutorial data (async Supabase calls)
  const tutorialsByLevel = await Promise.all(
    levels.map(async (level) => ({
      level: level.level,
      tutorials: await getTutorialsByLevel(level.level),
      levelUpTutorials: await getLevelUpTutorials(level.level),
    }))
  );
  const dataMap = new Map(tutorialsByLevel.map((d) => [d.level, d]));

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Learning Paths</h1>
        <p className="text-bc-text-secondary">
          Follow the AI Maturity Framework from L0 to L4. Each path builds on
          the last.
        </p>
      </section>

      {/* Visual Path */}
      <div className="space-y-0">
        {levels.map((level) => {
          const tutorials = dataMap.get(level.level)?.tutorials ?? [];
          const levelUpTutorials = dataMap.get(level.level)?.levelUpTutorials ?? [];
          const transition = TRANSITIONS.find((t) => t.from === level.level);
          const totalCount = tutorials.length;

          return (
            <div key={level.level}>
              {/* Level Node */}
              <div className="relative flex gap-5">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: level.color }}
                  >
                    L{level.level}
                  </div>
                  {level.level < 4 && (
                    <div className="w-0.5 flex-1 bg-bc-border" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 pt-1">
                  <Link
                    href={`/levels/${level.level}`}
                    className="group"
                  >
                    <h2 className="text-xl font-bold group-hover:text-bc-primary transition-colors">
                      {level.you_role} &rarr; {level.ai_role}
                    </h2>
                  </Link>
                  <p className="mt-1 text-sm text-bc-text-secondary">
                    {level.description}
                  </p>

                  {/* Tutorial Count */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {totalCount > 0 ? (
                      <Link
                        href={`/levels/${level.level}`}
                        className="inline-flex items-center gap-1 rounded-full bg-bc-surface border border-bc-border px-3 py-1 text-sm font-medium text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {totalCount} tutorial{totalCount !== 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span className="text-sm text-bc-text-secondary italic">
                        No tutorials yet
                      </span>
                    )}

                    {levelUpTutorials.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-bc-secondary/10 px-3 py-1 text-sm font-medium text-bc-secondary">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {levelUpTutorials.length} level-up
                      </span>
                    )}
                  </div>

                  {/* Tutorial list */}
                  {tutorials.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {tutorials.map((t, idx) => (
                        <Link
                          key={t.id}
                          href={`/tutorials/${t.slug}`}
                          className="flex items-baseline gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bc-primary/5 transition-colors"
                        >
                          <span className="shrink-0 text-xs font-mono text-bc-text-secondary">
                            {idx + 1}.
                          </span>
                          <span className="font-medium hover:text-bc-primary">
                            {t.title}
                          </span>
                          {t.level_relation === "level-up" && (
                            <span className="shrink-0 rounded bg-bc-secondary/10 px-1.5 py-0.5 text-xs text-bc-secondary">
                              level-up
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transition Arrow */}
              {transition && (
                <div className="relative flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-full bg-bc-border" />
                  </div>
                  <div className="pb-6">
                    <div className="rounded-lg border border-dashed border-bc-secondary/30 bg-bc-secondary/5 px-4 py-2">
                      <p className="text-xs text-bc-text-secondary">
                        <span className="font-medium text-red-500">
                          Give up:
                        </span>{" "}
                        {transition.give_up}
                        <span className="mx-2">&middot;</span>
                        <span className="font-medium text-bc-primary">
                          Invest:
                        </span>{" "}
                        {transition.invest}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center space-y-3">
        <p className="text-bc-text-secondary">
          Know where you are?
        </p>
        <Link
          href="/level-up"
          className="inline-flex items-center gap-2 rounded-lg bg-bc-secondary px-6 py-3 font-semibold text-white transition-shadow hover:shadow-lg"
        >
          Find Your Level
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
