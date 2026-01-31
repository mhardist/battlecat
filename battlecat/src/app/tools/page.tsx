import Link from "next/link";
import { getAllLevels } from "@/config/levels";
import { AI_TOOLS, getToolsByLevel, formatToolDate } from "@/config/tools";
import { getToolIcon, DEFAULT_TOOL_ICON } from "@/config/tool-icons";
import { getAllTutorials } from "@/data/tutorials";

export const revalidate = 60;

export default async function ToolsPage() {
  const levels = getAllLevels();
  const allTutorials = await getAllTutorials();

  // Build a map of tool name → tutorial count
  const toolTutorialCounts = new Map<string, number>();
  for (const t of allTutorials) {
    for (const tool of t.tools_mentioned) {
      const key = tool.toLowerCase();
      toolTutorialCounts.set(key, (toolTutorialCounts.get(key) || 0) + 1);
    }
  }

  // Timeline: all milestones sorted chronologically
  const allMilestones = AI_TOOLS.flatMap((tool) =>
    (tool.milestones || []).map((m) => ({
      ...m,
      toolName: tool.name,
      level: tool.level,
    }))
  ).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">AI Tools Directory</h1>
        <p className="text-bc-text-secondary">
          Every AI tool in the framework — organized by maturity level, with launch
          dates and key milestones.
        </p>
      </section>

      {/* Timeline */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Timeline</h2>
        <p className="text-sm text-bc-text-secondary">
          When the tools at each level became available.
        </p>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-bc-border" />
          <div className="space-y-4">
            {allMilestones.map((m, i) => {
              const levelInfo = levels[m.level];
              return (
                <div key={i} className="relative flex gap-4 pl-10">
                  <div
                    className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: levelInfo?.color || "#9CA3AF" }}
                  />
                  <div className="flex-1 rounded-lg border border-bc-border bg-bc-surface p-3">
                    <div className="flex items-center gap-2 text-xs text-bc-text-secondary">
                      <span className="font-mono">{formatToolDate(m.date)}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: levelInfo?.color || "#9CA3AF" }}
                      >
                        L{m.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{m.event}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools by Level */}
      {levels.map((level) => {
        const tools = getToolsByLevel(level.level);
        if (tools.length === 0) return null;

        return (
          <section key={level.level} className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: level.color }}
              >
                L{level.level}
              </span>
              <div>
                <h2 className="text-xl font-bold">
                  {level.you_role} &rarr; {level.ai_role}
                </h2>
                <p className="text-sm text-bc-text-secondary">
                  {level.description.slice(0, 80)}...
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map((tool) => {
                const icon = getToolIcon(tool.name) || DEFAULT_TOOL_ICON;
                const tutorialCount = toolTutorialCounts.get(tool.name.toLowerCase()) || 0;

                return (
                  <div
                    key={tool.name}
                    className="rounded-xl border border-bc-border bg-bc-surface p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <svg
                          width={20}
                          height={20}
                          viewBox="0 0 16 16"
                          fill="none"
                          className="shrink-0"
                        >
                          <path
                            d={icon.icon}
                            fill={icon.color}
                            fillRule="evenodd"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-semibold">{tool.name}</h3>
                      </div>
                      <span className="text-xs font-mono text-bc-text-secondary">
                        {formatToolDate(tool.launchDate)}
                      </span>
                    </div>

                    <p className="text-sm text-bc-text-secondary">
                      {tool.description}
                    </p>

                    {/* Milestones */}
                    {tool.milestones && tool.milestones.length > 0 && (
                      <div className="space-y-1">
                        {tool.milestones.slice(-3).map((m, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-bc-text-secondary"
                          >
                            <span className="font-mono shrink-0">
                              {formatToolDate(m.date)}
                            </span>
                            <span className="truncate">{m.event}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 pt-1 border-t border-bc-border">
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-bc-primary hover:underline"
                      >
                        Visit &rarr;
                      </a>
                      {tutorialCount > 0 && (
                        <Link
                          href={`/search?q=${encodeURIComponent(tool.name)}`}
                          className="text-xs text-bc-text-secondary hover:text-bc-primary"
                        >
                          {tutorialCount} tutorial{tutorialCount !== 1 ? "s" : ""}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
