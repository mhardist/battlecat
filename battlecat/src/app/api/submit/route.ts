import { NextResponse } from "next/server";
import { detectSourceType } from "@/lib/extract";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

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

    // Trigger processing pipeline
    triggerProcessing(submission.id).catch(console.error);

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

/** Trigger the processing pipeline by calling /api/process internally */
async function triggerProcessing(submissionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submission_id: submissionId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[submit] Processing failed for ${submissionId}:`, err);
  }
}
