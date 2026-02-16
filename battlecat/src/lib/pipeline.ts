/**
 * Pipeline engine — step-based state machine for processing submissions.
 *
 * Replaces the monolithic processSubmission() with a resumable pipeline
 * that persists intermediate results and can be retried from any step.
 *
 * Usage:
 *   const result = await advanceSubmission(submissionId, { hotNews: true });
 *   // result.success === true means the submission reached "published"
 *   // result.success === false means it's stuck at a step (but may be retried)
 */

import { createServerClient } from "@/lib/supabase";
import {
  PipelineError,
  retryDelay,
  sleep,
} from "@/lib/pipeline-errors";
import {
  stepExtract,
  stepClassify,
  stepGenerate,
  stepPublish,
} from "@/lib/pipeline-steps";
import type { Submission, PipelineStep } from "@/types";
import { STATUS_TO_STEP } from "@/types";

/** Options passed through to step functions. */
export interface PipelineOptions {
  hotNews?: boolean;
  /** Max time (ms) the pipeline is allowed to run. Default 55000 (55s). */
  budgetMs?: number;
}

/** Result of running the pipeline on a submission. */
export interface PipelineResult {
  success: boolean;
  status: string;
  tutorialId?: string;
  merged?: boolean;
  error?: string;
}

/** Max in-process retries per step (within a single advanceSubmission call). */
const MAX_STEP_RETRIES = 2;

/**
 * Resolve which pipeline step to run for a given submission.
 * For 'failed' status, uses last_step to determine which step to retry.
 */
function resolveStep(sub: Submission): PipelineStep | null {
  if (sub.status === "failed") {
    // Retry the step that was in progress when it failed
    const lastStep = sub.last_step;
    if (!lastStep) return "extract"; // no last_step recorded, start from beginning

    // last_step records the in-progress status (e.g., "extracting")
    // Map it back to the step entry point
    const step = STATUS_TO_STEP[lastStep];
    if (step) return step;

    // If last_step is a completed status like "extracted", run the NEXT step
    const completedMap: Record<string, PipelineStep> = {
      extracted: "classify",
      classified: "generate",
      generated: "publish",
    };
    return completedMap[lastStep] ?? "extract";
  }

  return STATUS_TO_STEP[sub.status] ?? null;
}

/** Step function registry. */
const STEP_FUNCTIONS: Record<
  PipelineStep,
  (sub: Submission, options?: PipelineOptions) => Promise<import("@/lib/pipeline-steps").StepResult>
> = {
  extract: (sub) => stepExtract(sub),
  classify: (sub) => stepClassify(sub),
  generate: (sub) => stepGenerate(sub),
  publish: (sub, opts) => stepPublish(sub, { hotNews: opts?.hotNews }),
};

/** In-progress status written before each step executes. */
const STEP_IN_PROGRESS_STATUS: Record<PipelineStep, string> = {
  extract: "extracting",
  classify: "classifying",
  generate: "generating",
  publish: "publishing",
};

/**
 * Advance a submission through the pipeline.
 *
 * Runs all remaining steps sequentially, persisting intermediate results
 * after each step. If a step fails transiently, retries up to MAX_STEP_RETRIES
 * times with exponential backoff before giving up.
 *
 * Respects a time budget (default 55s) — will stop between steps if
 * running low on time rather than risk a timeout mid-step.
 */
