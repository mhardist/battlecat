/**
 * Achievement definitions for the Battlecat AI reward system.
 *
 * The Sorceress of Castle Grayskull guides learners through their journey,
 * appearing to celebrate milestones and encourage progress.
 *
 * Achievements track: reads, completions, submissions, ratings, level mastery,
 * bookmarks, quiz completion, and cross-level exploration.
 */

export type AchievementCategory =
  | "reading"
  | "completion"
  | "submission"
  | "rating"
  | "level-mastery"
  | "exploration"
  | "special";

export interface Achievement {
  id: string;
  name: string;
  /** He-Man themed subtitle */
  title: string;
  description: string;
  /** Points of Power awarded */
  points: number;
  category: AchievementCategory;
  /** The Sorceress's congratulatory message when this is unlocked */
  sorceressMessage: string;
  /** Threshold check — returns true if the achievement should unlock */
  check: (stats: UserStats) => boolean;
  /** For progress bars: how close the user is (0–1) */
  progress: (stats: UserStats) => number;
}

export interface UserStats {
  /** Total unique tutorials read (visited detail page) */
  reads: number;
  /** Tutorials marked as completed */
  completions: number;
  /** Links submitted through the submit page */
  submissions: number;
  /** Tutorials rated with Orkos */
  ratingsGiven: number;
  /** Tutorials bookmarked */
  bookmarksCount: number;
  /** Quiz completed */
  quizCompleted: boolean;
  /** Per-level read counts */
  levelReads: Record<number, number>;
  /** Per-level completion counts */
  levelCompletions: Record<number, number>;
  /** Unique levels that have at least 1 read */
  levelsExplored: number;
}

// ─── Reading Achievements ────────────────────────────────────────────────────

const READING_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-read",
    name: "The Call to Adventure",
    title: "Initiate of Grayskull",
    description: "Read your first tutorial",
    points: 10,
    category: "reading",
    sorceressMessage:
      "Welcome, brave learner. You have taken your first step into the halls of knowledge. Castle Grayskull opens its doors to those who seek wisdom.",
    check: (s) => s.reads >= 1,
    progress: (s) => Math.min(1, s.reads / 1),
  },
  {
    id: "bookworm",
    name: "Scholar of Eternia",
    title: "Scholar",
    description: "Read 5 tutorials",
    points: 25,
    category: "reading",
    sorceressMessage:
      "Your thirst for knowledge grows stronger. The ancient texts of Eternia reveal their secrets to the dedicated. Keep reading — wisdom is the greatest power.",
    check: (s) => s.reads >= 5,
    progress: (s) => Math.min(1, s.reads / 5),
  },
  {
    id: "sage",
    name: "Sage of the Crystal Sea",
    title: "Sage",
    description: "Read 15 tutorials",
    points: 60,
    category: "reading",
    sorceressMessage:
      "Fifteen scrolls of knowledge now rest in your mind. Like the Crystal Sea that reflects all truths, your understanding deepens with each tutorial.",
    check: (s) => s.reads >= 15,
    progress: (s) => Math.min(1, s.reads / 15),
  },
  {
    id: "loremaster",
    name: "Loremaster of Grayskull",
    title: "Loremaster",
    description: "Read 30 tutorials",
    points: 100,
    category: "reading",
    sorceressMessage:
      "You have absorbed more knowledge than most who walk these halls. The Loremaster title is bestowed only upon the most devoted seekers of wisdom.",
    check: (s) => s.reads >= 30,
    progress: (s) => Math.min(1, s.reads / 30),
  },
];

// ─── Completion Achievements ─────────────────────────────────────────────────

