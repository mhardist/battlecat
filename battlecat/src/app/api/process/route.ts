import { NextRequest, NextResponse } from "next/server";
import { advanceSubmission } from "@/lib/pipeline";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/process
 *
 * Advance a submission through the pipeline (extract → classify → generate → publish).
 * Resumes from wherever the submission left off — safe to call multiple times.
 *
 * Body: { submission_id: string, hot_news?: boolean }
 */
export async function POST(request: NextRequest) {
  const { submission_id, hot_news } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });
  }

  const result = await advanceSubmission(submission_id, { hotNews: !!hot_news });

  if (!result.success) {
    return NextResponse.json(
      { error: "Processing failed", status: result.status, details: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    status: result.status,
    tutorial_id: result.tutorialId,
  });
}
