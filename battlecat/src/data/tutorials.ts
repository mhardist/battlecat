import { Tutorial } from "@/types";
import { SEED_TUTORIALS, withDevAudio } from "./seed-tutorials";

/**
 * Data access layer that reads from Supabase, falling back to seed data.
 * Server-side only — used by pages and API routes.
 */

async function getSupabase() {
  try {
    const { createServerClient } = await import("@/lib/supabase");
    return createServerClient();
  } catch {
    return null;
  }
}

/** Fetch all published tutorials from Supabase + seed data */
export async function getAllTutorials(): Promise<Tutorial[]> {
  const supabase = await getSupabase();
  let dbTutorials: Tutorial[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        dbTutorials = data as Tutorial[];
      }
    } catch (err) {
      console.error("Failed to fetch tutorials from Supabase:", err);
    }
  }

  // Merge: DB tutorials first, then seed tutorials that don't conflict
  const dbSlugs = new Set(dbTutorials.map((t) => t.slug));
  const seedOnly = withDevAudio(
    SEED_TUTORIALS.filter((t) => !dbSlugs.has(t.slug))
  );

  return [...dbTutorials, ...seedOnly].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/** Fetch tutorials flagged as hot news, most recent first */
export async function getHotNewsTutorials(): Promise<Tutorial[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("is_published", true)
      .eq("is_hot_news", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      return data as Tutorial[];
    }
  } catch (err) {
    console.error("Failed to fetch hot news tutorials:", err);
  }

  return [];
}

/** Fetch tutorials by maturity level */
export async function getTutorialsByLevel(level: number): Promise<Tutorial[]> {
  const all = await getAllTutorials();
  return all.filter((t) => t.maturity_level === level);
}

/** Fetch a single tutorial by slug */
export async function getTutorialBySlug(slug: string): Promise<Tutorial | undefined> {
  // Try Supabase first for fresh data
  const supabase = await getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!error && data) {
        return data as Tutorial;
      }
    } catch {
      // fall through to seed
    }
  }

  // Fallback to seed data (with dev audio URL injected in non-production)
  const seed = SEED_TUTORIALS.find((t) => t.slug === slug);
  if (!seed) return undefined;
  return withDevAudio([seed])[0];
}

/** Fetch level-up tutorials from a given level */
export async function getLevelUpTutorials(fromLevel: number): Promise<Tutorial[]> {
  const all = await getAllTutorials();
  return all.filter(
    (t) => t.level_relation === "level-up" && t.maturity_level === fromLevel
  );
}

/** Get all unique topics */
export async function getAllTopics(): Promise<string[]> {
  const all = await getAllTutorials();
  const topics = new Set<string>();
  for (const t of all) {
    for (const topic of t.topics) {
      topics.add(topic);
    }
  }
  return [...topics].sort();
}

/** Search tutorials by query */
export async function searchTutorials(query: string): Promise<Tutorial[]> {
  const q = query.toLowerCase();

  // Try Supabase full-text search first
  const supabase = await getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("is_published", true)
        .textSearch("fts", query, { type: "websearch" })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data as Tutorial[];
      }
    } catch {
      // fall through to local search
    }
  }

  // Fallback: local text search over all tutorials
  const all = await getAllTutorials();
  return all.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.topics.some((topic) => topic.toLowerCase().includes(q)) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.tools_mentioned.some((tool) => tool.toLowerCase().includes(q))
  );
}
