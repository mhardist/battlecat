"use client";

import { useAchievementContext } from "@/components/AchievementProvider";
import { useAchievements } from "@/hooks/useAchievements";
import {
  ALL_ACHIEVEMENTS,
  POWER_TIERS,
  getPowerTier,
  getNextTier,
  type AchievementCategory,
} from "@/config/achievements";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  reading: "Reading",
  completion: "Completion",
  submission: "Submissions",
  rating: "Ratings",
  "level-mastery": "Level Mastery",
  exploration: "Exploration",
  special: "Special",
};

const CATEGORY_ORDER: AchievementCategory[] = [
  "reading",
  "completion",
  "submission",
  "level-mastery",
  "rating",
  "exploration",
  "special",
];

export default function AchievementsPage() {
  const { totalPoints, unlockedCount } = useAchievementContext();
  const { isUnlocked, loaded } = useAchievements();

  const tier = getPowerTier(totalPoints);
  const nextTier = getNextTier(totalPoints);

  // Build external stats from localStorage for progress display
  // (We read localStorage hooks inline here for the progress bars)
  const progressToNext = nextTier
    ? ((totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100
    : 100;

  // Group achievements by category
  const grouped: Partial<Record<AchievementCategory, typeof ALL_ACHIEVEMENTS>> = {};
  for (const a of ALL_ACHIEVEMENTS) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category]!.push(a);
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-bc-text-secondary">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Achievements
        </h1>
        <p className="text-bc-text-secondary">
          The Sorceress of Castle Grayskull rewards those who seek knowledge
        </p>
      </div>

      {/* Power Tier card */}
      <div className="rounded-2xl border border-bc-border bg-bc-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-bc-text-secondary mb-1">
              Your Rank
            </p>
            <h2
              className="text-2xl font-bold"
              style={{ color: tier.color }}
            >
              {tier.name}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-xs text-bc-text-secondary">Points of Power</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-bc-text-secondary">
              <span>{tier.name}</span>
              <span>{nextTier.name} — {nextTier.minPoints} pts</span>
            </div>
            <div className="h-2.5 bg-bc-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressToNext}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-xl font-bold">{unlockedCount}</p>
            <p className="text-xs text-bc-text-secondary">Unlocked</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{ALL_ACHIEVEMENTS.length}</p>
            <p className="text-xs text-bc-text-secondary">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">
              {Math.round((unlockedCount / ALL_ACHIEVEMENTS.length) * 100)}%
            </p>
            <p className="text-xs text-bc-text-secondary">Complete</p>
          </div>
        </div>
      </div>

      {/* Power tier legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {POWER_TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border ${
              t.name === tier.name
                ? "border-current font-semibold"
                : "border-bc-border text-bc-text-secondary opacity-60"
            }`}
            style={t.name === tier.name ? { color: t.color, borderColor: t.color } : undefined}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            {t.name}
            <span className="opacity-60">{t.minPoints}+</span>
          </div>
        ))}
      </div>

      {/* Achievement grid by category */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;

        return (
          <section key={cat} className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {CATEGORY_LABELS[cat]}
              <span className="text-xs font-normal text-bc-text-secondary">
                {items.filter((a) => isUnlocked(a.id)).length}/{items.length}
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((achievement) => {
                const unlocked = isUnlocked(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-xl border p-4 transition-all ${
                      unlocked
                        ? "border-teal-700/40 bg-teal-950/10"
                        : "border-bc-border bg-bc-surface opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${unlocked ? "" : "grayscale opacity-50"}`}>
                            {unlocked ? "✦" : "○"}
                          </span>
                          <h4 className={`font-semibold text-sm leading-tight ${
                            unlocked ? "text-teal-300" : ""
                          }`}>
                            {achievement.name}
                          </h4>
                        </div>
                        <p className="text-xs text-bc-text-secondary">
                          {achievement.description}
                        </p>
                        {unlocked && (
                          <p className="text-[11px] italic text-teal-400/60 mt-1">
                            {achievement.title}
                          </p>
                        )}
                      </div>
                      {achievement.points > 0 && (
                        <div className={`shrink-0 text-right ${unlocked ? "text-amber-400" : "text-bc-text-secondary"}`}>
                          <p className="text-sm font-bold">+{achievement.points}</p>
                          <p className="text-[10px]">pts</p>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for locked achievements */}
                    {!unlocked && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-bc-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600/50 rounded-full transition-all"
                            style={{ width: "0%" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
