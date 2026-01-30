import Link from "next/link";
import { getAllLevels } from "@/config/levels";
import { getAllTutorials } from "@/data/seed-tutorials";

const LEVEL_COLORS: Record<number, string> = {
  0: "border-l-bc-level-0",
  1: "border-l-bc-level-1",
  2: "border-l-bc-level-2",
  3: "border-l-bc-level-3",
  4: "border-l-bc-level-4",
};

export default function Home() {
  const levels = getAllLevels();
  const tutorials = getAllTutorials().slice(0, 4);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Level Up Your{" "}
          <span className="text-bc-primary">AI Skills</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-bc-text-secondary">
          Forward a TikTok, article, or tweet from your phone. Battle Cat
          extracts the knowledge, organizes it by maturity level, and turns it
          into step-by-step tutorials you can actually follow.
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

      {/* Framework Overview */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">The AI Maturity Framework</h2>
          <Link href="/paths" className="text-sm text-bc-primary hover:underline">
            View full path &rarr;
          </Link>
        </div>
        <p className="text-bc-text-secondary">
          Every tutorial is mapped to a level. Find where you are, learn what
          comes next.
        </p>
        <div className="grid gap-3">
          {levels.map((level) => (
            <Link
              key={level.level}
              href={`/levels/${level.level}`}
              className={`block rounded-lg border border-bc-border border-l-4 ${LEVEL_COLORS[level.level]} bg-bc-surface p-4 transition-shadow hover:shadow-md`}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: level.color }}
                >
                  L{level.level}
                </span>
                <div>
                  <span className="font-semibold">
                    You: {level.you_role}
                  </span>
                  <span className="mx-2 text-bc-text-secondary">&rarr;</span>
                  <span className="font-semibold text-bc-primary">
                    AI: {level.ai_role}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-bc-text-secondary">
                {level.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {level.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full bg-bc-border px-2 py-0.5 text-xs text-bc-text-secondary"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Tutorials */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Latest Tutorials</h2>
          <Link href="/browse" className="text-sm text-bc-primary hover:underline">
            Browse all &rarr;
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.id}
              href={`/tutorials/${tutorial.slug}`}
              className="group rounded-lg border border-bc-border bg-bc-surface p-5 transition-all hover:shadow-md hover:border-bc-primary/30"
            >
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="rounded-full px-2 py-0.5 font-bold text-white"
                  style={{
                    backgroundColor:
                      levels[tutorial.maturity_level]?.color || "#9CA3AF",
                  }}
                >
                  L{tutorial.maturity_level}
                </span>
                <span className="text-bc-text-secondary capitalize">
                  {tutorial.difficulty}
                </span>
                {tutorial.source_count > 1 && (
                  <span className="text-bc-text-secondary">
                    {tutorial.source_count} sources
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-semibold group-hover:text-bc-primary transition-colors">
                {tutorial.title}
              </h3>
              <p className="mt-1 text-sm text-bc-text-secondary line-clamp-2">
                {tutorial.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats / Why */}
      <section className="rounded-xl bg-bc-surface border border-bc-border p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Where Most People Are</h2>
        <div className="grid grid-cols-5 gap-2 mx-auto max-w-xl">
          {[
            { level: 0, pct: 49, color: "#9CA3AF" },
            { level: 1, pct: 25, color: "#14B8A6" },
            { level: 2, pct: 15, color: "#22C55E" },
            { level: 3, pct: 8, color: "#F59E0B" },
            { level: 4, pct: 3, color: "#D4960A" },
          ].map((item) => (
            <div key={item.level} className="text-center">
              <div className="relative mx-auto h-32 w-full rounded-t-lg overflow-hidden bg-bc-border/30">
                <div
                  className="absolute bottom-0 w-full rounded-t-lg transition-all"
                  style={{
                    height: `${item.pct * 2}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="mt-1 text-xs font-bold" style={{ color: item.color }}>
                L{item.level}
              </div>
              <div className="text-xs text-bc-text-secondary">{item.pct}%</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-bc-text-secondary italic">
          &quot;Moving up one level is a competitive moat.&quot;
        </p>
      </section>
    </div>
  );
}