const COMPLETION_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-complete",
    name: "First Victory",
    title: "Apprentice Warrior",
    description: "Complete your first tutorial",
    points: 15,
    category: "completion",
    sorceressMessage:
      "You have not merely read — you have done. Action is the bridge between knowledge and power. Your first victory is won!",
    check: (s) => s.completions >= 1,
    progress: (s) => Math.min(1, s.completions / 1),
  },
  {
    id: "warrior",
    name: "Warrior of Light",
    title: "Warrior",
    description: "Complete 5 tutorials",
    points: 40,
    category: "completion",
    sorceressMessage:
      "Five battles fought, five lessons learned. You wield knowledge like He-Man wields the Sword of Power. The forces of ignorance retreat before you!",
    check: (s) => s.completions >= 5,
    progress: (s) => Math.min(1, s.completions / 5),
  },
  {
    id: "champion",
    name: "Champion of Eternia",
    title: "Champion",
    description: "Complete 10 tutorials",
    points: 75,
    category: "completion",
    sorceressMessage:
      "Ten trials conquered! You stand among the champions of Eternia. The power within you grows with every skill you master.",
    check: (s) => s.completions >= 10,
    progress: (s) => Math.min(1, s.completions / 10),
  },
  {
    id: "legend",
    name: "Legend of Grayskull",
    title: "Legend",
    description: "Complete 25 tutorials",
    points: 150,
    category: "completion",
    sorceressMessage:
      "Your name shall be etched into the walls of Castle Grayskull itself. Twenty-five tutorials mastered — you are a Legend of this realm!",
    check: (s) => s.completions >= 25,
    progress: (s) => Math.min(1, s.completions / 25),
  },
];

// ─── Submission Achievements ─────────────────────────────────────────────────

const SUBMISSION_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-submit",
    name: "The Offering",
    title: "Seeker",
    description: "Submit your first link",
    points: 20,
    category: "submission",
    sorceressMessage:
      "You bring new knowledge to the halls of Grayskull! By sharing what you find, you strengthen the foundation for all learners.",
    check: (s) => s.submissions >= 1,
    progress: (s) => Math.min(1, s.submissions / 1),
  },
  {
    id: "contributor",
    name: "Curator of Knowledge",
    title: "Curator",
    description: "Submit 3 links",
    points: 40,
    category: "submission",
    sorceressMessage:
      "Three offerings! You do not merely learn — you help build the library. The Curator's role is sacred in Castle Grayskull.",
    check: (s) => s.submissions >= 3,
    progress: (s) => Math.min(1, s.submissions / 3),
  },
  {
    id: "herald",
    name: "Herald of Discovery",
    title: "Herald",
    description: "Submit 10 links",
    points: 80,
    category: "submission",
    sorceressMessage:
      "Ten discoveries brought to our gates! You are a Herald, spreading knowledge across Eternia. The realm grows stronger through your contributions.",
    check: (s) => s.submissions >= 10,
    progress: (s) => Math.min(1, s.submissions / 10),
  },
];

// ─── Rating Achievements ─────────────────────────────────────────────────────

const RATING_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-rate",
    name: "Orko's Friend",
    title: "Orko's Companion",
    description: "Rate your first tutorial",
    points: 10,
    category: "rating",
    sorceressMessage:
      "Orko is delighted! Your feedback helps fellow learners find the best content. Even the smallest magic makes a difference.",
    check: (s) => s.ratingsGiven >= 1,
    progress: (s) => Math.min(1, s.ratingsGiven / 1),
  },
  {
    id: "critic",
    name: "Orko's Confidant",
    title: "Trusted Reviewer",
    description: "Rate 5 tutorials",
    points: 30,
    category: "rating",
    sorceressMessage:
      "Five ratings shared! Orko trusts your judgment completely now. Your reviews light the way for others on their learning journey.",
    check: (s) => s.ratingsGiven >= 5,
    progress: (s) => Math.min(1, s.ratingsGiven / 5),
  },
];

// ─── Level Mastery Achievements ──────────────────────────────────────────────

function levelMastery(level: number, name: string, title: string): Achievement {
  const levelNames = ["Curious", "Capable", "Creative", "Strategic", "Visionary"];
  return {
    id: `l${level}-master`,
    name,
    title,
    description: `Complete 5 tutorials at Level ${level} (${levelNames[level]})`,
    points: 50 + level * 15,
    category: "level-mastery",
    sorceressMessage: `You have achieved mastery at Level ${level}! The ${levelNames[level]} path is now fully illuminated. The power of that knowledge is forever yours.`,
    check: (s) => (s.levelCompletions[level] || 0) >= 5,
    progress: (s) => Math.min(1, (s.levelCompletions[level] || 0) / 5),
  };
}

