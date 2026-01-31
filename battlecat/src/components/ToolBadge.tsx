import { getToolIcon, DEFAULT_TOOL_ICON } from "@/config/tool-icons";

interface ToolBadgeProps {
  tool: string;
  size?: "sm" | "md";
}

export function ToolBadge({ tool, size = "sm" }: ToolBadgeProps) {
  const icon = getToolIcon(tool) || DEFAULT_TOOL_ICON;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-bc-border px-2 py-0.5 text-xs text-bc-text-secondary">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <path d={icon.icon} fill={icon.color} fillRule="evenodd" clipRule="evenodd" />
      </svg>
      {tool}
    </span>
  );
}
