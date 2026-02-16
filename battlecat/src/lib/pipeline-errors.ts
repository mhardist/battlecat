/**
 * Pipeline error classification and utilities.
 *
 * Separates transient errors (retry-worthy) from permanent errors
 * (content genuinely unavailable — don't waste retries).
 */

export type ErrorKind = "transient" | "permanent";

/** Patterns that indicate the content itself is unavailable — no point retrying. */
const PERMANENT_PATTERNS = [
  "private or unavailable",
  "insufficient content",
  "insufficient extractable text",
  "no transcript",
  "LinkedIn blocked",
  "Invalid URL",
  "not have transcripts available",
] as const;

/** HTTP status codes that are permanent failures (not worth retrying). */
const PERMANENT_STATUS_CODES = [400, 401, 403, 404, 410, 422] as const;

/**
 * Classify an error as transient or permanent.
 *
 * Transient: timeouts, rate limits, 5xx, network errors — worth retrying.
 * Permanent: content unavailable, invalid input — retrying won't help.
 */
export function classifyError(error: unknown): ErrorKind {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  // Check for permanent content-unavailable patterns
  for (const pattern of PERMANENT_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      return "permanent";
    }
  }

  // Check for permanent HTTP status codes embedded in error messages
  for (const code of PERMANENT_STATUS_CODES) {
    if (lower.includes(`${code}`) && lower.includes("failed")) {
      return "permanent";
    }
  }

  // Everything else is transient (timeouts, rate limits, 5xx, network)
  return "transient";
}

/**
 * Custom error class for pipeline steps.
 * Carries the error kind so the pipeline engine can decide whether to retry.
 */
export class PipelineError extends Error {
  public readonly kind: ErrorKind;
  public readonly step: string;

  constructor(message: string, step: string, kind?: ErrorKind) {
    super(message);
    this.name = "PipelineError";
    this.step = step;
    this.kind = kind ?? classifyError(message);
  }

  static fromError(err: unknown, step: string): PipelineError {
    if (err instanceof PipelineError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new PipelineError(message, step, classifyError(err));
  }
}

/**
 * Calculate next retry delay using exponential backoff.
 * retryCount 0 → 3s, 1 → 9s, 2 → 27s (capped at 30s).
 * These are in-process delays for immediate retries within after().
 */
export function retryDelay(retryCount: number): number {
  return Math.min(3000 * Math.pow(3, retryCount), 30_000);
}

/** Sleep for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
