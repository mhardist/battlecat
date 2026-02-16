import { NextResponse, after } from "next/server";
import { detectSourceType } from "@/lib/extract";
import { advanceSubmission } from "@/lib/pipeline";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/submit
 * Web form submission endpoint.
 * Accepts a URL + optional note, validates, stores in Supabase,
 * and triggers the pipeline.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, note, hot_news } = body as { url?: string; note?: string; hot_news?: boolean };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const sourceType = detectSourceType(url);

    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Check for duplicate URL — but allow retry of failed/dead submissions
    const { data: existing } = await supabase
      .from("submissions")
      .select("id, status")
      .eq("url", url)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const retryable = existing.status === "failed" || existing.status === "dead";

      if (!retryable && existing.status !== "received") {
        return NextResponse.json(
          { error: "This URL has already been submitted", existing_submission_id: existing.id },
          { status: 409 }
        );
      }

      if (retryable) {
        // Reset the failed submission for re-processing
        await supabase
          .from("submissions")
          .update({ status: "received", retry_count: 0, last_error: null })
          .eq("id", existing.id);

        const isHotNews = !!hot_news;
        after(async () => {
          console.log(`[submit] Retrying failed submission ${existing.id} (hot_news: ${isHotNews})`);
          const result = await advanceSubmission(existing.id, { hotNews: isHotNews });
          console.log(`[submit] Retry result for ${existing.id}:`, result);
        });

        return NextResponse.json({
          success: true,
          message: "Retrying previously failed link.",
          source_type: sourceType,
          submission_id: existing.id,
          retried: true,
        });
      }
    }

    // Store submission in Supabase
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        phone_number: "web",
        raw_message: note || url,
        url,
        source_type: sourceType,
        status: "received",
      })
      .select("id")
      .single();

    if (error || !submission) {
      console.error("[submit] Failed to store submission:", error);
      return NextResponse.json(
        { error: "Failed to store submission" },
        { status: 500 }
      );
    }

    // Run pipeline after the response is sent.
    const isHotNews = !!hot_news;
    after(async () => {
      console.log(`[submit] Starting pipeline for ${submission.id} (hot_news: ${isHotNews})`);
      const result = await advanceSubmission(submission.id, { hotNews: isHotNews });
      console.log(`[submit] Pipeline result for ${submission.id}:`, result);
    });

    return NextResponse.json({
      success: true,
      message: "Link received — processing started.",
      source_type: sourceType,
      submission_id: submission.id,
    });
  } catch (error) {
    console.error("[submit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