const LEVEL_MASTERY_ACHIEVEMENTS: Achievement[] = [
  levelMastery(0, "The Awakening", "L0 Master"),
  levelMastery(1, "Tools of Power", "L1 Master"),
  levelMastery(2, "The Builder's Way", "L2 Master"),
  levelMastery(3, "Architect's Vision", "L3 Master"),
  levelMastery(4, "Eternian Sovereign", "L4 Master"),
];

// ─── Exploration & Special Achievements ──────────────────────────────────────

const SPECIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "explorer",
    name: "Explorer of All Realms",
    title: "Realm Walker",
    description: "Read a tutorial from every maturity level",
    points: 60,
    category: "exploration",
    sorceressMessage:
      "You have ventured into every realm of knowledge — from the first spark of curiosity to the heights of strategic vision. Few achieve such breadth!",
    check: (s) => s.levelsExplored >= 5,
    progress: (s) => Math.min(1, s.levelsExplored / 5),
  },
  {
    id: "quiz-complete",
    name: "Know Thyself",
    title: "Self-Aware",
    description: "Complete the AI Maturity quiz",
    points: 20,
    category: "special",
    sorceressMessage:
      "Understanding yourself is the first step to growth. The quiz has revealed your current power level — now you know which path to walk.",
    check: (s) => s.quizCompleted,
    progress: (s) => (s.quizCompleted ? 1 : 0),
  },
  {
    id: "collector",
    name: "Keeper of the Library",
    title: "Collector",
    description: "Bookmark 10 tutorials",
    points: 25,
    category: "special",
    sorceressMessage:
      "Your personal library grows! A true keeper of knowledge curates wisely. These bookmarks are your treasure map through Eternia.",
    check: (s) => s.bookmarksCount >= 10,
    progress: (s) => Math.min(1, s.bookmarksCount / 10),
  },
  {
    id: "master-of-universe",
    name: "Master of the Universe",
    title: "Master of the Universe",
    description: "Earn 500 Points of Power",
    points: 0, // Meta-achievement, no extra points
    category: "special",
    sorceressMessage:
      "BY THE POWER OF GRAYSKULL! You have proven yourself worthy. You are now a MASTER OF THE UNIVERSE! The Sorceress bows before your dedication. Go forth and transform the world with the knowledge you carry!",
    check: () => false, // Special: checked against total points
    progress: () => 0, // Special: calculated from total points
  },
];

// ─── All achievements ────────────────────────────────────────────────────────

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...READING_ACHIEVEMENTS,
  ...COMPLETION_ACHIEVEMENTS,
  ...SUBMISSION_ACHIEVEMENTS,
  ...RATING_ACHIEVEMENTS,
  ...LEVEL_MASTERY_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
];

/** Total possible points (excluding "Master of the Universe" which is 0) */
export const MAX_POINTS = ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);

// ─── Power Level Tiers ───────────────────────────────────────────────────────

export interface PowerTier {
  name: string;
  minPoints: number;
  color: string;
}

export const POWER_TIERS: PowerTier[] = [
  { name: "Apprentice", minPoints: 0, color: "#6B7280" },
  { name: "Guardian", minPoints: 75, color: "#3B82F6" },
  { name: "Defender", minPoints: 200, color: "#8B5CF6" },
  { name: "Heroic Warrior", minPoints: 400, color: "#F59E0B" },
  { name: "Master of the Universe", minPoints: 600, color: "#EF4444" },
];

export function getPowerTier(points: number): PowerTier {
  for (let i = POWER_TIERS.length - 1; i >= 0; i--) {
    if (points >= POWER_TIERS[i].minPoints) return POWER_TIERS[i];
  }
  return POWER_TIERS[0];
}

export function getNextTier(points: number): PowerTier | null {
  const current = getPowerTier(points);
  const idx = POWER_TIERS.indexOf(current);
  return idx < POWER_TIERS.length - 1 ? POWER_TIERS[idx + 1] : null;
}
