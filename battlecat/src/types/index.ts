/** AI Maturity Framework levels (0–4) */
export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

/** How a tutorial relates to a maturity level */
export type LevelRelation = "level-up" | "level-practice" | "cross-level";

/** Supported content source types */
export type SourceType =
  | "tiktok"
  | "article"
  | "tweet"
  | "youtube"
  | "pdf"
  | "linkedin";

/** Processing status of an ingested link */
export type ProcessingStatus =
  | "received"
  | "extracting"
  | "processing"
  | "published"
  | "failed";

/** A raw submission from SMS */
export interface Submission {
  id: string;
  phone_number: string;
  raw_message: string;
  url: string;
  source_type: SourceType;
  status: ProcessingStatus;
  created_at: string;
}

/** Extracted content from a source URL */
export interface ExtractedContent {
  submission_id: string;
  source_type: SourceType;
  url: string;
  title: string | null;
  raw_text: string;
  author: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
}

/** A processed, published tutorial */
export interface Tutorial {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  maturity_level: MaturityLevel;
  level_relation: LevelRelation;
  topics: string[];
  tags: string[];
  tools_mentioned: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  action_items: string[];
  source_urls: string[];
  source_count: number;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/** Maturity level metadata for display */
export interface LevelInfo {
  level: MaturityLevel;
  name: string;
  you_role: string;
  ai_role: string;
  relationship: string;
  trust: string;
  investment: string;
  description: string;
  tools: string[];
  color: string;
}

/** User progress on a tutorial */
export interface UserProgress {
  tutorial_id: string;
  bookmarked: boolean;
  completed: boolean;
  notes: string | null;
}
