import type { Metadata } from "next";
import Link from "next/link";
import { getAllLevels } from "@/config/levels";
import { getAllTutorials, getHotNewsTutorials } from "@/data/tutorials";
import { TutorialCard } from "@/components/TutorialCard";
import { HotNews } from "@/components/HotNews";
import type { NewsItem } from "@/components/HotNews";
import { HOT_NEWS } from "@/config/hot-news";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Battlecat AI — Level Up Your AI Skills",
  description:
    "Forward links from your phone. Get organized, step-by-step AI tutorials mapped to the AI Maturity Framework (L0 Asker → L4 Architect).",
};

export default async function Home() {
  const levels = getAllLevels();
  const allTutorials = await getAllTutorials();
  const latestTutorials = allTutorials.slice(0, 6);

  // Build hot news: only items from today (removes after 1 day)
  const today = new Date().toISOString().slice(0, 10);
  const hotNewsTutorials = await getHotNewsTutorials();
  const dbNewsItems: NewsItem[] = hotNewsTutorials
    .filter((t) => t.created_at.slice(0, 10) === today)
    .map((t) => ({
      date: t.created_at.slice(0, 10),
      headline: t.hot_news_headline || t.title,
      teaser: t.hot_news_teaser || t.summary.slice(0, 200),
      toolName: t.tools_mentioned[0] || "AI",
      level: t.maturity_level,
      url: `/tutorials/${t.slug}`,
    }));
  const todayConfigItems = HOT_NEWS.filter((item) => item.date === today);
  const hotNewsItems = [...dbNewsItems, ...todayConfigItems].slice(0, 8);

  // Stats
  const totalTutorials = allTutorials.length;
  const totalSources = allTutorials.reduce((sum, t) => sum + t.source_count, 0);
  const levelCounts = levels.map(
    (l) => allTutorials.filter((t) => t.maturity_level === l.level).length
  );

  return (
    <div className="space-y-16">
      {/* Hero — tight, 3 lines max */}
      <section className="space-y-4 text-center pt-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Send a link.{" "}
          <span className="text-bc-primary">Get a tutorial.</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-bc-text-secondary">
          Forward a TikTok, article, or tweet. Battlecat turns it into a
          step-by-step AI tutorial mapped to your skill level.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/level-up"
            className="rounded-lg bg-bc-primary px-5 py-2.5 font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-bc-primary/25"
          >
            Find Your Level
          </Link>
          <Link
            href="/submit"
            className="rounded-lg border-2 border-bc-secondary px-5 py-2.5 font-semibold text-bc-secondary transition-colors hover:bg-bc-secondary/10"
          >
            Submit a Link
          </Link>
        </div>
      </section>

      {/* Hot News — only shown when there are items from today */}
      {hotNewsItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              Hot in AI
            </h2>
            <Link
              href="/tools"
              className="text-sm font-medium text-bc-primary hover:underline"
            >
              Full timeline &rarr;
            </Link>
          </div>
          <HotNews items={hotNewsItems} levels={levels} />
        </section>
      )}

      {/* Latest Tutorials — the main content */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Latest Tutorials</h2>
          <Link
            href="/browse"
            className="text-sm font-medium text-bc-primary hover:underline"
          >
            Browse all &rarr;
          </Link>
        </div>

        {latestTutorials.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestTutorials.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-bc-border bg-bc-surface p-12 text-center">
            <p className="text-bc-text-secondary">
              No tutorials yet. Send your first link to get started.
            </p>
            <Link
              href="/submit"
              className="mt-4 inline-block rounded-lg bg-bc-primary px-5 py-2.5 font-semibold text-white"
            >
              Submit a Link
            </Link>
          </div>
        )}
      </section>

      {/* Stats Bar — compact */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-xl bg-bc-surface border border-bc-border p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-bc-primary">{totalTutorials}</div>
          <div className="text-sm text-bc-text-secondary">Tutorials</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-bc-secondary">{totalSources}</div>
          <div className="text-sm text-bc-text-secondary">Sources</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: "#22C55E" }}>5</div>
          <div className="text-sm text-bc-text-secondary">AI Levels</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: "#F59E0B" }}>
            {new Set(allTutorials.flatMap((t) => t.tools_mentioned)).size}
          </div>
          <div className="text-sm text-bc-text-secondary">Tools Covered</div>
        </div>
      </section>

      {/* Framework Overview — secondary, compact */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">The AI Maturity Framework</h2>
          <Link
            href="/paths"
            className="text-sm font-medium text-bc-primary hover:underline"
          >
            Learn about the framework &rarr;
          </Link>
        </div>
        <p className="text-bc-text-secondary text-sm">
          Every tutorial is mapped to a level. Find where you are, learn what
          comes next.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (
            <Link
              key={level.level}
              href={`/levels/${level.level}`}
              className="group flex items-start gap-3 rounded-lg border border-bc-border bg-bc-surface p-4 transition-all hover:shadow-md hover:border-bc-primary/30"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: level.color }}
              >
                L{level.level}
              </span>
              <div className="min-w-0">
                <div className="font-semibold group-hover:text-bc-primary transition-colors">
                  {level.you_role} &rarr; {level.ai_role}
                </div>
                <p className="mt-0.5 text-xs text-bc-text-secondary line-clamp-2">
                  {level.description}
                </p>
                <div className="mt-1.5 text-xs text-bc-text-secondary">
                  {levelCounts[level.level]} tutorial{levelCounts[level.level] !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Distribution bar — compact version of the old stats */}
      <section className="rounded-xl bg-bc-surface border border-bc-border p-6 text-center space-y-4">
        <h3 className="text-lg font-bold">Where Most People Are</h3>
        <div className="flex items-end justify-center gap-3 mx-auto max-w-md h-24">
          {[
            { level: 0, pct: 49, color: "#9CA3AF" },
            { level: 1, pct: 25, color: "#14B8A6" },
            { level: 2, pct: 15, color: "#22C55E" },
            { level: 3, pct: 8, color: "#F59E0B" },
            { level: 4, pct: 3, color: "#D4960A" },
          ].map((item) => (
            <div key={item.level} className="flex-1 text-center">
              <div
                className="mx-auto rounded-t-md w-full transition-all"
                style={{
                  height: `${Math.max(item.pct, 4)}%`,
                  backgroundColor: item.color,
                }}
              />
              <div className="mt-1 text-xs font-bold" style={{ color: item.color }}>
                L{item.level}
              </div>
              <div className="text-[10px] text-bc-text-secondary">{item.pct}%</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-bc-text-secondary italic">
          Moving up one level is a competitive moat.
        </p>
      </section>
    </div>
  );
}
