"use client";

import { useState } from "react";

interface OrkoIconProps {
  filled: boolean;
  hovered: boolean;
  size?: number;
}

/**
 * Orko character icon — the He-Man wizard.
 * Red pointed hat, purple scarf, blue skin, red robe with "O".
 */
function OrkoIcon({ filled, hovered, size = 32 }: OrkoIconProps) {
  const opacity = filled ? 1 : hovered ? 0.6 : 0.2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      fill="none"
      style={{ opacity, transition: "opacity 150ms, transform 150ms", transform: hovered ? "scale(1.15)" : "scale(1)" }}
    >
      {/* Hat — tall red pointed wizard hat */}
      <path
        d="M32 0L18 30h28L32 0z"
        fill={filled || hovered ? "#E53935" : "#9CA3AF"}
      />
      {/* Hat brim */}
      <ellipse
        cx="32" cy="30" rx="16" ry="4"
        fill={filled || hovered ? "#C62828" : "#6B7280"}
      />
      {/* Face — dark area under hat */}
      <ellipse
        cx="32" cy="36" rx="10" ry="6"
        fill={filled || hovered ? "#1a1a2e" : "#4B5563"}
      />
      {/* Eyes — yellow */}
      <circle cx="28" cy="35" r="2" fill={filled || hovered ? "#FDD835" : "#9CA3AF"} />
      <circle cx="36" cy="35" r="2" fill={filled || hovered ? "#FDD835" : "#9CA3AF"} />
      {/* Scarf / bandana — purple */}
      <path
        d="M22 38q10 6 20 0v4q-10 6-20 0z"
        fill={filled || hovered ? "#9C27B0" : "#6B7280"}
      />
      {/* Body / robe — red */}
      <path
        d="M22 42q0 20 10 28q10-8 10-28z"
        fill={filled || hovered ? "#E53935" : "#9CA3AF"}
      />
      {/* "O" on robe */}
      <ellipse
        cx="32" cy="55" rx="5" ry="6"
        fill="none"
        stroke={filled || hovered ? "#1a1a2e" : "#6B7280"}
        strokeWidth="2"
      />
      {/* Left arm — blue */}
      <path
        d="M22 44q-8 4-10 12q2 1 4 0q2-6 8-8z"
        fill={filled || hovered ? "#4FC3F7" : "#9CA3AF"}
      />
      {/* Right arm — blue */}
      <path
        d="M42 44q8 4 10 12q-2 1-4 0q-2-6-8-8z"
        fill={filled || hovered ? "#4FC3F7" : "#9CA3AF"}
      />
    </svg>
  );
}

interface OrkoRatingProps {
  tutorialId: string;
  rating: number;
  onRate: (tutorialId: string, rating: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

export function OrkoRating({
  tutorialId,
  rating,
  onRate,
  size = "md",
  readOnly = false,
}: OrkoRatingProps) {
  const [hoverIndex, setHoverIndex] = useState<number>(0);

  const iconSize = size === "sm" ? 20 : size === "lg" ? 40 : 32;

  const handleClick = (index: number) => {
    if (readOnly) return;
    // Clicking the same rating toggles it off
    const newRating = rating === index ? 0 : index;
    onRate(tutorialId, newRating);
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          disabled={readOnly}
          onClick={() => handleClick(index)}
          onMouseEnter={() => !readOnly && setHoverIndex(index)}
          onMouseLeave={() => !readOnly && setHoverIndex(0)}
          className={`p-0.5 ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          aria-label={`Rate ${index} out of 5 Orkos`}
        >
          <OrkoIcon
            filled={index <= rating}
            hovered={hoverIndex > 0 && index <= hoverIndex}
            size={iconSize}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-bc-text-secondary">
          {rating}/5 Orko{rating !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
