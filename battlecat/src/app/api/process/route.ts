import { NextRequest, NextResponse } from "next/server";
import { processSubmission } from "@/lib/process-submission";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/process
 *
 * Process a submission: extract content, classify, generate tutorial.
 * Can be called directly for manual retries or by a cron job.
 *
 * Body: { submission_id: string }
 */
export async function POST(request: NextRequest) {
  const { submission_id, hot_news } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });
  }

  const result = await processSubmission(submission_id, { hotNews: !!hot_news });

  if (!result.success) {
    return NextResponse.json(
      { error: "Processing failed", details: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    tutorial_id: result.tutorial_id,
    merged: result.merged,
  });
}
