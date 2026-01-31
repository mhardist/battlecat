"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllLevels, TRANSITIONS } from "@/config/levels";
import { MaturityLevel, Tutorial } from "@/types";
import { getTutorialsByLevel as getSeedByLevel, getLevelUpTutorials as getSeedLevelUp } from "@/data/seed-tutorials";
import { TutorialCard } from "@/components/TutorialCard";
import { useBookmarks } from "@/hooks/useBookmarks";

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  0: "You ask questions and get answers. No memory, no context.",
  1: "AI knows who you are and adapts to your situation.",
  2: "You describe what you want, AI builds it.",
  3: "AI works autonomously. You supervise outcomes, not keystrokes.",
  4: "You design systems of agents. The org chart includes AI.",
};

export default function LevelUpPage() {
  const [currentLevel, setCurrentLevel] = useState<MaturityLevel>(0);
  const levels = getAllLevels();
  const { toggle, isBookmarked } = useBookmarks();

  const transition = TRANSITIONS.find((t) => t.from === currentLevel);
  const nextLevel = currentLevel < 4 ? (currentLevel + 1) as MaturityLevel : null;

  // Start with seed data, fetch from API on mount
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>([]);

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((data) => { if (data.tutorials) setAllTutorials(data.tutorials); })
      .catch(console.error);
  }, []);

  const levelUpContent = allTutorials.length > 0
    ? allTutorials.filter((t) => t.level_relation === "level-up" && t.maturity_level === currentLevel)
    : getSeedLevelUp(currentLevel);
  const practiceContent = allTutorials.length > 0
    ? allTutorials.filter((t) => t.maturity_level === currentLevel && t.level_relation === "level-practice")
    : getSeedByLevel(currentLevel).filter((t) => t.level_relation === "level-practice");

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">
          Level Up{" "}
          <span className="text-bc-secondary">Your AI Skills</span>
        </h1>
        <p className="text-bc-text-secondary">
          Select where you are today. We&apos;ll show you what to learn next.
        </p>
      </section>

      {/* Level Selector */}
      <section>
        <p className="mb-3 text-sm font-medium text-bc-text-secondary">
          I&apos;m currently at:
        </p>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level.level}
              onClick={() => setCurrentLevel(level.level)}
              className="rounded-lg px-4 py-3 text-left transition-all"
              style={
                currentLevel === level.level
                  ? {
                      backgroundColor: level.color,
                      color: "white",
                      boxShadow: `0 4px 14px ${level.color}40`,
                    }
                  : {
                      border: `2px solid ${level.color}30`,
                      color: level.color,
                    }
              }
            >
              <div className="text-sm font-bold">L{level.level}</div>
              <div className="text-xs opacity-80">{level.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Current Level Summary */}
      <section
        className="rounded-xl border-l-4 bg-bc-surface p-6"
        style={{ borderLeftColor: levels[currentLevel].color }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-3xl font-bold"
            style={{ color: levels[currentLevel].color }}
          >
            L{currentLevel}
          </span>
          <h2 className="text-xl font-bold">
            You: {levels[currentLevel].you_role} &rarr; AI:{" "}
            {levels[currentLevel].ai_role}
          </h2>
        </div>
        <p className="mt-2 text-bc-text-secondary">
          {LEVEL_DESCRIPTIONS[currentLevel]}
        </p>
      </section>

      {/* What It Takes to Level Up */}
      {transition && nextLevel !== null && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">
            To Reach{" "}
            <span style={{ color: levels[nextLevel].color }}>
              L{nextLevel} ({levels[nextLevel].name})
            </span>
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-bc-border bg-bc-surface p-5">
              <div className="text-sm font-medium text-bc-text-secondary">
                You&apos;ll give up
              </div>
              <div className="mt-1 text-lg font-semibold text-red-500">
                {transition.give_up}
              </div>
              <p className="mt-2 text-sm text-bc-text-secondary">
                {currentLevel === 0 &&
                  "You'll stop being anonymous. The AI needs to know who you are."}
                {currentLevel === 1 &&
                  "You'll stop doing everything yourself. Let AI build for you."}
                {currentLevel === 2 &&
                  "You'll stop directing every step. Let AI figure out the how."}
                {currentLevel === 3 &&
                  "You'll stop supervising individual agents. Design the system instead."}
              </p>
            </div>
            <div className="rounded-lg border border-bc-border bg-bc-surface p-5">
              <div className="text-sm font-medium text-bc-text-secondary">
                You&apos;ll invest
              </div>
              <div className="mt-1 text-lg font-semibold text-bc-primary">
                {transition.invest}
              </div>
              <p className="mt-2 text-sm text-bc-text-secondary">
                {currentLevel === 0 &&
                  "Time upfront to teach the AI your context, preferences, and constraints."}
                {currentLevel === 1 &&
                  "Clarity on what you want built — clear specs, clear outcomes."}
                {currentLevel === 2 &&
                  "Trust. Willingness to let an agent make decisions and ship code."}
                {currentLevel === 3 &&
                  "Systems thinking. The ability to decompose complex problems into agent-sized pieces."}
              </p>
            </div>
          </div>

          {(currentLevel === 2 || currentLevel === 3) && (
            <div className="rounded-lg border-2 border-bc-secondary/30 bg-bc-secondary/5 p-5">
              <h3 className="font-bold text-bc-secondary">
                {currentLevel === 2
                  ? "The Technical Cliff"
                  : "The Gate"}
              </h3>
              <p className="mt-1 text-sm text-bc-text-secondary">
                {currentLevel === 2
                  ? "The L2 → L3 transition is the hardest. Prototyping tools can't ship production code. You need to understand security, authentication, data integrity, and error handling — even if an AI agent does the actual work."
                  : "L3 → L4 is gated. You can't orchestrate agents you don't trust. Master security (auth, encryption, access control), reliability (testing, monitoring, rollback), and systems thinking (architecture, scaling, integration) first."}
              </p>
            </div>
          )}
        </section>
      )}

      {currentLevel === 4 && (
        <section className="rounded-xl border border-bc-secondary bg-bc-secondary/5 p-6 text-center">
          <div className="text-3xl">&#x1F451;</div>
          <h2 className="mt-2 text-xl font-bold text-bc-secondary">
            You&apos;re at the top
          </h2>
          <p className="mt-1 text-bc-text-secondary">
            L4 Architect — you design AI organizations. Keep deepening your
            orchestration skills with the tutorials below.
          </p>
        </section>
      )}

      {/* Level-Up Tutorials */}
      {levelUpContent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            Level-Up Tutorials{" "}
            <span className="text-sm font-normal text-bc-text-secondary">
              (teach you to reach L{currentLevel + 1})
            </span>
          </h2>
          <div className="grid gap-3">
            {levelUpContent.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                showBookmark
                isBookmarked={isBookmarked(tutorial.id)}
                onToggleBookmark={toggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Practice at Current Level */}
      {practiceContent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            Deepen Your L{currentLevel} Skills
          </h2>
          <div className="grid gap-3">
            {practiceContent.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                showBookmark
                isBookmarked={isBookmarked(tutorial.id)}
                onToggleBookmark={toggle}
              />
            ))}
          </div>
        </section>
      )}

      {levelUpContent.length === 0 && practiceContent.length === 0 && (
        <section className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No L{currentLevel} tutorials yet. Forward some content about{" "}
            {levels[currentLevel].tools.join(", ")} to populate this view.
          </p>
        </section>
      )}

      {/* Quick link */}
      <div className="text-center">
        <Link
          href={`/levels/${currentLevel}`}
          className="text-sm text-bc-primary hover:underline"
        >
          View all L{currentLevel} details &rarr;
        </Link>
      </div>
    </div>
  );
}