export async function advanceSubmission(
  submissionId: string,
  options?: PipelineOptions,
): Promise<PipelineResult> {
  const supabase = createServerClient();
  const budgetMs = options?.budgetMs ?? 55_000;
  const startTime = Date.now();

  // Fetch the submission
  const { data: sub, error: fetchError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !sub) {
    console.error(`[pipeline] Submission ${submissionId} not found:`, fetchError);
    return { success: false, status: "not_found", error: "Submission not found" };
  }

  // Cast to typed Submission
  let submission = sub as Submission;

  // Already terminal?
  if (submission.status === "published") {
    return {
      success: true,
      status: "published",
      tutorialId: submission.tutorial_id ?? undefined,
    };
  }
  if (submission.status === "dead") {
    return {
      success: false,
      status: "dead",
      error: submission.last_error ?? "Permanently failed",
    };
  }

  // Mark pipeline start
  if (!submission.started_at) {
    await supabase
      .from("submissions")
      .update({ started_at: new Date().toISOString() })
      .eq("id", submissionId);
  }

  // Run steps until published, failed, or out of budget
  while (true) {
    const step = resolveStep(submission);
    if (!step) {
      // No more steps to run (published, dead, or unknown terminal state)
      const status = submission.status as string;
      return {
        success: status === "published",
        status,
        tutorialId: submission.tutorial_id ?? undefined,
      };
    }

    // Budget check: do we have enough time for another step?
    const elapsed = Date.now() - startTime;
    if (elapsed > budgetMs) {
      console.log(
        `[pipeline] Budget exhausted (${elapsed}ms / ${budgetMs}ms) at step ${step} for ${submissionId}`,
      );
      return {
        success: false,
        status: submission.status,
        error: `Budget exhausted at step: ${step}`,
      };
    }

    // Write in-progress status
    const inProgressStatus = STEP_IN_PROGRESS_STATUS[step];
    await supabase
      .from("submissions")
      .update({ status: inProgressStatus, last_step: inProgressStatus })
      .eq("id", submissionId);

    const stepFn = STEP_FUNCTIONS[step];
    let lastError: PipelineError | null = null;

    // Try the step with in-process retries
    for (let attempt = 0; attempt <= MAX_STEP_RETRIES; attempt++) {
      try {
        console.log(
          `[pipeline] Running step=${step} attempt=${attempt + 1}/${MAX_STEP_RETRIES + 1} for ${submissionId}`,
        );

        const result = await stepFn(submission, options);

        // Step succeeded — persist intermediate results and advance status
        const updatePayload: Record<string, unknown> = {
          status: result.nextStatus,
          last_step: result.nextStatus,
          last_error: null,
          ...result.updates,
        };

        await supabase
          .from("submissions")
          .update(updatePayload)
          .eq("id", submissionId);

        console.log(
          `[pipeline] Step ${step} succeeded → ${result.nextStatus} for ${submissionId}`,
        );

        // Refresh submission state for next iteration
        const { data: refreshed } = await supabase
          .from("submissions")
          .select("*")
          .eq("id", submissionId)
          .single();

        if (refreshed) {
          submission = refreshed as Submission;
        }

        lastError = null;
        break; // Exit retry loop on success
      } catch (err) {
        lastError = PipelineError.fromError(err, step);

        if (lastError.kind === "permanent") {
          console.error(
            `[pipeline] Permanent failure at step=${step} for ${submissionId}: ${lastError.message}`,
          );
          break; // Don't retry permanent errors
        }

        // Transient error — retry with backoff if we have attempts left
        if (attempt < MAX_STEP_RETRIES) {
          const delay = retryDelay(attempt);
          const remainingBudget = budgetMs - (Date.now() - startTime);

          if (delay > remainingBudget) {
            console.log(
              `[pipeline] Not enough budget for retry delay (${delay}ms > ${remainingBudget}ms remaining)`,
            );
            break;
          }

          console.log(
            `[pipeline] Transient error at step=${step}, retrying in ${delay}ms: ${lastError.message}`,
          );
          await sleep(delay);
        }
      }
    }

    // If we exited the retry loop with an error, handle failure
    if (lastError) {
      const newRetryCount = submission.retry_count + 1;
      const isDead =
        lastError.kind === "permanent" ||
        newRetryCount >= submission.max_retries;

      const failureUpdate: Record<string, unknown> = {
        status: isDead ? "dead" : "failed",
        retry_count: newRetryCount,
        last_step: inProgressStatus,
        last_error: lastError.message,
      };

      await supabase
        .from("submissions")
        .update(failureUpdate)
        .eq("id", submissionId);

      const outcome = isDead ? "dead" : "failed";
      console.error(
        `[pipeline] Step ${step} ${outcome} for ${submissionId} (retry ${newRetryCount}/${submission.max_retries}): ${lastError.message}`,
      );

      return {
        success: false,
        status: outcome,
        error: lastError.message,
      };
    }

    // If we just published, we're done
    if (submission.status === "published") {
      return {
        success: true,
        status: "published",
        tutorialId: submission.tutorial_id ?? undefined,
      };
    }
  }
}

/**
 * Retry all failed submissions that haven't exhausted their retry budget.
 * Processes them one at a time to respect Vercel's execution budget.
 * Returns the count of submissions attempted and succeeded.
 */
export async function retryAllFailed(
  budgetMs: number = 55_000,
): Promise<{ attempted: number; succeeded: number; results: Array<{ id: string; result: PipelineResult }> }> {
  const supabase = createServerClient();
  const startTime = Date.now();

  const { data: pending } = await supabase
    .from("submissions")
    .select("id, retry_count, max_retries")
    .eq("status", "failed")
    .order("created_at", { ascending: true })
    .limit(10);

  if (!pending || pending.length === 0) {
    return { attempted: 0, succeeded: 0, results: [] };
  }

  // Filter to those with retry budget remaining
  const retryable = pending.filter(
    (s) => (s.retry_count ?? 0) < (s.max_retries ?? 3),
  );

  let succeeded = 0;
  const results: Array<{ id: string; result: PipelineResult }> = [];

  for (const sub of retryable) {
    const elapsed = Date.now() - startTime;
    if (elapsed > budgetMs) {
      console.log(`[pipeline] retryAllFailed: budget exhausted after ${results.length} submissions`);
      break;
    }

    const remainingBudget = budgetMs - elapsed;
    const result = await advanceSubmission(sub.id, { budgetMs: remainingBudget });
    results.push({ id: sub.id, result });

    if (result.success) succeeded++;
  }

  return { attempted: results.length, succeeded, results };
}
