"use client";

import { useState } from "react";
import { formatToolDate } from "@/config/tools";
import type { LevelInfo } from "@/types";

export interface NewsItem {
  date: string;
  headline: string;
  teaser: string;
  toolName: string;
  level: number;
  url?: string;
}

interface HotNewsProps {
  items: NewsItem[];
  levels: LevelInfo[];
}

const INITIAL_COUNT = 3;
const EXPANDED_COUNT = 8;

export function HotNews({ items, levels }: HotNewsProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items.slice(0, EXPANDED_COUNT) : items.slice(0, INITIAL_COUNT);
  const hasMore = items.length > INITIAL_COUNT && !expanded;
  const canCollapse = expanded && items.length > INITIAL_COUNT;

  const getLevelColor = (level: number) => levels[level]?.color || "#9CA3AF";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visible.map((item, i) => (
          <div
            key={`${item.date}-${item.toolName}-${i}`}
            className="group rounded-xl border border-bc-border bg-bc-surface p-4 transition-all hover:shadow-md hover:border-bc-primary/30"
          >
            <div className="flex items-start gap-3">
              {/* Level dot */}
              <div className="mt-1.5 shrink-0">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: getLevelColor(item.level) }}
                />
              </div>

              <div className="min-w-0 flex-1">
                {/* Top row: date + tool + level */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-bc-text-secondary">
                    {formatToolDate(item.date)}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: getLevelColor(item.level) }}
                  >
                    L{item.level}
                  </span>
                  <span className="text-xs font-semibold text-bc-primary">
                    {item.toolName}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="font-semibold text-sm leading-snug">
                  {item.headline}
                </h3>

                {/* Teaser */}
                <p className="mt-1 text-xs text-bc-text-secondary leading-relaxed line-clamp-2">
                  {item.teaser}
                </p>

                {/* Link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-bc-primary hover:underline"
                  >
                    Learn more &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand / Collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-2.5 text-sm font-medium text-bc-primary hover:bg-bc-primary/5 transition-colors"
        >
          Show {Math.min(items.length - INITIAL_COUNT, EXPANDED_COUNT - INITIAL_COUNT)} more stories
        </button>
      )}
      {canCollapse && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-2.5 text-sm font-medium text-bc-text-secondary hover:text-bc-primary transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}
