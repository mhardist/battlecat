import { NextRequest, NextResponse } from "next/server";
import { advanceSubmission } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Verify admin secret from query param or Authorization header */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  if (querySecret === secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return false;
}

/**
 * GET /api/admin/submissions
 *
 * List submissions with status counts and optional filtering.
 * Query params:
 *   ?secret=<ADMIN_SECRET>
 *   ?status=failed,dead       (comma-separated status filter)
 *   ?limit=50                 (default 50)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Count by status
    const ALL_STATUSES = [
      "received", "extracting", "extracted", "classifying", "classified",
      "generating", "generated", "publishing", "published", "failed", "dead",
    ];

    const countPromises = ALL_STATUSES.map(async (s) => {
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      return [s, count ?? 0] as const;
    });

    const countEntries = await Promise.all(countPromises);
    const counts = Object.fromEntries(countEntries);

    // Fetch submissions
    let query = supabase
      .from("submissions")
      .select(
        "id, url, source_type, status, retry_count, max_retries, last_step, last_error, started_at, completed_at, created_at, tutorial_id",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim());
      query = query.in("status", statuses);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ counts, submissions: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/submissions
 *
 * Retry a single submission by ID.
 * Body: { submission_id: string, secret: string }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    // Also check body for secret
    const body = await request.clone().json().catch(() => ({}));
    const secret = process.env.ADMIN_SECRET;
    if (!secret || body.secret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { submission_id } = await request.json();

    if (!submission_id) {
      return NextResponse.json({ error: "submission_id required" }, { status: 400 });
    }

    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Fetch current state
    const { data: sub, error: fetchErr } = await supabase
      .from("submissions")
      .select("id, status, retry_count")
      .eq("id", submission_id)
      .single();

    if (fetchErr || !sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Reset for retry
    await supabase
      .from("submissions")
      .update({
        status: "received",
        retry_count: 0,
        last_error: null,
        error_message: null,
      })
      .eq("id", submission_id);

    // Process synchronously
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
