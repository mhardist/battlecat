import Link from "next/link";
import { MaturityLevel } from "@/types";
import { getLevel } from "@/config/levels";

interface LevelBadgeProps {
  level: MaturityLevel;
  relation?: "level-up" | "level-practice" | "cross-level";
  size?: "sm" | "md";
}

export function LevelBadge({ level, relation, size = "sm" }: LevelBadgeProps) {
  const info = getLevel(level);
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className="inline-flex items-center gap-1.5">
      <Link
        href={`/levels/${level}`}
        className={`rounded-full font-bold text-white ${sizeClasses}`}
        style={{ backgroundColor: info.color }}
      >
        L{level} {info.name}
      </Link>
      {relation && (
        <span className="rounded-full border border-bc-border px-2 py-0.5 text-xs text-bc-text-secondary">
          {relation === "level-up"
            ? "Level Up"
            : relation === "level-practice"
              ? "Practice"
              : "Cross-Level"}
        </span>
      )}
    </span>
  );
}
