"use client";

import { useState, useTransition } from "react";

/**
 * Moss Man SVG icon — the He-Man character covered in moss and leaves.
 * Used as a visual indicator for stale/outdated tutorials.
 */
function MossManIcon({ size = 32, active = false }: { size?: number; active?: boolean }) {
  const moss = active ? "#2E7D32" : "#6B7280";
  const mossLight = active ? "#66BB6A" : "#9CA3AF";
  const mossDark = active ? "#1B5E20" : "#4B5563";
  const bark = active ? "#5D4037" : "#6B7280";
  const eyes = active ? "#FDD835" : "#9CA3AF";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body — mossy torso */}
      <ellipse cx="32" cy="42" rx="14" ry="18" fill={moss} />
      {/* Leaf/moss texture patches */}
      <ellipse cx="24" cy="38" rx="4" ry="3" fill={mossLight} opacity={0.7} />
      <ellipse cx="38" cy="44" rx="3" ry="4" fill={mossLight} opacity={0.6} />
      <ellipse cx="30" cy="50" rx="5" ry="2" fill={mossDark} opacity={0.5} />

      {/* Head */}
      <circle cx="32" cy="20" r="12" fill={moss} />
      {/* Mossy crown / leaves on top */}
      <path d="M20 18q4-10 8-6q2-8 6-4q4-6 8 0q2-4 4 2" stroke={mossLight} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="26" cy="12" rx="3" ry="4" fill={mossLight} opacity={0.8} />
      <ellipse cx="38" cy="14" rx="3" ry="3" fill={mossLight} opacity={0.7} />

      {/* Eyes — glowing yellow when active */}
      <circle cx="27" cy="20" r="2.5" fill={eyes} />
      <circle cx="37" cy="20" r="2.5" fill={eyes} />
      {active && (
        <>
          <circle cx="27" cy="20" r="1" fill="#F57F17" />
          <circle cx="37" cy="20" r="1" fill="#F57F17" />
        </>
      )}

      {/* Mouth — bark-like */}
      <path d="M28 26q4 2 8 0" stroke={bark} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Arms — woody/mossy */}
      <path d="M18 35q-6-2-8 4" stroke={bark} strokeWidth="3" strokeLinecap="round" />
      <path d="M46 35q6-2 8 4" stroke={bark} strokeWidth="3" strokeLinecap="round" />

      {/* Leaf details on arms */}
      <ellipse cx="12" cy="37" rx="3" ry="2" fill={mossLight} opacity={0.6} />
      <ellipse cx="52" cy="37" rx="3" ry="2" fill={mossLight} opacity={0.6} />

      {/* Legs — bark/trunk */}
      <path d="M26 58v4" stroke={bark} strokeWidth="4" strokeLinecap="round" />
      <path d="M38 58v4" stroke={bark} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface MossManBadgeProps {
  tutorialId: string;
  isStale: boolean;
  /** If true, the badge is clickable and toggles stale status via API */
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onToggle?: (newStale: boolean) => void;
}

/**
 * Moss Man badge — shows when a tutorial is stale/outdated.
 * When interactive, clicking toggles the stale status in the database.
 */
export function MossManBadge({
  tutorialId,
  isStale,
  interactive = false,
  size = "sm",
  onToggle,
}: MossManBadgeProps) {
  const [stale, setStale] = useState(isStale);
  const [isPending, startTransition] = useTransition();

  const iconSize = size === "lg" ? 40 : size === "md" ? 28 : 20;

  async function toggleStale() {
    if (!interactive) return;

    const newStale = !stale;
    setStale(newStale);
    onToggle?.(newStale);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tutorials/${tutorialId}/stale`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_stale: newStale }),
        });

        if (!res.ok) {
          // Revert on failure
          setStale(!newStale);
          onToggle?.(!newStale);
          console.error("Failed to toggle stale status");
        }
      } catch {
        setStale(!newStale);
        onToggle?.(!newStale);
        console.error("Failed to toggle stale status");
      }
    });
  }

  if (!interactive && !stale) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleStale();
      }}
      disabled={!interactive || isPending}
      className={`
        inline-flex items-center gap-1.5 rounded-full transition-all
        ${stale
          ? "bg-green-900/20 border border-green-700/40 text-green-400"
          : interactive
            ? "bg-bc-surface border border-bc-border text-bc-text-secondary hover:border-green-700/40 hover:text-green-400"
            : ""
        }
        ${size === "lg" ? "px-3 py-1.5" : size === "md" ? "px-2.5 py-1" : "px-2 py-0.5"}
        ${interactive ? "cursor-pointer hover:scale-105" : "cursor-default"}
        ${isPending ? "opacity-60" : ""}
      `}
      title={stale ? "Marked as outdated (click to remove)" : "Mark as outdated"}
    >
      <MossManIcon size={iconSize} active={stale} />
      {size !== "sm" && (
        <span className={`font-medium ${size === "lg" ? "text-sm" : "text-xs"}`}>
          {stale ? "Overgrown" : "Mark stale"}
        </span>
      )}
    </button>
  );
}

/**
 * Stale overlay banner for tutorial cards.
 * Shows a semi-transparent green moss overlay when a tutorial is stale.
 */
export function StaleOverlay() {
  return (
    <div className="absolute inset-0 bg-green-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
      <div className="flex items-center gap-2 bg-green-900/80 rounded-full px-4 py-2 border border-green-700/50">
        <MossManIcon size={24} active />
        <span className="text-sm font-semibold text-green-300">Outdated</span>
      </div>
    </div>
  );
}
