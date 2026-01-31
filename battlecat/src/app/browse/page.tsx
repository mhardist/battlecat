"use client";

import { useState, useMemo, useEffect } from "react";
import { MaturityLevel, Tutorial } from "@/types";
import { getAllTutorials as getSeedTutorials, getAllTopics as getSeedTopics } from "@/data/seed-tutorials";
import { TutorialCard } from "@/components/TutorialCard";
import { FilterBar } from "@/components/FilterBar";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useRatings } from "@/hooks/useRatings";

export default function BrowsePage() {
  const [selectedLevel, setSelectedLevel] = useState<MaturityLevel | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { toggle, isBookmarked } = useBookmarks();
  const { getRating } = useRatings();

  // Start with seed data, then fetch from API (includes Supabase tutorials)
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>(getSeedTutorials());
  const [allTopics, setAllTopics] = useState<string[]>(getSeedTopics());

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((data) => { if (data.tutorials) setAllTutorials(data.tutorials); })
      .catch(console.error);
    fetch("/api/tutorials?topics=true")
      .then((r) => r.json())
      .then((data) => { if (data.topics) setAllTopics(data.topics); })
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let result: Tutorial[] = allTutorials;

    if (selectedLevel !== null) {
      result = result.filter((t) => t.maturity_level === selectedLevel);
    }
    if (selectedRelation) {
      result = result.filter((t) => t.level_relation === selectedRelation);
    }
    if (selectedDifficulty) {
      result = result.filter((t) => t.difficulty === selectedDifficulty);
    }
    if (selectedTopic) {
      result = result.filter((t) => t.topics.includes(selectedTopic));
    }

    return result;
  }, [allTutorials, selectedLevel, selectedRelation, selectedDifficulty, selectedTopic]);

  const clearFilters = () => {
    setSelectedLevel(null);
    setSelectedRelation(null);
    setSelectedDifficulty(null);
    setSelectedTopic(null);
  };

  const hasFilters = selectedLevel !== null || selectedRelation !== null || selectedDifficulty !== null || selectedTopic !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Tutorials</h1>
          <p className="mt-1 text-bc-text-secondary">
            {filtered.length} tutorial{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " matching your filters" : ""}
          </p>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-bc-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <FilterBar
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        selectedRelation={selectedRelation}
        onSelectRelation={setSelectedRelation}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={setSelectedDifficulty}
      />

      {/* Topic Pills */}
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs font-medium text-bc-text-secondary">
          Topics:
        </span>
        {allTopics.map((topic) => (
          <button
            key={topic}
            onClick={() =>
              setSelectedTopic(selectedTopic === topic ? null : topic)
            }
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedTopic === topic
                ? "bg-bc-primary text-white"
                : "bg-bc-primary/10 text-bc-primary hover:bg-bc-primary/20"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              showBookmark
              isBookmarked={isBookmarked(tutorial.id)}
              onToggleBookmark={toggle}
              rating={getRating(tutorial.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No tutorials match your filters.{" "}
            <button
              onClick={clearFilters}
              className="text-bc-primary hover:underline"
            >
              Clear filters
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
