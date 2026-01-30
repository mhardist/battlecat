"use client";

import { MaturityLevel } from "@/types";

interface FilterBarProps {
  selectedLevel: MaturityLevel | null;
  onSelectLevel: (level: MaturityLevel | null) => void;
  selectedRelation: string | null;
  onSelectRelation: (relation: string | null) => void;
  selectedDifficulty: string | null;
  onSelectDifficulty: (difficulty: string | null) => void;
}

const LEVELS: MaturityLevel[] = [0, 1, 2, 3, 4];

const LEVEL_NAMES: Record<number, string> = {
  0: "L0 Asker",
  1: "L1 Instructor",
  2: "L2 Designer",
  3: "L3 Supervisor",
  4: "L4 Architect",
};

const LEVEL_COLORS: Record<number, string> = {
  0: "#9CA3AF",
  1: "#14B8A6",
  2: "#22C55E",
  3: "#F59E0B",
  4: "#D4960A",
};

const RELATIONS = [
  { value: "level-up", label: "Level Up" },
  { value: "level-practice", label: "Practice" },
  { value: "cross-level", label: "Cross-Level" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export function FilterBar({
  selectedLevel,
  onSelectLevel,
  selectedRelation,
  onSelectRelation,
  selectedDifficulty,
  onSelectDifficulty,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Level Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectLevel(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selectedLevel === null
              ? "bg-bc-primary text-white"
              : "border border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
          }`}
        >
          All Levels
        </button>
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() =>
              onSelectLevel(selectedLevel === level ? null : level)
            }
            className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={
              selectedLevel === level
                ? { backgroundColor: LEVEL_COLORS[level], color: "white" }
                : {
                    border: `1px solid ${LEVEL_COLORS[level]}40`,
                    color: LEVEL_COLORS[level],
                  }
            }
          >
            {LEVEL_NAMES[level]}
          </button>
        ))}
      </div>

      {/* Relation + Difficulty Filters */}
      <div className="flex flex-wrap gap-2">
        {RELATIONS.map((r) => (
          <button
            key={r.value}
            onClick={() =>
              onSelectRelation(selectedRelation === r.value ? null : r.value)
            }
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedRelation === r.value
                ? "bg-bc-secondary text-white"
                : "border border-bc-border text-bc-text-secondary hover:border-bc-secondary hover:text-bc-secondary"
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="mx-1 self-center text-bc-border">|</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() =>
              onSelectDifficulty(selectedDifficulty === d ? null : d)
            }
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
              selectedDifficulty === d
                ? "bg-bc-primary-dark text-white"
                : "border border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
