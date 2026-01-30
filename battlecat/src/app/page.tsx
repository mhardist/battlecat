import Link from "next/link";
import { getAllLevels } from "@/config/levels";

const LEVEL_COLORS: Record<number, string> = {
  0: "border-l-bc-level-0",
  1: "border-l-bc-level-1",
  2: "border-l-bc-level-2",
  3: "border-l-bc-level-3",
  4: "border-l-bc-level-4",
};

export default function Home() {
  const levels = getAllLevels();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Level Up Your{" "}
          <span className="text-bc-primary">AI Skills</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-bc-text-secondary">
          Forward a TikTok, article, or tweet from your phone. Battle Cat
          extracts the knowledge, organizes it by maturity level, and turns it
          into step-by-step tutorials you can actually follow.
        </p>
      </section>

      {/* Framework Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">The AI Maturity Framework</h2>
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

      {/* Latest Tutorials - placeholder */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Latest Tutorials</h2>
        <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No tutorials yet. Text a link to your Battle Cat number to get
            started.
          </p>
        </div>
      </section>
    </div>
  );
}
