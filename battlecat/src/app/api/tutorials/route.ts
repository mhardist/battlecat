import { NextResponse } from "next/server";
import { getAllTutorials, getAllTopics, searchTutorials } from "@/data/tutorials";

export const dynamic = "force-dynamic";

/**
 * GET /api/tutorials
 *
 * Returns all published tutorials from Supabase + seed data.
 * Supports ?q= for search and ?topics=true to get all topics.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const wantTopics = searchParams.get("topics");

  try {
    if (wantTopics) {
      const topics = await getAllTopics();
      return NextResponse.json({ topics });
    }

    if (query) {
      const results = await searchTutorials(query);
      return NextResponse.json({ tutorials: results });
    }

    const tutorials = await getAllTutorials();
    return NextResponse.json({ tutorials });
  } catch (error) {
    console.error("[api/tutorials] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutorials" },
      { status: 500 }
    );
  }
}
