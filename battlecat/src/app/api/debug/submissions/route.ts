import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug/submissions
 *
 * Lists recent submissions with their status. Use this to see what
 * arrived, what got stuck, and what failed.
 *
 * Query params:
 *   ?status=failed      — filter by status
 *   ?limit=20           — how many to return (default 20)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    let query = supabase
      .from("submissions")
      .select("id, phone_number, url, source_type, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Query failed: ${error.message}` },
        { status: 500 },
      );
    }

    // Count by status (pipeline step-level statuses)
    const counts: Record<string, number> = {};
    for (const s of [
      "received", "extracting", "extracted", "classifying", "classified",
      "generating", "generated", "publishing", "published", "failed", "dead",
    ]) {
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      counts[s] = count ?? 0;
    }

    return NextResponse.json({
      counts,
      filter: statusFilter || "all",
      submissions: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/debug/submissions
 *
 * Retry a failed or stuck submission by ID.
 *
 * Body: { submission_id: string }
 */
export async function POST(request: NextRequest) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: "submission_id required" }, { status: 400 });
  }

  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Reset status to "received" so processSubmission can pick it up
    const { data: sub, error: fetchErr } = await supabase
      .from("submissions")
      .select("id, url, status")
      .eq("id", submission_id)
      .single();

    if (fetchErr || !sub) {
      return NextResponse.json(
        { error: `Submission not found: ${fetchErr?.message}` },
        { status: 404 },
      );
    }

    // Reset to received and clear retry state
    await supabase
      .from("submissions")
      .update({ status: "received", error_message: null, last_error: null, retry_count: 0 })
      .eq("id", submission_id);

    // Process synchronously via pipeline engine
    const { advanceSubmission } = await import("@/lib/pipeline");
    const result = await advanceSubmission(submission_id);

    return NextResponse.json({
      previous_status: sub.status,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
