import { NextRequest, NextResponse } from "next/server";
import { retryAllFailed } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/retry-stuck
 *
 * Called by Vercel Cron every 10 minutes. Sweeps stuck and failed
 * submissions through the pipeline. Authenticated via CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
