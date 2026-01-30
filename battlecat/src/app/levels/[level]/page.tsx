import { notFound } from "next/navigation";
import { getLevel, TRANSITIONS } from "@/config/levels";
import { MaturityLevel } from "@/types";

interface Props {
  params: Promise<{ level: string }>;
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

      {/* Tutorials for this level - placeholder */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          L{level.level} Tutorials
        </h2>
        <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No L{level.level} tutorials yet. Forward content about{" "}
            {level.tools.join(", ")} to populate this level.
          </p>
        </div>
      </section>
    </div>
  );
}
