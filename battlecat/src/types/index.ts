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

/** Processing status of an ingested link (step-level state machine) */
export type ProcessingStatus =
  | "received"
  | "extracting"
  | "extracted"
  | "classifying"
  | "classified"
  | "generating"
  | "generated"
  | "publishing"
  | "published"
  | "failed"
  | "dead";

/** Pipeline step names (correspond to status transitions) */
export type PipelineStep = "extract" | "classify" | "generate" | "publish";

/** Maps a status to which step should run next */
export const STATUS_TO_STEP: Record<string, PipelineStep | null> = {
  received: "extract",
  extracted: "classify",
  classified: "generate",
  generated: "publish",
  failed: null, // resolved from last_step
  // terminal statuses
  published: null,
  dead: null,
  // in-progress statuses (shouldn't be queried, but handle gracefully)
  extracting: "extract",
  classifying: "classify",
  generating: "generate",
  publishing: "publish",
};

/** Classification result stored as jsonb on submissions */
export interface ClassificationResult {
  maturity_level: MaturityLevel;
  level_relation: LevelRelation;
  topics: string[];
  tags: string[];
  tools_mentioned: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

/** Generated tutorial stored as jsonb on submissions */
export interface GeneratedTutorialData {
  title: string;
  slug: string;
  summary: string;
  body: string;
  action_items: string[];
  classification: ClassificationResult;
}

/** A raw submission from SMS/WhatsApp/web */
export interface Submission {
  id: string;
  phone_number: string;
  raw_message: string;
  url: string;
  source_type: SourceType;
  status: ProcessingStatus;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  last_step: string | null;
  last_error: string | null;
  extracted_text: string | null;
  classification: ClassificationResult | null;
  generated_tutorial: GeneratedTutorialData | null;
  tutorial_id: string | null;
  started_at: string | null;
  completed_at: string | null;
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
  audio_url: string | null;
  is_stale: boolean;
  is_hot_news: boolean;
  hot_news_headline: string | null;
  hot_news_teaser: string | null;
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
