"use client";

import { useState, useMemo } from "react";
import type { AITool } from "@/config/tools";
import { formatToolDate } from "@/config/tools";
import type { LevelInfo } from "@/types";

interface TimelineMilestone {
  date: string;
  event: string;
  toolName: string;
  level: number;
  significance: "high" | "medium" | "low";
}

interface ToolsTimelineProps {
  tools: AITool[];
  levels: LevelInfo[];
  toolTutorialCounts: Record<string, number>;
}

/** Group milestones into time buckets */
function getTimeBucket(date: string, now: string): string {
  const d = new Date(date + "-01");
  const n = new Date(now + "-01");
  const diffMonths =
    (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());

  if (diffMonths <= 1) return "This Month";
  if (diffMonths <= 3) return "Last 3 Months";
  if (diffMonths <= 6) return "Last 6 Months";
  if (diffMonths <= 12) return "Last Year";
  return "Older";
}

const BUCKET_ORDER = [
  "This Month",
  "Last 3 Months",
  "Last 6 Months",
  "Last Year",
  "Older",
];

export function ToolsTimeline({
  tools,
  levels,
  toolTutorialCounts,
}: ToolsTimelineProps) {
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(
    new Set(["This Month", "Last 3 Months"])
  );
  const [showAllInBucket, setShowAllInBucket] = useState<Set<string>>(
    new Set()
  );
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null
  );

  const now = "2026-01";

  // Flatten all milestones, reverse chronological
  const allMilestones = useMemo(() => {
    return tools
      .flatMap((tool) =>
        (tool.milestones || []).map((m) => ({
          ...m,
          toolName: tool.name,
          level: tool.level,
          significance: (m as { significance?: string }).significance as
            | "high"
            | "medium"
            | "low" || "medium",
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [tools]);

  // Group by time bucket
  const buckets = useMemo(() => {
    let filtered = allMilestones;

    if (levelFilter !== null) {
      filtered = filtered.filter((m) => m.level === levelFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.event.toLowerCase().includes(q) ||
          m.toolName.toLowerCase().includes(q)
      );
    }

    const groups: Record<string, TimelineMilestone[]> = {};
    for (const m of filtered) {
      const bucket = getTimeBucket(m.date, now);
      if (!groups[bucket]) groups[bucket] = [];
      groups[bucket].push(m);
    }
    return groups;
  }, [allMilestones, levelFilter, searchQuery]);

  const toggleBucket = (bucket: string) => {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  };

  const toggleShowAll = (bucket: string) => {
    setShowAllInBucket((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  };

  const getLevelColor = (level: number) =>
    levels[level]?.color || "#9CA3AF";

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-bc-border pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-b-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level filter pills */}
          <button
            onClick={() => setLevelFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              levelFilter === null
                ? "bg-bc-primary text-white"
                : "bg-bc-surface border border-bc-border text-bc-text-secondary hover:border-bc-primary"
            }`}
          >
            All
          </button>
          {levels.map((level) => (
            <button
              key={level.level}
              onClick={() =>
                setLevelFilter(
                  levelFilter === level.level ? null : level.level
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                levelFilter === level.level
                  ? "text-white"
                  : "bg-bc-surface border border-bc-border text-bc-text-secondary hover:opacity-80"
              }`}
              style={
                levelFilter === level.level
                  ? { backgroundColor: level.color }
                  : {}
              }
            >
              L{level.level}
            </button>
          ))}

          {/* Search */}
          <div className="relative ml-auto">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-bc-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="rounded-lg border border-bc-border bg-bc-surface pl-8 pr-3 py-1.5 text-xs outline-none focus:border-bc-primary w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Timeline buckets */}
      <div className="space-y-2">
        {BUCKET_ORDER.map((bucketName) => {
          const items = buckets[bucketName];
          if (!items || items.length === 0) return null;

          const isExpanded = expandedBuckets.has(bucketName);
          const showAll = showAllInBucket.has(bucketName);
          const highItems = items.filter((m) => m.significance === "high");
          const visibleItems = showAll
            ? items
            : isExpanded
              ? bucketName === "This Month" || bucketName === "Last 3 Months"
                ? items
                : highItems.length > 0
                  ? highItems
                  : items.slice(0, 5)
              : [];
          const hiddenCount = items.length - visibleItems.length;

          return (
            <div
              key={bucketName}
              className="rounded-xl border border-bc-border bg-bc-surface overflow-hidden"
            >
              {/* Bucket header */}
              <button
                onClick={() => toggleBucket(bucketName)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bc-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`h-4 w-4 text-bc-text-secondary transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <h3 className="font-semibold text-sm">{bucketName}</h3>
                  <span className="rounded-full bg-bc-primary/10 text-bc-primary px-2 py-0.5 text-xs font-medium">
                    {items.length} event{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {/* Level dots preview */}
                <div className="flex gap-1">
                  {Array.from(new Set(items.map((m) => m.level)))
                    .sort()
                    .map((lvl) => (
                      <span
                        key={lvl}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getLevelColor(lvl) }}
                      />
                    ))}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-bc-border">
                  <div className="relative pl-8 pr-4 py-3">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-bc-border" />

                    <div className="space-y-3">
                      {visibleItems.map((m, i) => {
                        const key = `${m.date}-${m.toolName}-${i}`;
                        const isItemExpanded = expandedMilestone === key;

                        return (
                          <div key={key} className="relative">
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-[14px] top-1.5 rounded-full border-2 border-white ${
                                m.significance === "high"
                                  ? "h-3.5 w-3.5 -left-[15px]"
                                  : "h-2.5 w-2.5 -left-[12px] top-2"
                              }`}
                              style={{
                                backgroundColor: getLevelColor(m.level),
                              }}
                            />

                            {/* Milestone card */}
                            <button
                              onClick={() =>
                                setExpandedMilestone(
                                  isItemExpanded ? null : key
                                )
                              }
                              className="w-full text-left rounded-lg hover:bg-bc-primary/5 px-3 py-2 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-bc-text-secondary shrink-0">
                                  {formatToolDate(m.date)}
                                </span>
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                                  style={{
                                    backgroundColor: getLevelColor(m.level),
                                  }}
                                >
                                  L{m.level}
                                </span>
                                <span className="text-xs font-semibold text-bc-primary shrink-0">
                                  {m.toolName}
                                </span>
                                {m.significance === "high" && (
                                  <span className="text-[10px] rounded-full bg-bc-secondary/15 text-bc-secondary px-1.5 py-0.5 font-medium shrink-0">
                                    Major
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-sm mt-1 ${
                                  m.significance === "high"
                                    ? "font-medium"
                                    : "text-bc-text-secondary"
                                }`}
                              >
                                {m.event}
                              </p>

                              {/* Expanded detail */}
                              {isItemExpanded && (
                                <div className="mt-2 pt-2 border-t border-bc-border/50 space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-bc-text-secondary">
                                    <span>
                                      Level {m.level} —{" "}
                                      {levels[m.level]?.you_role} &rarr;{" "}
                                      {levels[m.level]?.ai_role}
                                    </span>
                                  </div>
                                  {toolTutorialCounts[
                                    m.toolName.toLowerCase()
                                  ] > 0 && (
                                    <p className="text-xs text-bc-primary">
                                      {
                                        toolTutorialCounts[
                                          m.toolName.toLowerCase()
                                        ]
                                      }{" "}
                                      related tutorial
                                      {toolTutorialCounts[
                                        m.toolName.toLowerCase()
                                      ] !== 1
                                        ? "s"
                                        : ""}
                                    </p>
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show more / less */}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => toggleShowAll(bucketName)}
                        className="mt-3 ml-3 text-xs text-bc-primary hover:underline font-medium"
                      >
                        Show {hiddenCount} more event
                        {hiddenCount !== 1 ? "s" : ""}
                      </button>
                    )}
                    {showAll && items.length > 5 && (
                      <button
                        onClick={() => toggleShowAll(bucketName)}
                        className="mt-3 ml-3 text-xs text-bc-text-secondary hover:underline"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
