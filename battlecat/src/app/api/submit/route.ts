import { NextResponse, after } from "next/server";
import { detectSourceType } from "@/lib/extract";
import { processSubmission } from "@/lib/process-submission";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/submit
 * Web form submission endpoint.
 * Accepts a URL + optional note, validates, stores in Supabase,
 * and triggers the processing pipeline.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, note } = body as { url?: string; note?: string };

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

    // Store submission in Supabase
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();
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

    // Run processing after the response is sent.
    // after() keeps the Vercel function alive so processing completes.
    after(async () => {
      console.log(`[submit] Starting background processing for ${submission.id}`);
      const result = await processSubmission(submission.id);
      console.log(`[submit] Processing result for ${submission.id}:`, result);
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
