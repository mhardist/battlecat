import Link from "next/link";
import { getAllLevels } from "@/config/levels";
import { AI_TOOLS, getToolsByLevel, formatToolDate } from "@/config/tools";
import { getToolIcon, DEFAULT_TOOL_ICON } from "@/config/tool-icons";
import { getAllTutorials } from "@/data/tutorials";
import { ToolsTimeline } from "@/components/ToolsTimeline";

export const revalidate = 60;

export default async function ToolsPage() {
  const levels = getAllLevels();
  const allTutorials = await getAllTutorials();

  // Build a map of tool name → tutorial count
  const toolTutorialCounts: Record<string, number> = {};
  for (const t of allTutorials) {
    for (const tool of t.tools_mentioned) {
      const key = tool.toLowerCase();
      toolTutorialCounts[key] = (toolTutorialCounts[key] || 0) + 1;
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">AI Tools Directory</h1>
        <p className="text-bc-text-secondary">
          Every AI tool in the framework — organized by maturity level, with
          launch dates and key milestones. Newest releases first.
        </p>
        <div className="flex items-center gap-4 text-sm text-bc-text-secondary mt-2">
          <span className="font-mono">{AI_TOOLS.length} tools</span>
          <span>&middot;</span>
          <span className="font-mono">
            {AI_TOOLS.reduce(
              (sum, t) => sum + (t.milestones?.length || 0),
              0
            )}{" "}
            milestones
          </span>
        </div>
      </section>

      {/* Collapsible Timeline */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Timeline</h2>
        <p className="text-sm text-bc-text-secondary">
          Major releases and milestones — most recent first. Click to expand
          sections and individual events.
        </p>
        <ToolsTimeline
          tools={AI_TOOLS}
          levels={levels}
          toolTutorialCounts={toolTutorialCounts}
        />
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
                const tutorialCount =
                  toolTutorialCounts[tool.name.toLowerCase()] || 0;
                const recentMilestones = (tool.milestones || [])
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 3);

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

                    {/* Recent milestones (newest first) */}
                    {recentMilestones.length > 0 && (
                      <div className="space-y-1">
                        {recentMilestones.map((m, i) => (
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
                          {tutorialCount} tutorial
                          {tutorialCount !== 1 ? "s" : ""}
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
