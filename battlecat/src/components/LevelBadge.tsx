import Link from "next/link";
import { MaturityLevel } from "@/types";
import { getLevel } from "@/config/levels";

interface LevelBadgeProps {
  level: MaturityLevel;
  relation?: "level-up" | "level-practice" | "cross-level";
  size?: "sm" | "md";
  /** Set to false when rendered inside a Link to avoid nested <a> tags */
  linked?: boolean;
}

export function LevelBadge({ level, relation, size = "sm", linked = true }: LevelBadgeProps) {
  const info = getLevel(level);
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const className = `rounded-full font-bold text-white ${sizeClasses}`;

  return (
    <span className="inline-flex items-center gap-1.5">
      {linked ? (
        <Link
          href={`/levels/${level}`}
          className={className}
          style={{ backgroundColor: info.color }}
        >
          L{level} {info.name}
        </Link>
      ) : (
        <span
          className={className}
          style={{ backgroundColor: info.color }}
        >
          L{level} {info.name}
        </span>
      )}
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
