import { NextRequest, NextResponse } from "next/server";
import { retryAllFailed } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/retry-all
 *
 * Retry all failed submissions that haven't exhausted their retry budget.
 * Processes sequentially with time-budget awareness (55s max).
 *
 * Body: { secret: string }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }

  // Check auth from body, query param, or header
  const body = await request.json().catch(() => ({}));
  const { searchParams } = new URL(request.url);

  const authorized =
    body.secret === secret ||
    searchParams.get("secret") === secret ||
    request.headers.get("authorization") === `Bearer ${secret}`;

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await retryAllFailed();

    return NextResponse.json({
      attempted: result.attempted,
      succeeded: result.succeeded,
      results: result.results.map((r) => ({
        id: r.id,
        success: r.result.success,
        status: r.result.status,
        error: r.result.error,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
