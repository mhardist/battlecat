import { NextResponse } from "next/server";
import { researchToolReleases } from "@/lib/research-agent";

/**
 * GET /api/research-tools?since=2025-06
 *
 * Triggers the AI research agent to discover new tool releases.
 * Returns structured data matching the AITool milestone format.
 *
 * Can be called manually or via Vercel Cron for daily automated research.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  if (!since || !/^\d{4}-\d{2}$/.test(since)) {
    return NextResponse.json(
      {
        error: "Missing or invalid 'since' parameter. Use format: YYYY-MM",
        example: "/api/research-tools?since=2025-06",
      },
      { status: 400 }
    );
  }

  try {
    const releases = await researchToolReleases(since);

    return NextResponse.json({
      since,
      researched_at: new Date().toISOString(),
      count: releases.length,
      releases,
    });
  } catch (error) {
    console.error("Research agent failed:", error);
    return NextResponse.json(
      { error: "Research agent failed. Check server logs." },
      { status: 500 }
    );
  }
}
